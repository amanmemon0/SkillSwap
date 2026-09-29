/* ═══════════════════════════════════════════════════════════
   Exam Page — Professional exam taking interface
   ═══════════════════════════════════════════════════════════ */
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Clock, ChevronLeft, ChevronRight, CheckCircle2,
  XCircle, AlertTriangle, Send, FileText, Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, Button } from '../components/ui/Primitives';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import Navbar from '../components/Navbar';
import { useLearningStore } from '../data/learningStore';

export default function ExamPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const nav = useNavigate();
  const store = useLearningStore();

  const [loadingExam, setLoadingExam] = useState(true);
  const course = store.courses.find(c => c.id === courseId);
  const exam = course ? store.getExam(course.id) : null;
  const enrollment = course ? store.getEnrollment(course.id) : null;

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [started, setStarted] = useState(false);

  // Fetch live exam on mount
  useEffect(() => {
    if (!courseId) return;
    setLoadingExam(true);
    store.loadExam(courseId).finally(() => setLoadingExam(false));
  }, [courseId, store]);

  // Initialize
  useEffect(() => {
    if (exam) {
      setAnswers(new Array(exam.questions.length).fill(null));
      setTimeLeft(exam.timeLimit * 60);
    }
  }, [exam]);

  // Timer
  useEffect(() => {
    if (!started || submitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, submitted, timeLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleAnswer = (optionIndex: number) => {
    setAnswers(prev => {
      const next = [...prev];
      next[currentQ] = optionIndex;
      return next;
    });
  };

  const handleSubmit = useCallback(async () => {
    if (!exam) return;
    const r = await store.submitExam(course!.id, store.currentUserId, store.currentUserName, answers);
    if (r) {
      setResult(r);
      setSubmitted(true);
      setShowSubmitConfirm(false);
    }
  }, [exam, answers, course, store]);

  if (store.loading || loadingExam) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar variant="auth" />
        <div className="flex items-center justify-center py-32 gap-3 text-ink/50">
          <Loader2 size={20} className="animate-spin text-violet" />
          <p className="text-sm font-medium">Loading exam details...</p>
        </div>
      </main>
    );
  }

  if (!course || !enrollment) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar variant="auth" />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <p className="text-ink/70 font-bold mb-2">Course not found or you are not enrolled as a learner.</p>
          <Button onClick={() => nav('/learning')} className="mt-2 bg-violet/10 text-violet text-xs">
            Back to My Learning
          </Button>
        </div>
      </main>
    );
  }

  if (!exam) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar variant="auth" />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <FileText size={36} className="mx-auto text-ink/25 mb-3" />
          <p className="text-ink/80 font-bold mb-1">No exam has been published for this course yet.</p>
          <p className="text-xs text-ink/40 mb-4 max-w-sm">Your instructor will publish the assessment when it is ready.</p>
          <Button onClick={() => nav(`/learning/${courseId}`)} className="bg-violet/10 text-violet text-xs">
            Back to Course
          </Button>
        </div>
      </main>
    );
  }

  const answeredCount = answers.filter(a => a !== null).length;
  const totalQ = exam.questions.length;
  const question = exam.questions[currentQ];
  const timeWarning = timeLeft < 120;

  // Not started yet — show instructions
  if (!started && !submitted) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar variant="auth" />
        <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
          <button
            onClick={() => nav(`/learning/${courseId}`)}
            className="mb-6 flex items-center gap-2 text-sm font-bold text-ink/50 hover:text-violet transition"
          >
            <ArrowLeft size={16} /> Back to Course
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-white p-8 shadow-card border border-ink/5 text-center"
          >
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-violet/10 mx-auto">
              <FileText size={28} className="text-violet" />
            </div>
            <h1 className="mt-5 font-display text-3xl font-bold">{exam.title}</h1>
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-ink/50">
              <Avatar name={course.teacherName} size="sm" />
              <span>Tutor: <b className="text-ink/70">{course.teacherName}</b></span>
            </div>

            <div className="mt-8 rounded-2xl bg-surface p-5 text-left">
              <p className="text-sm font-bold text-ink">Instructions</p>
              <p className="mt-2 text-sm text-ink/60 leading-6">{exam.description}</p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-lg font-extrabold text-ink">{totalQ}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Questions</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-lg font-extrabold text-ink">{exam.timeLimit} min</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Time Limit</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-lg font-extrabold text-ink">{exam.passingScore}%</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Pass Mark</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-ink/40">
              <AlertTriangle size={14} />
              <span>Once started, the timer cannot be paused. Good luck!</span>
            </div>

            <Button
              onClick={() => setStarted(true)}
              className="mt-6 bg-gradient-to-r from-violet to-electric text-white hover:shadow-glow text-base px-8 py-3.5"
            >
              Start Exam
            </Button>
          </motion.div>
        </div>
      </main>
    );
  }

  // Results
  if (submitted && result) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar variant="auth" />
        <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl bg-white p-8 shadow-card border border-ink/5 text-center"
          >
            <div className={`grid h-20 w-20 place-items-center rounded-3xl mx-auto ${result.passed ? 'bg-emerald-100' : 'bg-rose-100'}`}>
              {result.passed ? <CheckCircle2 size={36} className="text-emerald-600" /> : <XCircle size={36} className="text-rose-600" />}
            </div>
            <h1 className="mt-5 font-display text-3xl font-bold">
              {result.passed ? '🎉 Congratulations!' : 'Keep Trying'}
            </h1>
            <p className="mt-2 text-ink/50">
              {result.passed
                ? `You passed the ${exam.title} with a score of ${result.score}%!`
                : `You scored ${result.score}%. You need ${exam.passingScore}% to pass.`}
            </p>

            {/* Score Display */}
            <div className="mt-8 flex items-center justify-center gap-8">
              <div className="text-center">
                <div className={`text-5xl font-extrabold ${result.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {result.score}%
                </div>
                <p className="mt-1 text-xs font-bold text-ink/40 uppercase tracking-wider">Your Score</p>
              </div>
              <div className="h-16 w-px bg-ink/10" />
              <div className="text-center">
                <div className="text-5xl font-extrabold text-ink/20">{exam.passingScore}%</div>
                <p className="mt-1 text-xs font-bold text-ink/40 uppercase tracking-wider">Pass Mark</p>
              </div>
            </div>

            {/* Question Breakdown */}
            <div className="mt-8 rounded-2xl bg-surface p-4">
              <p className="text-sm font-bold text-ink mb-3">Question Breakdown</p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {answers.map((ans, i) => {
                  const correct = ans === exam.questions[i].correctAnswer;
                  return (
                    <span
                      key={i}
                      className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold ${
                        correct ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {i + 1}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <Button
                onClick={() => nav(`/learning/${courseId}`)}
                className="bg-gradient-to-r from-violet to-electric text-white hover:shadow-glow"
              >
                Back to Course
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  // Active Exam
  return (
    <main className="min-h-screen bg-surface">
      {/* Exam Header */}
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-xl px-5 py-3 sm:px-8">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-ink">{exam.title}</h1>
            <p className="text-xs text-ink/40">Tutor: {course.teacherName}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-ink/40">{answeredCount}/{totalQ} answered</span>
            <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${
              timeWarning ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-surface text-ink'
            }`}>
              <Clock size={14} />
              {formatTime(timeLeft)}
            </div>
            <Button
              onClick={() => setShowSubmitConfirm(true)}
              className="bg-gradient-to-r from-violet to-electric text-white text-xs"
            >
              <Send size={14} /> Submit
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_200px]">
          {/* Question Area */}
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-3xl bg-white p-6 sm:p-8 shadow-card border border-ink/5"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet/10 text-sm font-extrabold text-violet">
                {currentQ + 1}
              </span>
              <p className="text-xs font-bold text-ink/40 uppercase tracking-wider">
                Question {currentQ + 1} of {totalQ}
              </p>
            </div>

            <h2 className="font-display text-xl font-bold text-ink leading-relaxed">{question.question}</h2>

            <div className="mt-6 space-y-3">
              {question.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${
                    answers[currentQ] === idx
                      ? 'border-violet bg-violet/5'
                      : 'border-ink/5 bg-white hover:border-violet/30 hover:bg-violet/[.02]'
                  }`}
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                    answers[currentQ] === idx
                      ? 'bg-violet text-white'
                      : 'bg-surface text-ink/40'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className={`text-sm ${answers[currentQ] === idx ? 'font-bold text-ink' : 'text-ink/70'}`}>
                    {option}
                  </span>
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between">
              <Button
                onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
                disabled={currentQ === 0}
                className="bg-surface text-ink/50 hover:bg-ink/10 disabled:opacity-30 text-sm"
              >
                <ChevronLeft size={16} /> Previous
              </Button>
              <Button
                onClick={() => setCurrentQ(prev => Math.min(totalQ - 1, prev + 1))}
                disabled={currentQ === totalQ - 1}
                className="bg-violet/10 text-violet hover:bg-violet hover:text-white text-sm"
              >
                Next <ChevronRight size={16} />
              </Button>
            </div>
          </motion.div>

          {/* Question Navigation */}
          <div className="rounded-3xl bg-white p-4 shadow-card border border-ink/5 h-fit lg:sticky lg:top-24">
            <p className="text-xs font-bold text-ink/40 uppercase tracking-wider mb-3">Questions</p>
            <div className="grid grid-cols-5 gap-1.5">
              {answers.map((ans, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`grid h-9 w-9 place-items-center rounded-lg text-xs font-bold transition ${
                    i === currentQ
                      ? 'bg-gradient-to-r from-violet to-electric text-white shadow-sm'
                      : ans !== null
                        ? 'bg-violet/10 text-violet'
                        : 'bg-surface text-ink/30 hover:bg-ink/10'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation */}
      {showSubmitConfirm && (
        <ConfirmModal
          title="Submit Exam?"
          message={`You have answered ${answeredCount} out of ${totalQ} questions. ${answeredCount < totalQ ? 'Some questions are unanswered. ' : ''}Are you sure you want to submit?`}
          confirmLabel="Submit Exam"
          onConfirm={handleSubmit}
          onCancel={() => setShowSubmitConfirm(false)}
        />
      )}
    </main>
  );
}
