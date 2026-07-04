// XP + level engine. Level N requires N^2 * 100 total XP (quadratic curve).
export const XP_PER_MINUTE = 2;

export function levelFromXp(xp: number) {
  return Math.max(1, Math.floor(Math.sqrt(xp / 100)) + (xp >= 100 ? 1 : 0));
}
export function xpForLevel(level: number) {
  return Math.pow(level - 1, 2) * 100;
}
export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  return { level, current: xp - floor, needed: ceil - floor, pct: Math.min(100, Math.round(((xp - floor) / (ceil - floor)) * 100)) };
}
export const RANKS = ['Rookie', 'Contender', 'Pro', 'All-Star', 'Elite', 'Champion', 'Legend'];
export function rankForLevel(level: number) {
  return RANKS[Math.min(RANKS.length - 1, Math.floor((level - 1) / 3))];
}
