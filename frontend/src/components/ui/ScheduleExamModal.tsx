/* ═══════════════════════════════════════════════════════════
   Schedule Exam Modal — Teacher schedules an exam date
   ═══════════════════════════════════════════════════════════ */
import { useState } from 'react';
import { X, FileText, Loader2, CalendarClock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Primitives';

interface Props {
  courseId: string;
  courseName: string;
  existingScheduledAt?: string | null;
  onClose: () => void;
  onSave: (scheduledAt: string) => Promise<void>;
}

export function ScheduleExamModal({ courseId: _courseId, courseName, existingScheduledAt, onClose, onSave }: Props) {
  const initialDate = existingScheduledAt
    ? new Date(existingScheduledAt).toISOString().slice(0, 16)
    : '';

  const [scheduledAt, setScheduledAt] = useState(initialDate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const minDatetime = new Date(Date.now() + 60_000).toISOString().slice(0, 16);
  const isRescheduling = !!existingScheduledAt;

  const handleSubmit = async () => {
    if (!scheduledAt) { setError('Please pick a date and time for the exam.'); return; }
    if (new Date(scheduledAt) <= new Date()) { setError('Exam date must be in the future.'); return; }
    setError('');
    setSaving(true);
    try {
      await onSave(new Date(scheduledAt).toISOString());
      onClose();
    } catch {
      setError('Failed to schedule exam. Please try again.');
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
          className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-ink/5 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink/5 px-6 py-5 bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                <CalendarClock size={18} />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-ink">
                  {isRescheduling ? 'Reschedule Exam' : 'Schedule Exam'}
                </h2>
                <p className="text-xs text-ink/40">All enrolled learners will be notified</p>
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
            {/* Course name info */}
            <div className="flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3">
              <FileText size={16} className="text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-ink">{courseName} — Final Exam</p>
                <p className="text-xs text-ink/50">Set the date and time when learners should take this exam.</p>
              </div>
            </div>

            {/* Existing schedule */}
            {isRescheduling && (
              <div className="flex items-center gap-2 text-xs text-amber-700 rounded-xl bg-amber-50 px-3 py-2">
                <AlertTriangle size={13} />
                Currently scheduled: <strong>{new Date(existingScheduledAt!).toLocaleString()}</strong>
              </div>
            )}

            {/* DateTime picker */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink/40">
                Exam Date &amp; Time *
              </label>
              <input
                type="datetime-local"
                min={minDatetime}
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-3 text-sm font-medium outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 transition"
              />
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
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-glow text-sm disabled:opacity-60"
            >
              {saving ? (
                <><Loader2 size={14} className="animate-spin" /> Scheduling…</>
              ) : (
                <><FileText size={14} /> {isRescheduling ? 'Reschedule' : 'Schedule Exam'}</>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
