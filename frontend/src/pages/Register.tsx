import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Camera } from 'lucide-react';
import AuthShell from '../layouts/AuthShell';
import { Button } from '../components/ui/Primitives';
import { supabase } from '../auth/supabaseClient';

const schema = z.object({
  name: z.string().min(2, 'Tell us your name'),
  email: z.email('Use a valid email'),
  password: z.string().min(8, 'Use 8 characters or more'),
  city: z.string().min(2, 'Add your city'),
  terms: z.literal(true, { error: 'Please accept the terms' }),
});

type Form = z.infer<typeof schema>;

export default function Register() {
  const nav = useNavigate();
  const [strength, setStrength] = useState(0);
  const [busy, setBusy] = useState(false);
  const [regError, setRegError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const password = register('password', {
    onChange: (e) => setStrength(Math.min(4, Math.ceil(e.target.value.length / 3))),
  });

  const submit = async (data: Form) => {
    setBusy(true);
    setRegError('');
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            location: data.city,
            role: 'user',
          },
        },
      });

      if (authError) {
        setRegError(authError.message);
        setBusy(false);
        return;
      }

      if (authData?.user) {
        // Create user profile in profiles table
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: authData.user.id,
          full_name: data.name,
          location: data.city,
          role: 'user',
        });

        if (profileError) {
          // If the profile upsert failed, report it but don't block access if session was created
          console.error('Error creating profile record:', profileError.message);
        }

        // Navigate to user dashboard
        nav('/dashboard');
      }
    } catch (err: any) {
      setRegError(err.message || 'An error occurred during registration.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <Link to="/login" className="text-lg font-extrabold">
        SkillSwap
      </Link>
      <p className="eyebrow mt-10">Start your exchange</p>
      <h2 className="mt-2 font-display text-4xl">Make it official.</h2>
      
      <form onSubmit={handleSubmit(submit)} className="mt-7 space-y-4">
        <label className="flex items-center gap-3 rounded-2xl border border-dashed border-ink/25 p-3 text-sm font-bold">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-mint">
            <Camera size={16} />
          </span>
          <span>
            Choose your portrait <small className="block font-normal text-ink/45">optional, but friendly</small>
          </span>
          <input className="sr-only" type="file" />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">
            Full name
            <input className="field" placeholder="Alex Morgan" {...register('name')} />
            {errors.name && <small className="text-coral">{errors.name.message}</small>}
          </label>
          <label className="text-sm font-bold">
            Your city
            <input className="field" placeholder="Mumbai" {...register('city')} />
            {errors.city && <small className="text-coral">{errors.city.message}</small>}
          </label>
        </div>

        <label className="block text-sm font-bold">
          Email
          <input className="field" placeholder="name@example.com" {...register('email')} />
          {errors.email && <small className="text-coral">{errors.email.message}</small>}
        </label>

        <label className="block text-sm font-bold">
          Create password
          <input className="field" type="password" {...password} />
          {errors.password && <small className="text-coral">{errors.password.message}</small>}
          <span className="mt-2 flex gap-1">
            {[1, 2, 3, 4].map((x) => (
              <i
                key={x}
                className={`h-1 flex-1 rounded ${x <= strength ? 'bg-violet' : 'bg-ink/10'}`}
              />
            ))}
          </span>
        </label>

        <label className="flex gap-2 text-xs text-ink/60">
          <input type="checkbox" className="accent-violet" {...register('terms')} />
          I agree to the Terms and community guidelines.
        </label>
        {errors.terms && <small className="text-coral">{errors.terms.message}</small>}

        {regError && (
          <p role="alert" className="rounded-xl bg-coral/20 p-3 text-xs font-bold text-ink">
            {regError}
          </p>
        )}

        <Button disabled={busy} className="w-full bg-violet text-white hover:-translate-y-0.5 hover:bg-ink">
          {busy ? 'Building your profile…' : <>Create my profile <ArrowRight size={16} /></>}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-ink/55">
        Already a neighbour?{' '}
        <Link className="font-bold text-violet" to="/login">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
