const jwt = require('jsonwebtoken');
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
    };

    const { data: existingUser, error: usernameError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', profile.username)
      .maybeSingle();

    if (usernameError) return next(usernameError);
    if (existingUser) return res.status(409).json({ message: 'That username is already taken' });

    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: profile } });

    if (error || !data.user) {
      return res.status(400).json({ message: error?.message || 'Unable to register user' });
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: data.user.id, ...profile }]);

    if (profileError) {
      return next(profileError);
    }

    return res.status(201).json({
      _id: data.user.id,
      name,
      email: data.user.email || email,
      token: generateToken(data.user.id, data.user.email || email),
    });
  } catch (error) {
    return next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      return next(profileError || new Error('User profile not found'));
    }

    return res.status(200).json({
      _id: data.user.id,
      name: profile.full_name,
      email: data.user.email,
      token: generateToken(data.user.id, data.user.email),
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
      .single();

    if (error || !profile) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      _id: profile.id,
      name: profile.full_name,
      email: req.user.email,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { registerUser, loginUser, getMe };
