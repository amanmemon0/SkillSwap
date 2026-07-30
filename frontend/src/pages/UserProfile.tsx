import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, LogOut, MapPin, Pencil, Save } from 'lucide-react'
import { api } from '../utils/api'
import { Avatar, Button } from '../components/ui/Primitives'

type Profile = { id: string; full_name: string; location: string; email: string }

export default function UserProfile() {
  const nav = useNavigate(); const [profile, setProfile] = useState<Profile | null>(null); const [editing, setEditing] = useState(false); const [saving, setSaving] = useState(false); const [message, setMessage] = useState('')
  useEffect(() => {
    const load = async () => {
      try {
        const user = await api.getMe();
        setProfile({
          id: user._id,
          full_name: user.name,
          location: user.location,
          email: user.email,
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    load();
  }, []);
  const update = (key: 'full_name' | 'location', value: string) => setProfile(current => current ? { ...current, [key]: value } : current)
  const save = async () => {
    if (!profile) return;
    setSaving(true);
    setMessage('');
    try {
      const updated = await api.updateProfile({
        name: profile.full_name,
        location: profile.location,
      });
      setProfile({
        id: updated._id,
        full_name: updated.name,
        location: updated.location,
        email: updated.email,
      });
      setEditing(false);
      setMessage('Profile saved successfully.');
    } catch (error: any) {
      setMessage(error.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };
  const logout = () => {
    api.logout();
    nav('/login');
  };
  if (!profile) return <main className="grid min-h-screen place-items-center bg-[#f7f5f2]"><p className="animate-pulse text-sm font-bold text-ink/50">Loading your profile…</p></main>
  return <main className="min-h-screen bg-[#f7f5f2]"><header className="mx-auto flex max-w-4xl items-center justify-between px-5 py-6"><Link to="/dashboard" className="flex items-center gap-2 text-sm font-extrabold text-ink/65 hover:text-ink"><ArrowLeft size={17}/> Back to discover</Link><button type="button" onClick={logout} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-ink/60 hover:text-coral"><LogOut size={15}/> Log out</button></header><section className="mx-auto max-w-4xl px-5 pb-12"><div className="overflow-hidden rounded-[2rem] bg-ink p-7 text-white sm:p-10"><p className="eyebrow text-mint">Member profile</p><div className="mt-6 flex items-center gap-5"><span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-violet to-[#a99eff] text-3xl font-extrabold">{profile.full_name.trim().charAt(0).toUpperCase() || '?'}</span><div><h1 className="font-display text-4xl">{profile.full_name}</h1><p className="mt-1 text-sm text-white/60">{profile.email}</p></div></div></div><div className="mt-5 rounded-3xl bg-white p-6 sm:p-8"><div className="flex items-center justify-between"><div><p className="eyebrow">Your details</p><h2 className="mt-1 font-display text-3xl">About you</h2></div><Button type="button" onClick={()=>{setEditing(!editing);setMessage('')}} className="border border-ink/10 bg-white text-ink hover:bg-ink/5">{editing ? 'Cancel' : <><Pencil size={16}/> Edit profile</>}</Button></div><div className="mt-8 grid gap-6 sm:grid-cols-2"><label className="text-sm font-bold">Full name<input value={profile.full_name} onChange={e=>update('full_name',e.target.value)} disabled={!editing} className="field mt-2 disabled:cursor-default disabled:text-ink/65"/></label><label className="text-sm font-bold">Location<div className="relative mt-2"><MapPin size={16} className="absolute left-0 top-3 text-ink/40"/><input value={profile.location} onChange={e=>update('location',e.target.value)} disabled={!editing} className="field pl-6 disabled:cursor-default disabled:text-ink/65"/></div></label></div>{message&&<p className={`mt-6 flex items-center gap-2 rounded-xl p-3 text-sm font-bold ${message.includes('success')?'bg-mint text-emerald-900':'bg-coral/20 text-ink'}`}><Check size={16}/>{message}</p>}{editing&&<Button type="button" onClick={save} disabled={saving} className="mt-7 bg-violet text-white hover:bg-ink">{saving?'Saving…':<><Save size={16}/> Save changes</>}</Button>}</div></section></main>
}
