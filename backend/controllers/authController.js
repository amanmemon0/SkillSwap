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
// arbitrary PostgREST relations supplied by a client.
const adminTables = [
  'users', 'profiles', 'skills', 'member_skills', 'skill_requests',
  'exchanges', 'notifications', 'conversations', 'messages', 'reviews',
  'courses', 'course_enrollments', 'lectures', 'lecture_attendance',
  'exams', 'exam_questions', 'exam_attempts', 'certificate_requests',
  'certificates', 'lecture_messages', 'community_posts', 'post_comments',
  'post_reactions',
];

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
    if (!adminTables.includes(table)) {
      return res.status(404).json({ message: 'Unknown database table' });
    }
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 25));
    const from = (page - 1) * pageSize;
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .range(from, from + pageSize - 1);
    if (error) return next(error);
    return res.json({ table, rows: data || [], total: count || 0, page, pageSize });
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
  adminUpdateUser,
  adminDeleteUser,
};
