/* ═══════════════════════════════════════════════════════════
   My Teaching — Hub page showing courses the user teaches
   ═══════════════════════════════════════════════════════════ */
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  BookOpen, Compass, GraduationCap, Home, MessageCircle, ArrowRightLeft,
  Settings, Award, ChevronRight, User, FileText, Plus, X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, Button, SkillTag } from '../components/ui/Primitives';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast, ToastContainer } from '../components/ui/Toast';
import Navbar from '../components/Navbar';
import { useLearningStore } from '../data/learningMockData';

const sideLinks = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/learning', icon: BookOpen, label: 'My Learning' },
  { to: '/teaching', icon: GraduationCap, label: 'My Teaching' },
  { to: '/explore', icon: Compass, label: 'Find Matches' },
  { to: '/exchanges', icon: ArrowRightLeft, label: 'My Exchanges' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/certificates', icon: Award, label: 'Certificates' },
];

export default function MyTeaching() {
  const nav = useNavigate();
  const store = useLearningStore();
  const { toasts, show, dismiss } = useToast();
  const myCourses = store.getMyTeachingCourses();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', skillName: '', description: '', category: 'development' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.title || !newCourse.skillName) return;
    setIsSubmitting(true);
    try {
      await store.createCourse({ ...newCourse, status: 'published' });
      show('Course created successfully!', 'success');
      setShowCreateModal(false);
      setNewCourse({ title: '', skillName: '', description: '', category: 'development' });
    } catch (err: any) {
      show(err.message || 'Failed to create course', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface">
      <Navbar variant="auth" />
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-1">
              {sideLinks.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      isActive ? 'bg-violet/10 text-violet' : 'text-ink/50 hover:bg-surface hover:text-ink'
                    }`
                  }
                >
                  <link.icon size={18} />
                  {link.label}
                </NavLink>
              ))}
              <div className="border-t border-ink/5 pt-2 mt-2">
                <NavLink
                  to="/profile"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink/50 hover:bg-surface hover:text-ink transition"
                >
                  <Settings size={18} />
                  Settings
                </NavLink>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Teacher</p>
                <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">My Teaching</h1>
                <p className="mt-1 text-sm text-ink/50">Courses and skills you're teaching to other SkillSwap users</p>
              </div>
              <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-violet to-electric text-white whitespace-nowrap">
                <Plus size={18} /> Create Course
              </Button>
            </motion.div>

            {myCourses.length === 0 ? (
              <EmptyState
                icon={<GraduationCap size={48} />}
                title="Not teaching yet"
                description="Create a course to share your skills with the SkillSwap community!"
                actionLabel="Create Course"
                onAction={() => setShowCreateModal(true)}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {myCourses.map((course, i) => {
                  const enrollments = store.getCourseEnrollments(course.id);
                  const lectures = store.getCourseLectures(course.id);
                  const upcomingLectures = lectures.filter(l => l.status === 'upcoming').length;
                  const examRequests = enrollments.filter(e => e.examStatus === 'requested').length;
                  const certRequests = store.getCertificateRequests({ teacherId: store.currentUserId })
                    .filter(r => r.courseId === course.id && r.tutorApproval === 'pending').length;

                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="rounded-3xl bg-white p-6 shadow-card border border-ink/5 hover-lift cursor-pointer"
                      onClick={() => nav(`/teaching/${course.id}`)}
                    >
                      {/* Course Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet to-electric text-2xl text-white">
                            {course.icon}
                          </span>
                          <div>
                            <h3 className="font-display text-lg font-bold text-ink">{course.skillName}</h3>
                            <p className="text-xs text-ink/50">You are teaching</p>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="mt-5 grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-surface p-3 text-center">
                          <p className="text-xl font-extrabold text-ink">{enrollments.length}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Learners</p>
                        </div>
                        <div className="rounded-xl bg-surface p-3 text-center">
                          <p className="text-xl font-extrabold text-ink">{upcomingLectures}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Upcoming</p>
                        </div>
                        <div className="rounded-xl bg-surface p-3 text-center">
                          <p className="text-xl font-extrabold text-ink">{course.totalLectures}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Total Lec.</p>
                        </div>
                      </div>

                      {/* Pending Items */}
                      {(examRequests > 0 || certRequests > 0) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {examRequests > 0 && (
                            <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                              <FileText size={11} /> {examRequests} Exam Request{examRequests > 1 ? 's' : ''}
                            </span>
                          )}
                          {certRequests > 0 && (
                            <span className="flex items-center gap-1.5 rounded-full bg-violet/10 px-2.5 py-1 text-[10px] font-bold text-violet">
                              <Award size={11} /> {certRequests} Cert Request{certRequests > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      )}

                      {/* CTA */}
                      <div className="mt-4 flex justify-end">
                        <Button className="bg-violet/10 text-violet hover:bg-violet hover:text-white text-xs py-1.5">
                          Manage Course <ChevronRight size={14} />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-6 top-6 text-ink/40 hover:text-ink transition"
            >
              <X size={20} />
            </button>
            <h2 className="font-display text-2xl font-bold">Create New Course</h2>
            <p className="text-sm text-ink/50 mt-1 mb-6">Share your knowledge with others.</p>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/70">Course Title <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newCourse.title}
                  onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="e.g. Master React in 30 Days"
                  className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-3 text-sm focus:border-violet focus:outline-none focus:ring-1 focus:ring-violet"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/70">Skill Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newCourse.skillName}
                  onChange={e => setNewCourse({ ...newCourse, skillName: e.target.value })}
                  placeholder="e.g. ReactJS"
                  className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-3 text-sm focus:border-violet focus:outline-none focus:ring-1 focus:ring-violet"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/70">Category</label>
                <select
                  value={newCourse.category}
                  onChange={e => setNewCourse({ ...newCourse, category: e.target.value })}
                  className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-3 text-sm focus:border-violet focus:outline-none focus:ring-1 focus:ring-violet"
                >
                  <option value="development">Development</option>
                  <option value="design">Design</option>
                  <option value="languages">Languages</option>
                  <option value="photography">Photography</option>
                  <option value="business">Business</option>
                  <option value="communication">Communication</option>
                  <option value="life_skills">Life Skills</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/70">Description</label>
                <textarea
                  rows={3}
                  value={newCourse.description}
                  onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="What will students learn?"
                  className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-3 text-sm focus:border-violet focus:outline-none focus:ring-1 focus:ring-violet resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" onClick={() => setShowCreateModal(false)} className="bg-surface text-ink hover:bg-ink/5">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-violet to-electric text-white min-w-[120px]">
                  {isSubmitting ? 'Creating...' : 'Create Course'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </main>
  );
}
