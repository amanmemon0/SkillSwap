/* ═══════════════════════════════════════════════════════════
   SkillSwap P2P Learning — Core Types
   ═══════════════════════════════════════════════════════════ */

/* ─── Lecture Status ─── */
export type LectureStatus = 'upcoming' | 'in-progress' | 'completed' | 'missed';

/* ─── Exam Status ─── */
export type ExamStatus = 'locked' | 'eligible' | 'requested' | 'scheduled' | 'in-progress' | 'submitted' | 'passed' | 'failed';

/* ─── Certificate Status ─── */
export type CertificateStatus = 'locked' | 'eligible' | 'requested' | 'tutor-approved' | 'admin-approved' | 'generated' | 'rejected';

/* ─── Approval Status ─── */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

/* ─── Course ─── */
export interface Course {
  id: string;
  skillName: string;
  description: string;
  teacherId: string;
  teacherName: string;
  totalLectures: number;
  category: string;
  icon: string;
  enrolledCount: number;
}

/* ─── Enrollment ─── */
export interface Enrollment {
  id: string;
  courseId: string;
  learnerId: string;
  learnerName: string;
  progress: number; // 0-100
  lecturesCompleted: number;
  examStatus: ExamStatus;
  examScore: number | null;
  certificateStatus: CertificateStatus;
  enrolledAt: string;
}

/* ─── Lecture ─── */
export interface Lecture {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  duration: string; // e.g. "45 min"
  scheduledAt: string;
  status: LectureStatus;
}

/* ─── Lecture Attendance ─── */
export interface LectureAttendance {
  lectureId: string;
  learnerId: string;
  learnerName: string;
  startedAt: string | null;
  endedAt: string | null;
  duration: number; // minutes
  status: LectureStatus;
}

/* ─── Exam Question ─── */
export interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index into options
}

/* ─── Exam ─── */
export interface Exam {
  id: string;
  courseId: string;
  title: string;
  description: string;
  questions: ExamQuestion[];
  timeLimit: number; // minutes
  passingScore: number; // percentage
}

/* ─── Exam Attempt ─── */
export interface ExamAttempt {
  id: string;
  examId: string;
  courseId: string;
  learnerId: string;
  learnerName: string;
  answers: (number | null)[]; // selected option index per question
  score: number | null;
  status: ExamStatus;
  startedAt: string | null;
  submittedAt: string | null;
}

/* ─── Certificate Request ─── */
export interface CertificateRequest {
  id: string;
  courseId: string;
  courseName: string;
  learnerId: string;
  learnerName: string;
  teacherId: string;
  teacherName: string;
  examScore: number;
  tutorApproval: ApprovalStatus;
  adminApproval: ApprovalStatus;
  status: CertificateStatus;
  certificateId: string | null;
  requestedAt: string;
  generatedAt: string | null;
}

/* ─── Certificate ─── */
export interface Certificate {
  id: string;
  certificateId: string; // e.g. SS-2026-000124
  courseId: string;
  courseName: string;
  learnerId: string;
  learnerName: string;
  teacherId: string;
  teacherName: string;
  examScore: number;
  completedAt: string;
  issuedAt: string;
}

/* ─── Chat Message (for live lecture) ─── */
export interface ChatMessage {
  id: string;
  senderName: string;
  senderId: string;
  text: string;
  timestamp: string;
}

/* ─── Participant (for live lecture) ─── */
export interface Participant {
  id: string;
  name: string;
  role: 'tutor' | 'learner';
  isOnline: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
}

/* ─── In-App Notification ─── */
export interface AppNotification {
  id: string;
  userId: string;
  type: 'lecture' | 'exam';
  title: string;
  message: string;
  courseId: string;
  lectureId?: string;
  scheduledAt: string; // ISO datetime
  read: boolean;
  createdAt: string;
}
