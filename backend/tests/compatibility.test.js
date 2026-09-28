const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

// The controller imports the shared client; these inert values keep unit tests offline.
process.env.SUPABASE_URL ||= 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key';

const { calculateCompatibility, getCompatibilityMatch } = require('../services/compatibilityService');
const { createGetCompatibility } = require('../controllers/matchController');
const { protect, createProtect } = require('../middleware/auth');

const skills = (offers = [], wants = []) => [
  ...offers.map((skill_id) => ({ type: 'offer', skill_id })),
  ...wants.map((skill_id) => ({ type: 'learn', skill_id })),
];

test('perfect reciprocal match is 100%', () => {
  assert.equal(calculateCompatibility(skills(['python'], ['painting']), skills(['painting'], ['python'])).compatibility, 100);
});

test('one-sided match is 50%', () => {
  assert.equal(calculateCompatibility(skills(['python'], ['painting']), skills(['painting'], ['cooking'])).compatibility, 50);
});

test('no overlap is 0%', () => {
  assert.equal(calculateCompatibility(skills(['python'], ['painting']), skills(['guitar'], ['cooking'])).compatibility, 0);
});

test('partial multi-skill overlap is rounded to the nearest integer', () => {
  const result = calculateCompatibility(skills(['python', 'sql'], ['painting', 'guitar', 'cooking', 'spanish']), skills(['painting', 'guitar', 'cooking'], ['python', 'sql']));
  assert.equal(result.aSatisfaction, 75);
  assert.equal(result.bSatisfaction, 100);
  assert.equal(result.compatibility, 88);
});

test('duplicate skill rows do not inflate compatibility', () => {
  const result = calculateCompatibility(
    [...skills(['python'], ['painting']), { type: 'learn', skill_id: 'painting' }],
    [...skills(['painting'], ['python']), { type: 'offer', skill_id: 'painting' }],
  );
  assert.equal(result.compatibility, 100);
});

test('empty wanted skills contribute zero satisfaction and never divide by zero', () => {
  assert.deepEqual(calculateCompatibility(skills(['python']), skills(['painting'])), {
    compatibility: 0, aSatisfaction: 0, bSatisfaction: 0, aMatchedWantedSkills: 0,
    bMatchedWantedSkills: 0, aWantedSkillCount: 0, bWantedSkillCount: 0,
    availabilityOverlapScore: 0, levelCompatibilityScore: 0,
    reasons: ['Potential for new skill discovery'],
  });
});

test('empty offered skills cannot satisfy wanted skills', () => {
  assert.equal(calculateCompatibility(skills([], ['painting']), skills([], ['python'])).compatibility, 0);
});

test('self matching is rejected', async () => {
  await assert.rejects(() => getCompatibilityMatch({}, 'same-user', 'same-user'), { statusCode: 400 });
});

test('a nonexistent matched user returns a 404', async () => {
  const profilesQuery = {
    select: () => profilesQuery,
    in: () => profilesQuery,
    is: async () => ({ data: [{ id: 'current-user' }], error: null }),
  };
  const fakeDb = { from: () => profilesQuery };
  await assert.rejects(() => getCompatibilityMatch(fakeDb, 'current-user', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), { statusCode: 404 });
});

test('authentication is required and client-supplied compatibility cannot override the server result', async () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'compatibility-test-secret';
  const unauthorized = { headers: {}, user: undefined };
  let unauthorizedStatus;
  await protect(unauthorized, { status: (status) => { unauthorizedStatus = status; return { json: () => {} }; } }, () => {});
  assert.equal(unauthorizedStatus, 401);

  const handler = createGetCompatibility(async (_db, currentUserId, matchedUserId) => ({ compatibility: 50, currentUserId, matchedUserId }));
  const token = jwt.sign({ id: 'current-user' }, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` }, params: { userId: 'other-user' }, body: { compatibility: 100 } };
  const fakeDb = {
    from: (table) => ({
      select: () => ({
        eq: () => ({
          is: () => ({
            maybeSingle: async () => ({ data: { id: 'current-user', ...(table === 'profiles' ? { status: 'Active' } : {}) }, error: null }),
          }),
        }),
      }),
    }),
  };
  await new Promise((resolve) => createProtect(fakeDb)(req, { status: () => ({ json: resolve }) }, resolve));
  let response;
  await handler(req, { json: (body) => { response = body; } }, (error) => { throw error; });
  assert.equal(response.compatibility, 50);
  assert.equal(response.currentUserId, 'current-user');
  assert.equal(response.matchedUserId, 'other-user');
  process.env.JWT_SECRET = originalSecret;
});
