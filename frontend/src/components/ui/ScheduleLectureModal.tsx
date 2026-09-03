/* ═══════════════════════════════════════════════════════════
   Schedule Lecture Modal — Teacher creates a new lecture
   ═══════════════════════════════════════════════════════════ */
import { useState } from 'react';
import { X, BookOpen, Loader2, CalendarClock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Primitives';

interface Props {
  courseId: string;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    durationMinutes: number;
    scheduledAt: string;
  }) => Promise<void>;
}

export function ScheduleLectureModal({ courseId: _courseId, onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(45);
  const [scheduledAt, setScheduledAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Min datetime = now (rounded to next minute)
  const minDatetime = new Date(Date.now() + 60_000).toISOString().slice(0, 16);

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Please enter a lecture title.'); return; }
    if (!scheduledAt) { setError('Please pick a date and time.'); return; }
    if (new Date(scheduledAt) <= new Date()) { setError('Schedule must be in the future.'); return; }
    setError('');
    setSaving(true);
    try {
      await onSave({ title: title.trim(), description: description.trim(), durationMinutes: duration, scheduledAt: new Date(scheduledAt).toISOString() });
      onClose();
    } catch {
      setError('Failed to create lecture. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-5 backdrop-blur-sm"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-ink/5 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink/5 px-6 py-5 bg-gradient-to-r from-violet/5 to-electric/5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet to-electric text-white">
                <CalendarClock size={18} />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Schedule New Lecture</h2>
                <p className="text-xs text-ink/40">Enrolled learners will be notified automatically</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-xl text-ink/30 hover:bg-ink/5 hover:text-ink transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* Title */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink/40">
                Lecture Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Introduction to React Hooks"
                className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-2.5 text-sm font-medium outline-none focus:border-violet focus:ring-2 focus:ring-violet/10 transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink/40">
                Description <span className="normal-case font-normal">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What will learners learn in this lecture?"
                className="w-full resize-none rounded-xl border border-ink/10 bg-surface px-4 py-2.5 text-sm font-medium outline-none focus:border-violet focus:ring-2 focus:ring-violet/10 transition"
              />
            </div>

            {/* Duration + DateTime row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink/40">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min={10}
                  max={300}
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-2.5 text-sm font-medium outline-none focus:border-violet focus:ring-2 focus:ring-violet/10 transition"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink/40">
                  Date &amp; Time *
                </label>
                <input
                  type="datetime-local"
                  min={minDatetime}
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-2.5 text-sm font-medium outline-none focus:border-violet focus:ring-2 focus:ring-violet/10 transition"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-2.5 text-sm text-rose-600 font-medium">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-ink/5 px-6 py-4">
            <Button
              onClick={onClose}
              className="bg-surface text-ink/60 hover:bg-ink/5 text-sm"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-gradient-to-r from-violet to-electric text-white hover:shadow-glow text-sm disabled:opacity-60"
            >
              {saving ? (
                <><Loader2 size={14} className="animate-spin" /> Scheduling…</>
              ) : (
                <><BookOpen size={14} /> Schedule Lecture</>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
