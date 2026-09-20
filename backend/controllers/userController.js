const supabase = require('../config/db');

// @desc    Get public user profile
// @route   GET /api/users/:id
// @access  Public
const getUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, bio, location, username, avatar_url, primary_skill, learning_skills, skill_level, rating, completed_swaps, availability, learning_mode, credits')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) return res.status(404).json({ message: 'User not found' });

    // Fetch member_skills with skill names
    const { data: memberSkills } = await supabase
      .from('member_skills')
      .select('type, skill_id, skills(id, name, category)')
      .eq('profile_id', id);

    // Fetch courses taught by this user
    const { data: courses } = await supabase
      .from('courses')
      .select('id, skill_name, description, category, status')
      .eq('teacher_id', id)
      .eq('status', 'published');

    // Fetch reviews received
    const { data: reviews } = await supabase
      .from('reviews')
      .select(`
        id, rating, comment, created_at,
        reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, username, avatar_url)
      `)
      .eq('reviewee_id', id)
      .order('created_at', { ascending: false })
      .limit(20);

    return res.status(200).json({
      ...profile,
      offeredSkills: (memberSkills || []).filter(s => s.type === 'offer').map(s => ({ id: s.skill_id, ...s.skills })),
      wantedSkills: (memberSkills || []).filter(s => s.type === 'learn').map(s => ({ id: s.skill_id, ...s.skills })),
      courses: courses || [],
      reviews: reviews || [],
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    List all users (for recommendations)
// @route   GET /api/users
// @access  Private
const listUsers = async (req, res, next) => {
  try {
    const currentUserId = req.user?.id;
    let query = supabase
      .from('profiles')
      .select('id, full_name, bio, location, username, avatar_url, primary_skill, learning_skills, skill_level, rating, completed_swaps, availability, learning_mode')
      .is('deleted_at', null)
      .order('rating', { ascending: false });

    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    const { data: profiles, error } = await query;
    if (error) throw error;

    return res.status(200).json(profiles || []);
  } catch (error) {
    return next(error);
  }
};

// @desc    Submit a review for a user after a completed exchange
// @route   POST /api/users/:id/reviews
// @access  Private
const submitReview = async (req, res, next) => {
  try {
    const { id: revieweeId } = req.params;
    const reviewerId = req.user.id;
    const { rating, comment, exchangeId } = req.body;

    if (reviewerId === revieweeId) {
      return res.status(400).json({ message: 'You cannot review yourself' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Verify exchange is completed and reviewer was part of it
    if (exchangeId) {
      const { data: exchange } = await supabase
        .from('exchanges')
        .select('sender_id, receiver_id, status')
        .eq('id', exchangeId)
        .maybeSingle();

      if (!exchange) {
        return res.status(404).json({ message: 'Exchange not found' });
      }
      if (exchange.status !== 'completed') {
        return res.status(400).json({ message: 'You can only review after a completed exchange' });
      }
      const isParticipant = exchange.sender_id === reviewerId || exchange.receiver_id === reviewerId;
      if (!isParticipant) {
        return res.status(403).json({ message: 'You were not part of this exchange' });
      }
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .insert([{
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        exchange_id: exchangeId || null,
        rating,
        comment: comment || null,
      }])
      .select(`
        id, rating, comment, created_at,
        reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, username, avatar_url)
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ message: 'You have already reviewed this person for this exchange' });
      }
      return res.status(400).json({ message: error.message });
    }

    return res.status(201).json(review);
  } catch (error) {
    return next(error);
  }
};

module.exports = { getUserProfile, listUsers, submitReview };
