import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Check, CheckCircle2, Edit3, Loader2, Play, Plus, Radio, Trash2, Video, X } from 'lucide-react';
import { Button } from './ui/Primitives';
import { useToast, ToastContainer } from './ui/Toast';
import { api } from '../utils/api';

interface Lecture {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  duration: string;
  scheduledAt: string;
  status: string;
}

interface LectureManagerProps {
  courseId: string;
  lectures: Lecture[];
  onChange: () => Promise<void>;
}

interface LectureFormState {
  title: string;
  description: string;
  durationMinutes: string;
  scheduledAt: string;
}

const EMPTY_FORM: LectureFormState = {
  title: '',
  description: '',
  durationMinutes: '60',
  scheduledAt: '',
};

export default function LectureManager({ courseId, lectures, onChange }: LectureManagerProps) {
  const nav = useNavigate();
  const { toasts, show, dismiss } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LectureFormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  const handleStartLecture = async (lecture: Lecture) => {
    setStartingId(lecture.id);
    try {
      if (lecture.status !== 'live' && lecture.status !== 'in-progress') {
        await api.updateLecture(lecture.id, { status: 'live' });
        await onChange();
      }
      nav(`/teaching/${courseId}/lecture/${lecture.id}`);
    } catch (err: any) {
      show(err.message || 'Starting lecture room...', 'info');
      nav(`/teaching/${courseId}/lecture/${lecture.id}`);
    } finally {
      setStartingId(null);
    }
  };

  const handleJoinLecture = (lecture: Lecture) => {
    nav(`/teaching/${courseId}/lecture/${lecture.id}`);
  };

  const handleEndLecture = async (lecture: Lecture) => {
    try {
      await api.updateLecture(lecture.id, { status: 'completed' });
      await onChange();
      show(`Lecture "${lecture.title}" marked as done and completed.`, 'success');
    } catch (err: any) {
      show(err.message || 'Failed to complete lecture', 'error');
    }
  };

  const toDatetimeLocal = (iso?: string | null) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (lecture: Lecture) => {
    setEditingId(lecture.id);
    setForm({
      title: lecture.title,
      description: lecture.description || '',
      durationMinutes: lecture.duration.replace(/\D/g, '') || '60',
      scheduledAt: toDatetimeLocal(lecture.scheduledAt),
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setBusy(true);
    try {
      let isoDate: string | null = null;
      if (form.scheduledAt && form.scheduledAt.trim()) {
        const parsed = new Date(form.scheduledAt);
        if (!isNaN(parsed.getTime())) {
          isoDate = parsed.toISOString();
        }
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || '',
        durationMinutes: Number(form.durationMinutes) || 0,
        scheduledAt: isoDate,
        order: editingId
          ? (lectures.find(l => l.id === editingId)?.order ?? lectures.length + 1)
          : lectures.length + 1,
      };

      if (editingId) {
        await api.updateLecture(editingId, payload);
        show(`Lecture updated`, 'success');
      } else {
        await api.createLecture(courseId, payload);
        show(`Lecture "${form.title.trim()}" added`, 'success');
      }

      await onChange();
      closeForm();
    } catch (err: any) {
      show(err.message || 'Failed to save lecture', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (lecture: Lecture) => {
    if (!window.confirm(`Delete lecture "${lecture.title}"? This cannot be undone.`)) return;
    setDeletingId(lecture.id);
    try {
      await api.deleteLecture(lecture.id);
      await onChange();
      show(`Lecture deleted`, 'success');
    } catch (err: any) {
      show(err.message || 'Failed to delete lecture', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-ink/60">
          {lectures.length} lecture{lectures.length !== 1 ? 's' : ''}
        </p>
        <Button
          onClick={openCreate}
          className="bg-gradient-to-r from-violet to-electric text-white text-xs py-2"
        >
          <Plus size={14} /> Add Lecture
        </Button>
      </div>

      {/* Inline form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-violet/20 bg-violet/5 p-5 space-y-4"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-extrabold text-violet">
              {editingId ? 'Edit Lecture' : 'New Lecture'}
            </p>
            <button
              type="button"
              onClick={closeForm}
              className="text-ink/40 hover:text-ink transition"
              aria-label="Close form"
            >
              <X size={16} />
            </button>
          </div>

          <label className="block">
            <span className="text-xs font-bold text-ink/60 mb-1 block">Title *</span>
            <input
              className="field w-full"
              type="text"
              required
              maxLength={160}
              placeholder="e.g. Introduction to the Course"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-ink/60 mb-1 block">Description</span>
            <textarea
              className="field w-full resize-y"
              rows={3}
              maxLength={4000}
              placeholder="What will learners cover in this lecture?"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-bold text-ink/60 mb-1 block">Duration (minutes)</span>
              <input
                className="field w-full"
                type="number"
                min="0"
                max="600"
                value={form.durationMinutes}
                onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))}
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-ink/60 mb-1 block">Scheduled At</span>
              <input
                className="field w-full"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
              />
            </label>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="submit"
              disabled={busy || !form.title.trim()}
              className="bg-gradient-to-r from-violet to-electric text-white text-xs py-2"
            >
              {busy ? (
                <><Loader2 size={14} className="animate-spin" /> Saving...</>
              ) : (
                <><Check size={14} /> {editingId ? 'Save Changes' : 'Add Lecture'}</>
              )}
            </Button>
            <Button
              type="button"
              onClick={closeForm}
              className="bg-ink/5 text-ink hover:bg-ink/10 text-xs py-2"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Lecture list */}
      {lectures.length === 0 && !showForm && (
        <div className="rounded-3xl bg-white p-12 text-center text-ink/40 shadow-card border border-ink/5">
          <BookOpen size={32} className="mx-auto mb-3" />
          <p className="font-bold">No lectures yet</p>
          <p className="mt-1 text-xs">Click "Add Lecture" to create your first lecture.</p>
        </div>
      )}

      {lectures.map((lecture) => (
        <div
          key={lecture.id}
          className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card border border-ink/5 group"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet/10 text-xs font-extrabold text-violet">
            {lecture.order}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{lecture.title}</p>
            <p className="text-xs text-ink/40">
              {lecture.duration}
              {lecture.scheduledAt && (
                <> · {new Date(lecture.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</>
              )}
            </p>
          </div>

          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold flex items-center gap-1.5 ${
            lecture.status === 'completed'
              ? 'bg-emerald-100 text-emerald-700'
              : lecture.status === 'live' || lecture.status === 'in-progress'
              ? 'bg-rose-100 text-rose-700 animate-pulse'
              : 'bg-ink/5 text-ink/60'
          }`}>
            {(lecture.status === 'live' || lecture.status === 'in-progress') && (
              <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
            )}
            {lecture.status === 'in-progress' ? 'LIVE NOW' : lecture.status === 'live' ? 'LIVE NOW' : lecture.status}
          </span>

          {/* Action Buttons for Instructor */}
          <div className="flex items-center gap-2">
            {(lecture.status === 'live' || lecture.status === 'in-progress') ? (
              <>
                <Button
                  type="button"
                  onClick={() => handleJoinLecture(lecture)}
                  className="bg-gradient-to-r from-rose-500 to-red-600 text-white text-xs py-1.5 px-3 font-bold shadow-sm hover:shadow-glow flex items-center gap-1.5"
                >
                  <Radio size={13} className="animate-pulse" /> Join Live Room
                </Button>
                <Button
                  type="button"
                  onClick={() => handleEndLecture(lecture)}
                  className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs py-1.5 px-3 font-bold flex items-center gap-1.5"
                  title="Conclude and mark lecture complete"
                >
                  <CheckCircle2 size={13} /> Mark Done
                </Button>
              </>
            ) : lecture.status === 'completed' ? (
              <Button
                type="button"
                onClick={() => handleJoinLecture(lecture)}
                className="bg-ink/5 text-ink hover:bg-ink/10 text-xs py-1.5 px-3 font-semibold flex items-center gap-1.5"
              >
                <Video size={13} /> Join Room
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={() => handleStartLecture(lecture)}
                  disabled={startingId === lecture.id}
                  className="bg-gradient-to-r from-violet to-electric text-white text-xs py-1.5 px-3 font-bold hover:shadow-glow transition flex items-center gap-1.5"
                >
                  {startingId === lecture.id ? (
                    <><Loader2 size={13} className="animate-spin" /> Starting...</>
                  ) : (
                    <><Play size={12} className="fill-white" /> Start Lecture</>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => handleJoinLecture(lecture)}
                  className="bg-ink/5 text-ink/70 hover:bg-ink/10 text-xs py-1.5 px-2.5 font-semibold flex items-center gap-1"
                  title="Join room directly"
                >
                  <Video size={13} /> Join
                </Button>
              </>
            )}

            <button
              type="button"
              onClick={() => openEdit(lecture)}
              className="rounded-lg p-1.5 text-ink/40 hover:bg-violet/10 hover:text-violet transition ml-1"
              aria-label="Edit lecture"
              title="Edit lecture"
            >
              <Edit3 size={15} />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(lecture)}
              disabled={deletingId === lecture.id}
              className="rounded-lg p-1.5 text-ink/40 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-50"
              aria-label="Delete lecture"
              title="Delete lecture"
            >
              {deletingId === lecture.id ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Trash2 size={15} />
              )}
            </button>
          </div>
        </div>
      ))}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
