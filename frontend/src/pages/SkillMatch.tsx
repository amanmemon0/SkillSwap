import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowRightLeft, MapPin, MessageCircle, Star, UserCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import { Avatar, Button, MatchScore, SkillTag } from '../components/ui/Primitives';
import { supabase } from '../auth/supabaseClient';
import { api } from '../utils/api';

export default function SkillMatch() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [matchedUser, setMatchedUser] = useState<any>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const me = await api.getMe();
        setCurrentUser({
          id: me._id,
          full_name: me.name,
          location: me.location,
          primary_skill: me.primary_skill,
          learning_skills: me.learning_skills,
          skill_level: me.skill_level,
          bio: me.bio,
        });

        // Fetch another user
        const allProfiles = await api.getProfiles();
        const otherUser = (allProfiles || []).find((p: any) => p.id !== me._id);
        
        if (otherUser) {
          setMatchedUser(otherUser);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
  }, []);

  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar />

      <section className="section-container py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
            <UserCheck size={16} /> Match Found!
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold sm:text-5xl">
            We Found a{' '}
            <span className="gradient-text">Potential Match!</span>
          </h1>
          <p className="mt-4 text-ink/55 max-w-lg mx-auto">
            Based on your skills and interests, this person looks like a great swap partner.
          </p>
        </motion.div>

        {/* Match Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mx-auto max-w-4xl"
        >
          <div className="rounded-[2.5rem] bg-white p-8 sm:p-10 shadow-float border border-ink/5">
            {/* Match Score */}
            <div className="text-center mb-8">
              <MatchScore score={matchedUser ? (matchedUser.rating ? Math.round(Number(matchedUser.rating) * 20) : 92) : 92} size={80} />
              <p className="mt-3 font-display text-lg font-bold">{matchedUser ? (matchedUser.rating ? Math.round(Number(matchedUser.rating) * 20) : 92) : 92}% Match</p>
              <p className="text-xs text-ink/50">Excellent compatibility</p>
            </div>

            {/* Two Profile Cards */}
            <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
              {/* Your Profile */}
              <div className="rounded-3xl bg-gradient-card p-6 text-center border border-violet/10">
                <p className="eyebrow text-violet/60">You</p>
                <div className="mt-4 mx-auto">
                  <Avatar name={currentUser?.full_name || 'Member'} size="xl" showStatus status="online" />
                </div>
                <h3 className="mt-3 font-display text-xl font-bold">{currentUser?.full_name || 'Member'}</h3>
                <p className="mt-1 flex items-center justify-center gap-1 text-xs text-ink/50">
                  <MapPin size={11} /> {currentUser?.location || 'Nearby'}
                </p>

                <div className="mt-5 rounded-2xl bg-white p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">You offer</p>
                  <div className="mt-3 flex justify-center">
                    <span className="text-3xl">💻</span>
                  </div>
                  <p className="mt-2 font-bold">{currentUser?.primary_skill || 'Skills'}</p>
                  <div className="mt-2">
                    <SkillTag skill={currentUser?.primary_skill || 'Skills'} />
                  </div>
                </div>

                <div className="mt-3 rounded-2xl bg-violet/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-violet/60">You want</p>
                  <div className="mt-3 flex justify-center">
                    <span className="text-3xl">🎸</span>
                  </div>
                  <p className="mt-2 font-bold">{Array.isArray(currentUser?.learning_skills) && currentUser.learning_skills[0] ? currentUser.learning_skills[0] : 'Guitar'}</p>
                </div>

                <div className="mt-4 flex items-center justify-center gap-1 text-xs">
                  <Star size={12} className="text-warmyellow fill-warmyellow" />
                  <span className="font-bold">{currentUser?.rating ? Number(currentUser.rating).toFixed(1) : '4.8'}</span>
                  <span className="text-ink/40">· {currentUser?.completed_swaps || 12} exchanges</span>
                </div>
              </div>

              {/* Exchange Arrow */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex flex-col items-center gap-2 py-4"
              >
                <div className="rounded-full bg-gradient-to-r from-violet to-electric p-4 shadow-glow">
                  <ArrowRightLeft size={28} className="text-white" />
                </div>
                <p className="text-xs font-bold text-violet">Skill Swap</p>
              </motion.div>

              {/* Matched User Profile */}
              <div className="rounded-3xl bg-gradient-card p-6 text-center border border-electric/10">
                <p className="eyebrow text-electric/60">Matched</p>
                <div className="mt-4 mx-auto">
                  <Avatar name={matchedUser?.full_name || 'Member'} size="xl" showStatus status="online" />
                </div>
                <h3 className="mt-3 font-display text-xl font-bold">{matchedUser?.full_name || 'Member'}</h3>
                <p className="mt-1 flex items-center justify-center gap-1 text-xs text-ink/50">
                  <MapPin size={11} /> {matchedUser?.location || 'Nearby'} · 1.2 km away
                </p>

                <div className="mt-5 rounded-2xl bg-white p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">They offer</p>
                  <div className="mt-3 flex justify-center">
                    <span className="text-3xl">🎸</span>
                  </div>
                  <p className="mt-2 font-bold">{matchedUser?.primary_skill || 'Skills'}</p>
                  <div className="mt-2">
                    <SkillTag skill={matchedUser?.primary_skill || 'Skills'} />
                  </div>
                </div>

                <div className="mt-3 rounded-2xl bg-electric/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-electric/60">They want</p>
                  <div className="mt-3 flex justify-center">
                    <span className="text-3xl">💻</span>
                  </div>
                  <p className="mt-2 font-bold">{Array.isArray(matchedUser?.learning_skills) && matchedUser.learning_skills[0] ? matchedUser.learning_skills[0] : 'Web Development'}</p>
                </div>

                <div className="mt-4 flex items-center justify-center gap-1 text-xs">
                  <Star size={12} className="text-warmyellow fill-warmyellow" />
                  <span className="font-bold">{matchedUser?.rating ? Number(matchedUser.rating).toFixed(1) : '4.9'}</span>
                  <span className="text-ink/40">· {matchedUser?.completed_swaps || 8} exchanges</span>
                </div>
              </div>
            </div>

            {/* Why This Match */}
            <div className="mt-8 rounded-2xl bg-emerald-50 p-5 border border-emerald-100">
              <h4 className="font-bold text-emerald-800 text-sm">Why this match works ✨</h4>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="flex items-center gap-2 text-xs text-emerald-700">
                  <span className="h-5 w-5 rounded-full bg-emerald-200 grid place-items-center text-[10px]">✓</span>
                  Skills perfectly complement
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-700">
                  <span className="h-5 w-5 rounded-full bg-emerald-200 grid place-items-center text-[10px]">✓</span>
                  Both available evenings
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-700">
                  <span className="h-5 w-5 rounded-full bg-emerald-200 grid place-items-center text-[10px]">✓</span>
                  Nearby location
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link to="/exchange-request" state={{ matchedUser }}>
                <Button className="w-full sm:w-auto bg-gradient-to-r from-violet to-electric text-white shadow-glow hover:scale-105 px-8">
                  <MessageCircle size={16} /> Propose Exchange
                </Button>
              </Link>
              <Button className="bg-white text-ink ring-1 ring-ink/10 hover:bg-violet/5 hover:text-violet">
                View Full Profile <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
