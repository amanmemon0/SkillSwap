const express = require('express');
const { protect, isAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const learning = require('../controllers/learningController');
const assessment = require('../controllers/assessmentController');
const {
  courseSchema, lectureSchema, attendanceSchema, examSchema,
  questionSchema, examSubmitSchema, certificateDecisionSchema, moderationDecisionSchema,
} = require('../utils/learningValidation');

const router = express.Router();

// ── Public catalog (published only) ──────────────────────────────────────────
router.get('/', learning.listCourses);

// ── My courses ────────────────────────────────────────────────────────────────
router.get('/mine/learning', protect, learning.myLearning);
router.get('/mine/teaching', protect, learning.myTeaching);

// ── Certificate routes ────────────────────────────────────────────────────────
router.get('/certificate-requests', protect, assessment.listCertificateRequests);
router.patch('/certificate-requests/:requestId/tutor-decision', protect, validate(certificateDecisionSchema), assessment.teacherCertificateDecision);
router.patch('/certificate-requests/:requestId/admin-decision', protect, isAdmin, validate(certificateDecisionSchema), assessment.adminCertificateDecision);
router.get('/certificates/mine', protect, assessment.myCertificates);
router.get('/certificates/verify/:certificateNumber', assessment.verifyCertificate);

// ── Admin moderation queue ────────────────────────────────────────────────────
router.get('/admin/pending', protect, isAdmin, learning.listPendingCourses);
router.patch('/:courseId/moderate', protect, isAdmin, validate(moderationDecisionSchema), learning.moderateCourse);

// ── Course CRUD ───────────────────────────────────────────────────────────────
router.post('/', protect, validate(courseSchema), learning.createCourse);
router.get('/:courseId', protect, learning.getCourse);
router.get('/:courseId/enrollments', protect, learning.listCourseEnrollments);
router.patch('/:courseId', protect, validate(courseSchema.partial()), learning.updateCourse);
router.delete('/:courseId', protect, learning.deleteCourse);

// ── Enrollment ────────────────────────────────────────────────────────────────
router.post('/:courseId/enroll', protect, learning.enroll);
router.delete('/:courseId/enrollment', protect, learning.dropEnrollment);

// ── Exam workflow ─────────────────────────────────────────────────────────────
router.post('/:courseId/exam-request', protect, learning.requestExam);
router.patch('/:courseId/enrollments/:learnerId/exam-status', protect, learning.setExamStatus);

// ── Lectures ──────────────────────────────────────────────────────────────────
router.get('/:courseId/lectures', protect, learning.listLectures);
router.post('/:courseId/lectures', protect, validate(lectureSchema), learning.createLecture);
router.patch('/lectures/:lectureId', protect, validate(lectureSchema.partial()), learning.updateLecture);
router.delete('/lectures/:lectureId', protect, learning.deleteLecture);
router.put('/lectures/:lectureId/attendance', protect, validate(attendanceSchema), learning.markAttendance);

// ── Exam CRUD ─────────────────────────────────────────────────────────────────
router.get('/:courseId/exam', protect, assessment.getCourseExam);
router.post('/:courseId/exam', protect, validate(examSchema), assessment.createExam);
router.patch('/exams/:examId', protect, validate(examSchema.partial()), assessment.updateExam);
router.post('/exams/:examId/questions', protect, validate(questionSchema), assessment.addQuestion);
router.post('/exams/:examId/submit', protect, validate(examSubmitSchema), assessment.submitExam);

// ── Certificate requests ──────────────────────────────────────────────────────
router.post('/:courseId/certificate-requests', protect, assessment.requestCertificate);

module.exports = router;
