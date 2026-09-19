const crypto = require('crypto');
const supabase = require('../config/db');

const respondDbError = (res, error, fallback = 'Database operation failed') => res.status(error?.code === '23505' ? 409 : 400).json({ message: error?.message || fallback });
const asCourse = (row) => row;
const isAdmin = async (userId) => {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
  return String(data?.role || '').toLowerCase() === 'admin';
};

async function courseForTeacher(courseId, userId) {
  const { data, error } = await supabase.from('courses').select('*').eq('id', courseId).eq('teacher_id', userId).maybeSingle();
  return { data, error };
}
async function enrollmentForLearner(courseId, learnerId) {
  const { data, error } = await supabase.from('course_enrollments').select('*').eq('course_id', courseId).eq('learner_id', learnerId).maybeSingle();
  return { data, error };
}
async function accessibleLecture(lectureId, userId) {
  const { data: lecture, error } = await supabase.from('lectures').select('*, courses!lectures_course_id_fkey(teacher_id)').eq('id', lectureId).maybeSingle();
  if (error || !lecture) return { lecture: null, error };
  if (lecture.courses.teacher_id === userId) return { lecture, error: null };
  const { data: enrollment, error: enrollmentError } = await enrollmentForLearner(lecture.course_id, userId);
  return { lecture: enrollment && enrollment.status === 'active' ? lecture : null, error: enrollmentError };
}

const listCourses = async (req, res, next) => {
  try { const { data, error } = await supabase.from('courses').select('*, teacher:profiles!courses_teacher_id_fkey(id, full_name, username)').eq('status', 'published').order('created_at', { ascending: false }); if (error) return respondDbError(res, error); return res.json(data.map(asCourse)); } catch (error) { return next(error); }
};
const getCourse = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('courses').select('*, teacher:profiles!courses_teacher_id_fkey(id, full_name, username)').eq('id', req.params.courseId).maybeSingle();
    if (error) return respondDbError(res, error); if (!data) return res.status(404).json({ message: 'Course not found' });
    if (data.status !== 'published' && data.teacher_id !== req.user.id && !(await isAdmin(req.user.id))) return res.status(403).json({ message: 'Course is not available' });
    return res.json(data);
  } catch (error) { return next(error); }
};
const createCourse = async (req, res, next) => {
  try { const b = req.body; const { data, error } = await supabase.from('courses').insert({ teacher_id: req.user.id, skill_id: b.skillId || null, skill_name: b.skillName, title: b.title, description: b.description || null, category: b.category || null, status: b.status || 'draft' }).select().single(); if (error) return respondDbError(res, error); return res.status(201).json(data); } catch (error) { return next(error); }
};
const updateCourse = async (req, res, next) => {
  try { const b = req.body; const updates = {}; [['skillId', 'skill_id'], ['skillName', 'skill_name'], ['title', 'title'], ['description', 'description'], ['category', 'category'], ['status', 'status']].forEach(([from, to]) => { if (b[from] !== undefined) updates[to] = b[from]; }); const { data, error } = await supabase.from('courses').update(updates).eq('id', req.params.courseId).eq('teacher_id', req.user.id).select().maybeSingle(); if (error) return respondDbError(res, error); if (!data) return res.status(404).json({ message: 'Course not found or not owned by you' }); return res.json(data); } catch (error) { return next(error); }
};
const deleteCourse = async (req, res, next) => {
  try { const { data, error } = await supabase.from('courses').delete().eq('id', req.params.courseId).eq('teacher_id', req.user.id).eq('status', 'draft').select('id').maybeSingle(); if (error) return respondDbError(res, error); if (!data) return res.status(404).json({ message: 'Draft course not found or not owned by you' }); return res.status(204).end(); } catch (error) { return next(error); }
};
const enroll = async (req, res, next) => {
  try { const { data: course, error: courseError } = await supabase.from('courses').select('id, teacher_id, status').eq('id', req.params.courseId).maybeSingle(); if (courseError) return respondDbError(res, courseError); if (!course) return res.status(404).json({ message: 'Course not found' }); if (course.status !== 'published') return res.status(409).json({ message: 'Only published courses can be enrolled in' }); if (course.teacher_id === req.user.id) return res.status(400).json({ message: 'Teachers cannot enroll in their own courses' }); const { data, error } = await supabase.from('course_enrollments').insert({ course_id: course.id, learner_id: req.user.id }).select().single(); if (error) return respondDbError(res, error, 'Unable to enroll in course'); return res.status(201).json(data); } catch (error) { return next(error); }
};
const dropEnrollment = async (req, res, next) => {
  try { const { data, error } = await supabase.from('course_enrollments').update({ status: 'dropped' }).eq('course_id', req.params.courseId).eq('learner_id', req.user.id).eq('status', 'active').select().maybeSingle(); if (error) return respondDbError(res, error); if (!data) return res.status(404).json({ message: 'Active enrollment not found' }); return res.json(data); } catch (error) { return next(error); }
};
const myLearning = async (req, res, next) => {
  try { const { data, error } = await supabase.from('course_enrollments').select('*, course:courses!course_enrollments_course_id_fkey(*, teacher:profiles!courses_teacher_id_fkey(id, full_name))').eq('learner_id', req.user.id).order('enrolled_at', { ascending: false }); if (error) return respondDbError(res, error); return res.json(data); } catch (error) { return next(error); }
};
const myTeaching = async (req, res, next) => {
  try { const { data, error } = await supabase.from('courses').select('*').eq('teacher_id', req.user.id).order('created_at', { ascending: false }); if (error) return respondDbError(res, error); return res.json(data); } catch (error) { return next(error); }
};
const listCourseEnrollments = async (req, res, next) => {
  try {
    const { data: course } = await courseForTeacher(req.params.courseId, req.user.id);
    if (!course && !(await isAdmin(req.user.id))) return res.status(403).json({ message: 'Only the course teacher can view enrollments' });
    const { data, error } = await supabase.from('course_enrollments').select('*, learner:profiles!course_enrollments_learner_id_fkey(id, full_name)').eq('course_id', req.params.courseId).order('enrolled_at', { ascending: false });
    if (error) return respondDbError(res, error); return res.json(data);
  } catch (error) { return next(error); }
};
const requestExam = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('course_enrollments').update({ exam_state: 'requested' }).eq('course_id', req.params.courseId).eq('learner_id', req.user.id).eq('status', 'active').eq('exam_state', 'eligible').select().maybeSingle();
    if (error) return respondDbError(res, error); if (!data) return res.status(409).json({ message: 'Complete all lectures before requesting an exam' }); return res.json(data);
  } catch (error) { return next(error); }
};
const setExamStatus = async (req, res, next) => {
  try {
    if (!['scheduled'].includes(req.body.status)) return res.status(400).json({ message: 'Only scheduled status may be set manually' });
    const { data: course } = await courseForTeacher(req.params.courseId, req.user.id);
    if (!course) return res.status(403).json({ message: 'Only the course teacher can schedule exams' });
    const { data, error } = await supabase.from('course_enrollments').update({ exam_state: req.body.status }).eq('course_id', course.id).eq('learner_id', req.params.learnerId).eq('exam_state', 'requested').select().maybeSingle();
    if (error) return respondDbError(res, error); if (!data) return res.status(409).json({ message: 'Exam is not awaiting scheduling' }); return res.json(data);
  } catch (error) { return next(error); }
};
const listLectures = async (req, res, next) => {
  try { const { data: course, error } = await supabase.from('courses').select('teacher_id, status').eq('id', req.params.courseId).maybeSingle(); if (error) return respondDbError(res, error); if (!course) return res.status(404).json({ message: 'Course not found' }); if (course.teacher_id !== req.user.id && !(await isAdmin(req.user.id))) { const { data: enrollment, error: enrollError } = await enrollmentForLearner(req.params.courseId, req.user.id); if (enrollError) return respondDbError(res, enrollError); if (!enrollment || enrollment.status !== 'active') return res.status(403).json({ message: 'An active enrollment is required' }); } const { data, error: lectureError } = await supabase.from('lectures').select('*').eq('course_id', req.params.courseId).order('order'); if (lectureError) return respondDbError(res, lectureError); return res.json(data); } catch (error) { return next(error); }
};
const createLecture = async (req, res, next) => {
  try { const { data: course, error: courseError } = await courseForTeacher(req.params.courseId, req.user.id); if (courseError) return respondDbError(res, courseError); if (!course) return res.status(403).json({ message: 'Only the course teacher can manage lectures' }); const b = req.body; const { data, error } = await supabase.from('lectures').insert({ course_id: course.id, title: b.title, description: b.description || null, order: b.order, duration_minutes: b.durationMinutes || 0, scheduled_at: b.scheduledAt || null, status: b.status || 'upcoming' }).select().single(); if (error) return respondDbError(res, error); return res.status(201).json(data); } catch (error) { return next(error); }
};
const updateLecture = async (req, res, next) => {
  try { const { data: lecture, error } = await supabase.from('lectures').select('course_id').eq('id', req.params.lectureId).maybeSingle(); if (error) return respondDbError(res, error); if (!lecture) return res.status(404).json({ message: 'Lecture not found' }); const { data: course } = await courseForTeacher(lecture.course_id, req.user.id); if (!course) return res.status(403).json({ message: 'Only the course teacher can manage lectures' }); const b = req.body; const updates = {}; [['title', 'title'], ['description', 'description'], ['order', 'order'], ['durationMinutes', 'duration_minutes'], ['scheduledAt', 'scheduled_at'], ['status', 'status']].forEach(([from, to]) => { if (b[from] !== undefined) updates[to] = b[from]; }); const result = await supabase.from('lectures').update(updates).eq('id', req.params.lectureId).select().single(); if (result.error) return respondDbError(res, result.error); return res.json(result.data); } catch (error) { return next(error); }
};
const deleteLecture = async (req, res, next) => {
  try { const { data: lecture } = await supabase.from('lectures').select('course_id').eq('id', req.params.lectureId).maybeSingle(); if (!lecture) return res.status(404).json({ message: 'Lecture not found' }); const { data: course } = await courseForTeacher(lecture.course_id, req.user.id); if (!course) return res.status(403).json({ message: 'Only the course teacher can manage lectures' }); const { error } = await supabase.from('lectures').delete().eq('id', req.params.lectureId); if (error) return respondDbError(res, error); return res.status(204).end(); } catch (error) { return next(error); }
};
const markAttendance = async (req, res, next) => {
  try { const { lecture, error } = await accessibleLecture(req.params.lectureId, req.user.id); if (error) return respondDbError(res, error); if (!lecture || lecture.courses.teacher_id === req.user.id) return res.status(403).json({ message: 'Only active learners can mark attendance' }); const b = req.body; const { data, error: writeError } = await supabase.from('lecture_attendance').upsert({ lecture_id: lecture.id, learner_id: req.user.id, status: b.status || 'present', joined_at: b.joinedAt || null, left_at: b.leftAt || null, minutes_attended: b.minutesAttended || 0 }, { onConflict: 'lecture_id,learner_id' }).select().single(); if (writeError) return respondDbError(res, writeError); const { count, error: countError } = await supabase.from('lecture_attendance').select('id', { count: 'exact', head: true }).eq('learner_id', req.user.id).eq('status', 'present').in('lecture_id', ((await supabase.from('lectures').select('id').eq('course_id', lecture.course_id)).data || []).map((row) => row.id)); if (countError) return respondDbError(res, countError); const { count: total, error: totalError } = await supabase.from('lectures').select('id', { count: 'exact', head: true }).eq('course_id', lecture.course_id); if (totalError) return respondDbError(res, totalError); const progress = total ? Math.round((count / total) * 100) : 0; await supabase.from('course_enrollments').update({ progress, exam_state: progress === 100 ? 'eligible' : 'locked' }).eq('course_id', lecture.course_id).eq('learner_id', req.user.id).eq('status', 'active'); return res.json({ attendance: data, progress }); } catch (error) { return next(error); }
};

module.exports = { listCourses, getCourse, createCourse, updateCourse, deleteCourse, enroll, dropEnrollment, myLearning, myTeaching, listCourseEnrollments, requestExam, setExamStatus, listLectures, createLecture, updateLecture, deleteLecture, markAttendance };
