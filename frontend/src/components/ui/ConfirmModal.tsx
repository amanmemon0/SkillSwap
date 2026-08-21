/* ─── ConfirmModal ─── */
import { Button } from './Primitives';

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/40 p-5 backdrop-blur-sm" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-ink/60">{message}</p>
        <div className="mt-7 flex justify-end gap-3">
          <Button onClick={onCancel} className="bg-white text-ink ring-1 ring-ink/10 hover:bg-ink/5">
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            className={
              variant === 'danger'
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-gradient-to-r from-violet to-electric text-white hover:shadow-glow'
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
