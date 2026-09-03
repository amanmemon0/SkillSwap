/* ═══════════════════════════════════════════════════════════
   SkillSwap P2P Learning — Mock Data & Live State Store
   ═══════════════════════════════════════════════════════════ */
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../auth/supabaseClient';
import type {
  Course, Enrollment, Lecture, Exam, ExamAttempt,
  CertificateRequest, Certificate, ExamStatus, CertificateStatus,
  ApprovalStatus, ChatMessage, AppNotification
} from './skillswapTypes';

/* ─── Active User Helpers ─── */
export const CURRENT_USER_ID = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'; // John Doe
export const CURRENT_USER_NAME = 'John Doe';

export const ADMIN_USER_ID = 'f67a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c'; // Olivia Bennett
export const ADMIN_USER_NAME = 'Olivia Bennett';

export function resetLearningStore() {
  // Database persists directly, no local reset needed
}

export function useLearningStore() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([]);
  const [certificateRequests, setCertificateRequests] = useState<CertificateRequest[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  /* ─── Notification state (localStorage-backed) ─── */
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ss_notifications') || '[]');
    } catch { return []; }
  });

  const _saveNotifications = (list: AppNotification[]) => {
    localStorage.setItem('ss_notifications', JSON.stringify(list));
    setNotifications(list);
  };

  const _pushNotifications = (notifs: AppNotification[]) => {
    const updated = [...notifs, ...notifications];
    _saveNotifications(updated);
  };

  const refresh = useCallback(async () => {
    try {
      // 1. Fetch courses
      const { data: dbCourses } = await supabase
        .from('courses')
        .select('*, profiles:teacher_id (full_name)');
      
      const { data: dbLectures } = await supabase
        .from('lectures')
        .select('*');

      const courseList: Course[] = (dbCourses || []).map(c => {
        const courseLectures = (dbLectures || []).filter(l => l.course_id === c.id);
        return {
          id: c.id,
          skillName: c.skill_name,
          description: c.description || '',
          teacherId: c.teacher_id,
          teacherName: c.profiles?.full_name || 'Teacher',
          totalLectures: courseLectures.length || 10,
          category: c.category || 'tech',
          icon: c.category === 'photography' ? '📸' : c.category === 'design' ? '🎨' : c.category === 'languages' ? '🗣️' : '💻',
          enrolledCount: 2
        };
      });

      // 2. Fetch enrollments
      const { data: dbEnrollments } = await supabase
        .from('course_enrollments')
        .select('*, profiles:learner_id (full_name)');
      
      const { data: dbAttendance } = await supabase
        .from('lecture_attendance')
        .select('*')
        .eq('status', 'present');

      const enrollmentList: Enrollment[] = (dbEnrollments || []).map(e => {
        const completedCount = (dbAttendance || []).filter(a => a.learner_id === e.learner_id && (dbLectures || []).filter(l => l.course_id === e.course_id).map(l => l.id).includes(a.lecture_id)).length;
        return {
          id: e.id,
          courseId: e.course_id,
          learnerId: e.learner_id,
          learnerName: e.profiles?.full_name || 'Student',
          progress: Number(e.progress || 0),
          lecturesCompleted: completedCount,
          examStatus: e.exam_state as ExamStatus,
          examScore: e.exam_state === 'passed' ? 90 : null,
          certificateStatus: e.certificate_state as CertificateStatus,
          enrolledAt: new Date(e.enrolled_at).toISOString().split('T')[0],
        };
      });

      // 3. Fetch lectures
      const lectureList: Lecture[] = (dbLectures || []).map(l => ({
        id: l.id,
        courseId: l.course_id,
        title: l.title,
        description: l.description || '',
        order: l.order,
        duration: `${l.duration_minutes} min`,
        scheduledAt: l.scheduled_at || new Date().toISOString(),
        status: l.status as any,
      }));

      // 4. Fetch attempts
      const { data: dbAttempts } = await supabase
        .from('exam_attempts')
        .select('*, profiles:learner_id (full_name)');

      const attemptList: ExamAttempt[] = (dbAttempts || []).map(a => ({
        id: a.id,
        examId: a.exam_id,
        courseId: a.exam_id,
        learnerId: a.learner_id,
        learnerName: a.profiles?.full_name || 'Student',
        answers: [],
        score: Number(a.score_percentage || 0),
        status: a.status as any,
        startedAt: a.started_at,
        submittedAt: a.submitted_at,
      }));

      // 5. Fetch certificate requests
      const { data: dbCertRequests } = await supabase
        .from('certificate_requests')
        .select(`
          *,
          learner:learner_id (full_name),
          reviewer:reviewer_id (full_name),
          courses:course_id (title, teacher_id, profiles:teacher_id(full_name))
        `);

      const requestList: CertificateRequest[] = (dbCertRequests || []).map(r => ({
        id: r.id,
        courseId: r.course_id,
        courseName: r.courses?.title || 'Course',
        learnerId: r.learner_id,
        learnerName: r.learner?.full_name || 'Student',
        teacherId: r.courses?.teacher_id || '',
        teacherName: r.courses?.profiles?.full_name || 'Teacher',
        examScore: Number(r.score_snapshot || 0),
        tutorApproval: r.tutor_decision as ApprovalStatus,
        adminApproval: r.admin_decision as ApprovalStatus,
        status: r.tutor_decision === 'approved' ? (r.admin_decision === 'approved' ? 'generated' : 'tutor-approved') : 'requested',
        certificateId: null,
        requestedAt: new Date(r.created_at).toISOString().split('T')[0],
        generatedAt: null,
      }));

      // 6. Fetch certificates
      const { data: dbCerts } = await supabase
        .from('certificates')
        .select(`
          *,
          profiles:learner_id (full_name),
          courses:course_id (title, teacher_id, profiles:teacher_id(full_name))
        `);

      const certList: Certificate[] = (dbCerts || []).map(c => ({
        id: c.id,
        certificateId: c.certificate_number,
        courseId: c.course_id,
        courseName: c.courses?.title || 'Course',
        learnerId: c.learner_id,
        learnerName: c.profiles?.full_name || 'Student',
        teacherId: c.courses?.teacher_id || '',
        teacherName: c.courses?.profiles?.full_name || 'Teacher',
        examScore: 90,
        completedAt: new Date(c.issued_at).toISOString().split('T')[0],
        issuedAt: new Date(c.issued_at).toISOString().split('T')[0],
      }));

      // 7. Fetch exams
      const { data: dbExams } = await supabase.from('exams').select('*');
      const { data: dbQuestions } = await supabase.from('exam_questions').select('*');

      const examList: Exam[] = (dbExams || []).map(ex => {
        const questions = (dbQuestions || []).filter(q => q.exam_id === ex.id).map(q => ({
          id: q.id,
          question: q.question_text,
          options: Array.isArray(q.options) ? q.options : [],
          correctAnswer: q.correct_option_idx
        }));
        return {
          id: ex.id,
          courseId: ex.course_id,
          title: ex.title,
          description: ex.description || '',
          questions,
          timeLimit: ex.time_limit_mins,
          passingScore: Number(ex.pass_mark_percentage)
        };
      });

      setCourses(courseList);
      setEnrollments(enrollmentList);
      setLectures(lectureList);
      setExamAttempts(attemptList);
      setCertificateRequests(requestList);
      setCertificates(certList);
      setExams(examList);
      setLoading(false);
    } catch (err) {
      console.error('Error loading database learning store:', err);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /* ─── Enrollment helpers ─── */
  const getMyLearning = useCallback((userId: string) => {
    return enrollments.filter(e => e.learnerId === userId);
  }, [enrollments]);

  const getMyTeachingCourses = useCallback((userId: string) => {
    return courses.filter(c => c.teacherId === userId);
  }, [courses]);

  const getCourseEnrollments = useCallback((courseId: string) => {
    return enrollments.filter(e => e.courseId === courseId);
  }, [enrollments]);

  const getEnrollment = useCallback((courseId: string, learnerId: string) => {
    return enrollments.find(e => e.courseId === courseId && e.learnerId === learnerId);
  }, [enrollments]);

  /* ─── Lecture helpers ─── */
  const getCourseLectures = useCallback((courseId: string) => {
    return lectures.filter(l => l.courseId === courseId).sort((a, b) => a.order - b.order);
  }, [lectures]);

  const createLecture = useCallback(async (
    courseId: string,
    data: { title: string; description: string; durationMinutes: number; scheduledAt: string }
  ) => {
    try {
      const courseLectures = lectures.filter(l => l.courseId === courseId);
      const nextOrder = courseLectures.length + 1;

      const { data: inserted, error } = await supabase.from('lectures').insert({
        course_id: courseId,
        title: data.title,
        description: data.description,
        order: nextOrder,
        duration_minutes: data.durationMinutes,
        scheduled_at: data.scheduledAt,
        status: 'upcoming',
      }).select().single();

      if (error) throw error;

      // Notify all enrolled learners
      const enrolled = enrollments.filter(e => e.courseId === courseId);
      const course = courses.find(c => c.id === courseId);
      const notifs: AppNotification[] = enrolled.map(e => ({
        id: `notif-lec-${inserted.id}-${e.learnerId}`,
        userId: e.learnerId,
        type: 'lecture',
        title: `New Lecture Scheduled: ${data.title}`,
        message: `${course?.skillName || 'Your course'} — Lecture ${nextOrder}: "${data.title}" is scheduled for ${new Date(data.scheduledAt).toLocaleString()}.`,
        courseId,
        lectureId: inserted.id,
        scheduledAt: data.scheduledAt,
        read: false,
        createdAt: new Date().toISOString(),
      }));
      _pushNotifications(notifs);

      await refresh();
      return inserted;
    } catch (err) {
      console.error('Error creating lecture:', err);
    }
  }, [lectures, enrollments, courses, refresh]);

  const updateLectureSchedule = useCallback(async (lectureId: string, scheduledAt: string) => {
    try {
      await supabase.from('lectures').update({ scheduled_at: scheduledAt }).eq('id', lectureId);
      const lec = lectures.find(l => l.id === lectureId);
      if (lec) {
        const enrolled = enrollments.filter(e => e.courseId === lec.courseId);
        const course = courses.find(c => c.id === lec.courseId);
        const notifs: AppNotification[] = enrolled.map(e => ({
          id: `notif-lec-upd-${lectureId}-${e.learnerId}-${Date.now()}`,
          userId: e.learnerId,
          type: 'lecture',
          title: `Lecture Rescheduled: ${lec.title}`,
          message: `${course?.skillName || 'Your course'} — "${lec.title}" has been rescheduled to ${new Date(scheduledAt).toLocaleString()}.`,
          courseId: lec.courseId,
          lectureId,
          scheduledAt,
          read: false,
          createdAt: new Date().toISOString(),
        }));
        _pushNotifications(notifs);
      }
      await refresh();
    } catch (err) {
      console.error('Error updating lecture schedule:', err);
    }
  }, [lectures, enrollments, courses, refresh]);

  const completeLecture = useCallback(async (courseId: string, lectureId: string, learnerId: string) => {
    try {
      await supabase.from('lecture_attendance').upsert({
        lecture_id: lectureId,
        learner_id: learnerId,
        status: 'present',
        minutes_attended: 45
      });

      const courseLectures = lectures.filter(l => l.courseId === courseId);
      const total = courseLectures.length || 1;
      
      const { data: dbAttendance } = await supabase
        .from('lecture_attendance')
        .select('*')
        .eq('learner_id', learnerId)
        .eq('status', 'present');

      const completedCount = (dbAttendance || []).filter(a => courseLectures.map(l => l.id).includes(a.lecture_id)).length;
      const progress = Math.round((completedCount / total) * 100);

      const exam_state = progress === 100 ? 'eligible' : 'locked';

      await supabase.from('course_enrollments')
        .update({ progress, exam_state })
        .eq('course_id', courseId)
        .eq('learner_id', learnerId);

      await refresh();
    } catch (err) {
      console.error('Error completing lecture:', err);
    }
  }, [lectures, refresh]);

  /* ─── Exam helpers ─── */
  const getExam = useCallback((courseId: string) => {
    return exams.find(e => e.courseId === courseId) || null;
  }, [exams]);

  const scheduleExamDate = useCallback(async (courseId: string, scheduledAt: string) => {
    try {
      // Store exam scheduled date in localStorage (since schema may not have the column yet)
      const key = `ss_exam_schedule_${courseId}`;
      localStorage.setItem(key, scheduledAt);

      // Notify all enrolled learners
      const enrolled = enrollments.filter(e => e.courseId === courseId);
      const course = courses.find(c => c.id === courseId);
      const exam = exams.find(ex => ex.courseId === courseId);
      const notifs: AppNotification[] = enrolled.map(e => ({
        id: `notif-exam-${courseId}-${e.learnerId}-${Date.now()}`,
        userId: e.learnerId,
        type: 'exam',
        title: `Exam Scheduled: ${exam?.title || course?.skillName + ' Final Exam'}`,
        message: `Your teacher has scheduled the final exam for ${course?.skillName || 'your course'} on ${new Date(scheduledAt).toLocaleString()}. Get ready!`,
        courseId,
        scheduledAt,
        read: false,
        createdAt: new Date().toISOString(),
      }));
      _pushNotifications(notifs);
    } catch (err) {
      console.error('Error scheduling exam date:', err);
    }
  }, [enrollments, courses, exams]);

  const getExamScheduledAt = useCallback((courseId: string): string | null => {
    return localStorage.getItem(`ss_exam_schedule_${courseId}`);
  }, []);

  const getExamAttempt = useCallback((courseId: string, learnerId: string) => {
    return examAttempts.find(a => a.learnerId === learnerId) || null;
  }, [examAttempts]);

  const requestExam = useCallback(async (courseId: string, learnerId: string, learnerName: string) => {
    try {
      await supabase.from('course_enrollments')
        .update({ exam_state: 'requested' })
        .eq('course_id', courseId)
        .eq('learner_id', learnerId);
      await refresh();
    } catch (err) {
      console.error(err);
    }
  }, [refresh]);

  const scheduleExam = useCallback(async (courseId: string, learnerId: string) => {
    try {
      await supabase.from('course_enrollments')
        .update({ exam_state: 'scheduled' })
        .eq('course_id', courseId)
        .eq('learner_id', learnerId);
      await refresh();
    } catch (err) {
      console.error(err);
    }
  }, [refresh]);

  const submitExam = useCallback(async (courseId: string, learnerId: string, learnerName: string, answers: (number | null)[]) => {
    try {
      const exam = exams.find(e => e.courseId === courseId);
      if (!exam) return;

      let correct = 0;
      answers.forEach((a, i) => {
        if (a === exam.questions[i]?.correctAnswer) correct++;
      });
      const score = Math.round((correct / exam.questions.length) * 100);
      const passed = score >= exam.passingScore;

      await supabase.from('exam_attempts').insert({
        exam_id: exam.id,
        learner_id: learnerId,
        answers: JSON.stringify(answers),
        score_percentage: score,
        status: passed ? 'passed' : 'failed'
      });

      await supabase.from('course_enrollments')
        .update({
          exam_state: passed ? 'passed' : 'failed',
          certificate_state: passed ? 'eligible' : 'none'
        })
        .eq('course_id', courseId)
        .eq('learner_id', learnerId);

      await refresh();
      return { score, passed };
    } catch (err) {
      console.error(err);
    }
  }, [exams, refresh]);

  const markExamResult = useCallback(async (courseId: string, learnerId: string, passed: boolean) => {
    try {
      await supabase.from('course_enrollments')
        .update({
          exam_state: passed ? 'passed' : 'failed',
          certificate_state: passed ? 'eligible' : 'none'
        })
        .eq('course_id', courseId)
        .eq('learner_id', learnerId);
      await refresh();
    } catch (err) {
      console.error(err);
    }
  }, [refresh]);

  /* ─── Notification helpers ─── */
  const getNotifications = useCallback((userId: string) => {
    return notifications.filter(n => n.userId === userId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications]);

  const markNotificationRead = useCallback((notifId: string) => {
    const updated = notifications.map(n => n.id === notifId ? { ...n, read: true } : n);
    _saveNotifications(updated);
  }, [notifications]);

  const markAllNotificationsRead = useCallback((userId: string) => {
    const updated = notifications.map(n => n.userId === userId ? { ...n, read: true } : n);
    _saveNotifications(updated);
  }, [notifications]);

  /* ─── Certificate helpers ─── */
  const getCertificateRequests = useCallback((filter?: { teacherId?: string; learnerId?: string }) => {
    let reqs = certificateRequests;
    if (filter?.teacherId) reqs = reqs.filter(r => r.teacherId === filter.teacherId);
    if (filter?.learnerId) reqs = reqs.filter(r => r.learnerId === filter.learnerId);
    return reqs;
  }, [certificateRequests]);

  const requestCertificate = useCallback(async (courseId: string, learnerId: string, learnerName: string) => {
    try {
      const course = courses.find(c => c.id === courseId);
      if (!course) return;

      const { data: dbEnroll } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('learner_id', learnerId)
        .single();

      await supabase.from('certificate_requests').insert({
        course_id: courseId,
        learner_id: learnerId,
        score_snapshot: dbEnroll?.exam_score || 90
      });

      await supabase.from('course_enrollments')
        .update({ certificate_state: 'requested' })
        .eq('course_id', courseId)
        .eq('learner_id', learnerId);

      await refresh();
    } catch (err) {
      console.error(err);
    }
  }, [courses, refresh]);

  const approveCertificateTutor = useCallback(async (requestId: string) => {
    try {
      const req = certificateRequests.find(r => r.id === requestId);
      if (!req) return;

      await supabase.from('certificate_requests')
        .update({ tutor_decision: 'approved' })
        .eq('id', requestId);

      await supabase.from('course_enrollments')
        .update({ certificate_state: 'tutor-approved' })
        .eq('course_id', req.courseId)
        .eq('learner_id', req.learnerId);

      await refresh();
    } catch (err) {
      console.error(err);
    }
  }, [certificateRequests, refresh]);

  const rejectCertificateTutor = useCallback(async (requestId: string) => {
    try {
      const req = certificateRequests.find(r => r.id === requestId);
      if (!req) return;

      await supabase.from('certificate_requests')
        .update({ tutor_decision: 'rejected' })
        .eq('id', requestId);

      await supabase.from('course_enrollments')
        .update({ certificate_state: 'rejected' })
        .eq('course_id', req.courseId)
        .eq('learner_id', req.learnerId);

      await refresh();
    } catch (err) {
      console.error(err);
    }
  }, [certificateRequests, refresh]);

  const approveCertificateAdmin = useCallback(async (requestId: string) => {
    try {
      const req = certificateRequests.find(r => r.id === requestId);
      if (!req) return;

      await supabase.from('certificate_requests')
        .update({ admin_decision: 'approved' })
        .eq('id', requestId);

      await supabase.from('course_enrollments')
        .update({ certificate_state: 'admin-approved' })
        .eq('course_id', req.courseId)
        .eq('learner_id', req.learnerId);

      await refresh();
    } catch (err) {
      console.error(err);
    }
  }, [certificateRequests, refresh]);

  const rejectCertificateAdmin = useCallback(async (requestId: string) => {
    try {
      const req = certificateRequests.find(r => r.id === requestId);
      if (!req) return;

      await supabase.from('certificate_requests')
        .update({ admin_decision: 'rejected' })
        .eq('id', requestId);

      await supabase.from('course_enrollments')
        .update({ certificate_state: 'rejected' })
        .eq('course_id', req.courseId)
        .eq('learner_id', req.learnerId);

      await refresh();
    } catch (err) {
      console.error(err);
    }
  }, [certificateRequests, refresh]);

  const generateCertificate = useCallback(async (requestId: string) => {
    try {
      const req = certificateRequests.find(r => r.id === requestId);
      if (!req) return;

      const certNumber = `SS-2026-${String(certificates.length + 200).padStart(6, '0')}`;

      await supabase.from('certificates').insert({
        certificate_number: certNumber,
        request_id: requestId,
        learner_id: req.learnerId,
        course_id: req.courseId,
        issued_at: new Date().toISOString()
      });

      await supabase.from('course_enrollments')
        .update({ certificate_state: 'issued' })
        .eq('course_id', req.courseId)
        .eq('learner_id', req.learnerId);

      await refresh();
    } catch (err) {
      console.error(err);
    }
  }, [certificateRequests, certificates, refresh]);

  const verifyCertificate = useCallback((certId: string) => {
    return certificates.find(c => c.certificateId === certId) || null;
  }, [certificates]);

  const getMyCertificates = useCallback((userId: string) => {
    return certificates.filter(c => c.learnerId === userId);
  }, [certificates]);

  return {
    enrollments,
    examAttempts,
    certificateRequests,
    certificates,
    lectures,
    courses,
    exams,
    loading,
    // Enrollment
    getMyLearning,
    getMyTeachingCourses,
    getCourseEnrollments,
    getEnrollment,
    // Lectures
    getCourseLectures,
    completeLecture,
    createLecture,
    updateLectureSchedule,
    // Exams
    getExam,
    getExamAttempt,
    requestExam,
    scheduleExam,
    submitExam,
    markExamResult,
    scheduleExamDate,
    getExamScheduledAt,
    // Certificates
    getCertificateRequests,
    requestCertificate,
    approveCertificateTutor,
    rejectCertificateTutor,
    approveCertificateAdmin,
    rejectCertificateAdmin,
    generateCertificate,
    verifyCertificate,
    getMyCertificates,
    // Notifications
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    notifications,
  };
}

/* ─── Backwards Compatibility Exports ─── */
export const mockCourses: Course[] = [
  {
    id: '11111111-1111-1111-1111-11111111c111',
    skillName: 'React Development',
    description: 'Master React from fundamentals to advanced patterns.',
    teacherId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    teacherName: 'John Doe',
    totalLectures: 4,
    category: 'tech',
    icon: '⚛️',
    enrolledCount: 2,
  },
  {
    id: '22222222-2222-2222-2222-22222222c222',
    skillName: 'Photography Basics',
    description: 'Learn composition and lighting fundamentals.',
    teacherId: '11111111-1111-1111-1111-111111111111',
    teacherName: 'Meera Iyer',
    totalLectures: 4,
    category: 'photo',
    icon: '📸',
    enrolledCount: 2,
  },
  {
    id: '55555555-5555-5555-5555-55555555c555',
    skillName: 'Public Speaking',
    description: 'Overcome stage fright and structure compelling talks.',
    teacherId: 'e5f67a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b',
    teacherName: 'Arjun Rao',
    totalLectures: 2,
    category: 'language',
    icon: '🗣️',
    enrolledCount: 1,
  }
];

export const mockExams: Exam[] = [];
export const mockLectures: Lecture[] = [];
export const mockChatMessages: ChatMessage[] = [
  { id: 'msg-1', senderName: 'Alex Memon', senderId: 'user-alex', text: 'Welcome everyone! Let\'s get started.', timestamp: '10:01 AM' },
  { id: 'msg-2', senderName: 'Sarah Khan', senderId: 'user-sarah', text: 'Excited for this lecture! 🎉', timestamp: '10:02 AM' },
];

