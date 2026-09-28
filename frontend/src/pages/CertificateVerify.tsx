/* ═══════════════════════════════════════════════════════════
   Certificate Verify — Public verification page
   ═══════════════════════════════════════════════════════════ */
import { useState } from 'react';
import { Search, CheckCircle2, XCircle, Award, Sparkles, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Primitives';
import Navbar from '../components/Navbar';
import { useLearningStore } from '../data/learningMockData';
import type { Certificate } from '../data/skillswapTypes';

export default function CertificateVerify() {
  const store = useLearningStore();
  const [certId, setCertId] = useState('');
  const [result, setResult] = useState<Certificate | null | 'not-found' | 'idle'>('idle');

  const handleVerify = () => {
    if (!certId.trim()) return;
    const cert = store.verifyCertificate(certId.trim());
    setResult(cert || 'not-found');
  };

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="mx-auto max-w-xl px-5 py-12 sm:px-8">
        {/* <Link
          to="/"
          className="mb-6 flex items-center gap-2 text-sm font-bold text-ink/50 hover:text-violet transition"
        >
          <ArrowLeft size={16} /> Back to SkillSwap
        </Link> */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white p-8 shadow-card border border-ink/5 text-center"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet to-electric text-white">
              <Sparkles size={18} />
            </span>
            <span className="font-display text-xl font-extrabold text-ink">SkillSwap</span>
          </div>

          <h1 className="font-display text-3xl font-bold text-ink">Verify Certificate</h1>
          <p className="mt-2 text-sm text-ink/50">
            Enter a SkillSwap certificate ID to verify its authenticity
          </p>

          {/* Input */}
          <div className="mt-8 flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-3.5 text-ink/30" />
              <input
                value={certId}
                onChange={e => { setCertId(e.target.value); if (result !== 'idle') setResult('idle'); }}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                placeholder="e.g. SS-2026-000124"
                className="w-full rounded-xl border border-ink/10 bg-surface py-3 pl-10 pr-4 text-sm font-mono outline-none transition focus:border-violet focus:ring-2 focus:ring-violet/10"
              />
            </div>
            <Button
              onClick={handleVerify}
              className="bg-gradient-to-r from-violet to-electric text-white hover:shadow-glow shrink-0"
            >
              Verify
            </Button>
          </div>

          {/* Result */}
          <AnimatePresence mode="wait">
            {result !== 'idle' && (
              <motion.div
                key={result === 'not-found' ? 'notfound' : 'found'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-8"
              >
                {result === 'not-found' ? (
                  <div className="rounded-2xl bg-rose-50 p-6 text-center">
                    <XCircle size={32} className="mx-auto text-rose-500" />
                    <h3 className="mt-3 font-display text-xl font-bold text-rose-700">Not Found</h3>
                    <p className="mt-1 text-sm text-rose-600/70">
                      No certificate found with ID "{certId}". Please check and try again.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-emerald-50 p-6 text-left">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 size={28} className="text-emerald-500" />
                      <div>
                        <h3 className="font-display text-xl font-bold text-emerald-700">✓ Verified</h3>
                        <p className="text-xs text-emerald-600/70">This certificate is authentic and valid</p>
                      </div>
                    </div>

                    <div className="space-y-3 border-t border-emerald-200/50 pt-4">
                      <DetailRow label="Learner" value={(result as Certificate).learnerName} />
                      <DetailRow label="Course" value={(result as Certificate).courseName} />
                      <DetailRow label="Teacher" value={(result as Certificate).teacherName} />
                      <DetailRow label="Exam Score" value={`${(result as Certificate).examScore}%`} />
                      <DetailRow label="Completed" value={new Date((result as Certificate).completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
                      <DetailRow label="Issued" value={new Date((result as Certificate).issuedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
                      <DetailRow label="Certificate ID" value={(result as Certificate).certificateId} mono />
                      <DetailRow label="Status" value="Valid ✓" highlight />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hint */}
          <p className="mt-8 text-xs text-ink/30">
            Try: <button onClick={() => { setCertId('SS-2026-000124'); setResult('idle'); }} className="font-mono text-violet hover:underline">SS-2026-000124</button>
          </p>
        </motion.div>
      </div>
    </main>
  );
}

function DetailRow({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-emerald-700/50">{label}</span>
      <span className={`text-sm font-bold ${highlight ? 'text-emerald-600' : 'text-emerald-900'} ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}
