/* ═══════════════════════════════════════════════════════════
   Notification Bell — Shows in-app notifications from backend
   ═══════════════════════════════════════════════════════════ */
import { useRef, useState, useEffect } from 'react';
import { Bell, BookOpen, FileText, ExternalLink, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const nav = useNavigate();

  // Load notifications from backend
  useEffect(() => {
    const load = async () => {
      try {
        const notifs = await api.getNotifications();
        setNotifications(notifs.map((n: any) => ({
          id: n.id,
          title: n.title || 'Notification',
          message: n.detail || n.message || '',
          type: n.type || 'lecture',
          courseId: n.course_id || '',
          lectureId: n.lecture_id || '',
          scheduledAt: n.scheduled_at || n.created_at || new Date().toISOString(),
          read: n.read ?? true,
          createdAt: n.created_at || new Date().toISOString(),
        })));
      } catch {
        // Not logged in or API error — show empty
        setNotifications([]);
      }
    };
    load();
  }, []);

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
  };

  const markRead = async (id: string | number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const handleItemClick = (n: any) => {
    markRead(n.id);
    setOpen(false);
    if (n.courseId && n.lectureId) {
      nav(`/learning/${n.courseId}/lecture/${n.lectureId}`);
    } else if (n.courseId) {
      nav(`/learning/${n.courseId}`);
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
                  <p className="text-xs mt-0.5">You'll be notified about lectures and exams</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`px-4 py-3.5 transition hover:bg-surface cursor-pointer ${!n.read ? 'bg-violet/[0.02]' : ''}`}
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
                        <span className="mt-1.5 block text-[10px] text-ink/30">{timeAgo(n.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {unread > 0 && (
              <div className="border-t border-ink/5 px-4 py-3 bg-surface/50">
                <button
                  onClick={markAllRead}
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
