import { useState } from 'react';
import { KeyRound, Mail, LogOut, ShieldCheck } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Card, Input, toast } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/ai';

export default function Settings() {
  const { user, profile, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [changing, setChanging] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);

  const changePassword = async () => {
    if (password.length < 8) { toast('Password must be at least 8 characters', 'error'); return; }
    if (password !== confirm) { toast('Passwords do not match', 'error'); return; }
    setChanging(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast(error.message, 'error');
    else { toast('Password changed'); setPassword(''); setConfirm(''); }
    setChanging(false);
  };

  const weeklyReport = async () => {
    if (!user?.email) return;
    setSendingReport(true);
    const since = new Date(); since.setDate(since.getDate() - 7);
    const { data } = await supabase.from('study_sessions').select('minutes,xp_earned')
      .eq('user_id', user.id).gte('created_at', since.toISOString());
    const minutes = (data ?? []).reduce((n, s) => n + s.minutes, 0);
    const xp = (data ?? []).reduce((n, s) => n + s.xp_earned, 0);
    await sendEmail(user.email, 'weekly', profile?.username,
      `${Math.floor(minutes / 60)}h ${minutes % 60}m trained · ${xp} XP earned · ${profile?.streak ?? 0}-day streak`);
    toast('Weekly report sent to your inbox');
    setSendingReport(false);
  };

  return (
    <AppLayout title="Settings" subtitle="Account and security">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <h2 className="eyebrow mb-1 flex items-center gap-2 text-muted"><KeyRound size={14} /> Change password</h2>
          <p className="mb-4 text-sm text-muted">Use at least 8 characters. You will stay signed in on this device.</p>
          <div className="space-y-4">
            <Input label="New password" id="new-pw" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
            <Input label="Confirm new password" id="confirm-pw" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
            <Button onClick={changePassword} loading={changing}>Update password</Button>
          </div>
        </Card>

        <Card>
          <h2 className="eyebrow mb-1 flex items-center gap-2 text-muted"><Mail size={14} /> Weekly progress email</h2>
          <p className="mb-4 text-sm text-muted">Get a snapshot of your last 7 days of training delivered to {user?.email}.</p>
          <Button variant="outline" onClick={weeklyReport} loading={sendingReport}>Send my weekly report</Button>
        </Card>

        <Card>
          <h2 className="eyebrow mb-1 flex items-center gap-2 text-muted"><ShieldCheck size={14} /> Security</h2>
          <p className="mb-4 text-sm text-muted">Your data is protected by Supabase Row Level Security — only you can read or modify your records.</p>
          <Button variant="danger" onClick={signOut}><LogOut size={16} /> Sign out of this device</Button>
        </Card>
      </div>
    </AppLayout>
  );
}
