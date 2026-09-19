import { useEffect, useState } from 'react';
import { Award, BookOpen, Calendar, Check, Clock, Edit3, GraduationCap, MapPin, Phone, Save, Star, User, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Avatar, Button, SkillTag, StatusDot } from '../components/ui/Primitives';
import { ProgressBar } from '../components/ui/ProgressBar';
import Navbar from '../components/Navbar';
import { SkillRequestPanel } from '../features/skill-management/SkillManagement';
import { skillManagementApi } from '../features/skill-management/api';
import { useLearningStore } from '../data/learningMockData';

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

export default function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const nav = useNavigate();
  const store = useLearningStore();
  const myTeachingCourses = store.getMyTeachingCourses();
  const myLearning = store.getMyLearning();
  const taughtHistory = myTeachingCourses.map(course => ({ id: course.id, title: course.skillName, student: `${course.enrolledCount} enrolled`, date: '', reviews: 0 }));
  const learnedHistory = myLearning.map(enrollment => {
    const course = store.courses.find(item => item.id === enrollment.courseId);
    return { id: enrollment.id, title: course?.skillName || 'Course', instructor: course?.teacherName || 'Teacher', status: enrollment.examStatus, date: enrollment.enrolledAt };
  });

  // Form states for editing
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [primarySkill, setPrimarySkill] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [learningMode, setLearningMode] = useState('Both');
  const [approvedSkills, setApprovedSkills] = useState<string[]>([]);

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

  useEffect(() => {
    void skillManagementApi.getCategories().then((categories) =>
      setApprovedSkills(categories.flatMap((category) => category.skills)),
    );
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
      <main className="grid min-h-screen place-items-center bg-surface">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-violet/10 animate-pulse" />
          <p className="mt-4 text-sm font-bold text-ink/50">Loading your profile…</p>
        </div>
      </main>
    );
  }

  const initialLetter = profile.full_name.trim().charAt(0).toUpperCase() || '?';

  return (
    <main className="min-h-screen bg-surface text-ink pb-12">
      <Navbar variant="auth" />

      <section className="mx-auto max-w-6xl px-5 mt-6 sm:px-8">
        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-ink via-violet/90 to-electric p-8 text-white sm:p-10 relative"
        >
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-electric/20 blur-3xl" />
          <div className="absolute -left-16 -bottom-16 h-60 w-60 rounded-full bg-violet/30 blur-3xl" />

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Avatar name={profile.full_name} size="xl" showStatus status="online" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-3xl font-bold sm:text-4xl truncate">{profile.full_name}</h1>
                  <StatusDot status="online" />
                </div>
                <p className="mt-1.5 text-white/60 text-sm font-medium">@{profile.username} · {profile.email}</p>
                <div className="mt-3 flex flex-wrap gap-4 items-center text-xs text-white/80">
                  <span className="flex items-center gap-1">
                    <MapPin size={14} className="text-cyan" /> {profile.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star size={14} className="text-warmyellow fill-warmyellow" />
                    <b>4.9 Rating</b> (12 reviews)
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => { setEditing(!editing); setMessage(''); }}
                  className="border border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  {editing ? 'Cancel' : <><Edit3 size={16} /> Edit Profile</>}
                </Button>
                {!editing && (
                  <Button className="bg-gradient-to-r from-cyan to-electric text-white hover:shadow-glow-blue">
                    Propose Skill Swap
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4 rounded-2xl bg-white/10 backdrop-blur-sm p-4">
              <div className="text-center">
                <p className="text-2xl font-extrabold">12</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Exchanges</p>
              </div>
              <div className="text-center border-x border-white/20">
                <p className="text-2xl font-extrabold">4.9</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Rating</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold">8</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Skills</p>
              </div>
            </div>
          </div>
        </motion.div>

        {message && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-5 flex items-center gap-2 rounded-2xl p-4 text-sm font-bold shadow-sm ${
              message.includes('success') ? 'bg-emerald-50 text-emerald-800' : 'bg-coral/20 text-ink'
            }`}
          >
            <Check size={16} />
            {message}
          </motion.p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
          {/* Main Column */}
          <div className="space-y-6">
            {/* About Section */}
            <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-card border border-ink/5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="eyebrow text-ink/40">Your Story</p>
                  <h2 className="mt-1 font-display text-2xl font-bold">About You</h2>
                </div>
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-ink/50">
                      Full Name
                      <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="field mt-2" />
                    </label>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-ink/50">
                      Location
                      <input value={location} onChange={(e) => setLocation(e.target.value)} className="field mt-2" />
                    </label>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-ink/50">
                      Phone Number
                      <div className="relative mt-2">
                        <Phone size={15} className="absolute left-3.5 top-3.5 text-ink/40" />
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +91 98765 43210" className="field pl-9" />
                      </div>
                    </label>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-ink/50">
                      Primary Skill to Teach
                      <select value={primarySkill} onChange={(e) => setPrimarySkill(e.target.value)} className="field mt-2">
                        <option value="">Select an approved skill</option>
                        {approvedSkills.map((skill) => <option key={skill}>{skill}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-ink/50">
                      Skill Level
                      <select value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)} className="field mt-2">
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                        <option>Expert</option>
                      </select>
                    </label>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-ink/50">
                      Learning Mode
                      <select value={learningMode} onChange={(e) => setLearningMode(e.target.value)} className="field mt-2">
                        <option>Online</option>
                        <option>Offline</option>
                        <option>Both</option>
                      </select>
                    </label>
                  </div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-ink/50 block">
                    Bio / Introduction
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="field mt-2 min-h-24 resize-y leading-relaxed" maxLength={280} />
                  </label>
                  <Button type="button" onClick={save} disabled={saving} className="bg-gradient-to-r from-violet to-electric text-white hover:shadow-glow mt-2">
                    {saving ? 'Saving changes…' : <><Save size={16} /> Save Changes</>}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-sm leading-relaxed text-ink/75">
                    {profile.bio || 'Add a friendly bio to introduce yourself to the community!'}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-3 border-t border-ink/5 pt-5 text-sm">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Phone</span>
                      <p className="mt-1 font-bold text-ink/80">{profile.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Location</span>
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

            {/* Skills I Can Teach */}
            <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-card border border-ink/5">
              <div className="flex items-center gap-2 mb-5">
                <GraduationCap className="text-violet" size={22} />
                <h2 className="font-display text-xl font-bold">Skills I Can Teach</h2>
              </div>
              {profile.primary_skill ? (
                <div className="flex flex-wrap gap-2">
                  <SkillTag skill={profile.primary_skill} size="md" />
                  <span className="rounded-full bg-violet/10 px-3 py-2 text-xs font-bold text-violet">
                    {profile.skill_level}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-ink/45 italic">No teaching skill selected yet</p>
              )}
            </div>

            {/* Skills I Want To Learn */}
            <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-card border border-ink/5">
              <div className="flex items-center gap-2 mb-5">
                <BookOpen className="text-electric" size={22} />
                <h2 className="font-display text-xl font-bold">Skills I Want To Learn</h2>
              </div>
              {profile.learning_skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.learning_skills.map((skill) => (
                    <SkillTag key={skill} skill={skill} size="md" />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink/45 italic">No learning skills selected yet</p>
              )}
            </div>

            {/* Teaching History */}
            <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-card border border-ink/5">
              <div className="flex items-center gap-2 mb-6">
                <GraduationCap className="text-violet" size={22} />
                <div>
                  <p className="eyebrow text-ink/40">Teaching History</p>
                  <h2 className="mt-0.5 font-display text-xl font-bold">Classes You Led</h2>
                </div>
              </div>
              <div className="space-y-3">
                {taughtHistory.map((course) => (
                  <div key={course.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-2xl bg-surface border border-ink/5 gap-3">
                    <div>
                      <h4 className="font-bold text-sm">{course.title}</h4>
                      <p className="text-xs text-ink/55 mt-1">Student: <b>{course.student}</b> · {course.date}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <Star size={13} className="text-warmyellow fill-warmyellow" />
                      <span className="font-bold">{course.reviews}</span> Rating
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning History */}
            <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-card border border-ink/5">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="text-electric" size={22} />
                <div>
                  <p className="eyebrow text-ink/40">Learning History</p>
                  <h2 className="mt-0.5 font-display text-xl font-bold">Lectures Enrolled In</h2>
                </div>
              </div>
              <div className="space-y-3">
                {learnedHistory.map((course) => (
                  <div key={course.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 gap-3">
                    <div>
                      <h4 className="font-bold text-sm">{course.title}</h4>
                      <p className="text-xs text-ink/55 mt-1">Instructor: <b>{course.instructor}</b> · {course.date}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      course.status === 'passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-violet/10 text-violet'
                    }`}>
                      {course.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Rating Card */}
            <div className="rounded-3xl bg-gradient-to-br from-violet to-electric p-6 text-white shadow-card relative overflow-hidden">
              <Award className="absolute -right-4 -bottom-4 text-white/10" size={100} />
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Community Rating</p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-5xl font-black">4.9</span>
                <span className="text-white/70 text-sm font-medium">/ 5.0</span>
              </div>
              <div className="mt-3 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={15} className="fill-warmyellow text-warmyellow" />
                ))}
              </div>
              <p className="mt-5 text-xs text-white/70 leading-relaxed">
                Excellent rating based on 12 teaching and learning exchanges. Neighbors appreciate promptness and clear instructions.
              </p>
            </div>

            {/* Skills Card */}
            <div className="rounded-3xl bg-white p-6 shadow-card border border-ink/5">
              <p className="eyebrow text-ink/40">Skills Profile</p>

              <div className="mt-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Teaches</span>
                <div className="mt-2 p-3.5 rounded-2xl bg-surface border border-ink/5">
                  <p className="font-bold text-sm">{profile.primary_skill || 'No primary skill selected'}</p>
                  <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider bg-violet/10 text-violet px-2.5 py-0.5 rounded-full">
                    {profile.skill_level}
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Wants to Learn</span>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {profile.learning_skills.length > 0 ? (
                    profile.learning_skills.map((skill) => (
                      <SkillTag key={skill} skill={skill} />
                    ))
                  ) : (
                    <span className="text-xs text-ink/45 italic">No learning skills selected</span>
                  )}
                </div>
              </div>
            </div>

            <SkillRequestPanel member={{ id: profile.id, name: profile.full_name, email: profile.email }} />

            {/* Availability */}
            <div className="rounded-3xl bg-white p-6 shadow-card border border-ink/5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={16} className="text-violet" />
                <p className="font-bold text-sm">Availability</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.availability.length > 0 ? (
                  profile.availability.map((day) => (
                    <span key={day} className="text-[10px] font-bold uppercase tracking-wider bg-surface text-ink/65 px-2.5 py-1 rounded-full border border-ink/5">
                      {day}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-ink/45 italic">No availability set</span>
                )}
              </div>
            </div>

            {/* Exchange Preferences */}
            <div className="rounded-3xl bg-white p-6 shadow-card border border-ink/5 text-sm space-y-4">
              <p className="eyebrow text-ink/40">Preferences</p>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 block">Preferred Mode</span>
                <span className="mt-1 font-bold block text-ink/80">{profile.learning_mode} Learning</span>
              </div>

              <div className="flex gap-2">
                {['Online', 'Offline'].map((mode) => (
                  <span
                    key={mode}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      profile.learning_mode === mode || profile.learning_mode === 'Both'
                        ? 'bg-violet/10 text-violet'
                        : 'bg-surface text-ink/30'
                    }`}
                  >
                    {mode === 'Online' ? '🖥️' : '🤝'} {mode}
                  </span>
                ))}
              </div>
            </div>

            {/* Skills I Teach */}
            <div className="rounded-3xl bg-white p-6 shadow-card border border-ink/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GraduationCap size={16} className="text-violet" />
                  <p className="font-bold text-sm">Skills I Teach</p>
                </div>
                <button onClick={() => nav('/teaching')} className="text-xs font-bold text-violet hover:text-ink transition">View all →</button>
              </div>
              {myTeachingCourses.length > 0 ? (
                <div className="space-y-2">
                  {myTeachingCourses.map(course => {
                    const enrollments = store.getCourseEnrollments(course.id);
                    return (
                      <div
                        key={course.id}
                        onClick={() => nav(`/teaching/${course.id}`)}
                        className="flex items-center gap-3 rounded-xl bg-surface p-3 hover:bg-violet/5 transition cursor-pointer"
                      >
                        <span className="text-xl">{course.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{course.skillName}</p>
                          <p className="text-xs text-ink/40">{enrollments.length} learners</p>
                        </div>
                        <ChevronRight size={14} className="text-ink/25" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-ink/40 italic">Not teaching any courses yet</p>
              )}
            </div>

            {/* Skills I'm Learning */}
            <div className="rounded-3xl bg-white p-6 shadow-card border border-ink/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-electric" />
                  <p className="font-bold text-sm">Skills I'm Learning</p>
                </div>
                <button onClick={() => nav('/learning')} className="text-xs font-bold text-violet hover:text-ink transition">View all →</button>
              </div>
              {myLearning.length > 0 ? (
                <div className="space-y-2">
                  {myLearning.map(enrollment => {
                    const course = store.courses.find(c => c.id === enrollment.courseId);
                    if (!course) return null;
                    return (
                      <div
                        key={enrollment.id}
                        onClick={() => nav(`/learning/${course.id}`)}
                        className="flex items-center gap-3 rounded-xl bg-surface p-3 hover:bg-violet/5 transition cursor-pointer"
                      >
                        <span className="text-xl">{course.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{course.skillName}</p>
                          <p className="text-xs text-ink/40">from {course.teacherName}</p>
                        </div>
                        <div className="w-16">
                          <ProgressBar value={enrollment.lecturesCompleted} max={course.totalLectures} size="sm" showLabel={false} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-ink/40 italic">Not enrolled in any courses yet</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
