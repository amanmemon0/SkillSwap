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
      role: 'user',
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
      role: 'user',
      location,
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
      .select('full_name, role, location')
      .eq('id', data.user.id)
      .maybeSingle();

    const role = profile?.role || data.user.user_metadata?.role || 'user';
    const name = profile?.full_name || data.user.user_metadata?.full_name || 'Member';
    const location = profile?.location || data.user.user_metadata?.location || 'Nearby';

    return res.status(200).json({
      _id: data.user.id,
      name,
      email: data.user.email,
      role,
      location,
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

