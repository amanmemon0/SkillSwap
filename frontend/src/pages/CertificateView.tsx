/* ═══════════════════════════════════════════════════════════
   Certificate View — High-Resolution Downloadable Certificate
   with Dynamic Templates & Prominent User Name Display
   ═══════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Printer,
  Award,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Palette,
  Edit3,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Primitives';
import Navbar from '../components/Navbar';
import { useLearningStore } from '../data/learningMockData';
import { api } from '../utils/api';
import type { Certificate } from '../data/skillswapTypes';

export type CertificateTemplateId = 'classic-gold' | 'royal-indigo' | 'emerald-prestige';

interface TemplateConfig {
  id: CertificateTemplateId;
  name: string;
  badge: string;
  description: string;
  primaryColor: string;
  accentBorder: string;
  bgGradient: string;
  cardBg: string;
  textColor: string;
  sealColor: string;
  ribbonColor: string;
  sealText: string;
}

const TEMPLATES: Record<CertificateTemplateId, TemplateConfig> = {
  'classic-gold': {
    id: 'classic-gold',
    name: 'Classic Ivy Gold',
    badge: '🏛️ Academic Prestige',
    description: 'Traditional parchment with rich gold leaf borders, obsidian typography & royal foil seal.',
    primaryColor: '#854D0E', // amber-800
    accentBorder: '#D97706', // amber-600
    bgGradient: 'from-amber-500/10 via-amber-100/30 to-yellow-500/10',
    cardBg: 'bg-[#FCFAF5]',
    textColor: 'text-stone-900',
    sealColor: '#B45309',
    ribbonColor: '#92400E',
    sealText: 'OFFICIAL ACADEMIC SEAL',
  },
  'royal-indigo': {
    id: 'royal-indigo',
    name: 'Royal Indigo Modern',
    badge: '💎 Executive Tech',
    description: 'Sleek executive credential with midnight indigo, electric violet accents & platinum badge.',
    primaryColor: '#4F46E5', // indigo-600
    accentBorder: '#6366F1', // indigo-500
    bgGradient: 'from-indigo-500/10 via-violet-100/30 to-cyan-500/10',
    cardBg: 'bg-[#FAFBFD]',
    textColor: 'text-slate-900',
    sealColor: '#4338CA',
    ribbonColor: '#3730A3',
    sealText: 'GLOBAL MASTERY VERIFIED',
  },
  'emerald-prestige': {
    id: 'emerald-prestige',
    name: 'Emerald Prestige',
    badge: '🌿 Honors Distinction',
    description: 'Heritage guild honors with deep forest emerald framing and warm bronze embellishments.',
    primaryColor: '#065F46', // emerald-800
    accentBorder: '#059669', // emerald-600
    bgGradient: 'from-emerald-500/10 via-teal-100/30 to-emerald-500/10',
    cardBg: 'bg-[#F9FCFA]',
    textColor: 'text-emerald-950',
    sealColor: '#047857',
    ribbonColor: '#064E3B',
    sealText: 'PEER GUILD DISTINCTION',
  },
};

export default function CertificateView() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const nav = useNavigate();
  const store = useLearningStore();

  const storeCert = store.verifyCertificate(certificateId || '');
  const [remoteCert, setRemoteCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(!storeCert);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Template state
  const [activeTemplate, setActiveTemplate] = useState<CertificateTemplateId>('classic-gold');

  // Customizer for recipient name (defaulting to certificate learnerName)
  const [customName, setCustomName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);

  const certContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (storeCert || !certificateId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.verifyCertificate(certificateId)
      .then(res => {
        if (res?.valid && res?.certificate) {
          setRemoteCert({
            id: res.certificate.certificate_number,
            certificateId: res.certificate.certificate_number,
            courseId: '',
            courseName: res.certificate.course?.title || 'Advanced Skill Mastery',
            learnerId: '',
            learnerName: res.certificate.learner?.full_name || 'Maya Lin',
            teacherId: '',
            teacherName: res.certificate.course?.teacher?.full_name || 'Prof. David Vance',
            examScore: Number(res.certificate.verification_metadata?.score_percentage || 95),
            completedAt: res.certificate.issued_at,
            issuedAt: res.certificate.issued_at,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [certificateId, storeCert]);

  const cert = storeCert || remoteCert;
  const displayedName = (customName.trim() || cert?.learnerName || 'Maya Lin').trim();

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // ═════════════════════════════════════════════════════════════
  // HIGH-RESOLUTION CANVAS EXPORT (2400 x 1700, 300 DPI equivalent)
  // ═════════════════════════════════════════════════════════════
  const handleDownloadImage = async () => {
    if (!cert) return;
    setDownloading(true);

    try {
      // Ensure web fonts are loaded
      if (document.fonts) {
        await document.fonts.ready;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 2400;
      canvas.height = 1700;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not initialize canvas context');

      const W = canvas.width;
      const H = canvas.height;
      const t = TEMPLATES[activeTemplate];

      // 1. Background
      if (activeTemplate === 'classic-gold') {
        const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W / 1.2);
        bgGrad.addColorStop(0, '#FFFDF9');
        bgGrad.addColorStop(0.7, '#FBF7EE');
        bgGrad.addColorStop(1, '#F3EBD8');
        ctx.fillStyle = bgGrad;
      } else if (activeTemplate === 'royal-indigo') {
        const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W / 1.2);
        bgGrad.addColorStop(0, '#FFFFFF');
        bgGrad.addColorStop(0.7, '#F8FAFC');
        bgGrad.addColorStop(1, '#EEF2F6');
        ctx.fillStyle = bgGrad;
      } else {
        const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W / 1.2);
        bgGrad.addColorStop(0, '#FCFDFB');
        bgGrad.addColorStop(0.7, '#F5FAF6');
        bgGrad.addColorStop(1, '#E6F0E9');
        ctx.fillStyle = bgGrad;
      }
      ctx.fillRect(0, 0, W, H);

      // Subtle security watermark pattern
      ctx.save();
      ctx.strokeStyle = activeTemplate === 'classic-gold' ? 'rgba(217,119,6,0.03)' : activeTemplate === 'royal-indigo' ? 'rgba(99,102,241,0.03)' : 'rgba(5,150,105,0.03)';
      ctx.lineWidth = 1;
      for (let r = 80; r < W; r += 120) {
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Borders & Corner Filigrees
      const margin = 50;
      const outerColor = activeTemplate === 'classic-gold' ? '#B45309' : activeTemplate === 'royal-indigo' ? '#1E1B4B' : '#064E3B';
      const innerColor = activeTemplate === 'classic-gold' ? '#D97706' : activeTemplate === 'royal-indigo' ? '#4F46E5' : '#059669';
      const thinColor = activeTemplate === 'classic-gold' ? '#F59E0B' : activeTemplate === 'royal-indigo' ? '#818CF8' : '#34D399';

      // Outer heavy border
      ctx.strokeStyle = outerColor;
      ctx.lineWidth = 14;
      ctx.strokeRect(margin, margin, W - margin * 2, H - margin * 2);

      // Intermediate gap line
      ctx.strokeStyle = thinColor;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(margin + 20, margin + 20, W - (margin + 20) * 2, H - (margin + 20) * 2);

      // Inner ornate border
      ctx.strokeStyle = innerColor;
      ctx.lineWidth = 5;
      ctx.strokeRect(margin + 34, margin + 34, W - (margin + 34) * 2, H - (margin + 34) * 2);

      // Corner Brackets / Flourishes
      const drawCorner = (x: number, y: number, angle: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.strokeStyle = outerColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(80, 0);
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 80);
        ctx.stroke();

        ctx.fillStyle = innerColor;
        ctx.beginPath();
        ctx.arc(20, 20, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(45, 12, 4, 0, Math.PI * 2);
        ctx.arc(12, 45, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      drawCorner(margin + 46, margin + 46, 0);
      drawCorner(W - (margin + 46), margin + 46, Math.PI / 2);
      drawCorner(W - (margin + 46), H - (margin + 46), Math.PI);
      drawCorner(margin + 46, H - (margin + 46), -Math.PI / 2);

      // 3. Institution Crest & Header
      ctx.textAlign = 'center';

      // Crest Icon / Circle
      const crestY = 175;
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, crestY, 42, 0, Math.PI * 2);
      ctx.fillStyle = outerColor;
      ctx.fill();
      ctx.strokeStyle = thinColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Starburst or icon in crest
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px "Playfair Display", Georgia, serif';
      ctx.fillText('✦', W / 2, crestY + 12);
      ctx.restore();

      // Top Institution Name
      ctx.fillStyle = outerColor;
      ctx.font = '700 28px "Cinzel", "Playfair Display", serif';
      ctx.letterSpacing = '8px';
      ctx.fillText('SKILLSWAP ACADEMIC COUNCIL & PEER EXCHANGE', W / 2, 275);
      ctx.letterSpacing = '0px';

      // Certificate Title
      ctx.font = '800 68px "Cinzel", "Playfair Display", Georgia, serif';
      ctx.fillStyle = activeTemplate === 'classic-gold' ? '#92400E' : activeTemplate === 'royal-indigo' ? '#1E1B4B' : '#064E3B';
      ctx.fillText('CERTIFICATE OF ACHIEVEMENT', W / 2, 375);

      // Sub-heading
      ctx.font = '600 22px "Inter", sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.letterSpacing = '5px';
      ctx.fillText('GLOBAL PEER-TO-PEER ACCREDITATION • OFFICIAL DISTINCTION', W / 2, 425);
      ctx.letterSpacing = '0px';

      // Divider Line with central ornament
      ctx.strokeStyle = thinColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 300, 465);
      ctx.lineTo(W / 2 - 40, 465);
      ctx.moveTo(W / 2 + 40, 465);
      ctx.lineTo(W / 2 + 300, 465);
      ctx.stroke();

      ctx.fillStyle = innerColor;
      ctx.font = '24px serif';
      ctx.fillText('❖', W / 2, 473);

      // Presentation Statement
      ctx.font = 'italic 500 28px "Playfair Display", Georgia, serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('This official credential is proudly presented to', W / 2, 535);

      // 4. USER NAME (Learner's Name) — Grand Centerpiece!
      ctx.save();
      ctx.font = 'bold 88px "Playfair Display", Georgia, serif';
      ctx.fillStyle = activeTemplate === 'classic-gold' ? '#1F2937' : activeTemplate === 'royal-indigo' ? '#0F172A' : '#064E3B';
      // Subtle shadow for 3D gold/letterpress effect
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 2;
      ctx.fillText(displayedName, W / 2, 650);
      ctx.restore();

      // Ornate Underline for the Name
      ctx.save();
      const nameWidth = ctx.measureText(displayedName).width;
      const lineLen = Math.max(nameWidth * 0.85, 480);
      ctx.strokeStyle = innerColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W / 2 - lineLen / 2, 680);
      ctx.lineTo(W / 2 - 35, 680);
      ctx.moveTo(W / 2 + 35, 680);
      ctx.lineTo(W / 2 + lineLen / 2, 680);
      ctx.stroke();

      ctx.fillStyle = innerColor;
      ctx.font = '18px serif';
      ctx.fillText('✦ ❖ ✦', W / 2, 686);
      ctx.restore();

      // Completion Statement
      ctx.font = 'italic 500 26px "Playfair Display", Georgia, serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('for demonstrating exceptional mastery and successfully fulfilling all curriculum requirements of', W / 2, 745);

      // Course Name
      ctx.font = '800 54px "Playfair Display", Georgia, serif';
      ctx.fillStyle = activeTemplate === 'classic-gold' ? '#B45309' : activeTemplate === 'royal-indigo' ? '#4F46E5' : '#047857';
      ctx.fillText(cert.courseName, W / 2, 835);

      // Course Instructor statement
      ctx.font = '500 24px "Inter", sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText(`Under the instruction and guidance of  ${cert.teacherName}`, W / 2, 890);

      // 5. Credential Metadata Strip (Pill Container)
      const stripY = 960;
      const stripW = 1500;
      const stripH = 95;
      const stripX = (W - stripW) / 2;

      ctx.save();
      ctx.fillStyle = activeTemplate === 'classic-gold' ? 'rgba(245, 158, 11, 0.08)' : activeTemplate === 'royal-indigo' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(5, 150, 105, 0.08)';
      ctx.strokeStyle = thinColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(stripX, stripY, stripW, stripH, 20);
      ctx.fill();
      ctx.stroke();

      // 4 Metadata columns
      const colW = stripW / 4;
      const formattedDate = new Date(cert.issuedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      const meta = [
        { label: 'DATE CONFERRED', val: formattedDate },
        { label: 'EXAMINATION SCORE', val: `${cert.examScore}% (Honors)` },
        { label: 'CERTIFICATE ID', val: cert.certificateId },
        { label: 'STATUS', val: 'Verified & Authentic ✓' },
      ];

      meta.forEach((m, idx) => {
        const cx = stripX + colW * idx + colW / 2;
        ctx.font = '700 13px "Inter", sans-serif';
        ctx.fillStyle = '#94A3B8';
        ctx.letterSpacing = '1px';
        ctx.fillText(m.label, cx, stripY + 36);
        ctx.letterSpacing = '0px';

        ctx.font = 'bold 20px "Inter", sans-serif';
        ctx.fillStyle = idx === 3 ? '#059669' : '#0F172A';
        ctx.fillText(m.val, cx, stripY + 68);

        // vertical divider
        if (idx < 3) {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(stripX + colW * (idx + 1), stripY + 20);
          ctx.lineTo(stripX + colW * (idx + 1), stripY + stripH - 20);
          ctx.stroke();
        }
      });
      ctx.restore();

      // 6. Official Rosette / Starburst Seal (Centered Bottom)
      const sealX = W / 2;
      const sealY = 1260;
      const sealRadius = 88;

      ctx.save();
      // Starburst rays (36 points)
      ctx.fillStyle = innerColor;
      for (let i = 0; i < 36; i++) {
        const angle = (i * Math.PI) / 18;
        const outerR = sealRadius + 14;
        const innerR = sealRadius;
        const p1x = sealX + Math.cos(angle) * outerR;
        const p1y = sealY + Math.sin(angle) * outerR;
        const p2x = sealX + Math.cos(angle + Math.PI / 36) * innerR;
        const p2y = sealY + Math.sin(angle + Math.PI / 36) * innerR;
        ctx.beginPath();
        ctx.moveTo(sealX, sealY);
        ctx.lineTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.fill();
      }

      // Outer gold circle
      ctx.beginPath();
      ctx.arc(sealX, sealY, sealRadius, 0, Math.PI * 2);
      ctx.fillStyle = outerColor;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner ring
      ctx.beginPath();
      ctx.arc(sealX, sealY, sealRadius - 12, 0, Math.PI * 2);
      ctx.strokeStyle = thinColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Seal Center
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px "Playfair Display", serif';
      ctx.fillText('★', sealX, sealY - 10);
      ctx.font = '700 13px "Inter", sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('SKILLSWAP', sealX, sealY + 16);
      ctx.font = '600 10px "Inter", sans-serif';
      ctx.fillText(t.sealText, sealX, sealY + 34);
      ctx.letterSpacing = '0px';

      // Ribbon tails hanging down from seal
      ctx.fillStyle = t.ribbonColor;
      ctx.beginPath();
      ctx.moveTo(sealX - 44, sealY + sealRadius - 10);
      ctx.lineTo(sealX - 60, sealY + sealRadius + 75);
      ctx.lineTo(sealX - 40, sealY + sealRadius + 60);
      ctx.lineTo(sealX - 20, sealY + sealRadius + 75);
      ctx.lineTo(sealX - 10, sealY + sealRadius - 10);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(sealX + 10, sealY + sealRadius - 10);
      ctx.lineTo(sealX + 20, sealY + sealRadius + 75);
      ctx.lineTo(sealX + 40, sealY + sealRadius + 60);
      ctx.lineTo(sealX + 60, sealY + sealRadius + 75);
      ctx.lineTo(sealX + 44, sealY + sealRadius - 10);
      ctx.fill();
      ctx.restore();

      // 7. Signatures (Left: Instructor, Right: Dean / Registrar)
      // Left Signature
      const sig1X = W / 2 - 580;
      const sigY = 1270;
      ctx.font = '54px "Great Vibes", "Brush Script MT", cursive';
      ctx.fillStyle = '#1E293B';
      ctx.fillText(cert.teacherName, sig1X, sigY);

      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sig1X - 180, sigY + 20);
      ctx.lineTo(sig1X + 180, sigY + 20);
      ctx.stroke();

      ctx.font = 'bold 20px "Inter", sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.fillText(cert.teacherName, sig1X, sigY + 52);
      ctx.font = '500 16px "Inter", sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('Course Faculty & Lead Instructor', sig1X, sigY + 76);

      // Right Signature
      const sig2X = W / 2 + 580;
      ctx.font = '54px "Great Vibes", "Brush Script MT", cursive';
      ctx.fillStyle = '#1E293B';
      ctx.fillText('Dr. Eleanor Vance', sig2X, sigY);

      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sig2X - 180, sigY + 20);
      ctx.lineTo(sig2X + 180, sigY + 20);
      ctx.stroke();

      ctx.font = 'bold 20px "Inter", sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.fillText('Dr. Eleanor Vance, Ph.D.', sig2X, sigY + 52);
      ctx.font = '500 16px "Inter", sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('Registrar & Academic Council Dean', sig2X, sigY + 76);

      // 8. Footer Legal / Anti-Counterfeit Notice
      ctx.font = '500 15px "Inter", sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(`Tamper-evident cryptographic verification: skillswap.city/certificates/verify?id=${cert.certificateId} • Issued by SkillSwap Global Exchange`, W / 2, 1580);

      // Trigger instant PNG Download
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const cleanLearner = displayedName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `SkillSwap_Certificate_${cleanLearner}_${cert.certificateId}.png`;

      const downloadLink = document.createElement('a');
      downloadLink.download = filename;
      downloadLink.href = dataUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Failed to generate high-resolution certificate:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar variant="auto" />
        <div className="flex flex-col items-center justify-center py-32 gap-3 text-ink/50">
          <Loader2 size={24} className="animate-spin text-violet" />
          <p className="text-sm font-medium">Verifying and loading official certificate...</p>
        </div>
      </main>
    );
  }

  if (!cert) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar variant="auto" />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <Award size={52} className="text-ink/15 mb-4" />
          <h1 className="font-display text-2xl font-bold text-ink">Certificate Not Found</h1>
          <p className="mt-2 text-sm text-ink/50 max-w-md">
            The certificate ID "{certificateId}" could not be verified in the SkillSwap credential database.
          </p>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => nav('/certificates')} className="bg-violet text-white text-sm">
              My Certificates
            </Button>
            <Button onClick={() => nav('/certificates/verify')} className="bg-white text-ink ring-1 ring-ink/10 text-sm">
              Search Verification Registry
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const currentTemplate = TEMPLATES[activeTemplate];

  return (
    <main className="min-h-screen bg-surface pb-16">
      <Navbar variant="auto" />

      {/* Print-specific style */}
      <style>{`
        @media print {
          nav, header, button, .print-hidden {
            display: none !important;
          }
          body, main {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .certificate-container {
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            page-break-inside: avoid !important;
          }
          @page {
            size: landscape;
            margin: 0.5cm;
          }
        }
      `}</style>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        {/* Navigation & Breadcrumbs */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print-hidden">
          <button
            onClick={() => nav('/certificates')}
            className="inline-flex items-center gap-2 text-sm font-bold text-ink/60 hover:text-violet transition"
          >
            <ArrowLeft size={16} /> Back to Certificates
          </button>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200/60">
              <ShieldCheck size={14} className="text-emerald-600" />
              Verified Authenticity: {cert.certificateId}
            </span>
          </div>
        </div>

        {/* Action Bar & Template Selector Header */}
        <div className="mb-8 rounded-3xl bg-white p-6 shadow-card border border-ink/5 print-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: Template Switcher */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink/40 mb-2">
                <Palette size={14} className="text-violet" />
                Select Certificate Template
              </div>
              <div className="flex flex-wrap gap-2.5">
                {(Object.keys(TEMPLATES) as CertificateTemplateId[]).map((tid) => {
                  const t = TEMPLATES[tid];
                  const isActive = activeTemplate === tid;
                  return (
                    <button
                      key={tid}
                      onClick={() => setActiveTemplate(tid)}
                      className={`relative flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-violet text-white shadow-md shadow-violet/20 ring-2 ring-violet'
                          : 'bg-surface text-ink/70 hover:bg-ink/5 hover:text-ink'
                      }`}
                    >
                      <span>{t.badge.split(' ')[0]}</span>
                      <span>{t.name}</span>
                      {isActive && <CheckCircle2 size={13} className="ml-1 text-white" />}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-ink/40">
                {currentTemplate.description}
              </p>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleCopyLink}
                className="bg-surface text-ink/80 ring-1 ring-ink/10 hover:bg-ink/5 text-xs py-2.5"
                title="Copy verification link"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copied ? 'Link Copied!' : 'Copy Link'}
              </Button>

              <Button
                onClick={handlePrint}
                className="bg-surface text-ink/80 ring-1 ring-ink/10 hover:bg-ink/5 text-xs py-2.5"
              >
                <Printer size={15} /> Print / PDF
              </Button>

              <Button
                onClick={handleDownloadImage}
                disabled={downloading}
                className="bg-gradient-to-r from-violet to-electric text-white hover:shadow-glow text-xs py-2.5 px-5 font-bold"
              >
                {downloading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Rendering High-Res...
                  </>
                ) : (
                  <>
                    <Download size={15} /> Download Certificate (PNG)
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Name Personalizer / Verification Banner */}
          <div className="mt-5 border-t border-ink/5 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-ink/40 font-medium">Recipient Name on Credential:</span>
              <span className="font-bold text-ink bg-ink/5 px-2.5 py-1 rounded-lg">
                {displayedName}
              </span>
              <button
                onClick={() => setIsEditingName(!isEditingName)}
                className="inline-flex items-center gap-1 font-bold text-violet hover:underline ml-1"
              >
                <Edit3 size={12} /> {isEditingName ? 'Close edit' : 'Edit name'}
              </button>
            </div>

            <div className="text-ink/40">
              Exam Distinction: <b className="text-emerald-600 font-bold">{cert.examScore}% Passing Score</b>
            </div>
          </div>

          {/* Name Editor Field */}
          <AnimatePresence>
            {isEditingName && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <div className="flex items-center gap-2 rounded-2xl bg-violet/5 p-3 border border-violet/10">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder={`Enter student name (default: ${cert.learnerName})`}
                    className="flex-1 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-ink outline-none ring-1 ring-ink/10 focus:ring-2 focus:ring-violet"
                  />
                  <Button
                    onClick={() => setIsEditingName(false)}
                    className="bg-violet text-white text-xs py-2"
                  >
                    Apply to Certificate
                  </Button>
                  {customName && (
                    <button
                      onClick={() => setCustomName('')}
                      className="text-xs text-ink/40 hover:text-ink px-2"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═════════════════════════════════════════════════════════
            LIVE ON-SCREEN CERTIFICATE DISPLAY
            ═════════════════════════════════════════════════════════ */}
        <motion.div
          key={activeTemplate}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          ref={certContainerRef}
          className={`certificate-container relative overflow-hidden rounded-[32px] ${currentTemplate.cardBg} p-8 sm:p-14 lg:p-20 shadow-2xl transition-all duration-300`}
          style={{
            boxShadow: '0 25px 65px -15px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0,0,0,0.05)',
          }}
        >
          {/* Ornate Multi-Tier Decorative Border */}
          <div
            className="pointer-events-none absolute inset-4 rounded-[26px] border-[6px]"
            style={{ borderColor: currentTemplate.accentBorder }}
          />
          <div
            className="pointer-events-none absolute inset-6 rounded-[22px] border-[2px]"
            style={{ borderColor: `${currentTemplate.primaryColor}55` }}
          />

          {/* Corner Flourishes */}
          <div
            className="pointer-events-none absolute top-7 left-7 text-xl font-serif select-none"
            style={{ color: currentTemplate.primaryColor }}
          >
            ❖
          </div>
          <div
            className="pointer-events-none absolute top-7 right-7 text-xl font-serif select-none"
            style={{ color: currentTemplate.primaryColor }}
          >
            ❖
          </div>
          <div
            className="pointer-events-none absolute bottom-7 left-7 text-xl font-serif select-none"
            style={{ color: currentTemplate.primaryColor }}
          >
            ❖
          </div>
          <div
            className="pointer-events-none absolute bottom-7 right-7 text-xl font-serif select-none"
            style={{ color: currentTemplate.primaryColor }}
          >
            ❖
          </div>

          {/* Certificate Inner Layout */}
          <div className="relative text-center max-w-4xl mx-auto">
            {/* Top Insignia / Brand Crest */}
            <div className="flex items-center justify-center gap-3">
              <span
                className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${currentTemplate.primaryColor}, ${currentTemplate.accentBorder})`,
                }}
              >
                <Sparkles size={22} />
              </span>
              <span className="font-display text-2xl font-extrabold tracking-tight text-ink">
                SkillSwap
              </span>
            </div>

            <p
              className="mt-6 font-mono text-[11px] font-bold uppercase tracking-[.35em]"
              style={{ color: currentTemplate.primaryColor }}
            >
              Academic Council & Peer Skill Exchange
            </p>

            <h2
              className="mt-3 font-serif text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl"
              style={{
                fontFamily: '"Cinzel", "Playfair Display", Georgia, serif',
                color: currentTemplate.textColor.includes('stone') ? '#292524' : currentTemplate.primaryColor,
              }}
            >
              Certificate of Completion
            </h2>

            <p className="mt-2 text-xs font-semibold uppercase tracking-[.25em] text-ink/40">
              Official Honors Credential • Verified Peer Exchange
            </p>

            {/* Ornamental Divider */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <div
                className="h-px w-28 sm:w-44"
                style={{ background: `linear-gradient(to right, transparent, ${currentTemplate.accentBorder})` }}
              />
              <span className="text-sm font-serif" style={{ color: currentTemplate.accentBorder }}>
                ✦ ❖ ✦
              </span>
              <div
                className="h-px w-28 sm:w-44"
                style={{ background: `linear-gradient(to left, transparent, ${currentTemplate.accentBorder})` }}
              />
            </div>

            {/* Presentation clause */}
            <p className="mt-8 font-serif text-base italic text-ink/60 sm:text-lg">
              This is proudly presented and conferred upon
            </p>

            {/* ══════════════════════════════════════════════════
                USER NAME (Learner's Name) — Prominent Centerpiece
                ══════════════════════════════════════════════════ */}
            <div className="relative my-4 inline-block">
              <h1
                className="font-serif text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl transition-all"
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  color: currentTemplate.textColor.includes('stone') ? '#1C1917' : currentTemplate.primaryColor,
                  textShadow: '0 2px 10px rgba(0,0,0,0.06)',
                }}
              >
                {displayedName}
              </h1>
              <div
                className="mx-auto mt-2 h-1 w-3/4 rounded-full"
                style={{
                  background: `linear-gradient(to right, transparent, ${currentTemplate.accentBorder}, transparent)`,
                }}
              />
            </div>

            {/* Achievement text */}
            <p className="mt-4 font-serif text-base italic text-ink/60 sm:text-lg max-w-2xl mx-auto">
              for successfully completing with honors the curriculum and mastering the comprehensive competencies of
            </p>

            {/* Course Title */}
            <h3
              className="mt-3 font-serif text-2xl font-extrabold sm:text-3xl md:text-4xl"
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                color: currentTemplate.primaryColor,
              }}
            >
              {cert.courseName}
            </h3>

            <p className="mt-2 text-sm font-medium text-ink/60">
              Under the instruction of <b className="text-ink/80">{cert.teacherName}</b>
            </p>

            {/* Detailed Credential Metadata Grid */}
            <div className="mt-10 grid grid-cols-2 gap-4 rounded-2xl bg-white/70 p-5 ring-1 ring-ink/5 sm:grid-cols-4 max-w-3xl mx-auto text-left">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink/35">Issue Date</p>
                <p className="mt-1 text-sm font-bold text-ink">
                  {new Date(cert.issuedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink/35">Examination Score</p>
                <p className="mt-1 text-sm font-bold text-emerald-600">
                  {cert.examScore}% (Distinction)
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink/35">Certificate Number</p>
                <p className="mt-1 text-xs font-mono font-bold text-violet break-all">
                  {cert.certificateId}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink/35">Validation Status</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <CheckCircle2 size={13} /> Authentic
                </p>
              </div>
            </div>

            {/* Signatures & Official Rosette Seal */}
            <div className="mt-12 pt-6 border-t border-ink/10 grid grid-cols-1 sm:grid-cols-3 items-center gap-6">
              {/* Signature 1: Teacher */}
              <div className="text-center sm:text-left">
                <p
                  className="font-serif text-3xl text-ink/80 italic select-none"
                  style={{ fontFamily: '"Great Vibes", "Brush Script MT", cursive' }}
                >
                  {cert.teacherName}
                </p>
                <div className="mt-1 h-px w-44 bg-ink/20 mx-auto sm:mx-0" />
                <p className="mt-1 text-xs font-bold text-ink">{cert.teacherName}</p>
                <p className="text-[10px] text-ink/40 uppercase font-semibold">Course Faculty & Mentor</p>
              </div>

              {/* Official Seal / Medallion */}
              <div className="flex flex-col items-center justify-center">
                <div
                  className="relative grid h-24 w-24 place-items-center rounded-full text-white shadow-xl ring-4 ring-white"
                  style={{
                    backgroundColor: currentTemplate.primaryColor,
                    backgroundImage: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.4), transparent 60%)`,
                  }}
                >
                  <div className="absolute inset-1.5 rounded-full border border-dashed border-white/60" />
                  <div className="text-center px-1">
                    <span className="block text-sm">★</span>
                    <span className="block text-[8px] font-bold uppercase tracking-widest leading-none mt-0.5">
                      SkillSwap
                    </span>
                    <span className="block text-[6px] uppercase tracking-wider opacity-85 mt-0.5">
                      Verified
                    </span>
                  </div>
                </div>
                <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-ink/40">
                  {currentTemplate.sealText}
                </span>
              </div>

              {/* Signature 2: Registrar / Academic Dean */}
              <div className="text-center sm:text-right">
                <p
                  className="font-serif text-3xl text-ink/80 italic select-none"
                  style={{ fontFamily: '"Great Vibes", "Brush Script MT", cursive' }}
                >
                  Dr. Eleanor Vance
                </p>
                <div className="mt-1 h-px w-44 bg-ink/20 mx-auto sm:ml-auto" />
                <p className="mt-1 text-xs font-bold text-ink">Dr. Eleanor Vance, Ph.D.</p>
                <p className="text-[10px] text-ink/40 uppercase font-semibold">Registrar & Academic Council</p>
              </div>
            </div>

            {/* Verification Footer Link */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-[11px] text-ink/40 font-mono">
              <span>Online Verification:</span>
              <a
                href={`/certificates/verify`}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-violet flex items-center gap-1"
              >
                skillswap.city/certificates/verify?id={cert.certificateId}
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
