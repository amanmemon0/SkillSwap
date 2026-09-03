/* ═══════════════════════════════════════════════════════════
   Notification Bell — Shows in-app notifications for learners
   ═══════════════════════════════════════════════════════════ */
import { useRef, useState, useEffect } from 'react';
import { Bell, BookOpen, FileText, ExternalLink, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLearningStore, CURRENT_USER_ID } from '../data/learningMockData';
import type { AppNotification } from '../data/skillswapTypes';

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function isJoinable(scheduledAt: string): boolean {
  const diff = new Date(scheduledAt).getTime() - Date.now();
  return diff <= 15 * 60_000 && diff > -2 * 60 * 60_000; // within 15 min before or 2h after
}

function formatScheduled(scheduledAt: string): string {
  const d = new Date(scheduledAt);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  const store = useLearningStore();
  const notifications: AppNotification[] = store.getNotifications(CURRENT_USER_ID);
  const unread = notifications.filter(n => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(prev => !prev);
    if (!open) {
      // Mark all as read when opening
      setTimeout(() => store.markAllNotificationsRead(CURRENT_USER_ID), 800);
    }
  };

  const handleJoin = (n: AppNotification) => {
    store.markNotificationRead(n.id);
    setOpen(false);
    if (n.type === 'lecture' && n.lectureId) {
      nav(`/learning/${n.courseId}/lecture/${n.lectureId}`);
    } else if (n.type === 'exam') {
      nav(`/learning/${n.courseId}/exam`);
    }
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        id="notification-bell-btn"
        onClick={handleOpen}
        className="relative grid h-9 w-9 place-items-center rounded-xl text-ink/60 hover:bg-ink/5 hover:text-ink transition"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
      >
        <Bell size={20} />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-gradient-to-br from-violet to-electric text-[9px] font-extrabold text-white"
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-ink/5 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink/5 px-4 py-3 bg-gradient-to-r from-violet/5 to-electric/5">
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-violet" />
                <p className="text-sm font-bold text-ink">Notifications</p>
                {unread > 0 && (
                  <span className="rounded-full bg-violet/10 px-1.5 py-0.5 text-[10px] font-extrabold text-violet">{unread} new</span>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="text-ink/30 hover:text-ink transition">
                <X size={16} />
              </button>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-ink/5">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-ink/30">
                  <Bell size={28} className="mb-2" />
                  <p className="text-sm font-bold">No notifications yet</p>
                  <p className="text-xs mt-0.5">You'll be notified when lectures or exams are scheduled</p>
                </div>
              ) : (
                notifications.map(n => {
                  const joinable = isJoinable(n.scheduledAt);
                  return (
                    <div
                      key={n.id}
                      className={`px-4 py-3.5 transition hover:bg-surface ${!n.read ? 'bg-violet/[0.02]' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                          n.type === 'exam'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-violet/10 text-violet'
                        }`}>
                          {n.type === 'exam' ? <FileText size={15} /> : <BookOpen size={15} />}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-ink truncate">{n.title}</p>
                            {!n.read && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet" />
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-ink/50 leading-4">{n.message}</p>

                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold text-ink/30 uppercase tracking-wider">
                              {formatScheduled(n.scheduledAt)}
                            </span>
                            <span className="text-[10px] text-ink/20">·</span>
                            <span className="text-[10px] text-ink/30">{timeAgo(n.createdAt)}</span>

                            {joinable && (
                              <button
                                onClick={() => handleJoin(n)}
                                className="ml-auto flex items-center gap-1 rounded-lg bg-gradient-to-r from-violet to-electric px-2.5 py-1 text-[10px] font-extrabold text-white hover:shadow-glow transition"
                              >
                                <ExternalLink size={10} /> Join Now
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-ink/5 px-4 py-3 bg-surface/50">
                <button
                  onClick={() => { store.markAllNotificationsRead(CURRENT_USER_ID); }}
                  className="flex items-center gap-1.5 text-xs font-bold text-ink/40 hover:text-violet transition"
                >
                  <Check size={12} /> Mark all as read
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
