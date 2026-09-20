/* ═══════════════════════════════════════════════════════════
   Teaching Course Detail — Teacher's management view
   ═══════════════════════════════════════════════════════════ */
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowLeft, Users, BookOpen, FileText, Award, CheckCircle2, Clock,
  Play, XCircle, ChevronRight, Plus, CalendarClock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, Button } from '../components/ui/Primitives';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { ScheduleLectureModal } from '../components/ui/ScheduleLectureModal';
import { ScheduleExamModal } from '../components/ui/ScheduleExamModal';
import { useToast, ToastContainer } from '../components/ui/Toast';
import Navbar from '../components/Navbar';
import { useLearningStore } from '../data/learningMockData';

type Tab = 'learners' | 'lectures' | 'exams' | 'certificates';

export default function TeachingCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const nav = useNavigate();
  const store = useLearningStore();
  const { toasts, show, dismiss } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('learners');
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string; name: string } | null>(null);
  const [showScheduleLecture, setShowScheduleLecture] = useState(false);
  const [showScheduleExam, setShowScheduleExam] = useState(false);

  const course = store.courses.find(c => c.id === courseId);
  const enrollments = course ? store.getCourseEnrollments(course.id) : [];
  const lectures = course ? store.getCourseLectures(course.id) : [];
  const certRequests = course ? store.getCertificateRequests({ teacherId: store.currentUserId }).filter(r => r.courseId === course.id) : [];

  if (!course || course.teacherId !== store.currentUserId) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar variant="auth" />
        <div className="flex items-center justify-center py-32">
          <p className="text-ink/50">Course not found or you are not the teacher.</p>
        </div>
      </main>
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof Users; count?: number }[] = [
    { key: 'learners', label: 'Learners', icon: Users, count: enrollments.length },
    { key: 'lectures', label: 'Lectures', icon: BookOpen, count: lectures.length },
    { key: 'exams', label: 'Exams', icon: FileText, count: enrollments.filter(e => e.examStatus === 'requested').length },
    { key: 'certificates', label: 'Certificates', icon: Award, count: certRequests.filter(r => r.tutorApproval === 'pending').length },
  ];

  const handleConfirm = () => {
    if (!confirmAction) return;
    const { type, id, name } = confirmAction;

    if (type === 'schedule-exam') {
      const enrollment = enrollments.find(e => e.learnerId === id);
      if (enrollment) {
        store.scheduleExam(course.id, id);
        show(`Exam scheduled for ${name}`, 'success');
      }
    } else if (type === 'pass-exam') {
      store.markExamResult(course.id, id, true);
      show(`${name} marked as passed!`, 'success');
    } else if (type === 'fail-exam') {
      store.markExamResult(course.id, id, false);
      show(`${name} marked as failed`, 'warning');
    } else if (type === 'approve-cert') {
      store.approveCertificateTutor(id);
      show(`Certificate approved for ${name}`, 'success');
    } else if (type === 'reject-cert') {
      store.rejectCertificateTutor(id);
      show(`Certificate rejected for ${name}`, 'warning');
    }

    setConfirmAction(null);
  };

  return (
    <main className="min-h-screen bg-surface">
      <Navbar variant="auth" />
      <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8">
        {/* Back */}
        <button
          onClick={() => nav('/teaching')}
          className="mb-6 flex items-center gap-2 text-sm font-bold text-ink/50 hover:text-violet transition"
        >
          <ArrowLeft size={16} /> Back to My Teaching
        </button>

        {/* Course Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-br from-ink via-violet/90 to-electric p-7 text-white sm:p-10"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-cyan">You are teaching</p>
              <h1 className="mt-2 font-display text-3xl font-bold">{course.skillName}</h1>
              <p className="mt-1 text-sm text-white/60">{enrollments.length} learners enrolled · {course.totalLectures} lectures</p>
            </div>
            <span className="text-5xl">{course.icon}</span>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-2xl bg-white p-1.5 shadow-card border border-ink/5">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition flex-1 justify-center ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-violet to-electric text-white shadow-sm'
                  : 'text-ink/50 hover:bg-surface hover:text-ink'
              }`}
            >
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
              {(tab.count ?? 0) > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                  activeTab === tab.key ? 'bg-white/20' : 'bg-violet/10 text-violet'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Learners Tab */}
          {activeTab === 'learners' && (
            <div className="space-y-3">
              {enrollments.length === 0 ? (
                <div className="rounded-3xl bg-white p-12 text-center text-ink/40 shadow-card border border-ink/5">
                  <Users size={32} className="mx-auto mb-3" />
                  <p className="font-bold">No learners enrolled yet</p>
                </div>
              ) : (
                enrollments.map(enrollment => (
                  <div key={enrollment.id} className="rounded-2xl bg-white p-5 shadow-card border border-ink/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar name={enrollment.learnerName} />
                        <div>
                          <p className="text-sm font-bold">{enrollment.learnerName}</p>
                          <p className="text-xs text-ink/40">Enrolled {enrollment.enrolledAt}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={enrollment.examStatus} />
                      </div>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={enrollment.lecturesCompleted} max={course.totalLectures} />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Lectures Tab */}
          {activeTab === 'lectures' && (
            <div className="space-y-2">
              {/* ── NEW: Schedule button ── */}
              <div className="flex justify-end mb-3">
                <Button
                  onClick={() => setShowScheduleLecture(true)}
                  className="bg-gradient-to-r from-violet to-electric text-white text-xs py-2"
                >
                  <Plus size={14} /> Schedule Lecture
                </Button>
              </div>

              {lectures.length === 0 && (
                <div className="rounded-3xl bg-white p-12 text-center text-ink/40 shadow-card border border-ink/5">
                  <BookOpen size={32} className="mx-auto mb-3" />
                  <p className="font-bold">No lectures yet</p>
                  <p className="mt-1 text-xs">Click "Schedule Lecture" to create your first lecture.</p>
                </div>
              )}

              {lectures.map((lecture, i) => {
                const attendedCount = enrollments.filter(e => e.lecturesCompleted >= lecture.order).length;
                return (
                  <div key={lecture.id} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card border border-ink/5">
                    <div className="shrink-0">
                      {lecture.status === 'completed' ? (
                        <CheckCircle2 size={20} className="text-emerald-500" />
                      ) : (
                        <Clock size={20} className="text-ink/25" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold">Lecture {lecture.order}: {lecture.title}</p>
                      <p className="text-xs text-ink/40">{lecture.duration} · {attendedCount}/{enrollments.length} attended</p>
                      {/* Scheduled time */}
                      {lecture.scheduledAt && (
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-violet font-bold">
                          <CalendarClock size={10} />
                          {new Date(lecture.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={lecture.status} />
                    {lecture.status !== 'completed' && (
                      <Button
                        onClick={() => nav(`/learning/${course.id}/lecture/${lecture.id}`)}
                        className="bg-violet/10 text-violet hover:bg-violet hover:text-white text-xs py-1.5"
                      >
                        <Play size={12} /> Start
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Exams Tab */}
          {activeTab === 'exams' && (
            <div className="space-y-3">
              {/* ── NEW: Schedule Exam Date button ── */}
              <div className="flex justify-end mb-3">
                <Button
                  onClick={() => setShowScheduleExam(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs py-2"
                >
                  <CalendarClock size={14} /> Schedule Exam Date
                </Button>
              </div>

              {/* Show currently scheduled exam date if set */}
              {(() => {
                const scheduled = store.getExamScheduledAt(course.id);
                return scheduled ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-100 px-5 py-3">
                    <CalendarClock size={18} className="text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-amber-800">Exam Scheduled</p>
                      <p className="text-xs text-amber-700">
                        {new Date(scheduled).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowScheduleExam(true)}
                      className="ml-auto text-xs font-bold text-amber-600 hover:text-amber-800 transition"
                    >
                      Change
                    </button>
                  </div>
                ) : null;
              })()}

              {enrollments.filter(e => ['requested', 'scheduled', 'passed', 'failed', 'submitted'].includes(e.examStatus)).length === 0 ? (
                <div className="rounded-3xl bg-white p-12 text-center text-ink/40 shadow-card border border-ink/5">
                  <FileText size={32} className="mx-auto mb-3" />
                  <p className="font-bold">No exam requests yet</p>
                  <p className="mt-1 text-xs">Learners will request exams after completing all lectures.</p>
                </div>
              ) : (
                enrollments
                  .filter(e => e.examStatus !== 'locked' && e.examStatus !== 'eligible')
                  .map(enrollment => (
                    <div key={enrollment.id} className="rounded-2xl bg-white p-5 shadow-card border border-ink/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar name={enrollment.learnerName} />
                          <div>
                            <p className="text-sm font-bold">{enrollment.learnerName}</p>
                            <p className="text-xs text-ink/40">
                              Lectures: {enrollment.lecturesCompleted}/{course.totalLectures}
                              {enrollment.examScore !== null && ` · Score: ${enrollment.examScore}%`}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={enrollment.examStatus} />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {enrollment.examStatus === 'requested' && (
                          <Button
                            onClick={() => setConfirmAction({ type: 'schedule-exam', id: enrollment.learnerId, name: enrollment.learnerName })}
                            className="bg-gradient-to-r from-violet to-electric text-white text-xs py-1.5"
                          >
                            Schedule Exam
                          </Button>
                        )}
                        {enrollment.examStatus === 'submitted' && (
                          <>
                            <Button
                              onClick={() => setConfirmAction({ type: 'pass-exam', id: enrollment.learnerId, name: enrollment.learnerName })}
                              className="bg-emerald-600 text-white text-xs py-1.5"
                            >
                              <CheckCircle2 size={14} /> Pass
                            </Button>
                            <Button
                              onClick={() => setConfirmAction({ type: 'fail-exam', id: enrollment.learnerId, name: enrollment.learnerName })}
                              className="bg-rose-600 text-white text-xs py-1.5"
                            >
                              <XCircle size={14} /> Fail
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          {/* Certificates Tab */}
          {activeTab === 'certificates' && (
            <div className="space-y-3">
              {certRequests.length === 0 ? (
                <div className="rounded-3xl bg-white p-12 text-center text-ink/40 shadow-card border border-ink/5">
                  <Award size={32} className="mx-auto mb-3" />
                  <p className="font-bold">No certificate requests yet</p>
                  <p className="mt-1 text-xs">Learners can request certificates after passing the exam.</p>
                </div>
              ) : (
                certRequests.map(req => (
                  <div key={req.id} className="rounded-2xl bg-white p-5 shadow-card border border-ink/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar name={req.learnerName} />
                        <div>
                          <p className="text-sm font-bold">{req.learnerName}</p>
                          <p className="text-xs text-ink/40">
                            Exam: Passed — {req.examScore}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={req.tutorApproval} />
                      </div>
                    </div>

                    {/* Requirements */}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 size={12} /> Lectures Complete
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 size={12} /> Exam Passed ({req.examScore}%)
                      </span>
                      <span className={`flex items-center gap-1 ${req.tutorApproval === 'approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {req.tutorApproval === 'approved' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        Tutor {req.tutorApproval === 'approved' ? 'Approved' : 'Pending'}
                      </span>
                      <span className={`flex items-center gap-1 ${req.adminApproval === 'approved' ? 'text-emerald-600' : 'text-ink/40'}`}>
                        {req.adminApproval === 'approved' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        Admin {req.adminApproval === 'approved' ? 'Approved' : 'Pending'}
                      </span>
                    </div>

                    {req.tutorApproval === 'pending' && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          onClick={() => setConfirmAction({ type: 'approve-cert', id: req.id, name: req.learnerName })}
                          className="bg-emerald-600 text-white text-xs py-1.5"
                        >
                          <CheckCircle2 size={14} /> Approve
                        </Button>
                        <Button
                          onClick={() => setConfirmAction({ type: 'reject-cert', id: req.id, name: req.learnerName })}
                          className="bg-white text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50 text-xs py-1.5"
                        >
                          <XCircle size={14} /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmAction && (
        <ConfirmModal
          title={
            confirmAction.type === 'schedule-exam' ? 'Schedule Exam' :
            confirmAction.type === 'pass-exam' ? 'Mark as Passed' :
            confirmAction.type === 'fail-exam' ? 'Mark as Failed' :
            confirmAction.type === 'approve-cert' ? 'Approve Certificate' :
            'Reject Certificate'
          }
          message={
            confirmAction.type === 'schedule-exam' ? `Schedule the final exam for ${confirmAction.name}?` :
            confirmAction.type === 'pass-exam' ? `Mark ${confirmAction.name} as passed?` :
            confirmAction.type === 'fail-exam' ? `Mark ${confirmAction.name} as failed? They may need to retake.` :
            confirmAction.type === 'approve-cert' ? `Approve the certificate for ${confirmAction.name}? This will proceed to admin review.` :
            `Reject the certificate request from ${confirmAction.name}?`
          }
          confirmLabel={
            confirmAction.type.includes('reject') || confirmAction.type.includes('fail') ? 'Confirm' : 'Yes, proceed'
          }
          variant={confirmAction.type.includes('reject') || confirmAction.type.includes('fail') ? 'danger' : 'primary'}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Schedule Lecture Modal */}
      {showScheduleLecture && (
        <ScheduleLectureModal
          courseId={course.id}
          onClose={() => setShowScheduleLecture(false)}
          onSave={async (data) => {
            await store.createLecture(course.id, data);
            show(`Lecture "${data.title}" scheduled! Learners notified.`, 'success');
          }}
        />
      )}

      {/* Schedule Exam Modal */}
      {showScheduleExam && (
        <ScheduleExamModal
          courseId={course.id}
          courseName={course.skillName}
          existingScheduledAt={store.getExamScheduledAt(course.id)}
          onClose={() => setShowScheduleExam(false)}
          onSave={async (scheduledAt) => {
            await store.scheduleExamDate(course.id, scheduledAt);
            show(`Exam scheduled! All learners notified.`, 'success');
          }}
        />
      )}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </main>
  );
}
