import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Check, Coins, Loader2, RefreshCw, User, XCircle } from 'lucide-react';
import { api } from '../utils/api';
import { Button } from './ui/Primitives';

interface PendingCourse {
  id: string;
  title: string;
  skill_name: string;
  description: string;
  credit_cost: number;
  category: string;
  status: string;
  created_at: string;
  teacher: { id: string; full_name: string; username: string } | null;
}

const categoryIcon: Record<string, string> = {
  design: '🎨', photography: '📷', languages: '🗣️', business: '💼',
  development: '💻', communication: '🗣', life_skills: '🌱', other: '📚',
};

export default function AdminCourseModeration() {
  const [courses, setCourses] = useState<PendingCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await api.adminListPendingCourses();
      setCourses(data);
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to load pending courses', ok: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const decide = async (course: PendingCourse, decision: 'approved' | 'rejected') => {
    setActionBusy(course.id);
    setMessage(null);
    try {
      await api.adminModerateCourse(course.id, decision);
      setCourses(prev => prev.filter(c => c.id !== course.id));
      setMessage({
        text: decision === 'approved'
          ? `"${course.title}" approved and published.`
          : `"${course.title}" rejected.`,
        ok: decision === 'approved',
      });
    } catch (err: any) {
      setMessage({ text: err.message || 'Action failed', ok: false });
    } finally {
      setActionBusy(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin workspace / courses</p>
          <h2 className="mt-2 font-display text-4xl sm:text-5xl">Course Moderation</h2>
          <p className="mt-2 text-sm text-ink/55">
            Review courses submitted by teachers. Approved courses appear in the public catalog.
          </p>
        </div>
        <Button
          onClick={fetchPending}
          className="bg-white text-ink ring-1 ring-ink/10 hover:bg-violet hover:text-white"
        >
          <RefreshCw size={16} /> Refresh
        </Button>
      </div>

      {/* Feedback message */}
      {message && (
        <div className={`mb-6 rounded-2xl border p-4 text-sm font-semibold ${
          message.ok
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {message.text}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-ink/50">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm font-medium">Loading pending courses…</span>
        </div>
      )}

      {!loading && courses.length === 0 && !message?.text && (
        <div className="rounded-3xl bg-white p-16 text-center text-ink/40 shadow-card border border-ink/5">
          <BookOpen size={36} className="mx-auto mb-4" />
          <p className="font-bold text-lg">No courses pending review</p>
          <p className="mt-2 text-sm">All caught up — check back later.</p>
        </div>
      )}

      <div className="space-y-4">
        {courses.map(course => (
          <div key={course.id} className="rounded-3xl bg-white border border-ink/5 shadow-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="text-3xl shrink-0">{categoryIcon[course.category] || '📚'}</span>
                <div>
                  <h3 className="font-display text-xl font-bold">{course.title}</h3>
                  <p className="mt-0.5 text-sm font-semibold text-violet">{course.skill_name}</p>
                  {course.description && (
                    <p className="mt-2 text-sm text-ink/60 max-w-xl line-clamp-3">{course.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-ink/40 font-medium">
                    <span className="flex items-center gap-1">
                      <User size={12} /> {course.teacher?.full_name || 'Unknown Teacher'}
                      {course.teacher?.username && (
                        <span className="text-ink/30">@{course.teacher.username}</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Coins size={12} /> {course.credit_cost ?? 25} credits
                    </span>
                    <span>
                      Submitted {new Date(course.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Moderation actions */}
              <div className="flex gap-3 shrink-0">
                <Button
                  onClick={() => decide(course, 'rejected')}
                  disabled={actionBusy === course.id}
                  className="bg-white text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50 text-sm"
                >
                  {actionBusy === course.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <XCircle size={16} />
                  )}
                  Reject
                </Button>
                <Button
                  onClick={() => decide(course, 'approved')}
                  disabled={actionBusy === course.id}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 text-sm"
                >
                  {actionBusy === course.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  Approve & Publish
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
