const toUniqueSkillIds = (skills, type) => new Set(
  (skills || [])
    .filter((skill) => skill && skill.type === type && skill.skill_id)
    .map((skill) => String(skill.skill_id)),
);

const intersectionSize = (left, right) => [...left].filter((id) => right.has(id)).length;
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const normalizeLevel = (level) => (level || '').toLowerCase().trim();

/**
 * Calculates availability overlap between two users.
 * Returns a value between 0–1 based on shared slots.
 */
const availabilityOverlap = (aAvail, bAvail) => {
  const aSet = new Set((aAvail || []).map(s => s.toLowerCase().trim()));
  const bSet = new Set((bAvail || []).map(s => s.toLowerCase().trim()));
  if (!aSet.size || !bSet.size) return 0;
  const overlap = [...aSet].filter(slot => bSet.has(slot)).length;
  return overlap / Math.max(aSet.size, bSet.size);
};

/**
 * Returns a bonus (0–1) if skill levels are compatible.
 * Teacher should be at or above learner level.
 */
const skillLevelBonus = (learnerLevel, teacherLevel) => {
  const li = SKILL_LEVELS.indexOf(normalizeLevel(learnerLevel));
  const ti = SKILL_LEVELS.indexOf(normalizeLevel(teacherLevel));
  if (li === -1 || ti === -1) return 0.5; // unknown — neutral
  if (ti >= li) return 1.0; // teacher meets or exceeds learner
  return Math.max(0, 1 - (li - ti) * 0.33); // partial credit for close levels
};

/**
 * Calculates reciprocal matching from canonical member_skills records.
 * An empty wanted-skill set has 0% satisfaction so it cannot inflate a match.
 */
const calculateCompatibility = (userASkills, userBSkills, profileA = {}, profileB = {}) => {
  const aOffers = toUniqueSkillIds(userASkills, 'offer');
  const aWants = toUniqueSkillIds(userASkills, 'learn');
  const bOffers = toUniqueSkillIds(userBSkills, 'offer');
  const bWants = toUniqueSkillIds(userBSkills, 'learn');

  const aMatchedWantedSkills = intersectionSize(aWants, bOffers);
  const bMatchedWantedSkills = intersectionSize(bWants, aOffers);
  const aSatisfaction = aWants.size ? (aMatchedWantedSkills / aWants.size) * 100 : 0;
  const bSatisfaction = bWants.size ? (bMatchedWantedSkills / bWants.size) * 100 : 0;
  const baseScore = (aSatisfaction + bSatisfaction) / 2;

  // Availability overlap bonus (up to 10 additional points)
  const availBonus = availabilityOverlap(profileA.availability, profileB.availability) * 10;

  // Skill level compatibility bonus (up to 5 additional points, averaged for both directions)
  const hasLevelInfo = Boolean(profileA.skill_level || profileB.skill_level);
  const aLevelBonus = skillLevelBonus(profileA.skill_level, profileB.skill_level) * 5;
  const bLevelBonus = skillLevelBonus(profileB.skill_level, profileA.skill_level) * 5;
  const levelBonus = hasLevelInfo ? (aLevelBonus + bLevelBonus) / 2 : 0;

  const rawScore = baseScore + availBonus + levelBonus;
  const compatibility = Math.min(100, Math.round(rawScore));

  // Build human-readable reasons
  const reasons = [];
  if (aMatchedWantedSkills > 0) reasons.push(`${profileB.full_name || 'Partner'} offers skills you want to learn`);
  if (bMatchedWantedSkills > 0) reasons.push(`You offer skills they want to learn`);
  if (availBonus > 5) reasons.push('Great schedule overlap');
  else if (availBonus > 0) reasons.push('Some schedule overlap');
  if (levelBonus > 3) reasons.push('Compatible skill levels');
  if (reasons.length === 0) reasons.push('Potential for new skill discovery');

  return {
    compatibility,
    aSatisfaction,
    bSatisfaction,
    aMatchedWantedSkills,
    bMatchedWantedSkills,
    aWantedSkillCount: aWants.size,
    bWantedSkillCount: bWants.size,
    availabilityOverlapScore: availBonus,
    levelCompatibilityScore: levelBonus,
    reasons,
  };
};

const mapSkills = (rows) => rows.map((row) => ({
  id: row.skill_id,
  name: row.skills?.name,
  category: row.skills?.category,
}));

const getCompatibilityMatch = async (supabase, currentUserId, matchedUserId) => {
  if (currentUserId === matchedUserId) {
    const error = new Error('Users cannot be matched with themselves');
    error.statusCode = 400;
    throw error;
  }
  if (!isUuid(matchedUserId)) {
    const error = new Error('Matched user ID is invalid');
    error.statusCode = 400;
    throw error;
  }

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, location, username, bio, skill_level, learning_mode, availability')
    .in('id', [currentUserId, matchedUserId])
    .is('deleted_at', null);
  if (profileError) throw profileError;

  const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));
  if (!profileById.has(currentUserId)) {
    const error = new Error('Authenticated user profile not found');
    error.statusCode = 404;
    throw error;
  }
  if (!profileById.has(matchedUserId)) {
    const error = new Error('Matched user not found');
    error.statusCode = 404;
    throw error;
  }

  const { data: skillRows, error: skillsError } = await supabase
    .from('member_skills')
    .select('profile_id, skill_id, type, skills(id, name, category)')
    .in('profile_id', [currentUserId, matchedUserId]);
  if (skillsError) throw skillsError;

  const currentUserSkills = (skillRows || []).filter((row) => row.profile_id === currentUserId);
  const matchedUserSkills = (skillRows || []).filter((row) => row.profile_id === matchedUserId);

  const profileA = profileById.get(currentUserId);
  const profileB = profileById.get(matchedUserId);
  const score = calculateCompatibility(currentUserSkills, matchedUserSkills, profileA, profileB);

  return {
    user: profileB,
    offeredSkills: mapSkills(matchedUserSkills.filter((row) => row.type === 'offer')),
    wantedSkills: mapSkills(matchedUserSkills.filter((row) => row.type === 'learn')),
    compatibility: score.compatibility,
    reasons: score.reasons,
    satisfaction: {
      currentUser: score.aSatisfaction,
      matchedUser: score.bSatisfaction,
    },
    currentUser: {
      offeredSkills: mapSkills(currentUserSkills.filter((row) => row.type === 'offer')),
      wantedSkills: mapSkills(currentUserSkills.filter((row) => row.type === 'learn')),
    },
  };
};

module.exports = { calculateCompatibility, getCompatibilityMatch };
