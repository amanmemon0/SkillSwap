import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff, ShieldCheck, UserRound } from 'lucide-react';
import AuthShell from '../layouts/AuthShell';
import { Button } from '../components/ui/Primitives';
import { supabase } from '../auth/supabaseClient';

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
    setValue,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const fillDemo = (email: string, password: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
    setAuthError('');
  };

  const submit = async (data: Form) => {
    setBusy(true);
    setAuthError('');
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setAuthError(authError.message);
        setBusy(false);
        return;
      }

      if (authData?.user) {
        // Query the profile to get the user's role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile role:', profileError.message);
        }

        // Use profile role, or fallback to metadata role, or default to 'user'
        const role = profile?.role || authData.user.user_metadata?.role || 'user';

        if (role === 'admin') {
          nav('/admin');
        } else {
          nav('/dashboard');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'An error occurred during sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <Link to="/login" className="text-lg font-extrabold">
        SkillSwap
      </Link>
      <p className="eyebrow mt-14">Welcome back</p>
      <h2 className="mt-3 font-display text-5xl">Keep your curiosity moving.</h2>

      <form onSubmit={handleSubmit(submit)} className="mt-10 space-y-6">
        <label className="block text-sm font-bold">
          Email
          <input className="field mt-1" placeholder="name@example.com" {...register('email')} />
          {errors.email && <small className="text-coral">{errors.email.message}</small>}
        </label>

        <label className="relative block text-sm font-bold">
          Password
          <input
            className="field mt-1 pr-9"
            type={show ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('password')}
          />
          <button
            type="button"
            aria-label="Toggle password visibility"
            onClick={() => setShow(!show)}
            className="absolute right-1 top-9 text-ink/40"
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
          {errors.password && <small className="text-coral">{errors.password.message}</small>}
        </label>

        {authError && (
          <p role="alert" className="rounded-xl bg-coral/20 p-3 text-xs font-bold text-ink">
            {authError}
          </p>
        )}

        <Button disabled={busy} className="w-full bg-ink text-white hover:-translate-y-0.5 hover:bg-violet">
          {busy ? 'Entering…' : <>Enter SkillSwap <ArrowRight size={16} /></>}
        </Button>
      </form>

      <div className="mt-7 rounded-2xl border border-ink/10 bg-white/70 p-4">
        <p className="text-xs font-extrabold">
          Try a demo account <span className="font-normal text-ink/45">— click to fill</span>
        </p>
        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
          <button
            type="button"
            onClick={() => fillDemo('user@skillswap.city', 'User@123')}
            className="rounded-xl bg-[#f7f5f2] p-2 text-left transition hover:bg-mint"
          >
            <span className="flex items-center gap-1 font-bold">
              <UserRound size={13} /> Member
            </span>
            <span className="block mt-1 text-ink/55">
              user@skillswap.city
              <br />
              User@123
            </span>
          </button>
          <button
            type="button"
            onClick={() => fillDemo('admin@skillswap.city', 'Admin@123')}
            className="rounded-xl bg-[#f7f5f2] p-2 text-left transition hover:bg-mint"
          >
            <span className="flex items-center gap-1 font-bold">
              <ShieldCheck size={13} /> Admin
            </span>
            <span className="block mt-1 text-ink/55">
              admin@skillswap.city
              <br />
              Admin@123
            </span>
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-ink/55">
        New around here?{' '}
        <Link className="font-bold text-violet" to="/register">
          Make your profile
        </Link>
      </p>
    </AuthShell>
  );
}
