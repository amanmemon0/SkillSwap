const test = require('node:test');
const assert = require('node:assert/strict');
const { registerSchema, loginSchema, forgotPasswordSchema, profileUpdateSchema, adminUserUpdateSchema } = require('../utils/authValidation');
const { validate } = require('../middleware/validate');

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

test('forgot password schema validates email and minimum password length', () => {
  const valid = forgotPasswordSchema.safeParse({ email: 'test@example.com', newPassword: 'NewPassword123' });
  assert.equal(valid.success, true);

  const invalidEmail = forgotPasswordSchema.safeParse({ email: 'invalid-email', newPassword: 'NewPassword123' });
  assert.equal(invalidEmail.success, false);

  const shortPassword = forgotPasswordSchema.safeParse({ email: 'test@example.com', newPassword: '123' });
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
