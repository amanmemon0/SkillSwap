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
  return <AuthShell><Link to="/login" className="text-lg font-extrabold">SkillSwap</Link><p className="eyebrow mt-14">Welcome back</p><h2 className="mt-3 font-display text-5xl">Keep your curiosity moving.</h2><p className="mt-3 text-sm text-ink/55">Sign in with the account provided by your team.</p><form onSubmit={handleSubmit(submit)} className="mt-10 space-y-6"><label className="block text-sm font-bold">Email<input className="field mt-1" type="email" placeholder="name@example.com" {...register('email')}/>{errors.email&&<small className="text-coral">{errors.email.message}</small>}</label><label className="relative block text-sm font-bold">Password<input className="field mt-1 pr-9" type={show?'text':'password'} placeholder="••••••••" {...register('password')}/><button type="button" aria-label="Toggle password visibility" onClick={()=>setShow(!show)} className="absolute right-1 top-9 text-ink/40">{show?<EyeOff size={17}/>:<Eye size={17}/>}</button>{errors.password&&<small className="text-coral">{errors.password.message}</small>}</label>{authError&&<p role="alert" className="rounded-xl bg-coral/20 p-3 text-xs font-bold text-ink">{authError}</p>}<Button disabled={busy} className="w-full bg-ink text-white hover:-translate-y-0.5 hover:bg-violet">{busy?'Signing in…':<>Enter SkillSwap <ArrowRight size={16}/></>}</Button></form><p className="mt-7 text-center text-sm text-ink/55">Need an account? <Link className="font-bold text-violet" to="/register">Create your profile</Link></p></AuthShell>
}
