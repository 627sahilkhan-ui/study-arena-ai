import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square } from 'lucide-react';
import { Button, Select, toast } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { XP_PER_MINUTE } from '@/lib/xp';
import { checkAchievements } from '@/lib/achievements';
import type { Subject } from '@/types';

/** The training clock. Log a session → minutes become XP. */
export function StudyTimer({ subjects, onLogged }: { subjects: Subject[]; onLogged?: () => void }) {
  const { user, addXp } = useAuth();
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [saving, setSaving] = useState(false);
  const interval = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (running) interval.current = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval.current);
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  const finish = async () => {
    setRunning(false);
    const minutes = Math.max(1, Math.round(seconds / 60));
    if (seconds < 30) { setSeconds(0); toast('Session too short to log (min 30s)', 'error'); return; }
    if (!user) return;
    setSaving(true);
    const xp = minutes * XP_PER_MINUTE;
    await supabase.from('study_sessions').insert({
      user_id: user.id, subject_id: subjectId || null, minutes, xp_earned: xp,
    });
    await addXp(xp);
    await checkAchievements(user.id, user.email ?? undefined);
    setSaving(false); setSeconds(0);
    toast(`Session logged: ${minutes} min · +${xp} XP`);
    onLogged?.();
  };

  return (
    <div className="card-brutal relative overflow-hidden bg-card p-6 md:p-8">
      <div className="stripe absolute left-0 top-0 h-1.5 w-full opacity-70" aria-hidden />
      <p className="eyebrow">Training clock</p>
      <motion.p key={running ? 'run' : 'idle'} className="display mt-3 text-7xl tabular-nums md:text-8xl"
        animate={running ? { scale: [1, 1.02, 1] } : {}} transition={{ repeat: Infinity, duration: 2 }}>
        {mm}<span className="text-primary">:</span>{ss}
      </motion.p>
      <p className="mt-1 font-mono text-xs text-muted">{XP_PER_MINUTE} XP per minute · every rep counts</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Select aria-label="Subject" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
          <option value="">No subject</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Button onClick={() => setRunning(r => !r)} variant={running ? 'outline' : 'primary'}>
          {running ? <><Pause size={16} /> Pause</> : <><Play size={16} /> {seconds ? 'Resume' : 'Start'}</>}
        </Button>
        <Button onClick={finish} variant="white" disabled={seconds === 0} loading={saving}>
          <Square size={16} /> Finish
        </Button>
      </div>
    </div>
  );
}
