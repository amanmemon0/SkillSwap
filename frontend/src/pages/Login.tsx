import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import AuthShell from '../layouts/AuthShell'
import { Button } from '../components/ui/Primitives'
import { supabase } from '../auth/supabaseClient'

const schema = z.object({ email: z.string().email('Use a valid email'), password: z.string().min(6, 'At least 6 characters') })
type Form = z.infer<typeof schema>

export default function Login() {
  const nav = useNavigate(); const [show, setShow] = useState(false); const [busy, setBusy] = useState(false); const [authError, setAuthError] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })
  
  const submit = async ({ email, password }: Form) => {
    setBusy(true); setAuthError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) { setAuthError(error?.message || 'Unable to sign in.'); setBusy(false); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    const role = profile?.role || data.user.user_metadata?.role || 'user'
    nav(role === 'admin' ? '/admin' : '/dashboard'); setBusy(false)
  }

  const signInWithGoogle = async () => {
    setBusy(true); setAuthError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
    if (error) {
      setAuthError(error.message)
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <Link to="/login" className="text-lg font-extrabold">SkillSwap</Link>
      <p className="eyebrow mt-14">Welcome back</p>
      <h2 className="mt-3 font-display text-5xl">Keep your curiosity moving.</h2>
      <p className="mt-3 text-sm text-ink/55">Sign in with the account provided by your team.</p>
      
      <form onSubmit={handleSubmit(submit)} className="mt-10 space-y-6">
        <label className="block text-sm font-bold">
          Email
          <input className="field mt-1" type="email" placeholder="name@example.com" {...register('email')}/>
          {errors.email && <small className="text-coral">{errors.email.message}</small>}
        </label>
        
        <label className="relative block text-sm font-bold">
          Password
          <input className="field mt-1 pr-9" type={show ? 'text' : 'password'} placeholder="••••••••" {...register('password')}/>
          <button type="button" aria-label="Toggle password visibility" onClick={() => setShow(!show)} className="absolute right-1 top-9 text-ink/40">
            {show ? <EyeOff size={17}/> : <Eye size={17}/>}
          </button>
          {errors.password && <small className="text-coral">{errors.password.message}</small>}
        </label>
        
        {authError && <p role="alert" className="rounded-xl bg-coral/20 p-3 text-xs font-bold text-ink">{authError}</p>}
        
        <Button disabled={busy} className="w-full bg-ink text-white hover:-translate-y-0.5 hover:bg-violet">
          {busy ? 'Signing in…' : <>Enter SkillSwap <ArrowRight size={16}/></>}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-ink/10" />
        </div>
        <div className="relative flex justify-center text-xs font-bold uppercase">
          <span className="bg-[#f7f5f2] px-3 text-ink/40">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        onClick={signInWithGoogle}
        disabled={busy}
        className="w-full border border-ink/10 bg-white text-ink hover:-translate-y-0.5 hover:bg-ink/5 flex items-center justify-center gap-2"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
        </svg>
        Sign in with Google
      </Button>

      <p className="mt-7 text-center text-sm text-ink/55">
        Need an account? <Link className="font-bold text-violet" to="/register">Create your profile</Link>
      </p>
    </AuthShell>
  )
}
