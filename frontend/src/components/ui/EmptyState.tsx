/* ─── EmptyState ─── */
import type { ReactNode } from 'react';
import { Button } from './Primitives';

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 text-ink/15">{icon}</div>
      <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-ink/50">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6 bg-gradient-to-r from-violet to-electric text-white hover:shadow-glow">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
