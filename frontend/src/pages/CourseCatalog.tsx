import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Coins, Loader2, Search, SlidersHorizontal, User } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { api } from '../utils/api';

interface Course {
  id: string;
  title: string;
  skill_name: string;
  description: string;
  credit_cost: number;
  category: string;
  status: string;
  teacher: { id: string; full_name: string; username: string } | null;
  created_at: string;
}

const CATEGORIES = ['all', 'development', 'languages', 'design', 'photography', 'business', 'communication', 'life_skills', 'other'];

const categoryLabel = (c: string) => c === 'all' ? 'All' : c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

const categoryIcon: Record<string, string> = {
  design: '🎨', photography: '📷', languages: '🗣️', business: '💼',
  development: '💻', communication: '🗣', life_skills: '🌱', other: '📚', all: '✨',
};

export default function CourseCatalog() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [enrollMsg, setEnrollMsg] = useState<{ id: string; msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    setLoading(true);
    api.listCourses()
      .then(data => setCourses(data))
      .catch(err => setError(err.message || 'Failed to load courses'))
      .finally(() => setLoading(false));

    // Pre-load enrolled courses to show correct button state
    api.getMyLearning().then(learning => {
      setEnrolledIds(new Set(learning.map((e: any) => e.course_id)));
    }).catch(() => {});
  }, []);

  const filtered = courses.filter(c => {
    const matchesSearch = !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.skill_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.teacher?.full_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || c.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleEnroll = async (course: Course) => {
    setEnrollingId(course.id);
    setEnrollMsg(null);
    try {
      await api.enrollCourse(course.id);
      setEnrolledIds(prev => new Set([...prev, course.id]));
      setEnrollMsg({ id: course.id, msg: 'Enrolled successfully!', ok: true });
    } catch (err: any) {
      const code = err.message?.toLowerCase();
      if (code?.includes('already_enrolled')) {
        setEnrolledIds(prev => new Set([...prev, course.id]));
        setEnrollMsg({ id: course.id, msg: 'Already enrolled', ok: true });
      } else {
        setEnrollMsg({ id: course.id, msg: err.message || 'Enrollment failed', ok: false });
      }
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar variant="auth" />

      {/* Hero */}
      <section className="bg-gradient-to-br from-ink via-violet/90 to-electric px-5 py-14 text-white text-center sm:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs font-extrabold uppercase tracking-widest text-cyan/80 mb-3">Course Catalog</p>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">
            Learn anything,<br />from real people.
          </h1>
          <p className="mt-4 text-white/60 max-w-xl mx-auto">
            Browse courses created by SkillSwap members. Enroll with your credits and start learning today.
          </p>

          {/* Search */}
          <div className="mt-8 relative max-w-lg mx-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search courses, skills, or teachers…"
              className="w-full rounded-2xl bg-white/10 border border-white/20 py-3.5 pl-11 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur"
            />
          </div>
        </motion.div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
                category === cat
                  ? 'bg-gradient-to-r from-violet to-electric text-white shadow-sm'
                  : 'bg-white border border-ink/10 text-ink/60 hover:border-violet/30 hover:text-violet'
              }`}
            >
              <span>{categoryIcon[cat]}</span>
              {categoryLabel(cat)}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-ink/50">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-medium">Loading courses…</span>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-100 p-6 text-center text-rose-700 text-sm font-semibold">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-3xl bg-white p-16 text-center text-ink/40 shadow-card border border-ink/5">
            <BookOpen size={36} className="mx-auto mb-4" />
            <p className="font-bold text-lg">No courses found</p>
            <p className="mt-2 text-sm">{search ? 'Try a different search term.' : 'No published courses yet.'}</p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course, i) => (
            <motion.article
              key={course.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-3xl bg-white border border-ink/5 shadow-card overflow-hidden flex flex-col hover:shadow-float transition-shadow"
            >
              {/* Category stripe */}
              <div className="h-1.5 bg-gradient-to-r from-violet to-electric" />

              <div className="flex flex-col flex-1 p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="text-3xl">{categoryIcon[course.category] || '📚'}</span>
                  <span className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2.5 py-1 text-xs font-extrabold text-amber-700 shrink-0">
                    <Coins size={11} /> {course.credit_cost ?? 25} credits
                  </span>
                </div>

                <h2 className="font-display text-lg font-bold text-ink leading-snug">{course.title}</h2>
                <p className="mt-1 text-xs font-semibold text-violet">{course.skill_name}</p>

                {course.description && (
                  <p className="mt-2 text-sm text-ink/55 line-clamp-2 flex-1">{course.description}</p>
                )}

                <div className="mt-4 flex items-center gap-2 text-xs text-ink/40 font-medium">
                  <User size={12} />
                  <span>{course.teacher?.full_name || 'SkillSwap Member'}</span>
                </div>

                {/* Enroll feedback */}
                {enrollMsg?.id === course.id && (
                  <p className={`mt-3 text-xs font-semibold ${enrollMsg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {enrollMsg.msg}
                  </p>
                )}

                <div className="mt-5 flex gap-2">
                  {enrolledIds.has(course.id) ? (
                    <Link
                      to={`/learning/${course.id}`}
                      className="flex-1 rounded-xl bg-emerald-500/10 border border-emerald-200 py-2.5 text-center text-xs font-extrabold text-emerald-700 hover:bg-emerald-500/20 transition"
                    >
                      ✓ Go to Course
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course)}
                      disabled={enrollingId === course.id}
                      className="flex-1 rounded-xl bg-gradient-to-r from-violet to-electric py-2.5 text-xs font-extrabold text-white hover:shadow-glow hover:scale-[1.02] transition disabled:opacity-70"
                    >
                      {enrollingId === course.id ? 'Enrolling…' : 'Enroll Now'}
                    </button>
                  )}
                  <Link
                    to={`/learning/${course.id}`}
                    className="rounded-xl border border-ink/10 px-3 py-2.5 text-xs font-bold text-ink/60 hover:border-violet/30 hover:text-violet transition"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </main>
  );
}
