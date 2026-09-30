/* ═══════════════════════════════════════════════════════════
   Live Lecture — Real video-call interface powered by Daily.co
   ═══════════════════════════════════════════════════════════ */
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Mic, MicOff, Video, VideoOff, Monitor, MessageSquare,
  LogOut, Users, Clock, Wifi, CheckCircle2, Send, Phone, Loader2,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DailyProvider, DailyAudio, useParticipantIds,
  useParticipantProperty, useLocalSessionId,
} from '@daily-co/daily-react';
import { Avatar, Button } from '../components/ui/Primitives';
import { VideoTile } from '../components/ui/VideoTile';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useToast, ToastContainer } from '../components/ui/Toast';
import { useDailyCall } from '../hooks/useDailyCall';
import { useLearningStore } from '../data/learningMockData';
import type { ChatMessage } from '../data/skillswapTypes';
import { api } from '../utils/api';

/* ─── Helpers ─── */
const DAILY_DOMAIN = import.meta.env.VITE_DAILY_DOMAIN || 'your-team.daily.co';

/** Build a deterministic Daily room URL from course + lecture IDs */
function buildRoomUrl(courseId: string, lectureId: string): string {
  // For testing purposes, we will use a single hardcoded room name.
  // This means you only have to create ONE room in Daily.co to test any lecture!
  return `https://${DAILY_DOMAIN}/skillswap-test-room`;
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

/* ═══════════════════════════════════════════════════════════
   Main Export — wraps everything in DailyProvider
   ═══════════════════════════════════════════════════════════ */
export default function LiveLecture() {
  return (
    <DailyProvider>
      <LiveLectureInner />
      {/* DailyAudio handles all remote audio routing automatically */}
      <DailyAudio />
    </DailyProvider>
  );
}

/* ─── Participant name display hook ─── */
function useDailyParticipantName(sessionId: string): string {
  const name = useParticipantProperty(sessionId, 'user_name') as string | undefined;
  return name || 'Participant';
}

/* ─── Remote participant tile that always renders the remote video ─── */
function RemoteParticipantTile({
  sessionId,
  isFeatured = false,
}: {
  sessionId: string;
  isFeatured?: boolean;
}) {
  const name = useDailyParticipantName(sessionId);
  return (
    <VideoTile
      key={sessionId}
      sessionId={sessionId}
      userName={name}
      isFeatured={isFeatured}
    />
  );
}

/* ═══════════════════════════════════════════════════════════
   Inner Component — uses Daily hooks (must be inside DailyProvider)
   ═══════════════════════════════════════════════════════════ */
function LiveLectureInner() {
  const { courseId, lectureId } = useParams<{ courseId: string; lectureId: string }>();
  const nav = useNavigate();
  const store = useLearningStore();
  const { toasts, show, dismiss } = useToast();

  /* ─── Daily.co call controls ─── */
  const {
    callState, error: callError,
    isMicOn, isCamOn, isScreenSharing,
    localSessionId, participantIds,
    localMediaStream,
    join, leave,
    toggleMic, toggleCam, toggleScreenShare,
  } = useDailyCall();

  /* ─── UI state ─── */
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(true);
  const [showLeave, setShowLeave] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ─── Course / lecture data ─── */
  const currentUserId = store.currentUserId;
  const currentUserName = store.currentUserName || 'User';
  const course = store.courses.find(c => c.id === courseId);
  const lectures = course ? store.getCourseLectures(course.id) : [];
  const lecture = lectures.find(l => l.id === lectureId);
  const isTeacher = course?.teacherId === currentUserId;
  const enrollments = course ? store.getCourseEnrollments(course.id) : [];

  /* ─── Timer (only runs when joined) ─── */
  useEffect(() => {
    if (callState !== 'joined') return;
    const timer = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(timer);
  }, [callState]);

  /* ─── Auto-scroll chat ─── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  /* ─── Loading / 404 guard ─── */
  if (store.loading) {
    return (
      <main className="min-h-screen bg-ink flex items-center justify-center">
        <p className="text-white/70">Loading lecture details...</p>
      </main>
    );
  }

  if (!course || !lecture || !courseId || !lectureId) {
    return (
      <main className="min-h-screen bg-ink flex items-center justify-center">
        <p className="text-white/50">Lecture not found.</p>
      </main>
    );
  }

  const roomUrl = buildRoomUrl(courseId, lectureId);

  /* ─── Handlers ─── */
  const handleJoin = async () => {
    await join(roomUrl, currentUserName);
    show('Connected to lecture!', 'success');
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderName: currentUserName,
      senderId: currentUserId,
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => [...prev, msg]);
    setChatInput('');
  };

  const handleCompleteLecture = async () => {
    setShowComplete(false);
    if (isTeacher) {
      try {
        await api.updateLecture(lecture.id, { status: 'completed' });
      } catch (err) {
        console.warn('Could not update status to completed:', err);
      }
      enrollments.forEach(e => {
        store.completeLecture(course.id, lecture.id, e.learnerId);
      });
      show('Lecture marked as done! Ending session...', 'success');
      await leave();
      nav(`/teaching/${courseId}`);
    } else {
      store.completeLecture(course.id, lecture.id, currentUserId);
      show('Attendance marked as attended!', 'success');
    }
  };

  const handleLeave = async () => {
    setShowLeave(false);
    await leave();
    nav(isTeacher ? `/teaching/${courseId}` : `/learning/${courseId}`);
  };

  /* ─── Build participants list from ACTUAL Daily.co participants ─── */
  // We always show the local user + all remote participants that Daily knows about.
  // We do NOT rely on store enrollment data for the sidebar — that was the old bug.
  const totalParticipantCount = 1 + participantIds.length; // local + remote

  /* ═══════════════════════════════════════════════════════
     Pre-Join Screen (Hair Check)
     ═══════════════════════════════════════════════════════ */
  if (callState === 'idle' || callState === 'joining' || callState === 'error') {
    return (
      <main className="min-h-screen bg-ink flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-br from-violet/10 via-ink to-electric/5 p-8 text-center"
        >
          {/* Header */}
          <h1 className="text-2xl font-bold text-white">
            {course.skillName} — Lecture {lecture.order}
          </h1>
          <p className="mt-1 text-sm text-white/50">{lecture.title}</p>

          {/* Camera preview placeholder */}
          <div className="mt-6 mx-auto h-48 w-full max-w-xs rounded-2xl border border-white/10 bg-gradient-to-br from-ink to-violet/20 flex flex-col items-center justify-center overflow-hidden">
            <Avatar name={currentUserName} size="xl" />
            <p className="mt-3 text-sm font-bold text-white">{currentUserName}</p>
            <p className="text-xs text-white/40">{isTeacher ? 'Tutor' : 'Learner'}</p>
          </div>

          {/* Info */}
          <p className="mt-5 text-xs text-white/40 leading-relaxed">
            Your camera and microphone will be activated when you join.
            <br />
            Make sure to allow browser permissions when prompted.
          </p>

          {/* Error display */}
          {callState === 'error' && callError && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-400">
              <AlertTriangle size={16} />
              <span>{callError}</span>
            </div>
          )}

          {/* Join button */}
          <button
            onClick={handleJoin}
            disabled={callState === 'joining'}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-violet to-electric px-6 py-3.5 text-sm font-bold text-white shadow-glow transition hover:shadow-glow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {callState === 'joining' ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                <Phone size={18} />
                Join Lecture
              </>
            )}
          </button>

          {/* Back button */}
          <button
            onClick={() => nav(isTeacher ? `/teaching/${courseId}` : `/learning/${courseId}`)}
            className="mt-3 text-xs text-white/40 hover:text-white/60 transition"
          >
            ← Back to course
          </button>
        </motion.div>
      </main>
    );
  }

  /* ═══════════════════════════════════════════════════════
     In-Call Interface
     ═══════════════════════════════════════════════════════ */

  // Are there remote participants in the call right now?
  const hasRemoteParticipants = participantIds.length > 0;
  // The first remote participant's session ID (shown as the featured tile)
  const featuredRemoteId = participantIds[0] ?? null;

  return (
    <main className="min-h-screen bg-ink text-white flex flex-col">
      {/* ─── Top Bar ─── */}
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 shrink-0">
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

      {/* ─── Main Layout ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 flex flex-col p-3 gap-3 min-h-0">

          {hasRemoteParticipants ? (
            /* ── TWO-PERSON LAYOUT: remote is big, local is small overlay ── */
            <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 min-h-0">
              {/* Featured: first remote participant fills the space */}
              <RemoteParticipantTile sessionId={featuredRemoteId!} isFeatured />

              {/* Local video: picture-in-picture in the bottom-right */}
              <div className="absolute bottom-4 right-4 w-44 h-32 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl z-10">
                <VideoTile
                  sessionId={localSessionId || ''}
                  localStream={localMediaStream}
                  userName={currentUserName}
                  isLocal
                  isCamOn={isCamOn}
                  isMicOn={isMicOn}
                  badge={isTeacher ? '🎓 You (Tutor)' : ''}
                />
              </div>

              {/* Extra remote participants grid (for 3+ person calls) */}
              {participantIds.length > 1 && (
                <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10">
                  {participantIds.slice(1).map(pid => (
                    <div key={pid} className="w-32 h-24 rounded-xl overflow-hidden border border-white/20">
                      <RemoteParticipantTile sessionId={pid} />
                    </div>
                  ))}
                </div>
              )}

              {/* Screen share overlay */}
              {isScreenSharing && (
                <div className="absolute top-4 left-4 rounded-full bg-emerald-500/80 backdrop-blur px-3 py-1 text-xs font-bold z-10">
                  🖥 Screen Sharing
                </div>
              )}
            </div>
          ) : (
            /* ── SOLO LAYOUT: only local user, waiting for others ── */
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10">
                <VideoTile
                  sessionId={localSessionId || ''}
                  localStream={localMediaStream}
                  userName={currentUserName}
                  isLocal
                  isFeatured
                  isCamOn={isCamOn}
                  isMicOn={isMicOn}
                  badge={isTeacher ? '🎓 Tutor' : undefined}
                />
                {/* Waiting overlay when alone */}
                <div className="absolute inset-x-0 top-4 flex justify-center pointer-events-none">
                  <div className="flex items-center gap-2 rounded-full bg-black/50 backdrop-blur px-4 py-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs font-bold text-white/70">
                      Waiting for others to join…
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Side Panel ─── */}
        <AnimatePresence>
          {(participantsOpen || chatOpen) && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-white/10 bg-ink/50 flex flex-col overflow-hidden shrink-0"
            >
              {/* Panel Tabs */}
              <div className="flex border-b border-white/10 shrink-0">
                <button
                  onClick={() => { setParticipantsOpen(true); setChatOpen(false); }}
                  className={`flex-1 px-4 py-3 text-xs font-bold transition ${participantsOpen && !chatOpen ? 'text-white border-b-2 border-violet' : 'text-white/40 hover:text-white/60'}`}
                >
                  <Users size={14} className="inline mr-1.5" />
                  People ({totalParticipantCount})
                </button>
                <button
                  onClick={() => { setChatOpen(true); setParticipantsOpen(false); }}
                  className={`flex-1 px-4 py-3 text-xs font-bold transition ${chatOpen ? 'text-white border-b-2 border-violet' : 'text-white/40 hover:text-white/60'}`}
                >
                  <MessageSquare size={14} className="inline mr-1.5" /> Chat
                </button>
              </div>

              {/* ── Participants: sourced from actual Daily.co participants ── */}
              {participantsOpen && !chatOpen && (
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                  {/* Local user (always shown first) */}
                  <div className="flex items-center gap-3 rounded-xl p-2.5 bg-white/5">
                    <Avatar name={currentUserName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{currentUserName}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">
                        {isTeacher ? 'tutor · you' : 'learner · you'}
                      </p>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                  </div>

                  {/* Remote participants (from Daily.co) */}
                  {participantIds.map(pid => (
                    <RemoteParticipantSidebarRow key={pid} sessionId={pid} />
                  ))}

                  {/* No one else yet */}
                  {participantIds.length === 0 && (
                    <p className="mt-4 text-center text-xs text-white/30 px-4">
                      {isTeacher
                        ? 'Learners will appear here when they join.'
                        : 'The tutor will appear here when they join.'}
                    </p>
                  )}
                </div>
              )}

              {/* Chat */}
              {chatOpen && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {chatMessages.length === 0 && (
                      <p className="text-center text-xs text-white/30 mt-8">
                        No messages yet. Say hello! 👋
                      </p>
                    )}
                    {chatMessages.map(msg => (
                      <div key={msg.id} className={`${msg.senderId === currentUserId ? 'text-right' : ''}`}>
                        <p className="text-[10px] font-bold text-white/40">{msg.senderName} · {msg.timestamp}</p>
                        <p className={`mt-0.5 inline-block rounded-xl px-3 py-2 text-sm ${
                          msg.senderId === currentUserId
                            ? 'bg-violet text-white'
                            : 'bg-white/10 text-white/80'
                        }`}>
                          {msg.text}
                        </p>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="border-t border-white/10 p-3 shrink-0">
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

      {/* ─── Bottom Toolbar ─── */}
      <footer className="border-t border-white/10 px-4 py-3 shrink-0">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <ToolbarButton active={isMicOn} onClick={toggleMic} icon={isMicOn ? Mic : MicOff} label={isMicOn ? 'Mute' : 'Unmute'} />
          <ToolbarButton active={isCamOn} onClick={toggleCam} icon={isCamOn ? Video : VideoOff} label={isCamOn ? 'Stop Video' : 'Start Video'} />
          <ToolbarButton active={isScreenSharing} onClick={toggleScreenShare} icon={Monitor} label="Share Screen" />
          <ToolbarButton active={chatOpen} onClick={() => { setChatOpen(!chatOpen); if (!chatOpen) setParticipantsOpen(false); }} icon={MessageSquare} label="Chat" />
          <ToolbarButton active={participantsOpen && !chatOpen} onClick={() => { setParticipantsOpen(!participantsOpen || chatOpen); if (chatOpen) setChatOpen(false); }} icon={Users} label="People" />

          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* Mark Attendance / Complete */}
          <button
            onClick={() => setShowComplete(true)}
            className="rounded-xl bg-emerald-500/20 px-4 py-2.5 text-sm font-bold text-emerald-400 hover:bg-emerald-500/30 transition flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            {isTeacher ? 'Mark Done & End' : 'Mark Attended'}
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

      {/* ─── Modals ─── */}
      {showLeave && (
        <ConfirmModal
          title="Leave Lecture?"
          message="Are you sure you want to leave this lecture? Your camera and microphone will be disconnected."
          confirmLabel="Leave"
          variant="danger"
          onConfirm={handleLeave}
          onCancel={() => setShowLeave(false)}
        />
      )}
      {showComplete && (
        <ConfirmModal
          title={isTeacher ? 'End Lecture & Mark Done?' : 'Mark as Attended?'}
          message={isTeacher
            ? `Mark "${lecture.title}" as completed and end the session now? Camera and audio will disconnect and learners' completion will be finalized.`
            : `Confirm your attendance for "${lecture.title}"? This cannot be undone.`
          }
          confirmLabel={isTeacher ? 'Mark Done & End Lecture' : 'Confirm Attendance'}
          onConfirm={handleCompleteLecture}
          onCancel={() => setShowComplete(false)}
        />
      )}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </main>
  );
}

/* ─── Sidebar row for a remote Daily.co participant ─── */
function RemoteParticipantSidebarRow({ sessionId }: { sessionId: string }) {
  const name = useDailyParticipantName(sessionId);
  return (
    <div className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-white/5 transition">
      <Avatar name={name} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{name}</p>
        <p className="text-[10px] text-white/40 uppercase tracking-wider">connected</p>
      </div>
      <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
    </div>
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
