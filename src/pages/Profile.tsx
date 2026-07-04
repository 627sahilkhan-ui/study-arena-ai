import { useRef, useState, useEffect } from 'react';
import { Camera, Save } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Card, Input, StatCard, ProgressBar, toast } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { levelFromXp, levelProgress, rankForLevel } from '@/lib/xp';
import { Flame, Zap, Medal, TrendingUp } from 'lucide-react';

export default function Profile() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? '');
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load initial values when profile becomes available
  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? '');
      setFullName(profile.full_name ?? '');
    }
  }, [profile]);

  if (!user) {
    return (
      <AppLayout title="Profile" subtitle="Loading...">
        <div className="flex min-h-96 items-center justify-center">
          <p className="text-muted font-mono text-sm">Redirecting to login...</p>
        </div>
      </AppLayout>
    );
  }

  if (loading || !profile) {
    return (
      <AppLayout title="Profile" subtitle="Loading your athlete card...">
        <div className="flex min-h-96 items-center justify-center">
          <div className="text-center">
            <div className="display animate-pulse text-2xl mb-4">STUDY<span className="text-primary">ARENA</span></div>
            <p className="text-muted font-mono text-sm">Loading profile...</p>
            {!profile && <p className="text-muted font-mono text-xs mt-2">If this takes too long, try refreshing the page</p>}
          </div>
        </div>
      </AppLayout>
    );
  }
  const level = levelFromXp(profile.xp);
  const progress = levelProgress(profile.xp);

  const save = async () => {
    if (!username.trim()) { toast('Username is required', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.from('profiles')
      .update({ username: username.trim(), full_name: fullName.trim() || null }).eq('id', user.id);
    if (error) toast(error.message, 'error');
    else { await refreshProfile(); toast('Profile updated'); }
    setSaving(false);
  };

  const uploadAvatar = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Please choose an image', 'error'); return; }
    setUploading(true);
    const path = `${user.id}/avatar-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) { toast(error.message, 'error'); setUploading(false); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
    await refreshProfile();
    toast('Avatar updated');
    setUploading(false);
  };

  return (
    <AppLayout title="Profile" subtitle="Your athlete card">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 text-center">
          <div className="relative mx-auto h-28 w-28">
            <div className="flex h-full w-full items-center justify-center overflow-hidden border-2 border-white/20 bg-surface text-4xl font-black uppercase">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="Your avatar" className="h-full w-full object-cover" />
                : profile.username?.[0] ?? '?'}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" aria-label="Upload avatar"
              onChange={e => uploadAvatar(e.target.files?.[0])} />
            <button onClick={() => fileRef.current?.click()} aria-label="Change avatar"
              className="absolute -bottom-2 -right-2 border-2 border-white bg-primary p-2 text-white transition-transform hover:scale-110">
              <Camera size={16} />
            </button>
          </div>
          <h2 className="display mt-5 text-3xl">{profile.username}</h2>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">{rankForLevel(level)} · Level {level}</p>
          <div className="mt-5">
            <ProgressBar pct={progress.pct} label="Level progress" />
            <p className="mt-2 font-mono text-xs text-muted">{progress.current} / {progress.needed} XP to level {level + 1}</p>
          </div>
          {uploading && <p className="mt-3 font-mono text-xs text-info">Uploading…</p>}
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Total XP" value={profile.xp.toLocaleString()} icon={<Zap />} />
            <StatCard label="Streak" value={`${profile.streak} days`} icon={<Flame />} accent="text-warning" />
            <StatCard label="Level" value={level} icon={<TrendingUp />} accent="text-info" />
            <StatCard label="Rank" value={rankForLevel(level)} icon={<Medal />} accent="text-success" />
          </div>

          <Card>
            <h2 className="eyebrow mb-4 text-muted">Edit profile</h2>
            <div className="space-y-4">
              <Input label="Username" id="pf-username" value={username} onChange={e => setUsername(e.target.value)} />
              <Input label="Full name" id="pf-fullname" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Optional" />
              <Input label="Email" id="pf-email" value={user.email ?? ''} disabled className="opacity-60" />
              <Button onClick={save} loading={saving}><Save size={16} /> Save changes</Button>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
