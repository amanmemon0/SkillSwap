/* ═══════════════════════════════════════════════════════════
   Learning Course Detail — Individual course view for learner
   ═══════════════════════════════════════════════════════════ */
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowLeft, BookOpen, CheckCircle2, Circle, Clock, Lock,
  FileText, Award, ChevronRight, Play, PartyPopper, Star, StarHalf
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, Button } from '../components/ui/Primitives';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useToast, ToastContainer } from '../components/ui/Toast';
import Navbar from '../components/Navbar';
import { useLearningStore, mockCourses, CURRENT_USER_ID, CURRENT_USER_NAME } from '../data/learningMockData';

export default function LearningCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const nav = useNavigate();
  const store = useLearningStore();
  const { toasts, show, dismiss } = useToast();
  const [showExamRequest, setShowExamRequest] = useState(false);
  const [showCertRequest, setShowCertRequest] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);

  const course = mockCourses.find(c => c.id === courseId);
  const enrollment = course ? store.getEnrollment(course.id, CURRENT_USER_ID) : null;
  const lectures = course ? store.getCourseLectures(course.id) : [];
  const certReqs = store.getCertificateRequests({ learnerId: CURRENT_USER_ID });
  const certReq = certReqs.find(r => r.courseId === courseId);

  if (!course || !enrollment) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar variant="auth" />
        <div className="flex items-center justify-center py-32">
          <p className="text-ink/50">Course not found or not enrolled.</p>
        </div>
      </main>
    );
  }

  const allLecturesCompleted = enrollment.progress === 100;
  const examPassed = enrollment.examStatus === 'passed';
  const canRequestExam = allLecturesCompleted && enrollment.examStatus === 'eligible';
  const canTakeExam = enrollment.examStatus === 'scheduled' || enrollment.examStatus === 'eligible' || enrollment.examStatus === 'requested';
  const canRequestCert = examPassed && enrollment.certificateStatus === 'eligible';

  const handleRequestExam = () => {
    store.requestExam(course.id, CURRENT_USER_ID, CURRENT_USER_NAME);
    setShowExamRequest(false);
    show('Exam request sent to your tutor!', 'success');
  };

  const handleRequestCert = () => {
    store.requestCertificate(course.id, CURRENT_USER_ID, CURRENT_USER_NAME);
    setShowCertRequest(false);
    show('Certificate request sent!', 'success');
  };

  const handleRateTutor = () => {
    if (selectedStar === 0) return;
    setShowRatingModal(false);
    show(`You rated ${course.teacherName} ${selectedStar} stars!`, 'success');
  };

  return (
    <main className="min-h-screen bg-surface">
      <Navbar variant="auth" />
      <div className="mx-auto max-w-4xl px-5 py-6 sm:px-8">
        {/* Back */}
        <button
          onClick={() => nav('/learning')}
          className="mb-6 flex items-center gap-2 text-sm font-bold text-ink/50 hover:text-violet transition"
        >
          <ArrowLeft size={16} /> Back to My Learning
        </button>

        {/* Course Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-br from-ink via-violet/90 to-electric p-7 text-white sm:p-10"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-cyan">Course</p>
              <h1 className="mt-2 font-display text-3xl font-bold">{course.skillName}</h1>
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={course.teacherName} size="sm" />
                <span className="text-sm text-white/70">Learning from <b className="text-white">{course.teacherName}</b></span>
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="ml-2 flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-white hover:bg-white/20 transition"
                >
                  <Star size={12} className="text-warmyellow fill-warmyellow" /> Rate Tutor
                </button>
              </div>
            </div>
            <span className="text-5xl">{course.icon}</span>
          </div>
          <div className="mt-6">
            <ProgressBar value={enrollment.lecturesCompleted} max={course.totalLectures} size="lg" />
          </div>
          <p className="mt-2 text-sm text-white/60">{course.description}</p>
        </motion.div>

        {/* Completion Banner */}
        {allLecturesCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-5 text-white"
          >
            <div className="flex items-center gap-3">
              <PartyPopper size={28} />
              <div>
                <h3 className="font-display text-lg font-bold">🎉 All Lectures Completed!</h3>
                <p className="mt-0.5 text-sm text-white/80">
                  You've completed {enrollment.lecturesCompleted}/{course.totalLectures} lectures.
                  {!examPassed && ' You are now eligible for the final exam.'}
                  {examPassed && ' You passed the exam — request your certificate!'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Lecture Timeline */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="eyebrow">Progress</p>
              <h2 className="mt-1 font-display text-2xl font-bold">Lectures</h2>
            </div>
            <span className="text-sm font-bold text-ink/40">{enrollment.lecturesCompleted}/{course.totalLectures} completed</span>
          </div>

          <div className="space-y-2">
            {lectures.map((lecture, i) => {
              const isCompleted = lecture.status === 'completed';
              const isCurrent = !isCompleted && (i === 0 || lectures[i - 1]?.status === 'completed');
              const isLocked = !isCompleted && !isCurrent;

              return (
                <motion.div
                  key={lecture.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-4 rounded-2xl p-4 transition border ${
                    isCompleted
                      ? 'bg-emerald-50/50 border-emerald-100'
                      : isCurrent
                        ? 'bg-violet/5 border-violet/20 shadow-sm'
                        : 'bg-white border-ink/5 opacity-60'
                  }`}
                >
                  {/* Status Icon */}
                  <div className="shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 size={22} className="text-emerald-500" />
                    ) : isCurrent ? (
                      <Circle size={22} className="text-violet fill-violet/20" />
                    ) : (
                      <Lock size={18} className="text-ink/25" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${isCompleted ? 'text-emerald-700' : isCurrent ? 'text-ink' : 'text-ink/40'}`}>
                      Lecture {lecture.order}: {lecture.title}
                    </p>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-ink/40">
                      <span className="flex items-center gap-1"><Clock size={11} /> {lecture.duration}</span>
                      <StatusBadge status={isCompleted ? 'completed' : isCurrent ? 'in-progress' : 'upcoming'} />
                    </div>
                  </div>

                  {/* Action */}
                  {(isCompleted || isCurrent) && (
                    <Button
                      onClick={(e) => { e.stopPropagation(); nav(`/learning/${course.id}/lecture/${lecture.id}`); }}
                      className={`text-xs py-1.5 ${
                        isCurrent
                          ? 'bg-gradient-to-r from-violet to-electric text-white hover:shadow-glow'
                          : 'bg-ink/5 text-ink/50 hover:bg-ink/10'
                      }`}
                    >
                      {isCurrent ? <><Play size={12} /> Join Lecture</> : 'Review'}
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Exam Section */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="eyebrow">Assessment</p>
              <h2 className="mt-1 font-display text-2xl font-bold">Final Exam</h2>
            </div>
            <StatusBadge status={enrollment.examStatus} />
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-card border border-ink/5">
            {enrollment.examStatus === 'locked' && (
              <div className="flex items-center gap-3 text-ink/40">
                <Lock size={20} />
                <div>
                  <p className="text-sm font-bold">Exam Locked</p>
                  <p className="text-xs">Complete all {course.totalLectures} lectures to unlock the exam.</p>
                </div>
              </div>
            )}

            {canRequestExam && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-violet" />
                  <div>
                    <p className="text-sm font-bold text-ink">You're eligible for the exam!</p>
                    <p className="text-xs text-ink/50">Request your tutor to schedule the final assessment.</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowExamRequest(true)}
                  className="bg-gradient-to-r from-violet to-electric text-white hover:shadow-glow text-xs"
                >
                  Request Exam
                </Button>
              </div>
            )}

            {enrollment.examStatus === 'requested' && (
              <div className="flex items-center gap-3 text-amber-700">
                <Clock size={20} />
                <div>
                  <p className="text-sm font-bold">Exam Requested</p>
                  <p className="text-xs text-ink/50">Waiting for {course.teacherName} to schedule your exam.</p>
                </div>
              </div>
            )}

            {enrollment.examStatus === 'scheduled' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-blue-700">
                  <FileText size={20} />
                  <div>
                    <p className="text-sm font-bold">Exam Scheduled</p>
                    <p className="text-xs text-ink/50">Your exam is ready. Take it when you're prepared!</p>
                  </div>
                </div>
                <Button
                  onClick={() => nav(`/learning/${course.id}/exam`)}
                  className="bg-gradient-to-r from-violet to-electric text-white hover:shadow-glow text-xs"
                >
                  Take Exam
                </Button>
              </div>
            )}

            {enrollment.examStatus === 'passed' && (
              <div className="flex items-center gap-3 text-emerald-700">
                <CheckCircle2 size={20} />
                <div>
                  <p className="text-sm font-bold">Exam Passed — {enrollment.examScore}%</p>
                  <p className="text-xs text-ink/50">Congratulations! You can now request your certificate.</p>
                </div>
              </div>
            )}

            {enrollment.examStatus === 'failed' && (
              <div className="flex items-center gap-3 text-rose-700">
                <FileText size={20} />
                <div>
                  <p className="text-sm font-bold">Exam Failed — {enrollment.examScore}%</p>
                  <p className="text-xs text-ink/50">You can request to retake the exam.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Certificate Section */}
        <section className="mt-8 mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="eyebrow">Certification</p>
              <h2 className="mt-1 font-display text-2xl font-bold">Certificate</h2>
            </div>
            {enrollment.certificateStatus !== 'locked' && (
              <StatusBadge status={enrollment.certificateStatus} />
            )}
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-card border border-ink/5">
            {/* Requirements Checklist */}
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40 mb-3">Certificate Requirements</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                {allLecturesCompleted
                  ? <CheckCircle2 size={16} className="text-emerald-500" />
                  : <Circle size={16} className="text-ink/20" />}
                <span className={`text-sm ${allLecturesCompleted ? 'text-emerald-700 font-bold' : 'text-ink/40'}`}>
                  All lectures completed
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                {examPassed
                  ? <CheckCircle2 size={16} className="text-emerald-500" />
                  : <Circle size={16} className="text-ink/20" />}
                <span className={`text-sm ${examPassed ? 'text-emerald-700 font-bold' : 'text-ink/40'}`}>
                  Exam passed {enrollment.examScore ? `— ${enrollment.examScore}%` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                {certReq?.tutorApproval === 'approved'
                  ? <CheckCircle2 size={16} className="text-emerald-500" />
                  : <Circle size={16} className="text-ink/20" />}
                <span className={`text-sm ${certReq?.tutorApproval === 'approved' ? 'text-emerald-700 font-bold' : 'text-ink/40'}`}>
                  Tutor approval {certReq?.tutorApproval === 'pending' ? '— Pending' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                {certReq?.adminApproval === 'approved'
                  ? <CheckCircle2 size={16} className="text-emerald-500" />
                  : <Circle size={16} className="text-ink/20" />}
                <span className={`text-sm ${certReq?.adminApproval === 'approved' ? 'text-emerald-700 font-bold' : 'text-ink/40'}`}>
                  Admin approval {certReq?.adminApproval === 'pending' ? '— Pending' : ''}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex flex-wrap gap-3">
              {canRequestCert && !certReq && (
                <Button
                  onClick={() => setShowCertRequest(true)}
                  className="bg-gradient-to-r from-violet to-electric text-white hover:shadow-glow text-sm"
                >
                  <Award size={16} /> Request Certificate
                </Button>
              )}

              {certReq?.status === 'admin-approved' && (
                <Button
                  onClick={() => {
                    store.generateCertificate(certReq.id);
                    show('Certificate generated!', 'success');
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-glow text-sm"
                >
                  🎓 Generate Certificate
                </Button>
              )}

              {certReq?.status === 'generated' && certReq.certificateId && (
                <Button
                  onClick={() => nav(`/certificates/${certReq.certificateId}`)}
                  className="bg-gradient-to-r from-violet to-electric text-white hover:shadow-glow text-sm"
                >
                  <Award size={16} /> View Certificate
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Modals */}
      {showExamRequest && (
        <ConfirmModal
          title="Request Exam"
          message={`Request ${course.teacherName} to schedule your final exam for ${course.skillName}?`}
          confirmLabel="Request Exam"
          onConfirm={handleRequestExam}
          onCancel={() => setShowExamRequest(false)}
        />
      )}
      {showCertRequest && (
        <ConfirmModal
          title="Request Certificate"
          message={`Request your certificate of completion for ${course.skillName}? This will be reviewed by your tutor and admin.`}
          confirmLabel="Request Certificate"
          onConfirm={handleRequestCert}
          onCancel={() => setShowCertRequest(false)}
        />
      )}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-5 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="font-display text-2xl font-bold">Rate {course.teacherName}</h2>
            <p className="mt-2 text-sm text-ink/60">How was your learning experience for {course.skillName}?</p>
            
            <div className="my-6 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setSelectedStar(star)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    size={32}
                    className={`${
                      (hoveredStar || selectedStar) >= star
                        ? 'text-warmyellow fill-warmyellow'
                        : 'text-ink/10 fill-ink/5'
                    } transition-colors duration-200`}
                  />
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <Button onClick={() => setShowRatingModal(false)} className="bg-surface text-ink hover:bg-ink/5">
                Cancel
              </Button>
              <Button onClick={handleRateTutor} className="bg-gradient-to-r from-violet to-electric text-white disabled:opacity-50" disabled={selectedStar === 0}>
                Submit Rating
              </Button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </main>
  );
}
