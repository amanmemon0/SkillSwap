require('dotenv').config();
const supabase = require('./config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function seedRandomData() {
  console.log('--- STARTING BULK SEED OF REALISTIC FAKE DATA ---');

  try {
    // 1. Generate password hash for standard password "Password@123"
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password@123', salt);

    // 2. Define realistic users
    const newUsers = [
      {
        fullName: 'Emily Watson',
        username: 'emily_w',
        email: 'emily.w@example.com',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        bio: 'UX designer passionate about digital product design, sketch drawing, and public speaking.',
        primarySkill: 'UI/UX Fundamentals',
        skillLevel: 'Expert',
        learningSkills: ['Python Basics', 'French Conversation'],
        availability: ['Weekends', 'Evenings'],
        learningMode: 'Online'
      },
      {
        fullName: 'Rahul Mehta',
        username: 'rahul_m',
        email: 'rahul.m@example.com',
        city: 'Ahmedabad',
        state: 'Gujarat',
        country: 'India',
        bio: 'Software engineer sharing Python backend development concepts. Eager to learn photography.',
        primarySkill: 'Python Basics',
        skillLevel: 'Expert',
        learningSkills: ['Street Photography', 'UI/UX Fundamentals'],
        availability: ['Weekends'],
        learningMode: 'Both'
      },
      {
        fullName: 'Sarah Connor',
        username: 'sarah_c',
        email: 'sarah.c@example.com',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        bio: 'Language instructor teaching French and German conversation. Loves baking and hiking.',
        primarySkill: 'French Conversation',
        skillLevel: 'Expert',
        learningSkills: ['React Basics', 'Baking'],
        availability: ['Weekdays'],
        learningMode: 'Online'
      }
    ];

    // Seed users and profiles
    const seededProfiles = [];

    for (const u of newUsers) {
      console.log(`Creating user: ${u.email}...`);

      // Check if user already exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', u.email)
        .maybeSingle();

      let userId;

      if (existing) {
        console.log(`User ${u.email} already exists with ID ${existing.id}. Updating profile.`);
        userId = existing.id;
      } else {
        // Insert into users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert({ email: u.email, password_hash: passwordHash })
          .select()
          .single();

        if (userError || !userData) {
          console.error(`Failed to insert user ${u.email}:`, userError?.message);
          continue;
        }
        userId = userData.id;
      }

      // Upsert profile
      const location = [u.city, u.state, u.country].join(', ');
      const profilePayload = {
        id: userId,
        full_name: u.fullName,
        username: u.username,
        email: u.email,
        city: u.city,
        state: u.state,
        country: u.country,
        location,
        bio: u.bio,
        primary_skill: u.primarySkill,
        skill_level: u.skillLevel,
        learning_skills: u.learningSkills,
        availability: u.availability,
        learning_mode: u.learningMode,
        role: 'user',
        status: 'Active'
      };

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert(profilePayload)
        .select()
        .single();

      if (profileError) {
        console.error(`Failed to upsert profile for ${u.email}:`, profileError.message);
      } else {
        console.log(`✔ Profile set for ${u.fullName}`);
        seededProfiles.push(profileData);
      }
    }

    // 3. Fetch skills to link
    const { data: skills, error: skillsErr } = await supabase.from('skills').select('*');
    if (skillsErr || !skills) {
      throw new Error(`Failed to fetch skills: ${skillsErr?.message}`);
    }

    const uiuxSkill = skills.find(s => s.name === 'UI/UX Fundamentals');
    const pythonSkill = skills.find(s => s.name === 'Python Basics') || skills.find(s => s.name.includes('Python'));
    const photoSkill = skills.find(s => s.name === 'Street Photography') || skills.find(s => s.name.includes('Photo'));
    const frenchSkill = skills.find(s => s.name === 'French Conversation') || skills.find(s => s.name.includes('French')) || skills.find(s => s.category === 'languages');

    console.log('Fetched referenced skill IDs:', {
      uiux: uiuxSkill?.id,
      python: pythonSkill?.id,
      photo: photoSkill?.id,
      french: frenchSkill?.id
    });

    // 4. Seed member_skills
    console.log('Seeding member_skills...');
    const memberSkillsToInsert = [];

    // Emily (idx 0): Offers UI/UX, learns Python & French
    const emily = seededProfiles.find(p => p.username === 'emily_w');
    if (emily) {
      if (uiuxSkill) memberSkillsToInsert.push({ profile_id: emily.id, skill_id: uiuxSkill.id, type: 'offer' });
      if (pythonSkill) memberSkillsToInsert.push({ profile_id: emily.id, skill_id: pythonSkill.id, type: 'learn' });
      if (frenchSkill) memberSkillsToInsert.push({ profile_id: emily.id, skill_id: frenchSkill.id, type: 'learn' });
    }

    // Rahul (idx 1): Offers Python, learns Photo & UI/UX
    const rahul = seededProfiles.find(p => p.username === 'rahul_m');
    if (rahul) {
      if (pythonSkill) memberSkillsToInsert.push({ profile_id: rahul.id, skill_id: pythonSkill.id, type: 'offer' });
      if (photoSkill) memberSkillsToInsert.push({ profile_id: rahul.id, skill_id: photoSkill.id, type: 'learn' });
      if (uiuxSkill) memberSkillsToInsert.push({ profile_id: rahul.id, skill_id: uiuxSkill.id, type: 'learn' });
    }

    // Sarah (idx 2): Offers French, learns React
    const sarah = seededProfiles.find(p => p.username === 'sarah_c');
    const reactSkill = skills.find(s => s.name === 'React Basics');
    if (sarah) {
      if (frenchSkill) memberSkillsToInsert.push({ profile_id: sarah.id, skill_id: frenchSkill.id, type: 'offer' });
      if (reactSkill) memberSkillsToInsert.push({ profile_id: sarah.id, skill_id: reactSkill.id, type: 'learn' });
    }

    if (memberSkillsToInsert.length) {
      const { error: msErr } = await supabase.from('member_skills').upsert(memberSkillsToInsert);
      if (msErr) console.error('Error seeding member_skills:', msErr.message);
      else console.log(`✔ Seeded ${memberSkillsToInsert.length} member skill associations`);
    }

    // 5. Create active exchange request
    console.log('Seeding exchanges...');
    if (emily && rahul && uiuxSkill && pythonSkill) {
      const { data: exchange, error: exErr } = await supabase
        .from('exchanges')
        .insert({
          sender_id: emily.id,
          receiver_id: rahul.id,
          sender_email: emily.email,
          receiver_email: rahul.email,
          sender_skill_id: uiuxSkill.id,
          receiver_skill_id: pythonSkill.id,
          sender_skill_name: uiuxSkill.name,
          receiver_skill_name: pythonSkill.name,
          message: 'Hey Rahul, I saw you want to learn UI/UX. Let us swap with your Python skill!',
          status: 'pending'
        })
        .select()
        .single();

      if (exErr) {
        console.error('Error inserting exchange request:', exErr.message);
      } else {
        console.log(`✔ Seeded pending exchange request from Emily to Rahul. ID: ${exchange.id}`);
        
        // Also insert notification for Rahul
        await supabase.from('notifications').insert({
          profile_id: rahul.id,
          exchange_id: exchange.id,
          title: 'New Exchange Request',
          detail: 'Emily Watson sent you an exchange request.',
          read: false
        });
        console.log('✔ Triggered notification for Rahul');
      }
    }

    // 6. Create a course and lectures
    console.log('Seeding course and lectures...');
    if (rahul && pythonSkill) {
      // Insert course
      const { data: course, error: cErr } = await supabase
        .from('courses')
        .insert({
          teacher_id: rahul.id,
          skill_id: pythonSkill.id,
          skill_name: pythonSkill.name,
          title: 'Python for Beginners',
          description: 'A comprehensive starter course on Python syntax, control structures, and simple data structures.',
          category: 'development',
          status: 'published'
        })
        .select()
        .single();

      if (cErr) {
        console.error('Error inserting course:', cErr.message);
      } else {
        console.log(`✔ Seeded course "Python for Beginners" (ID: ${course.id})`);

        // Insert lectures
        const lectures = [
          { course_id: course.id, title: 'Introduction to Python & Variables', order: 1, duration_minutes: 30, status: 'completed' },
          { course_id: course.id, title: 'Control Flow: Loops & Conditionals', order: 2, duration_minutes: 40, status: 'upcoming' },
          { course_id: course.id, title: 'Functions & Modules', order: 3, duration_minutes: 45, status: 'upcoming' }
        ];

        const { data: lectureData, error: lErr } = await supabase
          .from('lectures')
          .insert(lectures)
          .select();

        if (lErr) {
          console.error('Error seeding lectures:', lErr.message);
        } else {
          console.log(`✔ Seeded ${lectureData.length} lectures for the Python course`);
        }

        // Enroll test_user_v21 (from database check)
        const testUserId = 'deffc233-8955-4e03-b7c3-18cdd2ea87df';
        const { error: enrollErr } = await supabase
          .from('course_enrollments')
          .insert({
            course_id: course.id,
            learner_id: testUserId,
            status: 'active',
            progress: 33, // completed 1 of 3
            exam_state: 'locked',
            certificate_state: 'none'
          });

        if (enrollErr) console.error('Error enrolling test user:', enrollErr.message);
        else console.log('✔ Enrolled Test User in Rahul\'s Python Course');
      }
    }

    console.log('\n--- SEED COMPLETED SUCCESSFULLY ---');
    console.log('Seeded accounts login (Password for all is Password@123):');
    newUsers.forEach(u => {
      console.log(`  - Username: ${u.username} | Email: ${u.email}`);
    });

  } catch (err) {
    console.error('Exception during seeding:', err.message || err);
  }
}

seedRandomData();
