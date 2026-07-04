import { useState, type ReactNode } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, NotebookPen, Layers, Target, CalendarRange, BookOpen,
  BrainCircuit, ScanEye, BarChart3, Trophy, Medal, User, Settings, LogOut, Menu, X, Flame, Zap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { levelProgress, rankForLevel } from '@/lib/xp';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/planner', label: 'Study Planner', icon: CalendarRange },
  { to: '/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/notes', label: 'Notes', icon: NotebookPen },
  { to: '/flashcards', label: 'Flashcards', icon: Layers },
  { to: '/quizzes', label: 'Quizzes', icon: Target },
  { to: '/ai-tutor', label: 'AI Coach', icon: BrainCircuit },
  { to: '/vision', label: 'Vision AI', icon: ScanEye },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/achievements', label: 'Achievements', icon: Medal },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const prog = levelProgress(profile?.xp ?? 0);
  return (
    <div className="flex h-full flex-col">
      <Link to="/dashboard" className="border-b-2 border-white/10 p-5">
        <span className="display text-xl">STUDY<span className="text-primary">ARENA</span></span>
      </Link>

      <div className="border-b-2 border-white/10 p-5">
        <p className="display text-lg leading-tight">{profile?.username ?? 'Athlete'}</p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
          LVL {prog.level} · {rankForLevel(prog.level)}
        </p>
        <div className="mt-3 h-2 border border-white/20 bg-surface">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${prog.pct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-muted">
          <span className="flex items-center gap-1"><Zap size={12} className="text-warning" /> {profile?.xp ?? 0} XP</span>
          <span className="flex items-center gap-1"><Flame size={12} className="text-primary" /> {profile?.streak ?? 0} day streak</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3" aria-label="Main navigation">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} onClick={onNavigate}
            className={({ isActive }) => cn(
              'mb-1 flex items-center gap-3 border-l-4 px-3 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors',
              isActive ? 'border-primary bg-primary/10 text-white' : 'border-transparent text-muted hover:text-white hover:bg-white/5'
            )}>
            <Icon size={16} aria-hidden /> {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t-2 border-white/10 p-3">
        <NavLink to="/profile" onClick={onNavigate} className="mb-1 flex items-center gap-3 px-3 py-2 font-mono text-xs uppercase tracking-widest text-muted hover:text-white"><User size={16} /> Profile</NavLink>
        <NavLink to="/settings" onClick={onNavigate} className="mb-1 flex items-center gap-3 px-3 py-2 font-mono text-xs uppercase tracking-widest text-muted hover:text-white"><Settings size={16} /> Settings</NavLink>
        <button onClick={async () => { await signOut(); navigate('/'); }}
          className="flex w-full items-center gap-3 px-3 py-2 font-mono text-xs uppercase tracking-widest text-primary hover:bg-primary/10">
          <LogOut size={16} /> Log out
        </button>
      </div>
    </div>
  );
}

export function AppLayout({ children, title, subtitle, actions }:
  { children: ReactNode; title: string; subtitle?: string; actions?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r-2 border-white/10 bg-surface lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={() => setOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r-2 border-white/10 bg-surface lg:hidden">
              <SidebarContent onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b-2 border-white/10 bg-bg/90 px-4 py-4 backdrop-blur md:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></button>
          <div className="min-w-0 flex-1">
            <h1 className="display truncate text-2xl md:text-3xl">{title}</h1>
            {subtitle && <p className="truncate font-mono text-xs text-muted">{subtitle}</p>}
          </div>
          {actions}
        </header>
        <motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
          className="flex-1 p-4 md:p-8">
          {children}
        </motion.main>
      </div>
    </div>
  );
}

export function CloseIcon() { return <X />; }
