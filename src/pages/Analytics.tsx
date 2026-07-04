import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
} from 'recharts';
import { AppLayout } from '@/components/layout';
import { Card, StatCard, Skeleton } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Flame, Clock3, Target, Zap } from 'lucide-react';
import type { StudySession, QuizAttempt, Subject, Goal } from '@/types';

const AXIS = { stroke: '#A0A0A0', fontSize: 11, fontFamily: 'JetBrains Mono' } as const;
const TOOLTIP = { background: '#1B1B1B', border: '2px solid rgba(255,255,255,0.15)', color: '#fff', fontFamily: 'Space Grotesk' } as const;
const PIE_COLORS = ['#FF2E2E', '#00C2FF', '#39FF14', '#FF9800', '#FFFFFF', '#B026FF', '#FF6B9D'];

export default function Analytics() {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [s, a, sub, g] = await Promise.all([
        supabase.from('study_sessions').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('quiz_attempts').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('subjects').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
      ]);
      setSessions((s.data as StudySession[]) ?? []);
      setAttempts((a.data as QuizAttempt[]) ?? []);
      setSubjects((sub.data as Subject[]) ?? []);
      setGoals((g.data as Goal[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  /* 14-day study minutes */
  const daily = useMemo(() => {
    const days: { day: string; minutes: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const minutes = sessions.filter(s => s.created_at.slice(0, 10) === key).reduce((n, s) => n + s.minutes, 0);
      days.push({ day: d.toLocaleDateString('en', { day: '2-digit', month: 'short' }), minutes });
    }
    return days;
  }, [sessions]);

  /* Subject distribution */
  const bySubject = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      const name = subjects.find(x => x.id === s.subject_id)?.name ?? 'General';
      map.set(name, (map.get(name) ?? 0) + s.minutes);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 7);
  }, [sessions, subjects]);

  /* Quiz accuracy over time */
  const accuracy = useMemo(() => attempts.map((a, i) => ({
    attempt: `#${i + 1}`, accuracy: Math.round((a.score / Math.max(1, a.total)) * 100),
  })), [attempts]);

  /* Cumulative XP growth */
  const xpGrowth = useMemo(() => {
    let sum = 0;
    return sessions.map(s => {
      sum += s.xp_earned;
      return { date: new Date(s.created_at).toLocaleDateString('en', { day: '2-digit', month: 'short' }), xp: sum };
    });
  }, [sessions]);

  const totalMinutes = sessions.reduce((n, s) => n + s.minutes, 0);
  const avgAccuracy = accuracy.length ? Math.round(accuracy.reduce((n, a) => n + a.accuracy, 0) / accuracy.length) : 0;
  const goalRate = goals.length ? Math.round((goals.filter(g => g.completed).length / goals.length) * 100) : 0;

  return (
    <AppLayout title="Analytics" subtitle="Performance data. No excuses, just numbers.">
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72" />)}</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total study time" value={`${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`} icon={<Clock3 />} />
            <StatCard label="Quiz accuracy" value={`${avgAccuracy}%`} sub={`${attempts.length} attempts`} icon={<Target />} accent="text-info" />
            <StatCard label="Goal completion" value={`${goalRate}%`} sub={`${goals.length} goals set`} icon={<Zap />} accent="text-success" />
            <StatCard label="Current streak" value={`${profile?.streak ?? 0} days`} icon={<Flame />} accent="text-warning" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="eyebrow mb-4 text-muted">Study minutes — last 14 days</h2>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={daily}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="day" {...AXIS} tickLine={false} axisLine={false} interval={1} />
                    <YAxis {...AXIS} tickLine={false} axisLine={false} width={32} />
                    <Tooltip contentStyle={TOOLTIP} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="minutes" fill="#FF2E2E" radius={[2, 2, 0, 0]} isAnimationActive />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h2 className="eyebrow mb-4 text-muted">Subject distribution</h2>
              <div className="h-64">
                {bySubject.length === 0 ? <p className="text-sm text-muted">Log study sessions to see the split.</p> : (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={bySubject} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3} stroke="#090909">
                        {bySubject.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP} formatter={(v: number) => [`${v} min`, 'Time']} />
                      <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card>
              <h2 className="eyebrow mb-4 text-muted">Quiz accuracy</h2>
              <div className="h-64">
                {accuracy.length === 0 ? <p className="text-sm text-muted">Take a quiz to start tracking accuracy.</p> : (
                  <ResponsiveContainer>
                    <LineChart data={accuracy}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="attempt" {...AXIS} tickLine={false} axisLine={false} />
                      <YAxis {...AXIS} domain={[0, 100]} tickLine={false} axisLine={false} width={32} />
                      <Tooltip contentStyle={TOOLTIP} />
                      <Line type="monotone" dataKey="accuracy" stroke="#00C2FF" strokeWidth={3} dot={{ fill: '#00C2FF', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card>
              <h2 className="eyebrow mb-4 text-muted">XP growth</h2>
              <div className="h-64">
                {xpGrowth.length === 0 ? <p className="text-sm text-muted">Earn XP from sessions to watch the curve climb.</p> : (
                  <ResponsiveContainer>
                    <AreaChart data={xpGrowth}>
                      <defs>
                        <linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#39FF14" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#39FF14" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="date" {...AXIS} tickLine={false} axisLine={false} />
                      <YAxis {...AXIS} tickLine={false} axisLine={false} width={40} />
                      <Tooltip contentStyle={TOOLTIP} />
                      <Area type="monotone" dataKey="xp" stroke="#39FF14" strokeWidth={2.5} fill="url(#xpFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
