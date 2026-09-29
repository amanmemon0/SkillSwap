const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('../config/db');

const generateToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const normalizeRole = (role) => String(role || 'user').toLowerCase() === 'admin' ? 'admin' : 'user';

// Keep this list explicit: the endpoint is an admin tool, not a way to query
// Explicit column allowlists per table to prevent accidental or malicious leakage
// of sensitive credentials (e.g. password_hash, tokens, session material).
const adminTableAllowlists = {
  users: ['id', 'email', 'role', 'created_at', 'deleted_at'],
  profiles: ['id', 'full_name', 'avatar_url', 'location', 'bio', 'role', 'created_at', 'username', 'phone', 'country', 'state', 'city', 'primary_skill', 'skill_level', 'learning_skills', 'availability', 'learning_mode', 'status', 'deleted_at', 'rating', 'total_reviews', 'completed_swaps', 'pending_swaps', 'cancelled_swaps', 'reports_count', 'email', 'credits'],
  skills: ['id', 'name', 'category', 'approved', 'created_by', 'created_at'],
  member_skills: ['profile_id', 'skill_id', 'type', 'created_at'],
  skill_requests: ['id', 'requester_id', 'skill_name', 'category', 'status', 'reviewer_id', 'reviewer_note', 'reviewed_at', 'created_at'],
  exchanges: ['id', 'sender_id', 'receiver_id', 'sender_skill_id', 'receiver_skill_id', 'sender_skill_name', 'receiver_skill_name', 'status', 'message', 'created_at', 'updated_at', 'sender_email', 'receiver_email'],
  notifications: ['id', 'profile_id', 'exchange_id', 'title', 'detail', 'read', 'created_at', 'type'],
  conversations: ['id', 'user1_id', 'user2_id', 'created_at'],
  messages: ['id', 'conversation_id', 'sender_id', 'body', 'created_at', 'read_at'],
  reviews: ['id', 'reviewer_id', 'reviewee_id', 'exchange_id', 'rating', 'comment', 'created_at'],
  courses: ['id', 'teacher_id', 'skill_id', 'skill_name', 'title', 'description', 'category', 'status', 'created_at', 'updated_at', 'credit_cost'],
  course_enrollments: ['id', 'course_id', 'learner_id', 'status', 'progress', 'exam_state', 'certificate_state', 'enrolled_at', 'completed_at', 'updated_at'],
  lectures: ['id', 'course_id', 'title', 'description', 'order', 'duration_minutes', 'scheduled_at', 'status', 'created_at', 'updated_at'],
  lecture_attendance: ['id', 'lecture_id', 'learner_id', 'status', 'minutes_attended', 'joined_at', 'left_at', 'created_at'],
  exams: ['id', 'course_id', 'title', 'description', 'time_limit_mins', 'pass_mark_percentage', 'status', 'created_at', 'updated_at'],
  exam_questions: ['id', 'exam_id', 'question_text', 'options', 'correct_option_idx', 'order', 'created_at', 'updated_at'],
  exam_attempts: ['id', 'exam_id', 'learner_id', 'status', 'score_percentage', 'answers', 'submitted_at', 'created_at'],
  certificate_requests: ['id', 'course_id', 'learner_id', 'score_snapshot', 'tutor_decision', 'admin_decision', 'reviewer_id', 'created_at', 'updated_at'],
  certificates: ['id', 'certificate_number', 'request_id', 'learner_id', 'course_id', 'issued_at', 'verification_metadata'],
  lecture_messages: ['id', 'lecture_id', 'sender_id', 'body', 'created_at'],
  community_posts: ['id', 'author_id', 'title', 'content', 'category', 'created_at', 'updated_at'],
  post_comments: ['id', 'post_id', 'author_id', 'content', 'created_at', 'updated_at'],
  post_reactions: ['id', 'post_id', 'user_id', 'type', 'created_at'],
};

const adminTables = Object.keys(adminTableAllowlists);

const serializeUser = (user, profile, token) => ({
  _id: user.id,
  name: profile.full_name || 'Member',
  email: profile.email || user.email,
  role: normalizeRole(profile.role || user.role),
  location: profile.location || 'Nearby',
  username: profile.username || 'member',
  phone: profile.phone || '',
  bio: profile.bio || '',
  primary_skill: profile.primary_skill || '',
  skill_level: profile.skill_level || 'Intermediate',
  learning_skills: profile.learning_skills || [],
  availability: profile.availability || [],
  learning_mode: profile.learning_mode || 'Both',
  credits: profile.credits ?? 50,
  rating: profile.rating ?? null,
  completed_swaps: profile.completed_swaps ?? 0,
  ...(token ? { token } : {}),
});

const registerUser = async (req, res, next) => {
  try {
    const { name, username, email, password, phone, country, state, city, bio, primarySkill, skillLevel, learningSkills, availability, learningMode } = req.body;
    const location = [city, state, country].join(', ');
    const profile = {
      full_name: name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      phone: phone || null,
      country,
      state,
      city,
      location,
      bio,
      primary_skill: primarySkill,
      skill_level: skillLevel,
      learning_skills: learningSkills,
      availability,
      learning_mode: learningMode,
      role: 'user',
      credits: 50,
    };

    // Check if username already exists
    const { data: existingUser, error: usernameError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', profile.username)
      .maybeSingle();

    if (usernameError) return next(usernameError);
    if (existingUser) return res.status(409).json({ message: 'That username is already taken' });

    // Check if email already exists
    const { data: existingEmail, error: emailError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (emailError) return next(emailError);
    if (existingEmail) return res.status(409).json({ message: 'A user with that email already exists' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user into custom public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{ email: email.toLowerCase(), password_hash: passwordHash }])
      .select()
      .single();

    if (userError || !userData) {
      if (userError?.code === '23505') {
        return res.status(409).json({ message: 'A user with that email already exists' });
      }
      return res.status(400).json({ message: userError?.message || 'Unable to register user' });
    }

    // Insert profile into public.profiles table using retrieved id
    const { data: createdProfile, error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: userData.id, ...profile }])
      .select()
      .single();

    if (profileError) {
      // Rollback user creation if profile creation fails
      await supabase.from('users').delete().eq('id', userData.id);
      if (profileError.code === '23505') {
        return res.status(409).json({ message: 'That username is already taken' });
      }
      return next(profileError);
    }

    return res.status(201).json(serializeUser(
      userData,
      createdProfile,
      generateToken(userData.id, userData.email),
    ));
  } catch (error) {
    return next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email in public.users
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .is('deleted_at', null)
      .maybeSingle();

    if (userError) return next(userError);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare password hashes
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Fetch profile from public.profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) return next(profileError);
    if (!profile) return res.status(404).json({ message: 'User profile not found' });

    return res.status(200).json(serializeUser(user, profile, generateToken(user.id, user.email)));
  } catch (error) {
    return next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) return next(error);
    if (!profile) return res.status(404).json({ message: 'User profile not found' });

    return res.status(200).json(serializeUser({ id: req.user.id, email: req.user.email }, profile));
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, location, phone, bio, primarySkill, skillLevel, learningSkills, availability, learningMode } = req.body;

    const updates = {};
    if (name !== undefined) updates.full_name = name;
    if (location !== undefined) updates.location = location;
    if (phone !== undefined) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;
    if (primarySkill !== undefined) updates.primary_skill = primarySkill;
    if (skillLevel !== undefined) updates.skill_level = skillLevel;
    if (learningSkills !== undefined) updates.learning_skills = learningSkills;
    if (availability !== undefined) updates.availability = availability;
    if (learningMode !== undefined) updates.learning_mode = learningMode;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(200).json(serializeUser({ id: req.user.id, email: req.user.email }, data));
  } catch (error) {
    return next(error);
  }
};

const getPublicProfiles = async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim();
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, location, city, state, country, bio, primary_skill, skill_level, learning_skills, availability, learning_mode, rating, total_reviews, completed_swaps, status, role')
      .is('deleted_at', null)
      .neq('status', 'Banned');

    if (error) return next(error);
    const uniqueProfiles = [...new Map((profiles || []).map((profile) => [profile.id, profile])).values()];
    if (!search) return res.status(200).json(uniqueProfiles);

    const query = search.toLowerCase();
    return res.status(200).json(uniqueProfiles.filter((profile) => {
      const searchable = [
        profile.full_name, profile.username, profile.primary_skill, profile.bio,
        ...(Array.isArray(profile.learning_skills) ? profile.learning_skills : []),
      ].filter(Boolean).join(' ').toLowerCase();
      return searchable.includes(query);
    }));
  } catch (error) {
    return next(error);
  }
};

const getAdminTableData = async (req, res, next) => {
  try {
    const table = String(req.params.table || '');
    const allowedColumns = adminTableAllowlists[table];
    if (!allowedColumns) {
      return res.status(404).json({ message: 'Unknown or unauthorized database table' });
    }
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 25));
    const from = (page - 1) * pageSize;
    const { data, error, count } = await supabase
      .from(table)
      .select(allowedColumns.join(', '), { count: 'exact' })
      .range(from, from + pageSize - 1);
    if (error) return next(error);
    return res.json({ table, rows: data || [], total: count || 0, page, pageSize });
  } catch (error) {
    return next(error);
  }
};

const getAdminOverviewMetrics = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalUsers },
      { count: activeCourses },
      { count: pendingCourses },
      { count: totalExchanges },
      { count: recentEnrollments },
      { count: recentCourses },
      { count: recentExchanges },
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('courses').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('courses').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
      supabase.from('exchanges').select('id', { count: 'exact', head: true }),
      supabase.from('course_enrollments').select('id', { count: 'exact', head: true }).gte('enrolled_at', thirtyDaysAgo),
      supabase.from('courses').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
      supabase.from('exchanges').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
    ]);

    return res.json({
      totalUsers: totalUsers || 0,
      activeCourses: activeCourses || 0,
      pendingCourses: pendingCourses || 0,
      totalExchanges: totalExchanges || 0,
      recentActivity: {
        newEnrollments30d: recentEnrollments || 0,
        newCourses30d: recentCourses || 0,
        newExchanges30d: recentExchanges || 0,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getRegistrationAnalytics = async (req, res, next) => {
  try {
    const daysLimit = Math.min(90, Math.max(7, Number.parseInt(req.query.days, 10) || 30));

    // First attempt the RPC if migrated
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_registration_stats', { days_limit: daysLimit });
    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      return res.json(rpcData);
    }

    // Fallback: Query created_at for users created in the date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysLimit);
    startDate.setHours(0, 0, 0, 0);

    const { data: rows, error: selectError } = await supabase
      .from('users')
      .select('created_at')
      .is('deleted_at', null)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (selectError) return next(selectError);

    // Group counts per calendar day
    const countMap = new Map();
    for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      countMap.set(key, 0);
    }

    (rows || []).forEach(r => {
      if (r.created_at) {
        const key = new Date(r.created_at).toISOString().slice(0, 10);
        if (countMap.has(key)) {
          countMap.set(key, (countMap.get(key) || 0) + 1);
        }
      }
    });

    const result = Array.from(countMap.entries()).map(([date, count]) => ({ date, count }));
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('*')
      .is('deleted_at', null);

    if (usersErr) return next(usersErr);

    const { data: profiles, error: profilesErr } = await supabase
      .from('profiles')
      .select('*')
      .is('deleted_at', null);

    if (profilesErr) return next(profilesErr);

    // Combine users and profiles
    const combined = users.map(user => {
      const profile = profiles.find(p => p.id === user.id) || {};
      
      return {
        id: user.id,
        fullName: profile.full_name || 'Member',
        username: profile.username || 'member',
        email: user.email,
        phone: profile.phone || '',
        city: profile.city || 'Nearby',
        bio: profile.bio || '',
        teachSkills: profile.primary_skill ? [profile.primary_skill] : [],
        learnSkills: profile.learning_skills || [],
        skillLevel: profile.skill_level || 'Intermediate',
        learningMode: profile.learning_mode || 'Online',
        availability: profile.availability || ['Weekends'],
        role: profile.role ? (profile.role.charAt(0).toUpperCase() + profile.role.slice(1)) : 'User',
        status: profile.status || 'Active',
        rating: Number(profile.rating ?? 5),
        totalReviews: profile.total_reviews ?? 0,
        completedSwaps: profile.completed_swaps ?? 0,
        pendingSwaps: profile.pending_swaps ?? 0,
        cancelledSwaps: profile.cancelled_swaps ?? 0,
        reports: profile.reports_count ?? 0,
        joinedAt: user.created_at || new Date().toISOString(),
        lastLogin: user.created_at || new Date().toISOString(),
      };
    });

    return res.status(200).json(combined);
  } catch (error) {
    return next(error);
  }
};

const adminUpdateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, role } = req.body;

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (role !== undefined) updates.role = role.toLowerCase();

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return next(error);

    return res.status(200).json({ message: 'User updated successfully', data });
  } catch (error) {
    return next(error);
  }
};

const adminDeleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ message: 'Administrators cannot delete their own account' });
    }

    const deletedAt = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update({ deleted_at: deletedAt })
      .eq('id', id)
      .is('deleted_at', null)
      .select('id')
      .maybeSingle();

    if (error) return next(error);
    if (!data) return res.status(404).json({ message: 'User not found' });

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ deleted_at: deletedAt, status: 'Banned' })
      .eq('id', id);

    if (profileError) return next(profileError);

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Step 1: Request a password reset.
 * Accepts only { email }. Generates a short-lived token, stores it in the
 * password_reset_tokens table, and sends it to the user via email.
 *
 * The response is always a 200 with a generic message to prevent user-enumeration.
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .is('deleted_at', null)
      .maybeSingle();

    // Always respond 200 to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        message: 'If an account exists for that email, a reset link has been sent.',
      });
    }

    // Generate a cryptographically secure token
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Invalidate any existing tokens for this user first
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('user_id', user.id)
      .eq('used', false);

    // Store hashed token
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({ user_id: user.id, token_hash: tokenHash, expires_at: expiresAt });

    if (insertError) return next(insertError);

    // TODO: Replace this console.log with your transactional email provider.
    // Recommended: Resend (https://resend.com) or SendGrid.
    // Example with Resend:
    //   const resend = new Resend(process.env.RESEND_API_KEY);
    //   await resend.emails.send({
    //     from: 'SkillSwap <noreply@skillswap.app>',
    //     to: user.email,
    //     subject: 'Reset your SkillSwap password',
    //     html: `<p>Use this token to reset your password: <strong>${plainToken}</strong></p>
    //            <p>It expires in 1 hour. If you did not request this, ignore this email.</p>`,
    //   });
    console.log(`[DEV ONLY] Password reset token for ${user.email}: ${plainToken}`);

    return res.status(200).json({
      message: 'If an account exists for that email, a reset link has been sent.',
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Step 2: Consume the token and set a new password.
 * Accepts { token, newPassword }. Validates the token against the hashed value
 * in the DB, checks expiry, and updates the password only if valid.
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { data: resetRecord, error: lookupError } = await supabase
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (lookupError) return next(lookupError);

    if (!resetRecord || resetRecord.used || new Date(resetRecord.expires_at) < new Date()) {
      return res.status(400).json({
        message: 'This password reset link is invalid or has expired. Please request a new one.',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update the user's password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', resetRecord.user_id);

    if (updateError) return next(updateError);

    // Mark the token as used (one-time use)
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', resetRecord.id);

    return res.status(200).json({
      message: 'Password reset successfully. You can now sign in with your new password.',
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  generateToken,
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  getPublicProfiles,
  getAllUsers,
  getAdminTableData,
  getAdminOverviewMetrics,
  getRegistrationAnalytics,
  adminUpdateUser,
  adminDeleteUser,
};
