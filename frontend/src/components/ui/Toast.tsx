/* ─── Toast ─── */
import { useState, useCallback, useEffect } from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const icons: Record<ToastType, typeof Check> = {
  success: Check,
  error: X,
  info: Info,
  warning: AlertTriangle,
};

const colors: Record<ToastType, string> = {
  success: 'bg-ink text-white',
  error: 'bg-rose-600 text-white',
  info: 'bg-violet text-white',
  warning: 'bg-amber-500 text-ink',
};

const iconColors: Record<ToastType, string> = {
  success: 'text-mint',
  error: 'text-rose-200',
  info: 'text-cyan',
  warning: 'text-amber-900',
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, show, dismiss };
}

export function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[70] flex flex-col gap-2">
      {toasts.map(toast => (
        <ToastNotification key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

function ToastNotification({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const Icon = icons[toast.type];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      role="status"
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold shadow-xl transition-all duration-300 ${colors[toast.type]} ${visible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}
    >
      <Icon size={16} className={iconColors[toast.type]} />
      <span className="flex-1">{toast.message}</span>
      <button onClick={onDismiss} className="rounded-full p-1 hover:bg-white/20 transition">
        <X size={14} />
      </button>
    </div>
  );
}
