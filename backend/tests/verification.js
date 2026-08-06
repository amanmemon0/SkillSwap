const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = 'http://localhost:5000';

async function runTests() {
  console.log('=== Starting Integration & Security Verification Tests ===\n');

  // Generate unique credentials
  const timestamp = Date.now();
  const userA = {
    name: 'User A',
    username: `usera_${timestamp}`,
    email: `usera_${timestamp}@example.com`,
    password: 'password123',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    bio: 'React developer with 5 years of professional experience.',
    primarySkill: 'React Basics',
    skillLevel: 'Intermediate',
    learningSkills: ['Spanish Conversation'],
    availability: ['Weekends'],
    learningMode: 'Online'
  };

  const userB = {
    name: 'User B',
    username: `userb_${timestamp}`,
    email: `userb_${timestamp}@example.com`,
    password: 'password123',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    bio: 'Spanish speaker with passion for teaching conversation skills.',
    primarySkill: 'Spanish Conversation',
    skillLevel: 'Expert',
    learningSkills: ['React Basics'],
    availability: ['Weekends'],
    learningMode: 'Online'
  };


  // Test 1: RLS Verification via Anon Key
  console.log('Test 1: Verifying RLS on public.users and public.profiles using SUPABASE_ANON_KEY...');
  const supabaseAnon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  
  const { data: anonUsers, error: anonUsersErr } = await supabaseAnon.from('users').select('*');
  const { data: anonProfiles, error: anonProfilesErr } = await supabaseAnon.from('profiles').select('*');

  // RLS is active: anon select should either fail or return empty data
  if (anonUsersErr || !anonUsers || anonUsers.length === 0) {
    console.log('✔ Direct access to public.users denied (RLS is ACTIVE)');
  } else {
    throw new Error('❌ SECURITY VULNERABILITY: Direct read access allowed on public.users!');
  }

  if (anonProfilesErr || !anonProfiles || anonProfiles.length === 0) {
    console.log('✔ Direct access to public.profiles denied (RLS is ACTIVE)');
  } else {
    throw new Error('❌ SECURITY VULNERABILITY: Direct read access allowed on public.profiles!');
  }

  // Test 2: Register User A
  console.log('\nTest 2: Registering User A...');
  const resRegA = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userA)
  });
  const dataRegA = await resRegA.json();
  if (resRegA.status !== 201) {
    throw new Error(`❌ Registration for User A failed: ${JSON.stringify(dataRegA)}`);
  }
  console.log('✔ User A registered successfully:', dataRegA._id);
  const tokenA = dataRegA.token;

  // Test 3: Duplicate Email Check (Task 7)
  console.log('\nTest 3: Attempting to register another user with the same email...');
  const duplicateEmailUser = { ...userB, email: userA.email };
  const resDupEmail = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(duplicateEmailUser)
  });
  const dataDupEmail = await resDupEmail.json();
  if (resDupEmail.status === 409 && dataDupEmail.message.includes('email already exists')) {
    console.log('✔ Duplicate email correctly rejected with 409 Conflict:', dataDupEmail.message);
  } else {
    throw new Error(`❌ Duplicate email handling failed. Status: ${resDupEmail.status}, Response: ${JSON.stringify(dataDupEmail)}`);
  }

  // Test 4: Duplicate Username Check (Task 7)
  console.log('\nTest 4: Attempting to register another user with the same username...');
  const duplicateUsernameUser = { ...userB, username: userA.username };
  const resDupUsername = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(duplicateUsernameUser)
  });
  const dataDupUsername = await resDupUsername.json();
  if (resDupUsername.status === 409 && dataDupUsername.message.includes('username is already taken')) {
    console.log('✔ Duplicate username correctly rejected with 409 Conflict:', dataDupUsername.message);
  } else {
    throw new Error(`❌ Duplicate username handling failed. Status: ${resDupUsername.status}, Response: ${JSON.stringify(dataDupUsername)}`);
  }

  // Register User B
  console.log('\nRegistering User B...');
  const resRegB = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userB)
  });
  const dataRegB = await resRegB.json();
  if (resRegB.status !== 201) {
    throw new Error(`❌ Registration for User B failed: ${JSON.stringify(dataRegB)}`);
  }
  console.log('✔ User B registered successfully:', dataRegB._id);
  const tokenB = dataRegB.token;

  // Let's query skills to get the IDs of 'React Basics' and 'Spanish Conversation'
  // Since we are running on local Supabase client with service key from process.env, we can query it directly
  const supabaseService = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: skills, error: skillsErr } = await supabaseService.from('skills').select('*');
  if (skillsErr || !skills) {
    throw new Error(`❌ Failed to fetch seeded skills: ${skillsErr?.message}`);
  }

  const reactSkill = skills.find(s => s.name === 'React Basics');
  const spanishSkill = skills.find(s => s.name === 'Spanish Conversation');
  if (!reactSkill || !spanishSkill) {
    throw new Error('❌ Seeded skills "React Basics" or "Spanish Conversation" not found');
  }

  // Test 5: Create Exchange request from User A to User B
  console.log('\nTest 5: Creating exchange request from User A to User B...');
  const resExchange = await fetch(`${API_URL}/api/exchanges`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      receiverId: dataRegB._id,
      senderSkillId: reactSkill.id,
      receiverSkillId: spanishSkill.id,
      message: 'Hey, let us swap skills!'
    })
  });
  const dataExchange = await resExchange.json();
  if (resExchange.status !== 201) {
    throw new Error(`❌ Create exchange failed: ${JSON.stringify(dataExchange)}`);
  }
  console.log('✔ Exchange request created. ID:', dataExchange.id, 'Status:', dataExchange.status);

  // Test 6: Verify trigger generated a notification for User B (Task 5)
  console.log('\nTest 6: Checking if notification was generated for User B...');
  const resNotificationsB = await fetch(`${API_URL}/api/notifications`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  const notificationsB = await resNotificationsB.json();
  const newExchangeNotification = notificationsB.find(n => n.exchange_id === dataExchange.id);
  if (newExchangeNotification) {
    console.log('✔ Trigger-generated notification found for User B:');
    console.log(`  Title:  "${newExchangeNotification.title}"`);
    console.log(`  Detail: "${newExchangeNotification.detail}"`);
  } else {
    throw new Error('❌ Trigger failed: No notification found for User B');
  }

  // Test 7: Verify Authorization check: Sender attempting to accept own request (Task 4)
  console.log('\nTest 7: Verification of authorization (Sender User A attempts to accept request)...');
  const resInvalidAccept = await fetch(`${API_URL}/api/exchanges/${dataExchange.id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`
    },
    body: JSON.stringify({ status: 'matched' })
  });
  const dataInvalidAccept = await resInvalidAccept.json();
  if (resInvalidAccept.status === 403) {
    console.log('✔ Request correctly rejected with 403 Forbidden:', dataInvalidAccept.message);
  } else {
    throw new Error(`❌ Authorization failure: Sender accepted their own request! Status: ${resInvalidAccept.status}, Response: ${JSON.stringify(dataInvalidAccept)}`);
  }

  // Test 8: Receiver accepts request (status transitions to matched)
  console.log('\nTest 8: Receiver B accepting request...');
  const resAccept = await fetch(`${API_URL}/api/exchanges/${dataExchange.id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenB}`
    },
    body: JSON.stringify({ status: 'matched' })
  });
  const dataAccept = await resAccept.json();
  if (resAccept.status === 200 && dataAccept.status === 'matched') {
    console.log('✔ Exchange status transitioned to matched');
  } else {
    throw new Error(`❌ Failed to accept request. Status: ${resAccept.status}, Response: ${JSON.stringify(dataAccept)}`);
  }

  // Test 9: Verify trigger generated acceptance notification for User A (Task 5)
  console.log('\nTest 9: Checking if notification was generated for User A...');
  const resNotificationsA = await fetch(`${API_URL}/api/notifications`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  const notificationsA = await resNotificationsA.json();
  const acceptNotification = notificationsA.find(n => n.exchange_id === dataExchange.id && n.title === 'Exchange Request Accepted');
  if (acceptNotification) {
    console.log('✔ Trigger-generated notification found for User A:');
    console.log(`  Title:  "${acceptNotification.title}"`);
    console.log(`  Detail: "${acceptNotification.detail}"`);
  } else {
    throw new Error('❌ Trigger failed: No acceptance notification found for User A');
  }

  console.log('\n✔ All integration and security tests passed successfully!');
}

runTests().catch(err => {
  console.error('\n❌ Verification failed with error:', err);
  process.exit(1);
});
