import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/ui';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
});
type Form = z.infer<typeof schema>;

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: Form) => {
    setServerError('');
    const { error } = await signIn(v.email, v.password);
    if (error) setServerError(error);
    else navigate('/dashboard');
  };

  return (
    <AuthShell title="BACK IN THE GAME" sub="Log in to continue your training.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Input id="email" label="Email" type="email" placeholder="you@college.edu" error={errors.email?.message} {...register('email')} />
        <Input id="password" label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
        {serverError && <p role="alert" className="border-2 border-primary bg-primary/10 px-3 py-2 font-mono text-xs text-primary">{serverError}</p>}
        <Button type="submit" loading={isSubmitting} className="w-full py-4">Log in</Button>
      </form>
      <div className="mt-6 flex justify-between font-mono text-xs text-muted">
        <Link to="/forgot-password" className="hover:text-primary">Forgot password?</Link>
        <Link to="/signup" className="hover:text-primary">New here? Sign up</Link>
      </div>
    </AuthShell>
  );
}

export function AuthShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="noise relative flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="stripe absolute left-0 top-0 h-2 w-full opacity-60" aria-hidden />
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-md">
        <Link to="/" className="display text-2xl">STUDY<span className="text-primary">ARENA</span></Link>
        <div className="card-brutal mt-6 bg-card p-8 shadow-hard">
          <h1 className="display text-3xl">{title}</h1>
          <p className="mt-1 mb-8 font-mono text-xs text-muted">{sub}</p>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
