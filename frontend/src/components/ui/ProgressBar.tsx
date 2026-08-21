/* ─── ProgressBar ─── */
export function ProgressBar({
  value,
  max = 100,
  showLabel = true,
  size = 'md',
  className = '',
}: {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
          <span className="text-ink/50">{value} / {max}</span>
          <span className="text-violet">{pct}%</span>
        </div>
      )}
      <div className={`${heights[size]} w-full rounded-full bg-ink/5 overflow-hidden`}>
        <div
          className={`${heights[size]} rounded-full bg-gradient-to-r from-violet to-electric transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
