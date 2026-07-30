import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, LogOut, MapPin, Sparkles, UserRound, X } from 'lucide-react';
import { api } from '../utils/api';
import { Avatar } from './ui/Primitives';

const initialNotifications = [
  { id: 1, title: 'Meera accepted your exchange request', detail: 'Spanish conversation practice starts this week.', time: '12 min ago', read: false },
  { id: 2, title: 'Your profile is getting noticed', detail: 'Three members viewed your design-systems skill.', time: '2 hours ago', read: false },
  { id: 3, title: 'A new skill match is available', detail: 'Rohan can help you explore street photography.', time: 'Yesterday', read: true },
];

export default function Navbar() {
  const nav = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string; location: string; email: string } | null>(null);
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
        console.error('Failed to get navbar profile:', err);
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
  const unreadCount = notifications.filter((n) => !n.read).length;
  const markRead = (id: number) => setNotifications((current) => current.map((n) => n.id === id ? { ...n, read: true } : n));

  return (
    <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
      <Link className="flex items-center gap-2 font-extrabold text-ink" to="/dashboard">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-mint">
          <Sparkles size={16} />
        </span>
        SkillSwap
      </Link>
      
      <nav aria-label="Member navigation" className="hidden items-center gap-2 text-sm font-bold md:flex">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `rounded-full px-3 py-2 transition ${isActive ? 'bg-ink text-white shadow-sm' : 'text-ink/55 hover:bg-white hover:text-ink'}`
          }
        >
          Discover
        </NavLink>
        <NavLink
          to="/exchanges"
          className={({ isActive }) =>
            `rounded-full px-3 py-2 transition ${isActive ? 'bg-ink text-white shadow-sm' : 'text-ink/55 hover:bg-white hover:text-ink'}`
          }
        >
          My exchanges
        </NavLink>
        <NavLink
          to="/messages"
          className={({ isActive }) =>
            `rounded-full px-3 py-2 transition ${isActive ? 'bg-ink text-white shadow-sm' : 'text-ink/55 hover:bg-white hover:text-ink'}`
          }
        >
          Messages
        </NavLink>
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
        <button onClick={logout} title="Log out" className="rounded-full bg-white p-2.5 text-ink hover:bg-coral hover:text-white transition">
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
            <p className="font-display text-2xl text-ink">{displayName}</p>
            <p className="mt-1 truncate text-sm text-ink/50">{displayEmail || 'Signed-in member'}</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-ink/60"><MapPin size={13} /> {displayLocation}</p>
          </div>
          <div className="mt-5 border-t border-ink/10 pt-4">
            <button type="button" onClick={() => { setProfileOpen(false); nav('/profile'); }} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-bold text-ink hover:bg-ink/5"><UserRound size={16} /> View my profile</button>
            <button type="button" onClick={logout} className="mt-1 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-bold text-coral hover:bg-coral/10"><LogOut size={16} /> Log out</button>
          </div>
        </aside>
      )}

      {notificationsOpen && (
        <aside className="absolute right-16 top-[4.75rem] z-20 w-[22rem] max-w-[calc(100vw-2.5rem)] rounded-3xl border border-ink/10 bg-white p-3 shadow-float">
          <div className="flex items-center justify-between px-2 py-2">
            <div><p className="font-display text-xl text-ink">Notifications</p><p className="text-xs text-ink/50">{unreadCount ? `${unreadCount} unread` : 'All caught up'}</p></div>
            {unreadCount > 0 && <button type="button" onClick={() => setNotifications((current) => current.map((n) => ({ ...n, read: true })))} className="text-xs font-extrabold text-violet hover:text-ink">Mark all read</button>}
          </div>
          <div className="mt-1 max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <button key={n.id} type="button" onClick={() => markRead(n.id)} className={`w-full rounded-2xl p-3 text-left transition hover:bg-[#f7f5f2] ${n.read ? 'opacity-60' : 'bg-violet/5'}`}>
                <div className="flex gap-3"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-violet'}`} /><span><span className="block text-sm font-extrabold text-ink">{n.title}</span><span className="mt-1 block text-xs leading-5 text-ink/55">{n.detail}</span><span className="mt-1.5 block text-[10px] font-bold uppercase tracking-wide text-ink/35">{n.time}</span></span></div>
              </button>
            ))}
          </div>
        </aside>
      )}
    </header>
  );
}
