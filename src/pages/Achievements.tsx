import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Card, SkeletonCards, Badge } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Achievement } from '@/types';

export default function Achievements() {
  const { user } = useAuth();
  const [all, setAll] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [a, ua] = await Promise.all([
        supabase.from('achievements').select('*').order('xp_reward'),
        supabase.from('user_achievements').select('achievement_id').eq('user_id', user.id),
      ]);
      setAll((a.data as Achievement[]) ?? []);
      setUnlocked(new Set((ua.data ?? []).map(r => r.achievement_id)));
      setLoading(false);
    })();
  }, [user]);

  const earned = all.filter(a => unlocked.has(a.id));

  return (
    <AppLayout title="Achievements" subtitle={`Trophy cabinet — ${earned.length} of ${all.length} unlocked`}>
      {loading ? <SkeletonCards /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {all.map((a, i) => {
            const got = unlocked.has(a.id);
            return (
              <motion.div key={a.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.2 }}>
                <Card className={`h-full text-center ${got ? 'border-warning' : 'opacity-50'}`}>
                  <div className="text-5xl" aria-hidden>{got ? a.icon : <Lock className="mx-auto text-muted" size={40} />}</div>
                  <h3 className="display mt-4 text-xl">{a.title}</h3>
                  <p className="mt-2 text-sm text-muted">{a.description}</p>
                  <div className="mt-4">
                    <Badge color={got ? 'border-warning text-warning' : 'border-white/20 text-muted'}>
                      {got ? 'Unlocked' : `${a.xp_reward} XP reward`}
                    </Badge>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
