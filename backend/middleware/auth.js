const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
  }
};

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

module.exports = { protect, isAdmin };
