const toUniqueSkillIds = (skills, type) => new Set(
  (skills || [])
    .filter((skill) => skill && skill.type === type && skill.skill_id)
    .map((skill) => String(skill.skill_id)),
);

const intersectionSize = (left, right) => [...left].filter((id) => right.has(id)).length;
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

/**
 * Calculates reciprocal matching from canonical member_skills records.
 * An empty wanted-skill set has 0% satisfaction so it cannot inflate a match.
 */
const calculateCompatibility = (userASkills, userBSkills) => {
  const aOffers = toUniqueSkillIds(userASkills, 'offer');
  const aWants = toUniqueSkillIds(userASkills, 'learn');
  const bOffers = toUniqueSkillIds(userBSkills, 'offer');
  const bWants = toUniqueSkillIds(userBSkills, 'learn');

  const aMatchedWantedSkills = intersectionSize(aWants, bOffers);
  const bMatchedWantedSkills = intersectionSize(bWants, aOffers);
  const aSatisfaction = aWants.size ? (aMatchedWantedSkills / aWants.size) * 100 : 0;
  const bSatisfaction = bWants.size ? (bMatchedWantedSkills / bWants.size) * 100 : 0;

  return {
    compatibility: Math.round((aSatisfaction + bSatisfaction) / 2),
    aSatisfaction,
    bSatisfaction,
    aMatchedWantedSkills,
    bMatchedWantedSkills,
    aWantedSkillCount: aWants.size,
    bWantedSkillCount: bWants.size,
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
    .select('id, full_name, avatar_url, location, username, bio, skill_level, learning_mode')
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
  const score = calculateCompatibility(currentUserSkills, matchedUserSkills);

  return {
    user: profileById.get(matchedUserId),
    offeredSkills: mapSkills(matchedUserSkills.filter((row) => row.type === 'offer')),
    wantedSkills: mapSkills(matchedUserSkills.filter((row) => row.type === 'learn')),
    compatibility: score.compatibility,
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
