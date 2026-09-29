// Live learning data layer, loaded through the SkillSwap backend API.
import { useCallback, useEffect, useState } from 'react';
import { api } from '../utils/api';
import type { Certificate, CertificateRequest, Course, Enrollment, Exam, ExamAttempt, Lecture } from './skillswapTypes';

const iconFor = (category: string) => ({ design: '🎨', photography: '📷', languages: '🗣️', business: '💼' }[category] || '💻');

const toCourse = (r: any, count = 0): Course => ({
  id: r.id,
  skillName: r.skill_name,
  description: r.description || '',
  teacherId: r.teacher_id,
  teacherName: r.teacher?.full_name || 'Teacher',
  totalLectures: count,
  category: r.category || 'other',
  icon: iconFor(r.category),
  enrolledCount: 0,
});

const toEnrollment = (r: any, totalLectures = 0): Enrollment => {
  const progress = Number(r.progress || 0);
  const lecturesCompleted = totalLectures > 0 ? Math.round((progress / 100) * totalLectures) : 0;
  return {
    id: r.id,
    courseId: r.course_id,
    learnerId: r.learner_id,
    learnerName: r.learner?.full_name || 'Learner',
    progress,
    lecturesCompleted,
    examStatus: r.exam_state,
    examScore: null,
    certificateStatus: r.certificate_state,
    enrolledAt: r.enrolled_at,
  };
};

const toLecture = (r: any): Lecture => ({
  id: r.id,
  courseId: r.course_id,
  title: r.title,
  description: r.description || '',
  order: r.order,
  duration: `${r.duration_minutes || 0} min`,
  scheduledAt: r.scheduled_at || '',
  status: r.status === 'live' ? 'in-progress' : r.status,
});

export function resetLearningStore() { }

export const mockCourses: Course[] = [];
export const mockChatMessages: any[] = [];
export const CURRENT_USER_ID = '';
export const CURRENT_USER_NAME = '';

export function useLearningStore() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [certificateRequests, setCertificateRequests] = useState<CertificateRequest[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const me = await api.getMe();
      setCurrentUserId(me._id);
      setCurrentUserName(me.name);

      const [published, learning, teaching, mineRequests, teachingRequests, myCerts] = await Promise.all([
        api.listCourses().catch(() => []),
        api.getMyLearning().catch(() => []),
        api.getMyTeaching().catch(() => []),
        api.getCertificateRequests('mine').catch(() => []),
        api.getCertificateRequests('teaching').catch(() => []),
        api.getMyCertificates().catch(() => []),
      ]);

      const rows = [...published, ...learning.map((x: any) => x.course), ...teaching].filter(Boolean);
      const unique = [...new Map(rows.map((x: any) => [x.id, x])).values()] as any[];
      const lectureLists = await Promise.all(unique.map(x => api.getLectures(x.id).catch(() => [])));
      const lectureCountMap = new Map(unique.map((x, i) => [x.id, lectureLists[i].length]));

      setCourses(unique.map((x, i) => toCourse(x, lectureLists[i].length)));
      setLectures(lectureLists.flat().map(toLecture));
      setEnrollments(learning.map((x: any) => toEnrollment(x, lectureCountMap.get(x.course_id) || 0)));

      const requests = [
        ...new Map([...mineRequests, ...teachingRequests].map((r: any) => [r.id, r])).values(),
      ] as any[];
      setCertificateRequests(requests.map(r => ({
        id: r.id,
        courseId: r.course_id,
        courseName: r.course?.title || 'Course',
        learnerId: r.learner_id,
        learnerName: r.learner?.full_name || 'Learner',
        teacherId: r.course?.teacher_id || '',
        teacherName: '',
        examScore: Number(r.score_snapshot || 0),
        tutorApproval: r.tutor_decision,
        adminApproval: r.admin_decision,
        status: r.admin_decision === 'approved' ? 'generated'
          : r.tutor_decision === 'approved' ? 'tutor-approved'
            : r.tutor_decision === 'rejected' ? 'rejected'
              : 'requested',
        certificateId: null,
        requestedAt: r.created_at,
        generatedAt: null,
      })));

      setCertificates(myCerts.map((c: any) => ({
        id: c.id,
        certificateId: c.certificate_number,
        courseId: c.course_id,
        courseName: c.course?.title || 'Course',
        learnerId: me._id,
        learnerName: me.name,
        teacherId: '',
        teacherName: c.course?.teacher?.full_name || 'SkillSwap Faculty',
        examScore: Number(c.verification_metadata?.score_percentage || 100),
        completedAt: c.issued_at,
        issuedAt: c.issued_at,
      })));
    } catch (error) {
      console.error('Unable to load learning data from the API', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const loadExam = useCallback(async (courseId: string) => {
    try {
      const r = await api.getExam(courseId);
      if (!r) return null;
      const value: Exam = {
        id: r.id,
        courseId: r.course_id,
        title: r.title,
        description: r.description || '',
        timeLimit: r.time_limit_mins,
        passingScore: Number(r.pass_mark_percentage),
        questions: (r.questions || []).map((q: any) => ({
          id: q.id,
          question: q.questionText || q.question_text,
          options: q.options,
          correctAnswer: q.correct_option_idx,
        })),
      };
      setExams(xs => [...xs.filter(x => x.courseId !== courseId), value]);
      return value;
    } catch (err) {
      console.error('Error loading exam:', err);
      return null;
    }
  }, []);

  return {
    courses, enrollments, lectures, certificates, certificateRequests, exams,
    loading, currentUserId, currentUserName, refresh,

    /**
     * Create a course. The backend always forces status to 'pending_review'.
     */
    createCourse: async (payload: { title: string; skillName: string; description?: string; category?: string; creditCost?: number }) => {
      const created = await api.createCourse(payload);
      await refresh();
      return created;
    },

    getMyLearning: (_userId?: string) => enrollments,
    getMyTeachingCourses: (_userId?: string) => courses.filter(x => x.teacherId === currentUserId),
    getCourseEnrollments: (id: string) => enrollments.filter(x => x.courseId === id),
    getEnrollment: (id: string, _userId?: string) => enrollments.find(x => x.courseId === id),
    getCourseLectures: (id: string) => lectures.filter(x => x.courseId === id).sort((a, b) => a.order - b.order),

    completeLecture: async (_courseId: string, lectureId: string, ..._args: unknown[]) => {
      await api.markAttendance(lectureId);
      await refresh();
    },

    getExam: (id: string) => exams.find(x => x.courseId === id) || null,
    loadExam,
    getExamAttempt: () => null as ExamAttempt | null,

    requestExam: async (id: string, ..._args: unknown[]) => { await api.requestExam(id); await refresh(); },
    scheduleExam: async (id: string, learnerId: string) => { await api.scheduleExam(id, learnerId); await refresh(); },
    submitExam: async (courseId: string, _learnerId: string, _name: string, answers: (number | null)[]) => {
      const exam = exams.find(x => x.courseId === courseId) || await loadExam(courseId);
      if (!exam) throw new Error('Exam not found');
      const result = await api.submitExam(exam.id, answers);
      await refresh();
      return { score: result.scorePercentage, passed: result.passed };
    },

    getCertificateRequests: (filter?: { teacherId?: string; learnerId?: string }) =>
      certificateRequests.filter(x =>
        (!filter?.teacherId || x.teacherId === currentUserId) &&
        (!filter?.learnerId || x.learnerId === currentUserId)
      ),
    requestCertificate: async (id: string, ..._args: unknown[]) => { await api.requestCertificate(id); await refresh(); },
    approveCertificateTutor: async (id: string) => { await api.decideCertificateAsTeacher(id, 'approved'); await refresh(); },
    rejectCertificateTutor: async (id: string) => { await api.decideCertificateAsTeacher(id, 'rejected'); await refresh(); },
    approveCertificateAdmin: async (id: string) => { await api.decideCertificateAsAdmin(id, 'approved'); await refresh(); },
    rejectCertificateAdmin: async (id: string) => { await api.decideCertificateAsAdmin(id, 'rejected'); await refresh(); },
    generateCertificate: async (_id: string) => { },
    markExamResult: async (_courseId: string, _learnerId: string, _passed: boolean) => { },
    verifyCertificate: (id: string) => certificates.find(x => x.certificateId === id) || null,
    getMyCertificates: (_userId?: string) => certificates,
  };
}
