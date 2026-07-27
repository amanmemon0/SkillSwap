const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'skillswap_super_secret_jwt_key_2026');

    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
  }
};

module.exports = { protect };
