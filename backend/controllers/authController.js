const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const supabase = require('../config/db');

const generateToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const registerUser = async (req, res, next) => {
  try {
    const { name, username, email, password, phone, country, state, city, bio, primarySkill, skillLevel, learningSkills, availability, learningMode } = req.body;
    const location = [city, state, country].join(', ');
    const profile = {
      full_name: name,
      username: username.toLowerCase(),
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
      return res.status(400).json({ message: userError?.message || 'Unable to register user' });
    }

    // Insert profile into public.profiles table using retrieved id
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: userData.id, ...profile }]);

    if (profileError) {
      // Rollback user creation if profile creation fails
      await supabase.from('users').delete().eq('id', userData.id);
      return next(profileError);
    }

    return res.status(201).json({
      _id: userData.id,
      name,
      email: userData.email,
      role: 'user',
      location,
      token: generateToken(userData.id, userData.email),
    });
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
      .select('full_name, role, location')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.role || 'user';
    const name = profile?.full_name || 'Member';
    const location = profile?.location || 'Nearby';

    return res.status(200).json({
      _id: user.id,
      name,
      email: user.email,
      role,
      location,
      token: generateToken(user.id, user.email),
    });
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
      .maybeSingle();

    if (error) {
      return next(error);
    }

    return res.status(200).json({
      _id: req.user.id,
      name: profile?.full_name || 'Member',
      email: req.user.email,
      role: profile?.role || 'user',
      location: profile?.location || 'Nearby',
    });
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, location } = req.body;

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: req.user.id,
        full_name: name,
        location: location,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(200).json({
      _id: data.id,
      name: data.full_name,
      location: data.location,
      email: req.user.email,
      role: data.role || 'user',
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { registerUser, loginUser, getMe, updateProfile };


