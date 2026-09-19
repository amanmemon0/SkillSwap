/* ═══════════════════════════════════════════════════════════
   My Learning — Hub page showing all courses the user is learning
   ═══════════════════════════════════════════════════════════ */
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen, Compass, GraduationCap, Home, MessageCircle, ArrowRightLeft,
  Settings, Award, ChevronRight, User,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, Button, SkillTag } from '../components/ui/Primitives';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
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

export default function MyLearning() {
  const nav = useNavigate();
  const store = useLearningStore();
  const myEnrollments = store.getMyLearning();

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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <p className="eyebrow">Learner</p>
              <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">My Learning</h1>
              <p className="mt-1 text-sm text-ink/50">Courses you're taking from other SkillSwap users</p>
            </motion.div>

            {myEnrollments.length === 0 ? (
              <EmptyState
                icon={<BookOpen size={48} />}
                title="No courses yet"
                description="Explore skills offered by other SkillSwap users and start learning something new!"
                actionLabel="Explore Skills"
                onAction={() => nav('/explore')}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {myEnrollments.map((enrollment, i) => {
                  const course = store.courses.find(c => c.id === enrollment.courseId);
                  if (!course) return null;
                  const nextLecture = store.getCourseLectures(course.id).find(l => l.status !== 'completed');
                  return (
                    <motion.div
                      key={enrollment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="rounded-3xl bg-white p-6 shadow-card border border-ink/5 hover-lift cursor-pointer"
                      onClick={() => nav(`/learning/${course.id}`)}
                    >
                      {/* Course Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet/10 to-electric/10 text-2xl">
                            {course.icon}
                          </span>
                          <div>
                            <h3 className="font-display text-lg font-bold text-ink">{course.skillName}</h3>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-ink/50">
                              <Avatar name={course.teacherName} size="sm" />
                              <span>Learning from <b className="text-ink/70">{course.teacherName}</b></span>
                            </div>
                          </div>
                        </div>
                        <SkillTag skill={course.category === 'tech' ? 'React' : course.category === 'photo' ? 'Photography' : course.skillName} />
                      </div>

                      {/* Progress */}
                      <div className="mt-5">
                        <ProgressBar value={enrollment.lecturesCompleted} max={course.totalLectures} />
                      </div>

                      {/* Next Lecture */}
                      {nextLecture && (
                        <div className="mt-4 rounded-xl bg-surface p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Next Lecture</p>
                          <p className="mt-1 text-sm font-bold text-ink">{nextLecture.title}</p>
                        </div>
                      )}

                      {/* Status Row */}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-ink/50">
                          <BookOpen size={12} />
                          <span>{enrollment.lecturesCompleted}/{course.totalLectures} lectures</span>
                        </div>
                        <StatusBadge status={enrollment.examStatus} />
                        {enrollment.certificateStatus !== 'locked' && (
                          <StatusBadge status={enrollment.certificateStatus} />
                        )}
                      </div>

                      {/* CTA */}
                      <div className="mt-4 flex justify-end">
                        <Button className="bg-violet/10 text-violet hover:bg-violet hover:text-white text-xs py-1.5">
                          Continue Learning <ChevronRight size={14} />
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
    </main>
  );
}
