import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, Compass, LogOut, MapPin, MessageCircle, Search, Sparkles, UserRound, X } from 'lucide-react';
import { api } from '../utils/api';
import { Avatar, Button, Status } from '../components/ui/Primitives';

const nearby = [
  ['Meera Iyer', 'Conversational Spanish', '0.8 km away', 'Language'],
  ['Rohan Kapoor', 'Street photography', '1.3 km away', 'Creative'],
  ['Tara Singh', 'Excel for small business', '2.1 km away', 'Career'],
];

const initialNotifications = [
  { id: 1, title: 'Meera accepted your exchange request', detail: 'Spanish conversation practice starts this week.', time: '12 min ago', read: false },
  { id: 2, title: 'Your profile is getting noticed', detail: 'Three members viewed your design-systems skill.', time: '2 hours ago', read: false },
  { id: 3, title: 'A new skill match is available', detail: 'Rohan can help you explore street photography.', time: 'Yesterday', read: true },
];

export default function UserDashboard() {
  const nav = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string; location: string; email: string } | null>(null);
  const [activeNav, setActiveNav] = useState('Discover');
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);

  useEffect(() => {
    const getProfile = async () => {
      try {
        const user = await api.getMe();
        setProfile({
          full_name: user.name,
          location: user.location,
          email: user.email,
        });
      } catch (err) {
        console.error('Failed to get dashboard profile:', err);
      }
    };
    getProfile();
  }, []);

  const logout = () => {
    api.logout();
    nav('/login');
  };

  const displayName = profile?.full_name || 'Member';
  const displayLocation = profile?.location || 'Nearby';
  const displayEmail = profile?.email || '';
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const markRead = (id: number) => setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, read: true } : notification));

  return (
    <main className="min-h-screen bg-[#f7f5f2]">
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link className="flex items-center gap-2 font-extrabold" to="/dashboard">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-mint">
            <Sparkles size={16} />
          </span>
          SkillSwap
        </Link>
        <nav aria-label="Member navigation" className="hidden items-center gap-2 text-sm font-bold md:flex">
          {['Discover', 'My exchanges', 'Messages'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setActiveNav(item)}
              className={`rounded-full px-3 py-2 transition ${activeNav === item ? 'bg-ink text-white shadow-sm' : 'text-ink/55 hover:bg-white hover:text-ink'}`}
              aria-current={activeNav === item ? 'page' : undefined}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }}
            className="relative rounded-full bg-white p-2.5 transition hover:bg-ink hover:text-white"
            aria-label="Open notifications"
            aria-expanded={notificationsOpen}
          >
            <Bell size={17} />
            {unreadCount > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-coral px-1 text-[9px] font-extrabold text-ink">{unreadCount}</span>}
          </button>
          <button onClick={logout} title="Log out" className="rounded-full bg-white p-2.5">
            <LogOut size={17} />
          </button>
          <button
            type="button"
            onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }}
            className="rounded-full transition hover:ring-4 hover:ring-violet/15 focus:outline-none focus:ring-4 focus:ring-violet/20"
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
          >
            <Avatar name={displayName} />
          </button>
        </div>
        {profileOpen && (
          <aside className="absolute right-5 top-[4.75rem] z-20 w-72 rounded-3xl border border-ink/10 bg-white p-5 shadow-float">
            <div className="flex items-start justify-between">
              <Avatar name={displayName} />
              <button type="button" onClick={() => setProfileOpen(false)} className="rounded-full p-1 text-ink/45 hover:bg-ink/5" aria-label="Close profile menu"><X size={17} /></button>
            </div>
            <div className="mt-4">
              <p className="font-display text-2xl">{displayName}</p>
              <p className="mt-1 truncate text-sm text-ink/50">{displayEmail || 'Signed-in member'}</p>
              <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-ink/60"><MapPin size={13} /> {displayLocation}</p>
            </div>
            <div className="mt-5 border-t border-ink/10 pt-4">
              <button type="button" onClick={() => { setProfileOpen(false); nav('/profile'); }} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-bold hover:bg-ink/5"><UserRound size={16} /> View my profile</button>
              <button type="button" onClick={logout} className="mt-1 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-bold text-coral hover:bg-coral/10"><LogOut size={16} /> Log out</button>
            </div>
          </aside>
        )}
        {notificationsOpen && (
          <aside className="absolute right-16 top-[4.75rem] z-20 w-[22rem] max-w-[calc(100vw-2.5rem)] rounded-3xl border border-ink/10 bg-white p-3 shadow-float">
            <div className="flex items-center justify-between px-2 py-2">
              <div><p className="font-display text-xl">Notifications</p><p className="text-xs text-ink/50">{unreadCount ? `${unreadCount} unread` : 'All caught up'}</p></div>
              {unreadCount > 0 && <button type="button" onClick={() => setNotifications((current) => current.map((notification) => ({ ...notification, read: true })))} className="text-xs font-extrabold text-violet hover:text-ink">Mark all read</button>}
            </div>
            <div className="mt-1 max-h-80 overflow-y-auto">
              {notifications.map((notification) => (
                <button key={notification.id} type="button" onClick={() => markRead(notification.id)} className={`w-full rounded-2xl p-3 text-left transition hover:bg-[#f7f5f2] ${notification.read ? 'opacity-60' : 'bg-violet/5'}`}>
                  <div className="flex gap-3"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.read ? 'bg-transparent' : 'bg-violet'}`} /><span><span className="block text-sm font-extrabold text-ink">{notification.title}</span><span className="mt-1 block text-xs leading-5 text-ink/55">{notification.detail}</span><span className="mt-1.5 block text-[10px] font-bold uppercase tracking-wide text-ink/35">{notification.time}</span></span></div>
                </button>
              ))}
            </div>
          </aside>
        )}
      </header>
      
      <section className="mx-auto max-w-6xl px-5 pb-12">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink p-7 text-white sm:p-10">
          <div className="absolute -right-12 -top-20 h-72 w-72 rounded-full bg-violet blur-3xl" />
          <p className="relative eyebrow text-mint">Your Friday in {displayLocation}</p>
          <h1 className="relative mt-3 max-w-xl font-display text-4xl leading-tight sm:text-5xl">
            What do you feel like getting better at, {displayName.split(' ')[0]}?
          </h1>
          <div className="relative mt-7 flex max-w-lg items-center gap-3 rounded-full bg-white p-2 pl-4 text-ink">
            <Search size={17} />
            <input
              className="min-w-0 flex-1 border-0 text-sm outline-none"
              placeholder="Try ‘pottery’, ‘French’ or ‘public speaking’"
            />
            <Button className="bg-violet text-white">Explore</Button>
          </div>
        </div>
        
        <div className="mt-7 grid gap-5 lg:grid-cols-[1.4fr_.6fr]">
          <section id="discover">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="eyebrow">Chosen for you</p>
                <h2 className="mt-1 font-display text-3xl">People worth meeting</h2>
              </div>
              <button className="text-sm font-bold text-violet">See more</button>
            </div>
            
            <div className="grid gap-3">
              {nearby.map(([name, skill, distance, kind]) => (
                <article
                  key={name}
                  className="flex items-center gap-4 rounded-3xl bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-float"
                >
                  <Avatar name={name} />
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold">{name}</p>
                    <p className="text-sm text-ink/55">Can help with {skill}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-ink/40">
                      <MapPin size={12} />
                      {distance}
                    </p>
                  </div>
                  <Status>{kind}</Status>
                  <button aria-label={`Open ${name}`} className="rounded-full bg-ink p-2.5 text-white">
                    <MessageCircle size={16} />
                  </button>
                </article>
              ))}
            </div>
          </section>
          
          <aside className="rounded-3xl bg-mint p-6">
            <p className="eyebrow text-ink/60">Your learning path</p>
            <h2 className="mt-2 font-display text-3xl">Keep the promise to yourself.</h2>
            <div className="mt-7 rounded-2xl bg-white/60 p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-mint">
                  <BookOpen size={18} />
                </span>
                <div>
                  <p className="font-extrabold">Design systems</p>
                  <p className="text-xs text-ink/55">Next session: Sunday</p>
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-ink/10">
                <div className="h-full w-2/3 rounded-full bg-violet" />
              </div>
              <p className="mt-2 text-xs font-bold">4 of 6 sessions complete</p>
            </div>
            <Button className="mt-5 w-full bg-ink text-white">
              <Compass size={16} /> Find a new skill
            </Button>
          </aside>
        </div>
      </section>
    </main>
  );
}
