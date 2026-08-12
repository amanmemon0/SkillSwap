import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import AuthShell from '../layouts/AuthShell';
import { Button } from '../components/ui/Primitives';
import { api } from '../utils/api';

const schema = z.object({
  email: z.string().email('Use a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
});
type Form = z.infer<typeof schema>;

export default function Login() {
  const nav = useNavigate();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const submit = async ({ email, password }: Form) => {
    setBusy(true);
    setAuthError('');
    try {
      const user = await api.login({ email, password });
      nav(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (error: any) {
      setAuthError(error.message || 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <Link to="/" className="flex items-center gap-2 text-lg font-extrabold">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet to-electric text-white text-xs">
          🔄
        </span>
        SkillSwap
      </Link>
      <p className="eyebrow mt-12">Welcome back</p>
      <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
        Keep your curiosity{' '}
        <span className="gradient-text">moving.</span>
      </h2>
      <p className="mt-3 text-sm text-ink/55">
        Sign in with the account provided by your team.
      </p>

      <form onSubmit={handleSubmit(submit)} className="mt-10 space-y-5">
        <label className="block text-sm font-bold">
          Email
          <input
            className="field mt-2"
            type="email"
            placeholder="name@example.com"
            {...register('email')}
          />
          {errors.email && <small className="text-coral mt-1 block">{errors.email.message}</small>}
        </label>

        <label className="relative block text-sm font-bold">
          Password
          <input
            className="field mt-2 pr-10"
            type={show ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('password')}
          />
          <button
            type="button"
            aria-label="Toggle password visibility"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-10 text-ink/40 hover:text-violet transition"
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
          {errors.password && <small className="text-coral mt-1 block">{errors.password.message}</small>}
        </label>

        {authError && (
          <p role="alert" className="rounded-xl bg-coral/10 border border-coral/20 p-3 text-xs font-bold text-coral">
            {authError}
          </p>
        )}

        <Button
          disabled={busy}
          className="w-full bg-gradient-to-r from-violet to-electric text-white hover:shadow-glow hover:scale-[1.02]"
        >
          {busy ? (
            'Signing in…'
          ) : (
            <>
              Enter SkillSwap <ArrowRight size={16} />
            </>
          )}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-ink/55">
        Need an account?{' '}
        <Link className="font-bold text-violet hover:text-electric transition" to="/register">
          Create your profile
        </Link>
      </p>
    </AuthShell>
  );
}
