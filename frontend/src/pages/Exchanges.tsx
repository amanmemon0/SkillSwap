import { useEffect, useState } from 'react';
import { BookOpen, Calendar, CheckCircle2, MessageSquare, RefreshCw, XCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { api } from '../utils/api';
import { Button } from '../components/ui/Primitives';

type Exchange = {
  id: string;
  partnerName: string;
  teachSkill: string;
  learnSkill: string;
  status: 'Active' | 'Pending' | 'Completed' | 'Cancelled';
  date: string;
  avatar: string;
};

const initialExchanges: Exchange[] = [
  { id: '1', partnerName: 'Meera Iyer', teachSkill: 'React Basics', learnSkill: 'Spanish Conversation', status: 'Active', date: 'Thursdays, 6:00 PM', avatar: 'M' },
  { id: '2', partnerName: 'Rohan Kapoor', teachSkill: 'UI/UX Fundamentals', learnSkill: 'Street Photography', status: 'Pending', date: 'TBD', avatar: 'R' },
  { id: '3', partnerName: 'Tara Singh', teachSkill: 'Introduction to Python', learnSkill: 'Excel for Small Business', status: 'Completed', date: 'Completed on July 15', avatar: 'T' },
  { id: '4', partnerName: 'Sofia Chen', teachSkill: 'Tailwind CSS Tips', learnSkill: 'Lightroom Editing', status: 'Cancelled', date: 'Cancelled', avatar: 'S' }
];

export default function Exchanges() {
  const [exchanges, setExchanges] = useState<Exchange[]>(initialExchanges);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Pending' | 'Completed'>('All');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const getProfile = async () => {
      try {
        const user = await api.getMe();
        setProfile(user);
      } catch (err) {
        console.error(err);
      }
    };
    getProfile();
  }, []);

  const updateStatus = (id: string, newStatus: 'Active' | 'Completed' | 'Cancelled') => {
    setExchanges((current) =>
      current.map((ex) => (ex.id === id ? { ...ex, status: newStatus } : ex))
    );
  };

  const filtered = exchanges.filter((ex) => filter === 'All' || ex.status === filter);

  // Statistics
  const activeCount = exchanges.filter((ex) => ex.status === 'Active').length;
  const pendingCount = exchanges.filter((ex) => ex.status === 'Pending').length;
  const completedCount = exchanges.filter((ex) => ex.status === 'Completed').length;

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-ink">
      <Navbar />

      <section className="mx-auto max-w-6xl px-5 pb-12">
        <div className="mb-8">
          <p className="eyebrow text-violet">Your learning path</p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">My Exchanges</h1>
          <p className="mt-2 text-sm text-ink/55">
            Manage your teaching and learning partnerships, scheduling, and progress.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-ink/5">
            <span className="text-xs font-bold uppercase tracking-wider text-ink/40">Active Exchanges</span>
            <p className="mt-2 text-3xl font-extrabold text-ink">{activeCount}</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-ink/5">
            <span className="text-xs font-bold uppercase tracking-wider text-ink/40">Pending Approval</span>
            <p className="mt-2 text-3xl font-extrabold text-violet">{pendingCount}</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-ink/5">
            <span className="text-xs font-bold uppercase tracking-wider text-ink/40">Completed Swaps</span>
            <p className="mt-2 text-3xl font-extrabold text-emerald-600">{completedCount}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-ink/10 pb-4 mb-6">
          {(['All', 'Active', 'Pending', 'Completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                filter === tab ? 'bg-ink text-white shadow-sm' : 'text-ink/60 hover:bg-white hover:text-ink'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Exchanges List */}
        <div className="space-y-4">
          {filtered.length > 0 ? (
            filtered.map((ex) => (
              <div
                key={ex.id}
                className="group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm hover:shadow-float border border-ink/5 transition"
              >
                <div className="flex items-center gap-4">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-violet to-[#a99eff] text-white text-xl font-extrabold shadow-sm">
                    {ex.avatar}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-extrabold">{ex.partnerName}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-ink/50">
                      <Calendar size={13} /> {ex.date}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 flex-1 md:max-w-md">
                  <div className="rounded-2xl bg-[#f7f5f2] p-3 text-xs">
                    <span className="font-extrabold block text-ink/40 uppercase tracking-wide text-[9px]">Teaching</span>
                    <span className="font-bold text-ink mt-1 block">{ex.teachSkill}</span>
                  </div>
                  <div className="rounded-2xl bg-mint/35 p-3 text-xs">
                    <span className="font-extrabold block text-emerald-800/40 uppercase tracking-wide text-[9px]">Learning</span>
                    <span className="font-bold text-emerald-900 mt-1 block">{ex.learnSkill}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      ex.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ex.status === 'Pending'
                        ? 'bg-amber-100 text-amber-800'
                        : ex.status === 'Completed'
                        ? 'bg-violet/10 text-violet'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {ex.status}
                  </span>

                  <div className="flex gap-2">
                    {ex.status === 'Pending' && (
                      <button
                        title="Accept Exchange"
                        onClick={() => updateStatus(ex.id, 'Active')}
                        className="rounded-xl p-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                    {ex.status === 'Active' && (
                      <button
                        title="Mark Complete"
                        onClick={() => updateStatus(ex.id, 'Completed')}
                        className="rounded-xl p-2.5 bg-violet/10 text-violet hover:bg-violet hover:text-white transition"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                    {(ex.status === 'Active' || ex.status === 'Pending') && (
                      <button
                        title="Cancel Exchange"
                        onClick={() => updateStatus(ex.id, 'Cancelled')}
                        className="rounded-xl p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                    <button
                      title="Send Message"
                      className="rounded-xl p-2.5 bg-[#f7f5f2] text-ink hover:bg-ink hover:text-white transition"
                    >
                      <MessageSquare size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center rounded-3xl bg-white p-12 border border-ink/5">
              <BookOpen className="mx-auto text-ink/20" size={32} />
              <p className="mt-3 font-bold">No exchanges found</p>
              <p className="mt-1 text-sm text-ink/50">Try switching your filter selection.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
