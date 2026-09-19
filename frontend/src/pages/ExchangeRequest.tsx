import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Calendar, Clock, Send } from 'lucide-react';
import Navbar from '../components/Navbar';
import { Avatar, Button, ExchangeVis } from '../components/ui/Primitives';
import { api } from '../utils/api';

export default function ExchangeRequest() {
  const location = useLocation();
  const [targetUser, setTargetUser] = useState<any>(location.state?.matchedUser || null);

  const [message, setMessage] = useState(
    `Hi! I can help you learn and would love to exchange skills with you. Are you available this weekend?`
  );
  const [mode, setMode] = useState('online');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [senderSkillId, setSenderSkillId] = useState<string>('');
  const [receiverSkillId, setReceiverSkillId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadSkillsAndUsers = async () => {
      try {
        const me = await api.getMe();
        const myProfile = {
          id: me._id,
          full_name: me.name,
          location: me.location,
          primary_skill: me.primary_skill,
          learning_skills: me.learning_skills,
          skill_level: me.skill_level,
          bio: me.bio,
        };
        setCurrentUser(myProfile);

        let partner = location.state?.matchedUser;
        if (!partner) {
          const allProfiles = await api.getProfiles();
          partner = (allProfiles || []).find((p: any) => p.id !== me._id);
        }
        setTargetUser(partner);

        const dbSkills = await api.getSkills();

        if (dbSkills && dbSkills.length > 0) {
          const mySkillName = (myProfile?.primary_skill || '').toLowerCase();
          let mySkill = dbSkills.find(s => 
            s.name.toLowerCase() === mySkillName ||
            s.name.toLowerCase().includes(mySkillName) ||
            (mySkillName && mySkillName.includes(s.name.toLowerCase()))
          );
          if (!mySkill) mySkill = dbSkills[0];
          if (mySkill) setSenderSkillId(mySkill.id);

          const theirSkillName = (partner?.primary_skill || partner?.skillOffered || '').toLowerCase();
          let theirSkill = dbSkills.find(s => 
            s.name.toLowerCase() === theirSkillName ||
            s.name.toLowerCase().includes(theirSkillName) ||
            (theirSkillName && theirSkillName.includes(s.name.toLowerCase()))
          );
          if (!theirSkill) {
            theirSkill = dbSkills.find(s => s.id !== mySkill?.id) || dbSkills[0];
          }
          if (theirSkill) setReceiverSkillId(theirSkill.id);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading skills/profile:', err);
        setLoading(false);
      }
    };
    loadSkillsAndUsers();
  }, [location.state?.matchedUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const partnerId = targetUser?.id || targetUser?._id;
    if (!partnerId) {
      setErrorMsg('No recipient selected for exchange.');
      return;
    }
    if (!senderSkillId || !receiverSkillId) {
      setErrorMsg('Unable to determine skill IDs. Make sure both users have valid skills.');
      return;
    }
    setErrorMsg('');
    try {
      await api.createExchange({
        receiverId: partnerId,
        senderSkillId,
        receiverSkillId,
        message: `${message} [Mode: ${mode}]` + (date ? ` on ${date}` : '') + (time ? ` at ${time}` : '')
      });
      setSubmitted(true);
    } catch (err: any) {
      console.error('Failed to propose exchange:', err);
      setErrorMsg(err.message || 'Failed to send exchange request.');
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-surface text-ink">
        <Navbar />
        <section className="section-container py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-md text-center"
          >
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50">
              <Check size={36} className="text-emerald-500" />
            </div>
            <h2 className="mt-6 font-display text-3xl font-bold">Request Sent! 🎉</h2>
            <p className="mt-3 text-ink/55">
              Your skill swap request has been sent to {targetUser?.full_name || targetUser?.name || 'Partner'}. You'll be notified when they respond.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link to="/dashboard">
                <Button className="bg-gradient-to-r from-violet to-electric text-white">
                  Go to Dashboard
                </Button>
              </Link>
              <Link to="/explore">
                <Button className="bg-white text-ink ring-1 ring-ink/10">
                  Explore More Skills
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-surface text-ink">
        <Navbar />
        <div className="flex justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet border-t-transparent" />
        </div>
      </main>
    );
  }

  const partnerName = targetUser?.full_name || targetUser?.name || 'Partner';
  const partnerSkill = targetUser?.primary_skill || targetUser?.skillOffered || 'Skill';
  const partnerLocation = targetUser?.location || 'Nearby';

  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar />

      <section className="section-container py-10">
        <Link to="/match" className="inline-flex items-center gap-2 text-sm font-bold text-ink/50 hover:text-violet transition mb-6">
          <ArrowLeft size={16} /> Back to match
        </Link>

        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="eyebrow">New request</p>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Propose a Skill Swap</h1>
            <p className="mt-3 text-ink/55">
              Send a friendly request to start exchanging skills.
            </p>
          </motion.div>

          {/* Exchange Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8 rounded-3xl bg-white p-6 shadow-card border border-ink/5"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <Avatar name={partnerName} size="lg" showStatus status="online" />
                <div>
                  <h3 className="font-bold">{partnerName}</h3>
                  <p className="text-xs text-ink/50">{partnerLocation} · 🟢 Online</p>
                </div>
              </div>
              <span className="rounded-full bg-gradient-to-r from-violet to-electric px-3 py-1 text-[10px] font-bold text-white">
                92% Match
              </span>
            </div>

            <ExchangeVis 
              yourSkill={currentUser?.primary_skill || 'Your Skill'} 
              theirSkill={partnerSkill} 
            />
          </motion.div>

          {/* Request Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="mt-6 rounded-3xl bg-white p-6 shadow-card border border-ink/5 space-y-6"
          >
            {errorMsg && (
              <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100 text-sm font-bold text-rose-600">
                {errorMsg}
              </div>
            )}

            {/* Message */}
            <div>
              <label className="text-sm font-bold">
                Your Message
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="field mt-2 min-h-32 resize-y"
                  placeholder="Introduce yourself and suggest how you'd like to exchange skills..."
                  maxLength={500}
                />
              </label>
              <p className="mt-1 text-right text-[10px] text-ink/30">{message.length}/500</p>
            </div>

            {/* Preferred Mode */}
            <div>
              <p className="text-sm font-bold mb-2">Preferred Mode</p>
              <div className="flex gap-3">
                {[
                  { value: 'online', label: '🖥️ Online', desc: 'Video call / screen share' },
                  { value: 'offline', label: '🤝 Offline', desc: 'Meet in person' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMode(opt.value)}
                    className={`flex-1 rounded-2xl p-4 text-left transition border ${
                      mode === opt.value
                        ? 'border-violet bg-violet/5 ring-1 ring-violet/20'
                        : 'border-ink/10 hover:border-violet/30'
                    }`}
                  >
                    <p className="font-bold text-sm">{opt.label}</p>
                    <p className="text-xs text-ink/50 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-bold">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-violet" /> Preferred Date
                  </span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="field mt-2"
                  />
                </label>
              </div>
              <div>
                <label className="text-sm font-bold">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-violet" /> Preferred Time
                  </span>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="field mt-2"
                  />
                </label>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet to-electric text-white shadow-glow hover:scale-[1.02] py-4 text-base disabled:opacity-50"
            >
              <Send size={16} /> {loading ? 'Loading...' : 'Send Exchange Request'}
            </Button>
          </motion.form>
        </div>
      </section>
    </main>
  );
}
