import { forwardRef, memo, useEffect, useRef, useState, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { X, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ---------------- Button ---------------- */
type BtnVariant = 'primary' | 'outline' | 'ghost' | 'white' | 'danger';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: BtnVariant; loading?: boolean; }
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading, className, children, disabled, ...props }, ref) {
  const styles: Record<BtnVariant, string> = {
    primary: 'bg-primary border-primary text-white hover:shadow-hard-white',
    outline: 'bg-transparent border-white text-white hover:bg-white hover:text-bg',
    ghost: 'bg-transparent border-transparent text-muted hover:text-white',
    white: 'bg-white border-white text-bg hover:shadow-hard',
    danger: 'bg-transparent border-primary text-primary hover:bg-primary hover:text-white',
  };
  return (
    <button ref={ref} disabled={disabled || loading}
      className={cn('btn-brutal disabled:opacity-40 disabled:pointer-events-none', styles[variant], className)} {...props}>
      {loading && <span className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" aria-hidden />}
      {children}
    </button>
  );
});

/* ---------------- Card ---------------- */
export function Card({ className, children, hover = false }: { className?: string; children: ReactNode; hover?: boolean }) {
  return (
    <div className={cn('card-brutal p-6', hover && 'transition-transform duration-200 hover:-translate-y-1 hover:border-primary', className)}>
      {children}
    </div>
  );
}

/* ---------------- Form fields ---------------- */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }>(
  function Input({ label, error, className, id, ...props }, ref) {
    return (
      <div>
        {label && <label htmlFor={id} className="eyebrow mb-2 block">{label}</label>}
        <input ref={ref} id={id}
          className={cn('w-full bg-surface border-2 border-white/15 px-4 py-3 text-white placeholder:text-muted/60 focus:border-primary focus:outline-none transition-colors', error && 'border-primary', className)}
          {...props} />
        {error && <p role="alert" className="mt-1 font-mono text-xs text-primary">{error}</p>}
      </div>
    );
  });

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }>(
  function Textarea({ label, className, id, ...props }, ref) {
    return (
      <div>
        {label && <label htmlFor={id} className="eyebrow mb-2 block">{label}</label>}
        <textarea ref={ref} id={id}
          className={cn('w-full bg-surface border-2 border-white/15 px-4 py-3 text-white placeholder:text-muted/60 focus:border-primary focus:outline-none transition-colors min-h-[120px]', className)}
          {...props} />
      </div>
    );
  });

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { label?: string }>(
  function Select({ label, className, id, children, ...props }, ref) {
    return (
      <div>
        {label && <label htmlFor={id} className="eyebrow mb-2 block">{label}</label>}
        <select ref={ref} id={id}
          className={cn('w-full bg-surface border-2 border-white/15 px-4 py-3 text-white focus:border-primary focus:outline-none', className)}
          {...props}>{children}</select>
      </div>
    );
  });

/* ---------------- Modal ---------------- */
export function Modal({ open, onClose, title, children, wide = false }:
  { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}
          role="dialog" aria-modal="true" aria-label={title}>
          <motion.div initial={{ y: 24, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className={cn('card-brutal shadow-hard w-full max-h-[85vh] overflow-y-auto bg-card p-6', wide ? 'max-w-3xl' : 'max-w-lg')}
            onClick={e => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="display text-2xl">{title}</h2>
              <button onClick={onClose} aria-label="Close dialog" className="text-muted hover:text-primary"><X /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Skeleton / Empty ---------------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-white/10', className)} aria-hidden />;
}
export function SkeletonCards({ n = 6 }: { n?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: n }).map((_, i) => <Skeleton key={i} className="h-40 border-2 border-white/10" />)}
    </div>
  );
}
export function EmptyState({ title, hint, action }: { title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="card-brutal flex flex-col items-center gap-3 py-16 text-center">
      <Inbox className="text-primary" size={40} aria-hidden />
      <p className="display text-2xl">{title}</p>
      <p className="max-w-sm text-sm text-muted">{hint}</p>
      {action}
    </div>
  );
}

/* ---------------- Stat / Progress / Badge / Counter ---------------- */
export const StatCard = memo(function StatCard({ label, value, sub, icon, accent = 'text-primary' }:
  { label: string; value: ReactNode; sub?: string; icon?: ReactNode; accent?: string }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="eyebrow">{label}</p>
          <p className="display mt-2 text-4xl md:text-5xl">{value}</p>
          {sub && <p className="mt-1 font-mono text-xs text-muted">{sub}</p>}
        </div>
        {icon && <div className={cn('shrink-0', accent)}>{icon}</div>}
      </div>
    </Card>
  );
});

export function ProgressBar({ pct, color = 'bg-primary', label }: { pct: number; color?: string; label?: string }) {
  return (
    <div role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="h-3 border-2 border-white/20 bg-surface">
        <motion.div className={cn('h-full', color)} initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }} />
      </div>
    </div>
  );
}

export function Badge({ children, color = 'border-info text-info' }: { children: ReactNode; color?: string }) {
  return <span className={cn('inline-block border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest', color)}>{children}</span>;
}

/** Animated number that counts up when scrolled into view. */
export function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1200;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ---------------- Toast (minimal, in-memory) ---------------- */
type Toast = { id: number; text: string; kind: 'success' | 'error' };
let pushToast: ((t: Omit<Toast, 'id'>) => void) | null = null;
export function toast(text: string, kind: 'success' | 'error' = 'success') { pushToast?.({ text, kind }); }
export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    pushToast = (t) => {
      const id = Date.now() + Math.random();
      setItems(list => [...list, { ...t, id }]);
      setTimeout(() => setItems(list => list.filter(i => i.id !== id)), 3500);
    };
    return () => { pushToast = null; };
  }, []);
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2" aria-live="polite">
      <AnimatePresence>
        {items.map(t => (
          <motion.div key={t.id} initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 80, opacity: 0 }}
            className={cn('card-brutal px-4 py-3 font-mono text-sm shadow-hard-dark', t.kind === 'error' ? 'border-primary text-primary' : 'border-success text-success')}>
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
