import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button, Input, toast } from '@/components/ui';
import { AuthShell } from './Login';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('At least 8 characters'); return; }
    setLoading(true); setError('');
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setError(error.message);
    else { toast('Password updated. Welcome back.'); navigate('/dashboard'); }
  };

  return (
    <AuthShell title="NEW PASSWORD" sub="Set a fresh password for your account.">
      <form onSubmit={submit} className="space-y-5">
        <Input id="password" label="New password" type="password" required value={password}
          onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 characters" error={error || undefined} />
        <Button type="submit" loading={loading} className="w-full py-4">Update password</Button>
      </form>
    </AuthShell>
  );
}
