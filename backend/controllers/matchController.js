const supabase = require('../config/db');
const { getCompatibilityMatch } = require('../services/compatibilityService');

const createGetCompatibility = (getMatch = getCompatibilityMatch) => async (req, res, next) => {
  try {
    const match = await getMatch(supabase, req.user.id, req.params.userId);
    return res.json(match);
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    return next(error);
  }
};

module.exports = { getCompatibility: createGetCompatibility(), createGetCompatibility };
