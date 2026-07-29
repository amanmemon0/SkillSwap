import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Camera, Check } from 'lucide-react';
import AuthShell from '../layouts/AuthShell';
import { Button } from '../components/ui/Primitives';
import { supabase } from '../auth/supabaseClient';

const skills = ['Web Development', 'Python', 'Graphic Design', 'Guitar', 'Cooking', 'Photography', 'UI/UX', 'Public Speaking', 'Excel'];
const availabilityOptions = ['Weekdays', 'Weekends', 'Morning', 'Afternoon', 'Evening'];
const learningModes = ['Online', 'Offline', 'Both'] as const;
const schema = z.object({
  name: z.string().trim().min(2, 'Tell us your name'),
  username: z.string().trim().min(3, 'Use at least 3 characters').max(24, 'Use 24 characters or fewer').regex(/^[a-zA-Z0-9_]+$/, 'Use letters, numbers, or underscores only'),
  email: z.email('Use a valid email'),
  password: z.string().min(8, 'Use 8 characters or more'),
  confirmPassword: z.string(),
  country: z.string().trim().min(2, 'Add your country'),
  state: z.string().trim().min(2, 'Add your state or region'),
  city: z.string().trim().min(2, 'Add your city'),
  bio: z.string().trim().min(20, 'A short introduction helps people know you').max(280, 'Keep it under 280 characters'),
  primarySkill: z.string().min(1, 'Choose a skill you can teach'),
  skillLevel: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert'], { error: 'Choose your skill level' }),
  learningSkills: z.array(z.string()).min(1, 'Choose at least one skill to learn'),
  availability: z.array(z.string()).min(1, 'Choose when you are usually available'),
  learningMode: z.enum(learningModes, { error: 'Choose how you want to learn' }),
  terms: z.literal(true, { error: 'Please accept the terms' }),
}).refine((data) => data.password === data.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });
type Form = z.infer<typeof schema>;
const stepTitles = ['Let’s get acquainted.', 'Where are you based?', 'Make your first match.', 'One last thing.'];
const stepDescriptions = ['A few essentials help keep the community trusted.', 'Location helps us introduce you to nearby neighbours.', 'Tell people what you can share and what you want to explore.', 'Review the community agreement and you’re ready to join.'];

export default function Register() {
  const nav = useNavigate(); const [step, setStep] = useState(1); const [strength, setStrength] = useState(0); const [busy, setBusy] = useState(false); const [regError, setRegError] = useState(''); const [photoName, setPhotoName] = useState(''); const [wantedSkill, setWantedSkill] = useState('');
  const { register, handleSubmit, trigger, getValues, setValue, watch, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { learningSkills: [], availability: [], learningMode: 'Both' } });
  const password = register('password', { onChange: (event) => setStrength(Math.min(4, Math.ceil(event.target.value.length / 3))) });
  const continueTo = async (fields: Array<keyof Form>) => { if (await trigger(fields)) setStep((current) => current + 1); };
  const learningSkills = watch('learningSkills');
  const addWantedSkill = () => {
    const skill = wantedSkill.trim();
    if (!skill || learningSkills.some((item) => item.toLowerCase() === skill.toLowerCase())) return;
    setValue('learningSkills', [...getValues('learningSkills'), skill], { shouldValidate: true });
    setWantedSkill('');
  };
  const removeWantedSkill = (skill: string) => setValue('learningSkills', getValues('learningSkills').filter((item) => item !== skill), { shouldValidate: true });
  const submit = async (data: Form) => {
    setBusy(true); setRegError('');
    const location = [data.city, data.state, data.country].join(', ');
    const profile = { full_name: data.name, username: data.username.toLowerCase(), country: data.country, state: data.state, city: data.city, location, bio: data.bio, primary_skill: data.primarySkill, skill_level: data.skillLevel, learning_skills: data.learningSkills, availability: data.availability, learning_mode: data.learningMode, role: 'user' };
    try {
      const { data: existingProfile, error: usernameError } = await supabase.from('profiles').select('id').eq('username', profile.username).maybeSingle();
      if (usernameError) { setRegError('We could not check that username. Please try again.'); return; }
      if (existingProfile) { setRegError('That username is already taken. Try another one.'); return; }
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: data.email, password: data.password, options: { data: profile } });
      if (authError) { setRegError(authError.message); return; }
      if (authData.user) { const { error } = await supabase.from('profiles').upsert({ id: authData.user.id, ...profile }); if (error) console.error('Error creating profile record:', error.message); nav('/dashboard'); }
    } catch (error: unknown) { setRegError(error instanceof Error ? error.message : 'An error occurred during registration.'); } finally { setBusy(false); }
  };
  return <AuthShell><Link to="/login" className="text-lg font-extrabold">SkillSwap</Link><p className="eyebrow mt-7">Start your exchange · Step {step} of 4</p><h2 className="mt-2 font-display text-4xl">{stepTitles[step - 1]}</h2><p className="mt-2 text-sm leading-6 text-ink/55">{stepDescriptions[step - 1]}</p><div className="mt-5 flex gap-2" aria-label={`Step ${step} of 4`}>{[1, 2, 3, 4].map((number) => <i key={number} className={`h-1.5 flex-1 rounded ${step >= number ? 'bg-violet' : 'bg-ink/10'}`} />)}</div>
    <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-4">
      {step === 1 && <><div className="grid gap-4 sm:grid-cols-2"><Field label="Full name" error={errors.name?.message}><input className="field" placeholder="Alex Morgan" autoComplete="name" {...register('name')} /></Field><Field label="Username" error={errors.username?.message}><input className="field" placeholder="alex_morgan" autoComplete="username" {...register('username')} /></Field></div><Field label="Email address" error={errors.email?.message}><input className="field" type="email" placeholder="name@example.com" autoComplete="email" {...register('email')} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Create password" error={errors.password?.message}><input className="field" type="password" autoComplete="new-password" {...password} /><span className="mt-2 flex gap-1">{[1, 2, 3, 4].map((value) => <i key={value} className={`h-1 flex-1 rounded ${value <= strength ? 'bg-violet' : 'bg-ink/10'}`} />)}</span></Field><Field label="Confirm password" error={errors.confirmPassword?.message}><input className="field" type="password" autoComplete="new-password" {...register('confirmPassword')} /></Field></div><Next onClick={() => continueTo(['name', 'username', 'email', 'password', 'confirmPassword'])} /></>}
      {step === 2 && <><div className="grid gap-4 sm:grid-cols-3"><Field label="Country" error={errors.country?.message}><input className="field" placeholder="India" {...register('country')} /></Field><Field label="State" error={errors.state?.message}><input className="field" placeholder="Maharashtra" {...register('state')} /></Field><Field label="City" error={errors.city?.message}><input className="field" placeholder="Mumbai" {...register('city')} /></Field></div><label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-ink/25 p-3 text-sm font-bold"><span className="grid h-10 w-10 place-items-center rounded-full bg-mint"><Camera size={16} /></span><span>{photoName || 'Choose your profile photo'}<small className="block font-normal text-ink/45">optional, but friendly</small></span><input className="sr-only" type="file" accept="image/*" onChange={(event) => setPhotoName(event.target.files?.[0]?.name || '')} /></label><Field label="Short bio / about me" error={errors.bio?.message}><textarea className="field min-h-24 resize-y" maxLength={280} placeholder="I'm a third-year Computer Engineering student who enjoys web development and photography." {...register('bio')} /></Field><Navigation back={() => setStep(1)} next={() => continueTo(['country', 'state', 'city', 'bio'])} /></>}
      {step === 3 && <><div className="grid gap-4 sm:grid-cols-2"><Field label="I can teach" error={errors.primarySkill?.message}><input className="field" list="teachable-skills" placeholder="Choose or add a skill" {...register('primarySkill')} /><datalist id="teachable-skills">{skills.map((skill) => <option key={skill} value={skill} />)}</datalist></Field><Field label="Skill level" error={errors.skillLevel?.message}><select className="field" {...register('skillLevel')}><option value="">Choose a level</option>{['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((level) => <option key={level}>{level}</option>)}</select></Field></div><ChoiceGroup label="I want to learn" options={skills} error={errors.learningSkills?.message} register={register('learningSkills')} /><div className="flex gap-2"><input value={wantedSkill} onChange={(event) => setWantedSkill(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addWantedSkill(); } }} className="field flex-1" placeholder="Add another skill you want to learn" /><Button type="button" onClick={addWantedSkill} className="bg-ink text-white hover:bg-violet">Add</Button></div>{learningSkills.filter((skill) => !skills.includes(skill)).length > 0 && <div className="flex flex-wrap gap-2">{learningSkills.filter((skill) => !skills.includes(skill)).map((skill) => <button type="button" key={skill} onClick={() => removeWantedSkill(skill)} className="rounded-full bg-violet px-3 py-2 text-xs font-bold text-white">{skill} ×</button>)}</div>}<ChoiceGroup label="Availability" options={availabilityOptions} error={errors.availability?.message} register={register('availability')} /><div><p className="text-sm font-bold">Online / offline</p><div className="mt-2 flex flex-wrap gap-2">{learningModes.map((mode) => <label key={mode} className="cursor-pointer"><input className="peer sr-only" type="radio" value={mode} {...register('learningMode')} /><span className="inline-flex rounded-full border border-ink/15 px-3 py-2 text-xs font-bold text-ink/60 peer-checked:border-violet peer-checked:bg-violet peer-checked:text-white">{mode}</span></label>)}</div>{errors.learningMode && <small className="text-coral">{errors.learningMode.message}</small>}</div><Navigation back={() => setStep(2)} next={() => continueTo(['primarySkill', 'skillLevel', 'learningSkills', 'availability', 'learningMode'])} /></>}
      {step === 4 && <><label className="flex gap-2 rounded-2xl bg-mint/50 p-4 text-sm leading-6 text-ink/70"><input type="checkbox" className="mt-1 accent-violet" {...register('terms')} />I agree to the Terms &amp; Conditions and community guidelines.</label>{errors.terms && <small className="text-coral">{errors.terms.message}</small>}{regError && <p role="alert" className="rounded-xl bg-coral/20 p-3 text-xs font-bold text-ink">{regError}</p>}<div className="flex gap-3"><Back onClick={() => setStep(3)} /><Button disabled={busy} className="flex-1 bg-violet text-white hover:bg-ink">{busy ? 'Building your profile...' : <>Create account <Check size={16} /></>}</Button></div></>}
    </form><p className="mt-5 text-center text-sm text-ink/55">Already a neighbour? <Link className="font-bold text-violet" to="/login">Sign in</Link></p></AuthShell>;
}
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <label className="block text-sm font-bold">{label}{children}{error && <small className="block text-coral">{error}</small>}</label>; }
function ChoiceGroup({ label, options, error, register }: { label: string; options: string[]; error?: string; register: UseFormRegisterReturn }) { return <div><p className="text-sm font-bold">{label}</p><div className="mt-2 flex flex-wrap gap-2">{options.map((option) => <label key={option} className="cursor-pointer"><input className="peer sr-only" type="checkbox" value={option} {...register} /><span className="inline-flex rounded-full border border-ink/15 px-3 py-2 text-xs font-bold text-ink/60 peer-checked:border-violet peer-checked:bg-violet peer-checked:text-white">{option}</span></label>)}</div>{error && <small className="text-coral">{error}</small>}</div>; }
function Back({ onClick }: { onClick: () => void }) { return <Button type="button" onClick={onClick} className="bg-white text-ink ring-1 ring-ink/10 hover:bg-ink/5"><ArrowLeft size={16} /> Back</Button>; }
function Next({ onClick }: { onClick: () => void }) { return <Button type="button" onClick={onClick} className="w-full bg-violet text-white hover:bg-ink">Continue <ArrowRight size={16} /></Button>; }
function Navigation({ back, next }: { back: () => void; next: () => void }) { return <div className="flex gap-3"><Back onClick={back} /><Button type="button" onClick={next} className="flex-1 bg-violet text-white hover:bg-ink">Continue <ArrowRight size={16} /></Button></div>; }
