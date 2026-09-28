const jwt = require('jsonwebtoken');

const createProtect = (supabase) => async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const bearerMatch = typeof authHeader === 'string' && authHeader.match(/^Bearer ([^\s]+)$/);

  if (!bearerMatch) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(bearerMatch[1], process.env.JWT_SECRET);
    if (!decoded || typeof decoded.id !== 'string' || !decoded.id) {
      return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', decoded.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (userError) {
      return res.status(500).json({ message: 'Unable to authenticate user' });
    }
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user is unavailable' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, status')
      .eq('id', decoded.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (profileError) {
      return res.status(500).json({ message: 'Unable to authenticate user' });
    }
    if (!profile || String(profile.status || '').toLowerCase() === 'banned') {
      return res.status(401).json({ message: 'Not authorized, user is unavailable' });
    }

    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
  }
};

const protect = createProtect(require('../config/db'));

const isAdmin = async (req, res, next) => {
  try {
    const supabase = require('../config/db');
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error || !profile || (profile.role.toLowerCase() !== 'admin')) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ message: 'Error verifying admin privileges' });
  }
};

module.exports = { protect, createProtect, isAdmin };
