const supabase = require('../config/db');

const categories = ['development', 'languages', 'design', 'photography', 'business', 'communication', 'life_skills', 'other'];
const dbError = (res, error, fallback = 'Database operation failed') => res.status(error?.code === '23505' ? 409 : 400).json({ message: error?.message || fallback });

const listSkills = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('skills').select('*').eq('approved', true).order('name');
    if (error) return dbError(res, error);
    return res.json(data);
  } catch (error) { return next(error); }
};

const mySkills = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('member_skills').select('type, created_at, skills(*)').eq('profile_id', req.user.id).order('created_at');
    if (error) return dbError(res, error);
    return res.json(data.map((entry) => ({ ...entry.skills, type: entry.type, createdAt: entry.created_at })));
  } catch (error) { return next(error); }
};

const setMySkills = async (req, res, next) => {
  try {
    const items = req.body.items;
    if (!Array.isArray(items) || items.some((item) => !item || !['offer', 'learn'].includes(item.type) || typeof item.skillId !== 'string')) return res.status(400).json({ message: 'items must contain skillId and type (offer or learn)' });
    const unique = new Set(items.map((item) => `${item.skillId}:${item.type}`));
    if (unique.size !== items.length) return res.status(400).json({ message: 'Duplicate skill memberships are not allowed' });
    const ids = [...new Set(items.map((item) => item.skillId))];
    if (ids.length) {
      const { data: skills, error } = await supabase.from('skills').select('id').in('id', ids).eq('approved', true);
      if (error) return dbError(res, error);
      if (skills.length !== ids.length) return res.status(400).json({ message: 'All skills must exist and be approved' });
    }
    const { error: removeError } = await supabase.from('member_skills').delete().eq('profile_id', req.user.id);
    if (removeError) return dbError(res, removeError);
    if (items.length) {
      const { error } = await supabase.from('member_skills').insert(items.map((item) => ({ profile_id: req.user.id, skill_id: item.skillId, type: item.type })));
      if (error) return dbError(res, error);
    }
    return mySkills(req, res, next);
  } catch (error) { return next(error); }
};

const getCategories = (req, res) => res.json(categories.map((id) => ({ id, name: id.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) })));
const mapRequest = (row) => ({ id: row.id, skillName: row.skill_name, categoryId: row.category, categoryName: row.category, status: row.status, requestedAt: row.created_at, reviewerNote: row.reviewer_note, requester: row.requester ? { id: row.requester.id, name: row.requester.full_name, email: row.requester.email } : undefined });

const getMyRequests = async (req, res, next) => {
  try { const { data, error } = await supabase.from('skill_requests').select('*').eq('requester_id', req.user.id).order('created_at', { ascending: false }); if (error) return dbError(res, error); return res.json(data.map(mapRequest)); } catch (error) { return next(error); }
};
const createRequest = async (req, res, next) => {
  try {
    const { data: pending, error: pendingError } = await supabase.from('skill_requests').select('id').eq('requester_id', req.user.id).eq('status', 'pending').limit(1);
    if (pendingError) return dbError(res, pendingError);
    if (pending.length) return res.status(409).json({ message: 'A skill request is already awaiting review' });
    const { data, error } = await supabase.from('skill_requests').insert({ requester_id: req.user.id, skill_name: req.body.skillName, category: req.body.category || null }).select().single();
    if (error) return dbError(res, error); return res.status(201).json(mapRequest(data));
  } catch (error) { return next(error); }
};
const updateRequest = async (req, res, next) => {
  try { const { data, error } = await supabase.from('skill_requests').update({ skill_name: req.body.skillName, category: req.body.category || null }).eq('id', req.params.id).eq('requester_id', req.user.id).eq('status', 'pending').select().maybeSingle(); if (error) return dbError(res, error); if (!data) return res.status(404).json({ message: 'Pending skill request not found' }); return res.json(mapRequest(data)); } catch (error) { return next(error); }
};
const revokeRequest = async (req, res, next) => {
  try { const { data, error } = await supabase.from('skill_requests').delete().eq('id', req.params.id).eq('requester_id', req.user.id).eq('status', 'pending').select('id').maybeSingle(); if (error) return dbError(res, error); if (!data) return res.status(404).json({ message: 'Pending skill request not found' }); return res.status(204).end(); } catch (error) { return next(error); }
};
const pendingRequests = async (req, res, next) => {
  try { const { data, error } = await supabase.from('skill_requests').select('*, requester:profiles!skill_requests_requester_id_fkey(id, full_name, email)').eq('status', 'pending').order('created_at'); if (error) return dbError(res, error); return res.json(data.map(mapRequest)); } catch (error) { return next(error); }
};
const reviewRequest = async (req, res, next) => {
  try { const { data, error } = await supabase.from('skill_requests').update({ status: req.body.decision, reviewer_id: req.user.id, reviewer_note: req.body.reviewerNote || null, reviewed_at: new Date().toISOString() }).eq('id', req.params.id).eq('status', 'pending').select('*, requester:profiles!skill_requests_requester_id_fkey(id, full_name, email)').maybeSingle(); if (error) return dbError(res, error); if (!data) return res.status(404).json({ message: 'Pending skill request not found' }); return res.json(mapRequest(data)); } catch (error) { return next(error); }
};

module.exports = { listSkills, mySkills, setMySkills, getCategories, getMyRequests, createRequest, updateRequest, revokeRequest, pendingRequests, reviewRequest };
