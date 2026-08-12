import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { getSkillCategory, type SkillCategory } from '../../data/mock';

/* ─── Button ─── */
export function Button({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`action ${className}`} {...props}>
      {children}
    </button>
  );
}

/* ─── Avatar ─── */
export function Avatar({
  name,
  size = 'md',
  showStatus,
  status = 'online',
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  status?: 'online' | 'busy' | 'offline';
}) {
  const sizes = {
    sm: 'h-8 w-8 text-[10px]',
    md: 'h-10 w-10 text-xs',
    lg: 'h-14 w-14 text-lg',
    xl: 'h-20 w-20 text-2xl',
  };
  const statusClasses = {
    online: 'status-online',
    busy: 'status-busy',
    offline: 'status-offline',
  };
  return (
    <span className="relative inline-flex shrink-0">
      <span
        className={`grid place-items-center rounded-full bg-gradient-to-br from-violet to-electric font-extrabold text-white ${sizes[size]}`}
      >
        {name.trim().charAt(0).toUpperCase() || '?'}
      </span>
      {showStatus && (
        <span className={`absolute -bottom-0.5 -right-0.5 ${statusClasses[status]}`} />
      )}
    </span>
  );
}

/* ─── Status Badge ─── */
export function Status({ children }: { children: ReactNode }) {
  const value = String(children);
  const styles =
    value === 'Active' || value === 'Matched'
      ? 'bg-emerald-50 text-emerald-700'
      : value === 'Review'
        ? 'bg-coral/20 text-orange-900'
        : 'bg-amber-50 text-amber-700';
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${styles}`}>
      {children}
    </span>
  );
}

/* ─── Skill Tag ─── */
const categoryStyles: Record<SkillCategory, string> = {
  tech: 'skill-tag-tech',
  design: 'skill-tag-design',
  music: 'skill-tag-music',
  language: 'skill-tag-language',
  fitness: 'skill-tag-fitness',
  photo: 'skill-tag-photo',
  cooking: 'skill-tag-cooking',
  business: 'skill-tag-business',
  academics: 'bg-indigo-50 text-indigo-700',
  hobby: 'bg-teal-50 text-teal-700',
};

export function SkillTag({ skill, size = 'sm' }: { skill: string; size?: 'sm' | 'md' }) {
  const category = getSkillCategory(skill);
  const sizeClass = size === 'md' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs';
  return (
    <span className={`skill-tag ${categoryStyles[category]} ${sizeClass}`}>
      {skill}
    </span>
  );
}

/* ─── Match Score ─── */
export function MatchScore({ score, size = 60 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="match-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-ink/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#matchGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="matchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-xs font-extrabold text-ink">{score}%</span>
    </div>
  );
}

/* ─── Exchange Visualization ─── */
export function ExchangeVis({
  yourSkill,
  theirSkill,
  compact = false,
}: {
  yourSkill: string;
  theirSkill: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <span className="exchange-vis text-sm">
        <SkillTag skill={yourSkill} />
        <span className="exchange-arrow">⇄</span>
        <SkillTag skill={theirSkill} />
      </span>
    );
  }
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-gradient-card p-4">
      <div className="flex-1 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">You offer</p>
        <div className="mt-2">
          <SkillTag skill={yourSkill} size="md" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-2xl font-bold text-violet animate-exchange-pulse">⇄</span>
      </div>
      <div className="flex-1 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">You learn</p>
        <div className="mt-2">
          <SkillTag skill={theirSkill} size="md" />
        </div>
      </div>
    </div>
  );
}

/* ─── Live Badge ─── */
export function LiveBadge() {
  return (
    <span className="live-badge">
      <span className="live-dot" />
      Live in your area
    </span>
  );
}

/* ─── Status Dot ─── */
export function StatusDot({ status }: { status: 'online' | 'busy' | 'offline' }) {
  const colors = {
    online: 'bg-emerald-400',
    busy: 'bg-warmyellow',
    offline: 'bg-gray-400',
  };
  const labels = {
    online: 'Available',
    busy: 'Busy',
    offline: 'Offline',
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold">
      <span className={`h-2 w-2 rounded-full ${colors[status]} ${status === 'online' ? 'animate-pulse' : ''}`} />
      {labels[status]}
    </span>
  );
}

/* ─── Stat Card ─── */
export function StatCard({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 transition-all hover-lift ${
        accent
          ? 'bg-gradient-to-br from-violet to-electric text-white'
          : 'bg-white border border-ink/5 shadow-card'
      }`}
    >
      <div className={`mb-3 inline-flex rounded-xl p-2.5 ${accent ? 'bg-white/20' : 'bg-violet/10'}`}>
        {icon}
      </div>
      <p className={`text-[10px] font-bold uppercase tracking-wider ${accent ? 'text-white/70' : 'text-ink/40'}`}>
        {label}
      </p>
      <p className={`mt-1 text-2xl font-extrabold ${accent ? 'text-white' : 'text-ink'}`}>{value}</p>
    </div>
  );
}
