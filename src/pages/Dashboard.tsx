import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Zap, Clock, Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { AppLayout } from '@/components/layout';
import { StudyTimer } from '@/components/dashboard/StudyTimer';
import { Card, StatCard, ProgressBar, Skeleton, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { levelProgress, rankForLevel } from '@/lib/xp';
import { timeAgo } from '@/lib/utils';
import type { Subject, StudySession, Goal } from '@/types';

const MOTIVATION = [
  'Champions are made when nobody is watching.',
  'One focused hour beats five distracted ones.',
  'The streak is the strategy.',
  'Hard days build strong minds.',
  'Show up. That is 80% of the win.',
];

export default function Dashboard() {
  const { user, profile, refreshProfile } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const [subs, sess, gls] = await Promise.all([
      supabase.from('subjects').select('*').eq('user_id', user.id),
      supabase.from('study_sessions').select('*').eq('user_id', user.id).gte('created_at', since).order('created_at', { ascending: false }),
      supabase.from('goals').select('*').eq('user_id', user.id).eq('completed', false).order('created_at', { ascending: false }).limit(4),
    ]);
    setSubjects((subs.data as Subject[]) ?? []);
    setSessions((sess.data as StudySession[]) ?? []);
    setGoals((gls.data as Goal[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const prog = levelProgress(profile?.xp ?? 0);
  const todayMin = useMemo(() => sessions
    .filter(s => s.created_at.slice(0, 10) === new Date().toISOString().slice(0, 10))
    .reduce((a, s) => a + s.minutes, 0), [sessions]);
  const weekMin = useMemo(() => sessions.reduce((a, s) => a + s.minutes, 0), [sessions]);

  const chart = useMemo(() => {
    const days: { day: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      days.push({
        day: d.toLocaleDateString(undefined, { weekday: 'short' }),
        minutes: sessions.filter(s => s.created_at.slice(0, 10) === key).reduce((a, s) => a + s.minutes, 0),
      });
    }
    return days;
  }, [sessions]);

  const quote = MOTIVATION[new Date().getDate() % MOTIVATION.length];

  return (
    <AppLayout title={`Welcome back, ${profile?.username ?? 'Athlete'}`} subtitle={quote}>
      {/* Stat row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Level" value={prog.level} sub={rankForLevel(prog.level)} icon={<Trophy size={28} />} />
        <StatCard label="Total XP" value={(profile?.xp ?? 0).toLocaleString()} sub={`${prog.needed - prog.current} XP to next level`} icon={<Zap size={28} />} accent="text-warning" />
        <StatCard label="Streak" value={`${profile?.streak ?? 0}`} sub="days in a row" icon={<Flame size={28} />} />
        <StatCard label="Today" value={`${todayMin}m`} sub={`${weekMin} min this week`} icon={<Clock size={28} />} accent="text-info" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 xl:col-span-2">
          <StudyTimer subjects={subjects} onLogged={() => { load(); refreshProfile(); }} />

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <p className="eyebrow">Last 7 days · minutes trained</p>
              <Link to="/analytics" className="font-mono text-xs text-primary hover:underline">Full analytics →</Link>
            </div>
            {loading ? <Skeleton className="h-52" /> : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart}>
                    <XAxis dataKey="day" stroke="#A0A0A0" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#A0A0A0" fontSize={11} tickLine={false} axisLine={false} width={30} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ background: '#1B1B1B', border: '2px solid #FF2E2E', fontFamily: 'JetBrains Mono', fontSize: 12 }} />
                    <Bar dataKey="minutes" fill="#FF2E2E" radius={0} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card>
            <p className="eyebrow mb-4">Recent activity</p>
            {loading ? <Skeleton className="h-24" /> : sessions.length === 0 ? (
              <p className="text-sm text-muted">No sessions yet. Start the clock above — your first rep is waiting.</p>
            ) : (
              <ul className="divide-y divide-white/10">
                {sessions.slice(0, 5).map(s => (
                  <li key={s.id} className="flex items-center justify-between py-3 text-sm">
                    <span className="flex items-center gap-2"><Clock size={14} className="text-info" /> {s.minutes} min session</span>
                    <span className="font-mono text-xs text-muted">+{s.xp_earned} XP · {timeAgo(s.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card>
            <p className="eyebrow mb-3">Level progress</p>
            <p className="display text-3xl">LVL {prog.level} <span className="text-primary">→</span> {prog.level + 1}</p>
            <div className="mt-4"><ProgressBar pct={prog.pct} label="Level progress" /></div>
            <p className="mt-2 font-mono text-xs text-muted">{prog.current} / {prog.needed} XP</p>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <p className="eyebrow">Weekly goals</p>
              <Link to="/goals" className="font-mono text-xs text-primary hover:underline">All goals →</Link>
            </div>
            {goals.length === 0 ? (
              <p className="text-sm text-muted">No open goals. Set a target and chase it down.</p>
            ) : goals.map(g => (
              <div key={g.id} className="mb-3 border-l-4 border-info bg-surface p-3">
                <p className="text-sm font-semibold">{g.title}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{g.target_hours}h target{g.deadline ? ` · due ${g.deadline}` : ''}</p>
              </div>
            ))}
          </Card>

          <Card className="border-primary">
            <p className="eyebrow mb-3">Quick actions</p>
            <div className="grid gap-2">
              <Link to="/ai-tutor"><Button variant="outline" className="w-full justify-between">Ask the AI Coach <Sparkles size={16} /></Button></Link>
              <Link to="/vision"><Button variant="outline" className="w-full justify-between">Scan notes <ArrowRight size={16} /></Button></Link>
              <Link to="/quizzes"><Button variant="outline" className="w-full justify-between">Take a quiz <ArrowRight size={16} /></Button></Link>
              <Link to="/flashcards"><Button variant="outline" className="w-full justify-between">Drill flashcards <ArrowRight size={16} /></Button></Link>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
