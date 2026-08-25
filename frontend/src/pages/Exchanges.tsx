import { useEffect, useState, useCallback } from 'react';
import { BookOpen, Calendar, CheckCircle2, MessageSquare, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { api } from '../utils/api';
import { Avatar, ExchangeVis } from '../components/ui/Primitives';

type Exchange = {
  id: string;
  partnerName: string;
  teachSkill: string;
  learnSkill: string;
  status: 'Active' | 'Pending' | 'Completed' | 'Cancelled';
  date: string;
  avatar: string;
  progress: number;
  isReceiver: boolean;
};

const progressSteps = ['Requested', 'Accepted', 'Scheduled', 'Completed'];

export default function Exchanges() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [dbExchanges, setDbExchanges] = useState<any[]>([]);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Pending' | 'Completed'>('All');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchExchanges = useCallback(async (userId: string) => {
    try {
      const data = await api.getExchanges();
      setDbExchanges(data);
      const mapped = data.map((ex: any): Exchange => {
        const isSender = ex.sender_id === userId;
        const partner = isSender ? ex.receiver : ex.sender;
        const partnerName = partner?.full_name || 'Member';
        
        let displayStatus: 'Active' | 'Pending' | 'Completed' | 'Cancelled' = 'Pending';
        if (ex.status === 'matched') displayStatus = 'Active';
        else if (ex.status === 'completed') displayStatus = 'Completed';
        else if (ex.status === 'sender_cancelled' || ex.status === 'receiver_declined') displayStatus = 'Cancelled';

        let progress = 25;
        if (displayStatus === 'Active') progress = 75;
        else if (displayStatus === 'Completed') progress = 100;
        else if (displayStatus === 'Cancelled') progress = 0;

        return {
          id: ex.id,
          partnerName,
          teachSkill: isSender ? ex.sender_skill_name : ex.receiver_skill_name,
          learnSkill: isSender ? ex.receiver_skill_name : ex.sender_skill_name,
          status: displayStatus,
          date: new Date(ex.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
          avatar: partnerName.charAt(0).toUpperCase() || 'M',
          progress,
          isReceiver: !isSender
        };
      });
      setExchanges(mapped);
    } catch (err) {
      console.error('Failed to fetch exchanges:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const getProfileAndExchanges = async () => {
      try {
        const user = await api.getMe();
        setProfile(user);
        await fetchExchanges(user._id);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    getProfileAndExchanges();
  }, [fetchExchanges]);

  const handleUpdateStatus = async (id: string, newStatus: 'Active' | 'Completed' | 'Cancelled') => {
    try {
      const dbEx = dbExchanges.find(x => x.id === id);
      if (!dbEx) return;

      const isSender = dbEx.sender_id === profile?._id;
      let targetStatus = '';
      if (newStatus === 'Active') {
        targetStatus = 'matched';
      } else if (newStatus === 'Completed') {
        targetStatus = 'completed';
      } else if (newStatus === 'Cancelled') {
        targetStatus = isSender ? 'sender_cancelled' : 'receiver_declined';
      }

      await api.updateExchangeStatus(id, targetStatus);
      await fetchExchanges(profile?._id);
    } catch (err: any) {
      console.error('Failed to update status:', err);
      alert(err.message || 'Failed to update status.');
    }
  };

  const filtered = exchanges.filter((ex) => filter === 'All' || ex.status === filter);

  // Statistics
  const activeCount = exchanges.filter((ex) => ex.status === 'Active').length;
  const pendingCount = exchanges.filter((ex) => ex.status === 'Pending').length;
  const completedCount = exchanges.filter((ex) => ex.status === 'Completed').length;

  if (loading) {
    return (
      <main className="min-h-screen bg-surface text-ink">
        <Navbar variant="auth" />
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-sm font-bold text-ink/50">Loading exchanges...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar variant="auth" />

      <section className="mx-auto max-w-6xl px-5 pb-12 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="eyebrow text-violet">Your learning path</p>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">My Exchanges</h1>
          <p className="mt-2 text-sm text-ink/55">
            Manage your teaching and learning partnerships, scheduling, and progress.
          </p>
        </motion.div>

        {/* Stats Section */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <div className="rounded-2xl bg-white p-5 shadow-card border border-ink/5 hover-lift">
            <span className="text-xs font-bold uppercase tracking-wider text-ink/40">Active Exchanges</span>
            <p className="mt-2 text-3xl font-extrabold text-ink">{activeCount}</p>
            <div className="mt-2 h-1 rounded-full bg-ink/5">
              <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-violet to-electric" />
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-card border border-ink/5 hover-lift">
            <span className="text-xs font-bold uppercase tracking-wider text-ink/40">Pending Approval</span>
            <p className="mt-2 text-3xl font-extrabold text-violet">{pendingCount}</p>
            <div className="mt-2 h-1 rounded-full bg-ink/5">
              <div className="h-full w-1/3 rounded-full bg-warmyellow" />
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-card border border-ink/5 hover-lift">
            <span className="text-xs font-bold uppercase tracking-wider text-ink/40">Completed Swaps</span>
            <p className="mt-2 text-3xl font-extrabold text-emerald-600">{completedCount}</p>
            <div className="mt-2 h-1 rounded-full bg-ink/5">
              <div className="h-full rounded-full bg-emerald-400" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-ink/5 pb-4 mb-6">
          {(['All', 'Active', 'Pending', 'Completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                filter === tab
                  ? 'bg-gradient-to-r from-violet to-electric text-white shadow-sm'
                  : 'text-ink/60 hover:bg-white hover:text-ink'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Exchanges List */}
        <div className="space-y-4">
          {filtered.length > 0 ? (
            filtered.map((ex, i) => (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-3xl bg-white p-6 shadow-card hover-lift border border-ink/5"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar name={ex.partnerName} size="lg" showStatus status={ex.status === 'Active' ? 'online' : 'offline'} />
                    <div>
                      <h3 className="font-display text-lg font-bold">{ex.partnerName}</h3>
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-ink/50">
                        <Calendar size={13} /> {ex.date}
                      </p>
                    </div>
                  </div>

                  <ExchangeVis yourSkill={ex.teachSkill} theirSkill={ex.learnSkill} compact />

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                        ex.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : ex.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700'
                            : ex.status === 'Completed'
                              ? 'bg-violet/10 text-violet'
                              : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {ex.status}
                    </span>

                    <div className="flex gap-1.5">
                      {ex.status === 'Pending' && ex.isReceiver && (
                        <button
                          title="Accept Exchange"
                          onClick={() => handleUpdateStatus(ex.id, 'Active')}
                          className="rounded-xl p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      {ex.status === 'Active' && (
                        <button
                          title="Mark Complete"
                          onClick={() => handleUpdateStatus(ex.id, 'Completed')}
                          className="rounded-xl p-2 bg-violet/10 text-violet hover:bg-violet hover:text-white transition"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      {(ex.status === 'Active' || ex.status === 'Pending') && (
                        <button
                          title="Cancel/Decline Exchange"
                          onClick={() => handleUpdateStatus(ex.id, 'Cancelled')}
                          className="rounded-xl p-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                      <button
                        title="Send Message"
                        className="rounded-xl p-2 bg-surface text-ink/60 hover:bg-ink hover:text-white transition"
                      >
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {ex.status !== 'Cancelled' && (
                  <div className="mt-5 pt-4 border-t border-ink/5">
                    <div className="flex items-center justify-between mb-2">
                      {progressSteps.map((step, idx) => {
                        const stepPercent = (idx + 1) * 25;
                        const isComplete = ex.progress >= stepPercent;
                        const isCurrent = ex.progress >= stepPercent - 25 && ex.progress < stepPercent;
                        return (
                          <div key={step} className="flex items-center gap-1.5">
                            <span
                              className={`grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold ${
                                isComplete
                                  ? 'bg-violet text-white'
                                  : isCurrent
                                    ? 'bg-electric/20 text-electric ring-2 ring-electric/30'
                                    : 'bg-ink/5 text-ink/30'
                              }`}
                            >
                              {isComplete ? '✓' : idx + 1}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider ${
                                isComplete ? 'text-violet' : isCurrent ? 'text-electric' : 'text-ink/25'
                              }`}
                            >
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="h-1.5 rounded-full bg-ink/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${ex.progress}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-violet to-electric"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center rounded-3xl bg-white p-16 border border-ink/5 shadow-card">
              <span className="text-5xl">📚</span>
              <p className="mt-4 font-display text-xl font-bold">No exchanges found</p>
              <p className="mt-2 text-sm text-ink/50">Try switching your filter selection.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
