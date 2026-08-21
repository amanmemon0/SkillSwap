/* ═══════════════════════════════════════════════════════════
   Certificate View — Beautiful certificate display
   ═══════════════════════════════════════════════════════════ */
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Download, Printer, Award, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Primitives';
import Navbar from '../components/Navbar';
import { useLearningStore } from '../data/learningMockData';

export default function CertificateView() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const nav = useNavigate();
  const store = useLearningStore();

  const cert = store.verifyCertificate(certificateId || '');

  if (!cert) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar variant="auth" />
        <div className="flex flex-col items-center justify-center py-32">
          <Award size={48} className="text-ink/15 mb-4" />
          <p className="font-display text-xl font-bold text-ink">Certificate not found</p>
          <p className="mt-1 text-sm text-ink/50">The certificate ID "{certificateId}" doesn't match any records.</p>
          <Button onClick={() => nav('/certificates')} className="mt-6 bg-violet/10 text-violet">
            Back to Certificates
          </Button>
        </div>
      </main>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-surface">
      <Navbar variant="auth" />
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <button
          onClick={() => nav('/certificates')}
          className="mb-6 flex items-center gap-2 text-sm font-bold text-ink/50 hover:text-violet transition print:hidden"
        >
          <ArrowLeft size={16} /> Back to Certificates
        </button>

        {/* Actions */}
        <div className="mb-6 flex justify-end gap-3 print:hidden">
          <Button onClick={handlePrint} className="bg-white text-ink ring-1 ring-ink/10 hover:bg-surface text-sm">
            <Printer size={16} /> Print
          </Button>
          <Button onClick={handlePrint} className="bg-gradient-to-r from-violet to-electric text-white hover:shadow-glow text-sm">
            <Download size={16} /> Download
          </Button>
        </div>

        {/* Certificate */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-3xl bg-white shadow-float"
        >
          {/* Decorative Border */}
          <div className="absolute inset-0 rounded-3xl border-[6px] border-transparent bg-gradient-to-br from-violet via-electric to-cyan bg-clip-border" style={{ WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', padding: '6px' }} />

          {/* Certificate Content */}
          <div className="relative p-8 sm:p-14 text-center">
            {/* Logo & Header */}
            <div className="flex items-center justify-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet to-electric text-white">
                <Sparkles size={18} />
              </span>
              <span className="font-display text-xl font-extrabold text-ink">SkillSwap</span>
            </div>

            <div className="mt-8">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[.3em] text-violet">Certificate of Completion</p>
            </div>

            {/* Decorative Line */}
            <div className="mt-6 mx-auto h-px w-48 bg-gradient-to-r from-transparent via-violet/30 to-transparent" />

            <p className="mt-8 text-sm text-ink/50">This certifies that</p>

            {/* Learner Name */}
            <h1 className="mt-3 font-display text-4xl font-bold text-ink sm:text-5xl">
              {cert.learnerName}
            </h1>

            <p className="mt-6 text-sm text-ink/50">has successfully completed the course</p>

            {/* Course Name */}
            <h2 className="mt-3 font-display text-2xl font-bold gradient-text sm:text-3xl">
              {cert.courseName}
            </h2>

            <p className="mt-6 text-sm text-ink/50">taught by</p>

            {/* Teacher Name */}
            <p className="mt-2 text-lg font-bold text-ink">{cert.teacherName}</p>

            {/* Decorative Line */}
            <div className="mt-8 mx-auto h-px w-48 bg-gradient-to-r from-transparent via-violet/30 to-transparent" />

            {/* Details Grid */}
            <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4 max-w-xl mx-auto">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink/35">Completed</p>
                <p className="mt-1 text-sm font-bold text-ink">{new Date(cert.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink/35">Issued</p>
                <p className="mt-1 text-sm font-bold text-ink">{new Date(cert.issuedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink/35">Exam Score</p>
                <p className="mt-1 text-sm font-bold text-emerald-600">{cert.examScore}%</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink/35">Certificate ID</p>
                <p className="mt-1 text-sm font-bold font-mono text-violet">{cert.certificateId}</p>
              </div>
            </div>

            {/* Approval Badges */}
            <div className="mt-8 flex items-center justify-center gap-6">
              <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                <CheckCircle2 size={16} />
                Teacher Approved
              </div>
              <div className="h-5 w-px bg-ink/10" />
              <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                <CheckCircle2 size={16} />
                Admin Approved
              </div>
            </div>

            {/* Decorative Bottom */}
            <div className="mt-10 flex items-center justify-center gap-2 text-xs text-ink/30">
              <span>Verify at skillswap.city/certificates/verify</span>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
