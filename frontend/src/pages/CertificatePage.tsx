/* ═══════════════════════════════════════════════════════════
   Certificate Page — Hub showing all certificates & requests
   ═══════════════════════════════════════════════════════════ */
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen, Compass, GraduationCap, Home, MessageCircle, ArrowRightLeft,
  Settings, Award, ChevronRight, CheckCircle2, Clock, Circle,
  ExternalLink, Search,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, Button } from '../components/ui/Primitives';
import { StatusBadge } from '../components/ui/StatusBadge';
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

export default function CertificatePage() {
  const nav = useNavigate();
  const store = useLearningStore();
  const { toasts, show, dismiss } = useToast();

  const myCertificates = store.getMyCertificates();
  const myRequests = store.getCertificateRequests({ learnerId: store.currentUserId });

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
              <div className="flex items-end justify-between">
                <div>
                  <p className="eyebrow">Achievements</p>
                  <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">My Certificates</h1>
                  <p className="mt-1 text-sm text-ink/50">Your earned certificates and pending requests</p>
                </div>
                <Button
                  onClick={() => nav('/certificates/verify')}
                  className="bg-white text-ink ring-1 ring-ink/10 hover:bg-violet/5 hover:text-violet text-xs"
                >
                  <Search size={14} /> Verify Certificate
                </Button>
              </div>
            </motion.div>

            {/* Generated Certificates */}
            {myCertificates.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-bold mb-3">🎓 Earned Certificates</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {myCertificates.map((cert, i) => (
                    <motion.div
                      key={cert.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="rounded-3xl bg-gradient-to-br from-violet/5 via-white to-electric/5 p-6 shadow-card border border-violet/10 hover-lift cursor-pointer"
                      onClick={() => nav(`/certificates/${cert.certificateId}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-display text-lg font-bold text-ink">{cert.courseName}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-ink/50">
                            <Avatar name={cert.teacherName} size="sm" />
                            <span>Taught by <b className="text-ink/70">{cert.teacherName}</b></span>
                          </div>
                        </div>
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet to-electric text-white">
                          <Award size={20} />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Passed ({cert.examScore}%)
                        </span>
                        <span className="text-ink/40">ID: {cert.certificateId}</span>
                        <span className="text-ink/40">Issued: {cert.issuedAt}</span>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Button className="bg-violet/10 text-violet hover:bg-violet hover:text-white text-xs py-1.5">
                          View Certificate <ExternalLink size={12} />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Pending Requests */}
            {myRequests.filter(r => r.status !== 'generated').length > 0 && (
              <section>
                <h2 className="font-display text-xl font-bold mb-3">⏳ Pending Requests</h2>
                <div className="space-y-3">
                  {myRequests.filter(r => r.status !== 'generated').map((req, i) => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-2xl bg-white p-5 shadow-card border border-ink/5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-ink">{req.courseName}</p>
                          <p className="text-xs text-ink/40">Teacher: {req.teacherName} · Exam: {req.examScore}%</p>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>

                      {/* Progress Tracker */}
                      <div className="mt-4 flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle2 size={12} /> Lectures
                        </span>
                        <ChevronRight size={10} className="text-ink/20" />
                        <span className="flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle2 size={12} /> Exam
                        </span>
                        <ChevronRight size={10} className="text-ink/20" />
                        <span className={`flex items-center gap-1 font-bold ${req.tutorApproval === 'approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {req.tutorApproval === 'approved' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          Tutor
                        </span>
                        <ChevronRight size={10} className="text-ink/20" />
                        <span className={`flex items-center gap-1 font-bold ${req.adminApproval === 'approved' ? 'text-emerald-600' : 'text-ink/30'}`}>
                          {req.adminApproval === 'approved' ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                          Admin
                        </span>
                        <ChevronRight size={10} className="text-ink/20" />
                        <span className="flex items-center gap-1 font-bold text-ink/30">
                          <Circle size={12} /> Generate
                        </span>
                      </div>

                      {/* Generate button when ready */}
                      {req.status === 'admin-approved' && (
                        <div className="mt-4">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              store.generateCertificate(req.id);
                              show('Certificate generated! 🎓', 'success');
                            }}
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs"
                          >
                            🎓 Generate Certificate
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {myCertificates.length === 0 && myRequests.length === 0 && (
              <EmptyState
                icon={<Award size={48} />}
                title="No certificates yet"
                description="Complete courses, pass exams, and earn certificates to showcase your skills!"
                actionLabel="Browse Courses"
                onAction={() => nav('/learning')}
              />
            )}
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </main>
  );
}
