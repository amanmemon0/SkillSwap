const test = require('node:test');
const assert = require('node:assert/strict');
const { registerSchema, loginSchema } = require('../utils/authValidation');
const { validate } = require('../middleware/validate');

test('register schema rejects invalid values', () => {
  const result = registerSchema.safeParse({ name: 'A', email: 'not-an-email', password: '123' });

  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((issue) => issue.path[0] === 'name'));
  assert.ok(result.error.issues.some((issue) => issue.path[0] === 'email'));
  assert.ok(result.error.issues.some((issue) => issue.path[0] === 'password'));
});

test('login schema accepts valid payload', () => {
  const result = loginSchema.safeParse({ email: 'user@example.com', password: 'secret123' });

  assert.equal(result.success, true);
  assert.deepEqual(result.data, { email: 'user@example.com', password: 'secret123' });
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
