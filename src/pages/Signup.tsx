import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/ui';
import { AuthShell } from './Login';

const schema = z.object({
  username: z.string().min(3, 'At least 3 characters').max(20, 'Max 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers and _ only'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});
type Form = z.infer<typeof schema>;

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: Form) => {
    setServerError('');
    const { error } = await signUp(v.email, v.password, v.username);
    if (error) setServerError(error);
    else navigate('/dashboard');
  };

  return (
    <AuthShell title="JOIN THE ARENA" sub="Create your athlete profile. Free forever.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Input id="username" label="Username" placeholder="iron_mind" error={errors.username?.message} {...register('username')} />
        <Input id="email" label="Email" type="email" placeholder="you@college.edu" error={errors.email?.message} {...register('email')} />
        <Input id="password" label="Password" type="password" placeholder="Minimum 8 characters" error={errors.password?.message} {...register('password')} />
        {serverError && <p role="alert" className="border-2 border-primary bg-primary/10 px-3 py-2 font-mono text-xs text-primary">{serverError}</p>}
        <Button type="submit" loading={isSubmitting} className="w-full py-4">Create account</Button>
      </form>
      <p className="mt-6 text-center font-mono text-xs text-muted">
        Already training? <Link to="/login" className="text-primary hover:underline">Log in</Link>
      </p>
    </AuthShell>
  );
}
