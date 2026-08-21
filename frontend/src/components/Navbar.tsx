import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, MapPin, Menu, Sparkles, UserRound, X } from 'lucide-react';
import { api } from '../utils/api';
import { Avatar, Button } from './ui/Primitives';

const initialNotifications = [
  { id: 1, title: 'Meera accepted your exchange request', detail: 'Spanish conversation practice starts this week.', time: '12 min ago', read: false },
  { id: 2, title: 'Your profile is getting noticed', detail: 'Three members viewed your design-systems skill.', time: '2 hours ago', read: false },
  { id: 3, title: 'A new skill match is available', detail: 'Rohan can help you explore street photography.', time: 'Yesterday', read: true },
];

type NavLinkItem = { to: string; label: string; isHash?: boolean };

/* Public nav links (Landing & public pages) */
const publicLinks: NavLinkItem[] = [
  { to: '/', label: 'Home' },
  { to: '/explore', label: 'Explore Skills' },
  { to: '/#how', label: 'How It Works', isHash: true },
  { to: '/community', label: 'Community' },
];

/* Authenticated nav links */
const authLinks: NavLinkItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/learning', label: 'My Learning' },
  { to: '/teaching', label: 'My Teaching' },
  { to: '/explore', label: 'Explore' },
  { to: '/certificates', label: 'Certificates' },
  { to: '/messages', label: 'Messages' },
];

export default function Navbar({ variant = 'auto' }: { variant?: 'public' | 'auth' | 'auto' }) {
  const nav = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<{ full_name: string; location: string; email: string } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [menuOpen, setMenuOpen] = useState(false);

  const isAuthenticated = variant === 'auth' || (variant === 'auto' && !!localStorage.getItem('skillswap-token'));

  useEffect(() => {
    if (!isAuthenticated) return;
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
  }, [isAuthenticated]);

  const logout = () => {
    api.logout();
    nav('/login');
  };

  const displayName = profile?.full_name || 'Member';
  const displayLocation = profile?.location || 'Nearby';
  const displayEmail = profile?.email || '';
  const unreadCount = notifications.filter((n) => !n.read).length;
  const markRead = (id: number) =>
    setNotifications((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const links = isAuthenticated ? authLinks : publicLinks;
  const isLanding = location.pathname === '/';

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isLanding && !isAuthenticated
          ? 'bg-transparent'
          : 'bg-white/80 backdrop-blur-xl border-b border-ink/5 shadow-sm'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        {/* Logo */}
        <Link
          to={isAuthenticated ? '/dashboard' : '/'}
          className="flex items-center gap-2.5 text-lg font-extrabold text-ink"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet to-electric text-white shadow-sm">
            <Sparkles size={16} />
          </span>
          <span className="font-display">SkillSwap</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) =>
            link.isHash ? (
              <a
                key={link.label}
                href={link.to}
                className="rounded-full px-3.5 py-2 text-sm font-semibold text-ink/55 transition hover:bg-violet/5 hover:text-violet"
              >
                {link.label}
              </a>
            ) : (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-violet/10 text-violet'
                      : 'text-ink/55 hover:bg-violet/5 hover:text-violet'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ),
          )}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileOpen(false);
                }}
                className="relative rounded-full p-2.5 text-ink/60 transition hover:bg-violet/10 hover:text-violet"
                aria-label="Open notifications"
                aria-expanded={notificationsOpen}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gradient-to-r from-violet to-electric px-1 text-[9px] font-extrabold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Logout */}
              <button
                onClick={logout}
                title="Log out"
                className="hidden rounded-full p-2.5 text-ink/60 transition hover:bg-coral/10 hover:text-coral sm:block"
              >
                <LogOut size={18} />
              </button>

              {/* Avatar */}
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotificationsOpen(false);
                }}
                className="rounded-full transition hover:ring-4 hover:ring-violet/15 focus:outline-none focus:ring-4 focus:ring-violet/20"
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
              >
                <Avatar name={displayName} showStatus status="online" />
              </button>
            </>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
              <Link
                to="/login"
                className="text-sm font-bold text-ink/65 transition hover:text-violet"
              >
                Log in
              </Link>
              <Link to="/register">
                <Button className="bg-gradient-to-r from-violet to-electric text-white shadow-sm hover:shadow-glow hover:scale-105">
                  Join SkillSwap
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            className="rounded-xl p-2.5 text-ink/60 transition hover:bg-ink/5 md:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <nav className="border-t border-ink/5 bg-white/95 backdrop-blur-xl p-4 md:hidden">
          <div className="space-y-1">
            {links.map((link) =>
              link.isHash ? (
                <a
                  key={link.label}
                  href={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-bold text-ink/70 hover:bg-violet/5 hover:text-violet"
                >
                  {link.label}
                </a>
              ) : (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 text-sm font-bold transition ${
                      isActive ? 'bg-violet/10 text-violet' : 'text-ink/70 hover:bg-violet/5 hover:text-violet'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ),
            )}
          </div>
          {!isAuthenticated && (
            <div className="mt-3 space-y-2 border-t border-ink/5 pt-3">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-4 py-3 text-center text-sm font-bold text-ink/70"
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl bg-gradient-to-r from-violet to-electric px-4 py-3 text-center text-sm font-bold text-white"
              >
                Join SkillSwap
              </Link>
            </div>
          )}
          {isAuthenticated && (
            <div className="mt-3 border-t border-ink/5 pt-3">
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-coral"
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          )}
        </nav>
      )}

      {/* Profile Dropdown */}
      {profileOpen && (
        <aside className="absolute right-5 top-[4.5rem] z-50 w-72 rounded-3xl border border-ink/10 bg-white p-5 shadow-float sm:right-8">
          <div className="flex items-start justify-between">
            <Avatar name={displayName} size="lg" showStatus status="online" />
            <button
              type="button"
              onClick={() => setProfileOpen(false)}
              className="rounded-full p-1 text-ink/45 hover:bg-ink/5"
              aria-label="Close profile menu"
            >
              <X size={17} />
            </button>
          </div>
          <div className="mt-4">
            <p className="font-display text-xl font-bold text-ink">{displayName}</p>
            <p className="mt-0.5 truncate text-sm text-ink/50">{displayEmail || 'Signed-in member'}</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-ink/60">
              <MapPin size={13} className="text-violet" /> {displayLocation}
            </p>
          </div>
          <div className="mt-4 border-t border-ink/10 pt-3 space-y-1">
            <button
              type="button"
              onClick={() => { setProfileOpen(false); nav('/profile'); }}
              className="flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-left text-sm font-bold text-ink hover:bg-violet/5 hover:text-violet transition"
            >
              <UserRound size={16} /> View my profile
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-left text-sm font-bold text-coral hover:bg-coral/10 transition"
            >
              <LogOut size={16} /> Log out
            </button>
          </div>
        </aside>
      )}

      {/* Notifications Dropdown */}
      {notificationsOpen && (
        <aside className="absolute right-16 top-[4.5rem] z-50 w-[22rem] max-w-[calc(100vw-2.5rem)] rounded-3xl border border-ink/10 bg-white p-4 shadow-float sm:right-20">
          <div className="flex items-center justify-between px-2 py-1">
            <div>
              <p className="font-display text-lg font-bold text-ink">Notifications</p>
              <p className="text-xs text-ink/50">
                {unreadCount ? `${unreadCount} unread` : 'All caught up ✨'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  setNotifications((current) => current.map((n) => ({ ...n, read: true })))
                }
                className="text-xs font-extrabold text-violet hover:text-ink transition"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="mt-2 max-h-80 overflow-y-auto space-y-1">
            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => markRead(n.id)}
                className={`w-full rounded-2xl p-3 text-left transition hover:bg-surface ${
                  n.read ? 'opacity-60' : 'bg-violet/5'
                }`}
              >
                <div className="flex gap-3">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-violet'}`}
                  />
                  <span>
                    <span className="block text-sm font-extrabold text-ink">{n.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-ink/55">{n.detail}</span>
                    <span className="mt-1.5 block text-[10px] font-bold uppercase tracking-wide text-ink/35">
                      {n.time}
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>
      )}
    </header>
  );
}
