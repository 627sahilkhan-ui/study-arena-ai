import { supabase } from './supabase';
import { toast } from '@/components/ui';
import { sendEmail } from './ai';

/**
 * Checks unlock conditions and awards any newly earned achievements.
 * Called after study sessions, quiz attempts and content creation.
 */
export async function checkAchievements(userId: string, email?: string, username?: string) {
  const [{ data: unlockedRows }, { data: profile }] = await Promise.all([
    supabase.from('user_achievements').select('achievement_id').eq('user_id', userId),
    supabase.from('profiles').select('xp, streak').eq('id', userId).single(),
  ]);
  const unlocked = new Set((unlockedRows ?? []).map(r => r.achievement_id));
  const toAward: string[] = [];

  const countOf = async (table: string) => {
    const { count } = await supabase.from(table).select('id', { count: 'exact', head: true }).eq('user_id', userId);
    return count ?? 0;
  };

  if (!unlocked.has('first_session') && (await countOf('study_sessions')) >= 1) toAward.push('first_session');
  if (!unlocked.has('streak_3') && (profile?.streak ?? 0) >= 3) toAward.push('streak_3');
  if (!unlocked.has('streak_7') && (profile?.streak ?? 0) >= 7) toAward.push('streak_7');
  if (!unlocked.has('xp_500') && (profile?.xp ?? 0) >= 500) toAward.push('xp_500');
  if (!unlocked.has('xp_2000') && (profile?.xp ?? 0) >= 2000) toAward.push('xp_2000');
  if (!unlocked.has('note_taker') && (await countOf('notes')) >= 10) toAward.push('note_taker');
  if (!unlocked.has('card_shark') && (await countOf('flashcards')) >= 25) toAward.push('card_shark');

  for (const id of toAward) {
    await supabase.from('user_achievements').insert({ user_id: userId, achievement_id: id });
    const { data: a } = await supabase.from('achievements').select('title').eq('id', id).single();
    const title = a?.title ?? id;
    toast(`🏅 Achievement unlocked: ${title}`);
    await supabase.from('notifications').insert({ user_id: userId, title: 'Achievement unlocked', body: title });
    if (email) sendEmail(email, 'achievement', username ?? 'Athlete', title);
  }
  return toAward.length;
}

/** Awards the perfect-quiz achievement directly. */
export async function awardQuizAce(userId: string, email?: string, username?: string) {
  const { data } = await supabase.from('user_achievements').select('achievement_id')
    .eq('user_id', userId).eq('achievement_id', 'quiz_ace').maybeSingle();
  if (data) return;
  await supabase.from('user_achievements').insert({ user_id: userId, achievement_id: 'quiz_ace' });
  toast('🏅 Achievement unlocked: Perfect Game');
  if (email) sendEmail(email, 'achievement', username ?? 'Athlete', 'Perfect Game');
}
