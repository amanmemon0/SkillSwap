import { useEffect, useState } from 'react';
import { Award, BookOpen, Check, Edit3, GraduationCap, MapPin, Phone, Save, Star, User } from 'lucide-react';
import { api } from '../utils/api';
import { Button } from '../components/ui/Primitives';
import Navbar from '../components/Navbar';

type Profile = {
  id: string;
  full_name: string;
  username: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  primary_skill: string;
  skill_level: string;
  learning_skills: string[];
  availability: string[];
  learning_mode: string;
};

// Static simulated history data to make the profile look rich and complete
const mockTaughtHistory = [
  { id: 't1', title: 'React State Management & Hooks', student: 'Noah Williams', date: 'June 2026', reviews: 5 },
  { id: 't2', title: 'Web Development Basics (HTML/CSS)', student: 'Arjun Rao', date: 'May 2026', reviews: 4.8 }
];

const mockLearnedHistory = [
  { id: 'l1', title: 'Conversational Spanish', instructor: 'Meera Iyer', status: 'Ongoing (4/6 sessions)', date: 'Starts this week' },
  { id: 'l2', title: 'Figma Auto Layout & Components', instructor: 'Aisha Patel', status: 'Completed', date: 'July 2026' }
];

export default function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Form states for editing
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [primarySkill, setPrimarySkill] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [learningMode, setLearningMode] = useState('Both');

  useEffect(() => {
    const load = async () => {
      try {
        const user = await api.getMe();
        const p: Profile = {
          id: user._id,
          full_name: user.name,
          username: user.username || 'member',
          email: user.email,
          phone: user.phone || '',
          location: user.location,
          bio: user.bio || '',
          primary_skill: user.primary_skill || '',
          skill_level: user.skill_level || 'Intermediate',
          learning_skills: user.learning_skills || [],
          availability: user.availability || [],
          learning_mode: user.learning_mode || 'Both',
        };
        setProfile(p);
        setFullName(p.full_name);
        setLocation(p.location);
        setPhone(p.phone);
        setBio(p.bio);
        setPrimarySkill(p.primary_skill);
        setSkillLevel(p.skill_level);
        setLearningMode(p.learning_mode);
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    load();
  }, []);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    setMessage('');
    try {
      const updated = await api.updateProfile({
        name: fullName,
        location: location,
        phone: phone,
        bio: bio,
        primarySkill: primarySkill,
        skillLevel: skillLevel,
        learningMode: learningMode,
      });

      const p: Profile = {
        id: updated._id,
        full_name: updated.name,
        username: updated.username || 'member',
        email: updated.email,
        phone: updated.phone || '',
        location: updated.location,
        bio: updated.bio || '',
        primary_skill: updated.primary_skill || '',
        skill_level: updated.skill_level || 'Intermediate',
        learning_skills: updated.learning_skills || [],
        availability: updated.availability || [],
        learning_mode: updated.learning_mode || 'Both',
      };
      setProfile(p);
      setEditing(false);
      setMessage('Profile saved successfully.');
    } catch (error: any) {
      setMessage(error.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f5f2]">
        <p className="animate-pulse text-sm font-bold text-ink/50">Loading your profile…</p>
      </main>
    );
  }

  const initialLetter = profile.full_name.trim().charAt(0).toUpperCase() || '?';

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-ink pb-12">
      <Navbar />

      <section className="mx-auto max-w-6xl px-5 mt-4">
        {/* Profile Card Header */}
        <div className="overflow-hidden rounded-[2.5rem] bg-ink p-8 text-white sm:p-10 relative">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-violet blur-3xl opacity-50" />
          <p className="eyebrow text-mint relative z-10">Member Profile</p>
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
            <span className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-violet to-[#a99eff] text-4xl font-extrabold shadow-md">
              {initialLetter}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-4xl truncate">{profile.full_name}</h1>
              <p className="mt-1.5 text-white/60 text-sm font-medium">@{profile.username} · {profile.email}</p>
              <div className="mt-3 flex flex-wrap gap-4 items-center text-xs text-white/80">
                <span className="flex items-center gap-1"><MapPin size={14} className="text-mint" /> {profile.location}</span>
                <span className="flex items-center gap-1.5">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <b>4.9 Rating</b> (12 reviews)
                </span>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => {
                setEditing(!editing);
                setMessage('');
              }}
              className="mt-4 sm:mt-0 border border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              {editing ? 'Cancel' : <><Edit3 size={16} /> Edit Profile</>}
            </Button>
          </div>
        </div>

        {message && (
          <p className={`mt-5 flex items-center gap-2 rounded-2xl p-4 text-sm font-bold shadow-sm ${
            message.includes('success') ? 'bg-mint/80 text-emerald-950' : 'bg-coral/20 text-ink'
          }`}>
            <Check size={16} />
            {message}
          </p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
          {/* Main Column */}
          <div className="space-y-6">
            {/* About You Section */}
            <div className="rounded-[2rem] bg-white p-6 sm:p-8 shadow-sm border border-ink/5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="eyebrow text-ink/40">Your Story</p>
                  <h2 className="mt-1 font-display text-3xl">About You</h2>
                </div>
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-ink/50">
                      Full Name
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="field mt-2"
                      />
                    </label>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-ink/50">
                      Location
                      <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="field mt-2"
                      />
                    </label>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-ink/50">
                      Phone Number
                      <div className="relative mt-2">
                        <Phone size={15} className="absolute left-3.5 top-3.5 text-ink/40" />
                        <input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                          className="field pl-9"
                        />
                      </div>
                    </label>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-ink/50">
                      Primary Skill to Teach
                      <input
                        value={primarySkill}
                        onChange={(e) => setPrimarySkill(e.target.value)}
                        className="field mt-2"
                      />
                    </label>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-ink/50">
                      Skill Level
                      <select
                        value={skillLevel}
                        onChange={(e) => setSkillLevel(e.target.value)}
                        className="field mt-2"
                      >
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                        <option>Expert</option>
                      </select>
                    </label>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-ink/50">
                      Learning Mode
                      <select
                        value={learningMode}
                        onChange={(e) => setLearningMode(e.target.value)}
                        className="field mt-2"
                      >
                        <option>Online</option>
                        <option>Offline</option>
                        <option>Both</option>
                      </select>
                    </label>
                  </div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-ink/50 block">
                    Bio / Introduction
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="field mt-2 min-h-24 resize-y leading-relaxed"
                      maxLength={280}
                    />
                  </label>
                  <Button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="bg-violet text-white hover:bg-ink mt-2"
                  >
                    {saving ? 'Saving changes…' : <><Save size={16} /> Save Changes</>}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-sm leading-relaxed text-ink/75">{profile.bio || 'Add a friendly bio to introduce yourself to neighbors!'}</p>

                  <div className="grid gap-4 sm:grid-cols-3 border-t border-ink/5 pt-5 text-sm">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Phone</span>
                      <p className="mt-1 font-bold text-ink/80">{profile.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40">City</span>
                      <p className="mt-1 font-bold text-ink/80">{profile.location.split(',')[0]}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Joined SkillSwap</span>
                      <p className="mt-1 font-bold text-ink/80">July 2026</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Courses Taught / Teaching History */}
            <div className="rounded-[2rem] bg-white p-6 sm:p-8 shadow-sm border border-ink/5">
              <div className="flex items-center gap-2 mb-6">
                <GraduationCap className="text-violet" size={24} />
                <div>
                  <p className="eyebrow text-ink/40">Teaching History</p>
                  <h2 className="mt-0.5 font-display text-2xl">Classes You Led</h2>
                </div>
              </div>
              <div className="space-y-4">
                {mockTaughtHistory.map((course) => (
                  <div key={course.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-2xl bg-[#f7f5f2] border border-ink/5 gap-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-ink">{course.title}</h4>
                      <p className="text-xs text-ink/55 mt-1">Student: <b>{course.student}</b> · {course.date}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <Star size={13} className="text-amber-500 fill-amber-500" />
                      <span className="font-bold">{course.reviews}</span> Rating received
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Courses Taken / Learning History */}
            <div className="rounded-[2rem] bg-white p-6 sm:p-8 shadow-sm border border-ink/5">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="text-violet" size={22} />
                <div>
                  <p className="eyebrow text-ink/40">Learning History</p>
                  <h2 className="mt-0.5 font-display text-2xl">Lectures Enrolled In</h2>
                </div>
              </div>
              <div className="space-y-4">
                {mockLearnedHistory.map((course) => (
                  <div key={course.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-2xl bg-mint/10 border border-emerald-100 gap-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-ink">{course.title}</h4>
                      <p className="text-xs text-ink/55 mt-1">Instructor: <b>{course.instructor}</b> · {course.date}</p>
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        course.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-violet/10 text-violet'
                      }`}>
                        {course.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (Skills & Meta) */}
          <div className="space-y-6">
            {/* Rating Details Card */}
            <div className="rounded-[2rem] bg-gradient-to-br from-violet to-[#a99eff] p-6 text-white shadow-sm relative overflow-hidden">
              <Award className="absolute -right-6 -bottom-6 text-white/10 shrink-0" size={130} />
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Community Rating</p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-5xl font-black">4.9</span>
                <span className="text-white/70 text-sm font-medium">/ 5.0</span>
              </div>
              <div className="mt-3 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={15} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-6 text-xs text-white/80 leading-relaxed font-medium">
                Excellent rating based on 12 teaching and learning exchanges in Patan. Neighbors appreciate promptness and clear instructions.
              </p>
            </div>

            {/* Skills Card */}
            <div className="rounded-[2rem] bg-white p-6 shadow-sm border border-ink/5">
              <p className="eyebrow text-ink/40">Skills Profile</p>
              
              <div className="mt-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Teaches</span>
                <div className="mt-2 p-3.5 rounded-2xl bg-[#f7f5f2] border border-ink/5">
                  <p className="font-extrabold text-sm text-ink">{profile.primary_skill || 'No primary skill selected'}</p>
                  <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider bg-violet/10 text-violet px-2.5 py-0.5 rounded-full">
                    {profile.skill_level}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Wants to Learn</span>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {profile.learning_skills.length > 0 ? (
                    profile.learning_skills.map((skill) => (
                      <span key={skill} className="text-xs font-bold bg-mint text-emerald-950 px-3 py-1.5 rounded-full">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-ink/45 font-medium italic">No learning skills selected</span>
                  )}
                </div>
              </div>
            </div>

            {/* Settings & Availability Card */}
            <div className="rounded-[2rem] bg-white p-6 shadow-sm border border-ink/5 text-sm space-y-4">
              <p className="eyebrow text-ink/40">Preferences</p>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 block">Preferred Mode</span>
                <span className="mt-1 font-bold block text-ink/80">{profile.learning_mode} Learning</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 block">General Availability</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {profile.availability.length > 0 ? (
                    profile.availability.map((day) => (
                      <span key={day} className="text-[10px] font-bold uppercase tracking-wider bg-[#f7f5f2] text-ink/65 px-2.5 py-1 rounded-full border border-ink/5">
                        {day}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-ink/45 font-medium italic">No availability set</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
