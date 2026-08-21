/* ═══════════════════════════════════════════════════════════
   Live Lecture — Video-call mock interface
   ═══════════════════════════════════════════════════════════ */
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Mic, MicOff, Video, VideoOff, Monitor, MessageSquare,
  Maximize, LogOut, Users, Clock, Wifi, CheckCircle2, Send, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, Button } from '../components/ui/Primitives';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useToast, ToastContainer } from '../components/ui/Toast';
import { useLearningStore, mockCourses, mockChatMessages, CURRENT_USER_ID, CURRENT_USER_NAME } from '../data/learningMockData';
import type { ChatMessage } from '../data/skillswapTypes';

export default function LiveLecture() {
  const { courseId, lectureId } = useParams<{ courseId: string; lectureId: string }>();
  const nav = useNavigate();
  const store = useLearningStore();
  const { toasts, show, dismiss } = useToast();

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenShare, setScreenShare] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(true);
  const [showLeave, setShowLeave] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const course = mockCourses.find(c => c.id === courseId);
  const lectures = course ? store.getCourseLectures(course.id) : [];
  const lecture = lectures.find(l => l.id === lectureId);
  const isTeacher = course?.teacherId === CURRENT_USER_ID;
  const enrollment = course ? store.getEnrollment(course.id, CURRENT_USER_ID) : null;
  const enrollments = course ? store.getCourseEnrollments(course.id) : [];

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  if (!course || !lecture) {
    return (
      <main className="min-h-screen bg-ink flex items-center justify-center">
        <p className="text-white/50">Lecture not found.</p>
      </main>
    );
  }

  const participants = [
    { id: course.teacherId, name: course.teacherName, role: 'tutor' as const, isOnline: true },
    ...enrollments.map(e => ({
      id: e.learnerId,
      name: e.learnerName,
      role: 'learner' as const,
      isOnline: Math.random() > 0.2,
    })),
  ];

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderName: CURRENT_USER_NAME,
      senderId: CURRENT_USER_ID,
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => [...prev, msg]);
    setChatInput('');
  };

  const handleCompleteLecture = () => {
    if (isTeacher) {
      // Teacher marks the lecture complete for all learners
      enrollments.forEach(e => {
        store.completeLecture(course.id, lecture.id, e.learnerId);
      });
      show('Lecture marked as completed for all learners!', 'success');
    } else {
      store.completeLecture(course.id, lecture.id, CURRENT_USER_ID);
      show('Attendance marked!', 'success');
    }
    setShowComplete(false);
  };

  const handleLeave = () => {
    setShowLeave(false);
    nav(`/learning/${courseId}`);
  };

  return (
    <main className="min-h-screen bg-ink text-white flex flex-col">
      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-4">
          <button onClick={() => setShowLeave(true)} className="rounded-lg p-2 hover:bg-white/10 transition">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-sm font-bold">{course.skillName} — Lecture {lecture.order}</h1>
            <p className="text-xs text-white/50">{lecture.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Wifi size={14} className="text-emerald-400" />
            <span className="text-white/60">Connected</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
            <Clock size={14} className="text-cyan" />
            <span className="text-sm font-mono font-bold">{formatTime(elapsed)}</span>
          </div>
          <div className="live-badge">
            <span className="live-dot" />
            Live
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 flex flex-col p-4 gap-4">
          {/* Main Video (Tutor) */}
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-gradient-to-br from-violet/30 via-ink to-electric/20 border border-white/10">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Avatar name={course.teacherName} size="xl" />
              <p className="mt-4 text-lg font-bold">{course.teacherName}</p>
              <p className="text-sm text-white/50">{isTeacher ? 'You (Teaching)' : 'Tutor'}</p>
            </div>
            {/* Tutor badge */}
            <div className="absolute top-4 left-4 rounded-full bg-violet/80 backdrop-blur px-3 py-1 text-xs font-bold">
              🎓 Tutor
            </div>
            {screenShare && (
              <div className="absolute top-4 right-4 rounded-full bg-emerald-500/80 backdrop-blur px-3 py-1 text-xs font-bold">
                🖥 Screen Sharing
              </div>
            )}
          </div>

          {/* Self/Learner Videos Grid */}
          <div className="flex gap-3 overflow-x-auto pb-1">
            {participants.filter(p => p.id !== course.teacherId).slice(0, 4).map(p => (
              <div
                key={p.id}
                className="relative h-28 w-40 shrink-0 rounded-xl bg-gradient-to-br from-ink to-violet/10 border border-white/10 flex flex-col items-center justify-center"
              >
                <Avatar name={p.name} size="md" />
                <p className="mt-1.5 text-xs font-bold truncate max-w-[130px]">{p.name}</p>
                {p.id === CURRENT_USER_ID && (
                  <span className="absolute top-2 left-2 text-[10px] font-bold text-cyan">You</span>
                )}
                <span className={`absolute top-2 right-2 h-2 w-2 rounded-full ${p.isOnline ? 'bg-emerald-400' : 'bg-gray-500'}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Side Panel */}
        <AnimatePresence>
          {(participantsOpen || chatOpen) && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-white/10 bg-ink/50 flex flex-col overflow-hidden"
            >
              {/* Panel Tabs */}
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => { setParticipantsOpen(true); setChatOpen(false); }}
                  className={`flex-1 px-4 py-3 text-xs font-bold transition ${participantsOpen && !chatOpen ? 'text-white border-b-2 border-violet' : 'text-white/40 hover:text-white/60'}`}
                >
                  <Users size={14} className="inline mr-1.5" /> Participants ({participants.length})
                </button>
                <button
                  onClick={() => { setChatOpen(true); setParticipantsOpen(false); }}
                  className={`flex-1 px-4 py-3 text-xs font-bold transition ${chatOpen ? 'text-white border-b-2 border-violet' : 'text-white/40 hover:text-white/60'}`}
                >
                  <MessageSquare size={14} className="inline mr-1.5" /> Chat
                </button>
              </div>

              {/* Participants */}
              {participantsOpen && !chatOpen && (
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                  {participants.map(p => (
                    <div key={p.id} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-white/5 transition">
                      <Avatar name={p.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{p.name}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">{p.role}</p>
                      </div>
                      <span className={`h-2 w-2 rounded-full ${p.isOnline ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                    </div>
                  ))}
                </div>
              )}

              {/* Chat */}
              {chatOpen && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {chatMessages.map(msg => (
                      <div key={msg.id} className={`${msg.senderId === CURRENT_USER_ID ? 'text-right' : ''}`}>
                        <p className="text-[10px] font-bold text-white/40">{msg.senderName} · {msg.timestamp}</p>
                        <p className={`mt-0.5 inline-block rounded-xl px-3 py-2 text-sm ${
                          msg.senderId === CURRENT_USER_ID
                            ? 'bg-violet text-white'
                            : 'bg-white/10 text-white/80'
                        }`}>
                          {msg.text}
                        </p>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="border-t border-white/10 p-3">
                    <div className="flex items-center gap-2">
                      <input
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                        placeholder="Type a message..."
                        className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:ring-1 focus:ring-violet"
                      />
                      <button
                        onClick={handleSendChat}
                        className="rounded-xl bg-violet p-2 hover:bg-violet/80 transition"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Toolbar */}
      <footer className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <ToolbarButton active={micOn} onClick={() => setMicOn(!micOn)} icon={micOn ? Mic : MicOff} label={micOn ? 'Mute' : 'Unmute'} />
          <ToolbarButton active={camOn} onClick={() => setCamOn(!camOn)} icon={camOn ? Video : VideoOff} label={camOn ? 'Stop Video' : 'Start Video'} />
          <ToolbarButton active={screenShare} onClick={() => { setScreenShare(!screenShare); show(screenShare ? 'Screen sharing stopped' : 'Screen sharing started', 'info'); }} icon={Monitor} label="Share Screen" />
          <ToolbarButton active={chatOpen} onClick={() => { setChatOpen(!chatOpen); if (!chatOpen) setParticipantsOpen(false); }} icon={MessageSquare} label="Chat" />
          <ToolbarButton active={participantsOpen && !chatOpen} onClick={() => { setParticipantsOpen(!participantsOpen || chatOpen); if (chatOpen) setChatOpen(false); }} icon={Users} label="People" />

          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* Mark Attendance / Complete */}
          <button
            onClick={() => setShowComplete(true)}
            className="rounded-xl bg-emerald-500/20 px-4 py-2.5 text-sm font-bold text-emerald-400 hover:bg-emerald-500/30 transition flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            {isTeacher ? 'Mark Complete' : 'Mark Attended'}
          </button>

          {/* Leave */}
          <button
            onClick={() => setShowLeave(true)}
            className="rounded-xl bg-rose-500/20 px-4 py-2.5 text-sm font-bold text-rose-400 hover:bg-rose-500/30 transition flex items-center gap-2"
          >
            <LogOut size={16} />
            Leave
          </button>
        </div>
      </footer>

      {/* Modals */}
      {showLeave && (
        <ConfirmModal
          title="Leave Lecture?"
          message="Are you sure you want to leave this lecture? Your progress won't be lost."
          confirmLabel="Leave"
          variant="danger"
          onConfirm={handleLeave}
          onCancel={() => setShowLeave(false)}
        />
      )}
      {showComplete && (
        <ConfirmModal
          title={isTeacher ? 'Mark Lecture Complete' : 'Mark as Attended'}
          message={isTeacher
            ? `Mark "${lecture.title}" as completed for all enrolled learners?`
            : `Confirm your attendance for "${lecture.title}"? This cannot be undone.`
          }
          confirmLabel={isTeacher ? 'Mark Complete' : 'Confirm Attendance'}
          onConfirm={handleCompleteLecture}
          onCancel={() => setShowComplete(false)}
        />
      )}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </main>
  );
}

/* ─── Toolbar Button ─── */
function ToolbarButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Mic;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition ${
        active ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white/60'
      }`}
    >
      <Icon size={20} />
      <span className="text-[9px] font-bold uppercase tracking-wider hidden sm:block">{label}</span>
    </button>
  );
}
