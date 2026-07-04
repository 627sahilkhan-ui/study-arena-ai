import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/ui';
import { AuthShell } from './Login';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await resetPassword(email);
    setLoading(false);
    if (res.error) setError(res.error); else setSent(true);
  };

  return (
    <AuthShell title="RESET PASSWORD" sub="We will email you a recovery link.">
      {sent ? (
        <div className="border-2 border-success bg-success/10 p-4 font-mono text-sm text-success">
          Recovery link sent to {email}. Check your inbox.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <Input id="email" label="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@college.edu" />
          {error && <p role="alert" className="font-mono text-xs text-primary">{error}</p>}
          <Button type="submit" loading={loading} className="w-full py-4">Send recovery link</Button>
        </form>
      )}
      <p className="mt-6 text-center font-mono text-xs text-muted">
        <Link to="/login" className="text-primary hover:underline">Back to log in</Link>
      </p>
    </AuthShell>
  );
}
