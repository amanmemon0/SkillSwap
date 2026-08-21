import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Compass,
  Gift,
  GraduationCap,
  Home,
  Layers,
  MapPin,
  MessageCircle,
  Search,
  Settings,
  Sparkles,
  Star,
  Users,
  User,
  ArrowRightLeft,
  Award,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../utils/api';
import { Avatar, Button, ExchangeVis, MatchScore, SkillTag, StatCard, StatusDot } from '../components/ui/Primitives';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StatusBadge } from '../components/ui/StatusBadge';
import LiveFeed from '../components/LiveFeed';
import Navbar from '../components/Navbar';
import { useLearningStore, mockCourses, CURRENT_USER_ID } from '../data/learningMockData';

const nearby = [
  { name: 'Meera Iyer', skill: 'Conversational Spanish', distance: '0.8 km away', category: 'Language', online: true, match: 92 },
  { name: 'Rohan Kapoor', skill: 'Street Photography', distance: '1.3 km away', category: 'Creative', online: true, match: 87 },
  { name: 'Tara Singh', skill: 'Excel for Business', distance: '2.1 km away', category: 'Business', online: false, match: 78 },
];

const currentExchanges = [
  { id: '1', partner: 'Meera Iyer', teach: 'React Basics', learn: 'Spanish', status: 'Scheduled', progress: 60 },
  { id: '2', partner: 'Rohan Kapoor', teach: 'UI/UX Design', learn: 'Photography', status: 'Requested', progress: 20 },
];

const sideLinks = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/learning', icon: BookOpen, label: 'My Learning' },
  { to: '/teaching', icon: GraduationCap, label: 'My Teaching' },
  { to: '/profile', icon: User, label: 'My Profile' },
  { to: '/explore', icon: Compass, label: 'Find Matches' },
  { to: '/exchanges', icon: ArrowRightLeft, label: 'My Exchanges' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/certificates', icon: Award, label: 'Certificates' },
  { to: '/community', icon: Users, label: 'Community' },
];

export default function UserDashboard() {
  const nav = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string; location: string; email: string } | null>(null);
  const store = useLearningStore();
  const myLearning = store.getMyLearning(CURRENT_USER_ID).slice(0, 2);
  const myTeaching = store.getMyTeachingCourses(CURRENT_USER_ID).slice(0, 2);

  useEffect(() => {
    const getProfile = async () => {
      try {
        const user = await api.getMe();
        setProfile({
          full_name: user.name,
          location: user.location,
          email: user.email,
        });
      } catch (err) {
        console.error('Failed to get dashboard profile:', err);
      }
    };
    getProfile();
  }, []);

  const displayName = profile?.full_name || 'Member';
  const displayLocation = profile?.location || 'Nearby';
  const firstName = displayName.split(' ')[0];

  // Get greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <main className="min-h-screen bg-surface">
      <Navbar variant="auth" />

      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-1">
              {sideLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-violet/10 text-violet'
                        : 'text-ink/50 hover:bg-surface hover:text-ink'
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
            {/* Welcome Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-violet/90 to-electric p-7 text-white sm:p-10"
            >
              <div className="absolute -right-12 -top-20 h-72 w-72 rounded-full bg-electric/20 blur-3xl" />
              <div className="absolute -left-12 -bottom-20 h-60 w-60 rounded-full bg-violet/30 blur-3xl" />
              <div className="relative">
                <p className="eyebrow text-cyan">{greeting}</p>
                <h1 className="mt-3 max-w-xl font-display text-3xl font-bold leading-tight sm:text-4xl">
                  {greeting}, {firstName} 👋
                </h1>
                <p className="mt-2 text-white/60">Ready to learn something new?</p>
                <div className="mt-7 flex max-w-lg items-center gap-3 rounded-2xl bg-white p-2 pl-4 text-ink">
                  <Search size={17} className="text-ink/30" />
                  <input
                    className="min-w-0 flex-1 border-0 text-sm outline-none"
                    placeholder="Try 'pottery', 'French' or 'public speaking'"
                  />
                  <Link to="/explore">
                    <Button className="bg-gradient-to-r from-violet to-electric text-white">Explore</Button>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Stats Row */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Skills Offered"
                value={3}
                icon={<Layers size={18} className="text-violet" />}
              />
              <StatCard
                label="Skills Wanted"
                value={5}
                icon={<BookOpen size={18} className="text-electric" />}
              />
              <StatCard
                label="Active Exchanges"
                value={2}
                icon={<ArrowRightLeft size={18} className="text-white" />}
                accent
              />
              <StatCard
                label="Completed"
                value={12}
                icon={<Gift size={18} className="text-emerald-500" />}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
              {/* Current Exchanges */}
              <section>
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="eyebrow">Active</p>
                    <h2 className="mt-1 font-display text-2xl font-bold">Current Exchanges</h2>
                  </div>
                  <Link to="/exchanges" className="text-sm font-bold text-violet hover:text-ink transition">
                    View all →
                  </Link>
                </div>

                <div className="space-y-3">
                  {currentExchanges.map((exchange) => (
                    <div
                      key={exchange.id}
                      className="rounded-3xl bg-white p-5 shadow-card border border-ink/5 hover-lift"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={exchange.partner} showStatus status="online" />
                          <div>
                            <p className="font-bold text-sm">{exchange.partner}</p>
                            <ExchangeVis yourSkill={exchange.teach} theirSkill={exchange.learn} compact />
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            exchange.status === 'Scheduled'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {exchange.status}
                        </span>
                      </div>

                      {/* Progress */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex gap-1">
                            {['Requested', 'Accepted', 'Scheduled', 'Completed'].map((step, i) => {
                              const progress = exchange.progress;
                              const stepPercent = (i + 1) * 25;
                              const isActive = progress >= stepPercent;
                              const isCurrent = progress >= stepPercent - 25 && progress < stepPercent;
                              return (
                                <span
                                  key={step}
                                  className={`text-[9px] font-bold uppercase tracking-wider ${
                                    isActive ? 'text-violet' : isCurrent ? 'text-electric' : 'text-ink/25'
                                  }`}
                                >
                                  {step}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-ink/5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet to-electric transition-all duration-500"
                            style={{ width: `${exchange.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <Link to="/exchanges">
                          <Button className="bg-violet/10 text-violet hover:bg-violet hover:text-white text-xs py-1.5">
                            View Exchange
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Recommended Matches */}
                <div className="rounded-3xl bg-white p-5 shadow-card border border-ink/5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="eyebrow">Suggested</p>
                      <h3 className="mt-1 font-display text-lg font-bold">Recommended Matches</h3>
                    </div>
                    <Link to="/explore" className="text-xs font-bold text-violet">See more</Link>
                  </div>

                  <div className="space-y-3">
                    {nearby.map((person) => (
                      <div
                        key={person.name}
                        className="flex items-center gap-3 rounded-2xl bg-surface p-3 transition hover:bg-violet/5"
                      >
                        <Avatar name={person.name} showStatus status={person.online ? 'online' : 'offline'} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{person.name}</p>
                          <p className="text-xs text-ink/50">{person.skill}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-ink/35">
                            <MapPin size={10} /> {person.distance}
                          </p>
                        </div>
                        <MatchScore score={person.match} size={44} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Feed */}
                <LiveFeed compact />
              </div>
            </div>

            {/* My Learning Section */}
            <section>
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="eyebrow">Learning</p>
                  <h2 className="mt-1 font-display text-2xl font-bold">My Learning</h2>
                </div>
                <Link to="/learning" className="text-sm font-bold text-violet hover:text-ink transition">View all →</Link>
              </div>
              {myLearning.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {myLearning.map(enrollment => {
                    const course = mockCourses.find(c => c.id === enrollment.courseId);
                    if (!course) return null;
                    return (
                      <div
                        key={enrollment.id}
                        onClick={() => nav(`/learning/${course.id}`)}
                        className="rounded-3xl bg-white p-5 shadow-card border border-ink/5 hover-lift cursor-pointer"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet/10 to-electric/10 text-xl">{course.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{course.skillName}</p>
                            <p className="text-xs text-ink/40">from {course.teacherName}</p>
                          </div>
                          <StatusBadge status={enrollment.examStatus} />
                        </div>
                        <ProgressBar value={enrollment.lecturesCompleted} max={course.totalLectures} size="sm" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-3xl bg-white p-8 text-center text-ink/40 shadow-card border border-ink/5">
                  <BookOpen size={28} className="mx-auto mb-2" />
                  <p className="text-sm font-bold">No courses yet</p>
                  <Link to="/explore" className="mt-2 text-xs font-bold text-violet">Explore skills →</Link>
                </div>
              )}
            </section>

            {/* My Teaching Section */}
            <section>
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="eyebrow">Teaching</p>
                  <h2 className="mt-1 font-display text-2xl font-bold">My Teaching</h2>
                </div>
                <Link to="/teaching" className="text-sm font-bold text-violet hover:text-ink transition">View all →</Link>
              </div>
              {myTeaching.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {myTeaching.map(course => {
                    const enrollments = store.getCourseEnrollments(course.id);
                    return (
                      <div
                        key={course.id}
                        onClick={() => nav(`/teaching/${course.id}`)}
                        className="rounded-3xl bg-white p-5 shadow-card border border-ink/5 hover-lift cursor-pointer"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet to-electric text-xl text-white">{course.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{course.skillName}</p>
                            <p className="text-xs text-ink/40">You are teaching</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-ink/50">
                          <span className="flex items-center gap-1"><Users size={12} /> {enrollments.length} learners</span>
                          <span className="flex items-center gap-1"><BookOpen size={12} /> {course.totalLectures} lectures</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-3xl bg-white p-8 text-center text-ink/40 shadow-card border border-ink/5">
                  <GraduationCap size={28} className="mx-auto mb-2" />
                  <p className="text-sm font-bold">Not teaching yet</p>
                  <Link to="/profile" className="mt-2 text-xs font-bold text-violet">Create a course →</Link>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
