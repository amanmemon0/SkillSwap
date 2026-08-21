/* ─── StatusBadge ─── */
import type { ExamStatus, CertificateStatus, LectureStatus, ApprovalStatus } from '../../data/skillswapTypes';

type BadgeVariant = ExamStatus | CertificateStatus | LectureStatus | ApprovalStatus | string;

const styles: Record<string, string> = {
  // Lecture
  'upcoming': 'bg-blue-50 text-blue-700',
  'in-progress': 'bg-amber-50 text-amber-700',
  'completed': 'bg-emerald-50 text-emerald-700',
  'missed': 'bg-rose-50 text-rose-700',
  // Exam
  'locked': 'bg-ink/5 text-ink/40',
  'eligible': 'bg-violet/10 text-violet',
  'requested': 'bg-amber-50 text-amber-700',
  'scheduled': 'bg-blue-50 text-blue-700',
  'submitted': 'bg-indigo-50 text-indigo-700',
  'passed': 'bg-emerald-50 text-emerald-700',
  'failed': 'bg-rose-50 text-rose-700',
  // Certificate
  'tutor-approved': 'bg-violet/10 text-violet',
  'admin-approved': 'bg-blue-50 text-blue-700',
  'generated': 'bg-emerald-50 text-emerald-700',
  'rejected': 'bg-rose-50 text-rose-700',
  // Approval
  'pending': 'bg-amber-50 text-amber-700',
  'approved': 'bg-emerald-50 text-emerald-700',
};

const labels: Record<string, string> = {
  'upcoming': 'Upcoming',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'missed': 'Missed',
  'locked': 'Locked',
  'eligible': 'Eligible',
  'requested': 'Requested',
  'scheduled': 'Scheduled',
  'submitted': 'Submitted',
  'passed': 'Passed',
  'failed': 'Failed',
  'tutor-approved': 'Tutor Approved',
  'admin-approved': 'Admin Approved',
  'generated': 'Generated',
  'rejected': 'Rejected',
  'pending': 'Pending',
  'approved': 'Approved',
};

export function StatusBadge({ status, className = '' }: { status: BadgeVariant; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${styles[status] || 'bg-ink/5 text-ink/50'} ${className}`}>
      {labels[status] || status}
    </span>
  );
}
