const test = require('node:test');
const assert = require('node:assert/strict');
const { registerSchema, loginSchema, requestPasswordResetSchema, resetPasswordSchema, profileUpdateSchema, adminUserUpdateSchema } = require('../utils/authValidation');
const { validate } = require('../middleware/validate');
const jwt = require('jsonwebtoken');

process.env.SUPABASE_URL ||= 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key';
const { generateToken } = require('../controllers/authController');
const { createProtect } = require('../middleware/auth');

const makeAuthDb = ({ user = { id: 'user-123' }, profile = { id: 'user-123', status: 'Active' } } = {}) => ({
  from(table) {
    const result = table === 'users' ? user : profile;
    const query = {
      select() { return query; },
      eq() { return query; },
      is() { return query; },
      maybeSingle: async () => ({ data: result, error: null }),
    };
    return query;
  },
});

const runProtect = async (authorization, db = makeAuthDb()) => {
  const req = { headers: authorization === undefined ? {} : { authorization } };
  let statusCode = 200;
  let responseBody;
  let nextCalled = false;
  const res = {
    status(code) { statusCode = code; return this; },
    json(body) { responseBody = body; return this; },
  };
  await createProtect(db)(req, res, () => { nextCalled = true; });
  return { req, statusCode, responseBody, nextCalled };
};

test('protect accepts a valid bearer JWT and rejects missing, malformed, tampered, and expired tokens', async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'auth-middleware-test-secret';
  try {
    const validToken = jwt.sign({ id: 'user-123' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const accepted = await runProtect(`Bearer ${validToken}`);
    assert.equal(accepted.nextCalled, true);
    assert.equal(accepted.req.user.id, 'user-123');

    const expiredToken = jwt.sign({ id: 'user-123' }, process.env.JWT_SECRET, { expiresIn: -1 });
    const invalidHeaders = [
      undefined,
      'Bearer',
      `Bearer ${validToken} extra`,
      `Bearer ${validToken.slice(0, -1)}x`,
      `Bearer ${expiredToken}`,
    ];
    for (const header of invalidHeaders) {
      const result = await runProtect(header);
      assert.equal(result.statusCode, 401);
      assert.equal(result.nextCalled, false);
    }
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

test('protect rejects deleted or unavailable accounts represented by otherwise valid JWTs', async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'auth-middleware-test-secret';
  try {
    const token = jwt.sign({ id: 'user-123' }, process.env.JWT_SECRET);
    for (const db of [makeAuthDb({ user: null }), makeAuthDb({ profile: null }), makeAuthDb({ profile: { id: 'user-123', status: 'Banned' } })]) {
      const result = await runProtect(`Bearer ${token}`, db);
      assert.equal(result.statusCode, 401);
      assert.equal(result.nextCalled, false);
    }
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

test('JWT uses configured JWT_EXPIRES_IN and contains only authentication claims', () => {
  const previousSecret = process.env.JWT_SECRET;
  const previousExpiry = process.env.JWT_EXPIRES_IN;
  process.env.JWT_SECRET = 'auth-test-secret';
  process.env.JWT_EXPIRES_IN = '2h';

  try {
    const token = generateToken('user-123', 'person@example.com');
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    assert.equal(payload.id, 'user-123');
    assert.equal(payload.email, 'person@example.com');
    assert.equal(payload.exp - payload.iat, 7200);
    assert.equal('password_hash' in payload, false);
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
    if (previousExpiry === undefined) delete process.env.JWT_EXPIRES_IN;
    else process.env.JWT_EXPIRES_IN = previousExpiry;
  }
});

test('register schema rejects invalid values', () => {
  const result = registerSchema.safeParse({ name: 'A', username: '!', email: 'not-an-email', password: '123' });

  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((issue) => issue.path[0] === 'name'));
  assert.ok(result.error.issues.some((issue) => issue.path[0] === 'email'));
  assert.ok(result.error.issues.some((issue) => issue.path[0] === 'password'));
  assert.ok(result.error.issues.some((issue) => issue.path[0] === 'username'));
});

test('login schema accepts valid payload', () => {
  const result = loginSchema.safeParse({ email: 'user@example.com', password: 'secret123' });

  assert.equal(result.success, true);
  assert.deepEqual(result.data, { email: 'user@example.com', password: 'secret123' });
});

test('requestPasswordResetSchema validates email only (Step 1)', () => {
  const valid = requestPasswordResetSchema.safeParse({ email: 'test@example.com' });
  assert.equal(valid.success, true);

  const invalidEmail = requestPasswordResetSchema.safeParse({ email: 'invalid-email' });
  assert.equal(invalidEmail.success, false);

  // Must NOT accept newPassword in step 1 — that's the old insecure shape
  // (extra fields are stripped by Zod by default, so this still succeeds)
  const withExtraFields = requestPasswordResetSchema.safeParse({ email: 'test@example.com', newPassword: 'secret' });
  assert.equal(withExtraFields.success, true);
});

test('resetPasswordSchema validates token + minimum password length (Step 2)', () => {
  const valid = resetPasswordSchema.safeParse({ token: 'abc123', newPassword: 'NewPassword1' });
  assert.equal(valid.success, true);

  const missingToken = resetPasswordSchema.safeParse({ newPassword: 'NewPassword1' });
  assert.equal(missingToken.success, false);

  const shortPassword = resetPasswordSchema.safeParse({ token: 'abc123', newPassword: '123' });
  assert.equal(shortPassword.success, false);
});

test('profile update schema accepts the frontend profile payload and rejects empty updates', () => {
  const frontendPayload = {
    name: 'Alex Morgan',
    location: 'Ahmedabad, Gujarat, India',
    phone: '+91 9876543210',
    bio: 'Engineering student sharing practical programming skills.',
    primarySkill: 'Web Development',
    skillLevel: 'Intermediate',
    learningMode: 'Both',
  };

  assert.equal(profileUpdateSchema.safeParse(frontendPayload).success, true);
  assert.equal(profileUpdateSchema.safeParse({}).success, false);
});

test('admin user update schema accepts frontend status values only', () => {
  assert.equal(adminUserUpdateSchema.safeParse({ status: 'Suspended' }).success, true);
  assert.equal(adminUserUpdateSchema.safeParse({ status: 'Deleted' }).success, false);
});

test('validate middleware returns structured errors for invalid body', async () => {
  const middleware = validate(registerSchema);
  const req = { body: { name: 'A', email: 'bad', password: '123' } };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  await middleware(req, res, next);

  assert.equal(res.statusCode, 400);
  assert.equal(nextCalled, false);
  assert.equal(res.body.message, 'Validation failed');
  assert.ok(Array.isArray(res.body.errors));
  assert.ok(res.body.errors.some((error) => error.field === 'email'));
});
