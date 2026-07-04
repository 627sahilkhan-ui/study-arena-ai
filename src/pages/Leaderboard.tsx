import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Flame } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Card, Skeleton } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { levelFromXp, rankForLevel } from '@/lib/xp';
import type { Profile } from '@/types';

const MEDAL = ['text-warning', 'text-white', 'text-[#CD7F32]'];

export default function Leaderboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('*').order('xp', { ascending: false }).limit(50);
      setRows((data as Profile[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <AppLayout title="Leaderboard" subtitle="Top 50 athletes in the arena">
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="space-y-3">
          {rows.map((p, i) => {
            const me = p.id === user?.id;
            const level = levelFromXp(p.xp);
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.5), duration: 0.25 }}>
                <Card className={`flex items-center gap-4 !p-4 ${me ? 'border-primary shadow-hard' : ''}`}>
                  <span className={`display w-10 text-center text-2xl ${MEDAL[i] ?? 'text-muted'}`}>
                    {i === 0 ? <Crown className="mx-auto" aria-label="1st place" /> : i + 1}
                  </span>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-white/15 bg-surface font-bold uppercase">
                    {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" loading="lazy" /> : p.username?.[0] ?? '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-white">{p.username}{me && <span className="ml-2 font-mono text-xs text-primary">YOU</span>}</p>
                    <p className="font-mono text-xs text-muted">Level {level} · {rankForLevel(level)}</p>
                  </div>
                  {p.streak > 0 && (
                    <span className="hidden items-center gap-1 font-mono text-xs text-warning sm:flex">
                      <Flame size={14} aria-hidden /> {p.streak}d
                    </span>
                  )}
                  <span className="display text-xl text-white">{p.xp.toLocaleString()}<span className="ml-1 font-mono text-[10px] text-muted">XP</span></span>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
