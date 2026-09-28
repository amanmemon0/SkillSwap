import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, MapPin, Search, Star, X, ChevronDown, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { Avatar, Button, SkillTag } from '../components/ui/Primitives';
import { exploreCategories, getSkillCategory } from '../data/mock';
import { api } from '../utils/api';

// ─── Category metadata (icons/names come from mock, counts computed from DB) ───
const CATEGORY_ICONS: Record<string, string> = {
  Technology: '💻',
  Design: '🎨',
  Music: '🎵',
  Languages: '🗣️',
  Fitness: '🏋️',
  Photography: '📸',
  Cooking: '🍳',
  Business: '💼',
  Academics: '📚',
  Hobbies: '🎯',
};

const categoryNameToKey: Record<string, string> = {
  Technology: 'tech',
  Design: 'design',
  Music: 'music',
  Languages: 'language',
  Fitness: 'fitness',
  Photography: 'photo',
  Cooking: 'cooking',
  Business: 'business',
  Academics: 'academics',
  Hobbies: 'hobby',
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function ExploreSkills() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    level: '',
    availability: '',
    mode: '',
  });

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 300);

  // ─── Fetch all profiles once ───────────────────────────────────────────────
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        setError('');
        const dbProfiles = await api.getProfiles();
        // Deduplicate by id
        const seen = new Set<string>();
        const unique = (dbProfiles || []).filter((p: any) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });

        const mapped = unique.map((p: any) => {
          const wantsList = Array.isArray(p.learning_skills) ? p.learning_skills : [];
          return {
            id: p.id,
            name: p.full_name || 'Member',
            username: p.username || '',
            location: p.location || p.city || 'Nearby',
            skillOffered: p.primary_skill || '',
            skillsOffered: p.primary_skill ? [p.primary_skill] : [],
            skillsWanted: wantsList,
            skillWanted: wantsList[0] || '',
            rating: p.rating ? Number(p.rating) : null,
            exchanges: p.completed_swaps ?? 0,
            level: p.skill_level || 'Intermediate',
            online: true, // could be real-time in future
            mode: p.learning_mode || 'Online',
            availability: Array.isArray(p.availability) ? p.availability : [],
            bio: p.bio || '',
            _raw: p,
          };
        });
        setAllUsers(mapped);
      } catch (err: any) {
        console.error('Error fetching explore users:', err);
        setError('Could not load profiles. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  // ─── Compute category counts from real DB data ─────────────────────────────
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allUsers.forEach((user) => {
      const allSkills = [...user.skillsOffered, ...user.skillsWanted];
      const seen = new Set<string>();
      allSkills.forEach((skill: string) => {
        const cat = getSkillCategory(skill);
        // Map cat key → category name
        const catName = Object.entries(categoryNameToKey).find(([, v]) => v === cat)?.[0];
        if (catName && !seen.has(catName)) {
          seen.add(catName);
          counts[catName] = (counts[catName] || 0) + 1;
        }
      });
    });
    return counts;
  }, [allUsers]);

  // ─── Filter & sort users ───────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    let result = allUsers;

    // Category filter
    if (activeCategory !== 'All') {
      const catKey = categoryNameToKey[activeCategory];
      if (catKey) {
        result = result.filter((user) => {
          const allSkills = [...user.skillsOffered, ...user.skillsWanted];
          return allSkills.some((s: string) => getSkillCategory(s) === catKey);
        });
      }
    }

    // Skill level filter
    if (filters.level) {
      result = result.filter((u) => u.level === filters.level);
    }

    // Mode filter
    if (filters.mode) {
      result = result.filter((u) =>
        u.mode?.toLowerCase().includes(filters.mode.toLowerCase())
      );
    }

    // Availability filter
    if (filters.availability) {
      result = result.filter((u) =>
        u.availability.some((a: string) =>
          a.toLowerCase().includes(filters.availability.toLowerCase())
        )
      );
    }

    // Search query filter (debounced)
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim();
      result = result.filter((user) => {
        const searchable = [
          user.name,
          user.username,
          user.bio,
          ...user.skillsOffered,
          ...user.skillsWanted,
          user.location,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return searchable.includes(q);
      });
    }

    // Sort: if searching, show best matches first; otherwise by rating
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      result = [...result].sort((a, b) => {
        const aSkillMatch = [...a.skillsOffered, ...a.skillsWanted].some((s: string) =>
          s.toLowerCase().includes(q)
        );
        const bSkillMatch = [...b.skillsOffered, ...b.skillsWanted].some((s: string) =>
          s.toLowerCase().includes(q)
        );
        if (aSkillMatch && !bSkillMatch) return -1;
        if (!aSkillMatch && bSkillMatch) return 1;
        return (b.rating ?? 0) - (a.rating ?? 0);
      });
    } else {
      result = [...result].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }

    return result;
  }, [allUsers, activeCategory, filters, debouncedQuery]);

  const clearFilters = useCallback(() => {
    setFilters({ level: '', availability: '', mode: '' });
    setActiveCategory('All');
    setSearchQuery('');
    searchRef.current?.focus();
  }, []);

  const activeFiltersCount = [
    filters.level,
    filters.availability,
    filters.mode,
    activeCategory !== 'All' ? activeCategory : '',
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar />

      {/* ── Hero / Search ─────────────────────────────────────────────────── */}
      <section className="section-container pt-8 pb-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet/10 to-electric/10 p-8 sm:p-10 border border-violet/10">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-violet/10 blur-[80px]" />
          <div className="absolute left-1/2 bottom-0 h-40 w-40 rounded-full bg-electric/10 blur-[60px]" />
          <div className="relative">
            <p className="eyebrow">Marketplace</p>
            <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Explore Skills</h1>
            <p className="mt-3 max-w-lg text-ink/55">
              Find someone who knows what you want to learn. Browse by category, filter, and discover your perfect skill swap partner.
            </p>

            {/* Search bar */}
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white p-2 pl-5 shadow-card max-w-2xl">
              {loading ? (
                <Loader2 size={18} className="text-violet animate-spin" />
              ) : (
                <Search size={18} className="text-ink/30" />
              )}
              <input
                ref={searchRef}
                className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-ink/35"
                placeholder="Search by skill, name, or location…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search profiles"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="rounded-full p-1 text-ink/40 hover:bg-ink/5 hover:text-ink transition"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
              <Button className="bg-gradient-to-r from-violet to-electric text-white">
                Search
              </Button>
            </div>

            {/* Quick category pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              {['Technology', 'Design', 'Music', 'Languages', 'Fitness', 'Photography'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? 'All' : cat)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    activeCategory === cat
                      ? 'bg-violet text-white shadow-sm'
                      : 'bg-white/70 text-ink/60 hover:bg-white hover:text-ink'
                  }`}
                >
                  {CATEGORY_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-container pb-16">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <aside className={`space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            {/* Categories */}
            <div className="rounded-2xl bg-white p-5 shadow-card border border-ink/5">
              <h3 className="font-bold text-sm">Categories</h3>
              <div className="mt-3 space-y-0.5">
                <button
                  onClick={() => setActiveCategory('All')}
                  className={`w-full text-left rounded-xl px-3 py-2 text-sm font-medium transition flex items-center justify-between ${
                    activeCategory === 'All'
                      ? 'bg-violet/10 text-violet font-bold'
                      : 'text-ink/60 hover:bg-surface'
                  }`}
                >
                  <span>All Skills</span>
                  <span className="text-xs text-ink/30">{allUsers.length}</span>
                </button>
                {Object.entries(CATEGORY_ICONS).map(([name, icon]) => (
                  <button
                    key={name}
                    onClick={() => setActiveCategory(activeCategory === name ? 'All' : name)}
                    className={`w-full text-left rounded-xl px-3 py-2 text-sm transition flex items-center justify-between ${
                      activeCategory === name
                        ? 'bg-violet/10 text-violet font-bold'
                        : 'text-ink/60 hover:bg-surface font-medium'
                    }`}
                  >
                    <span>
                      <span className="mr-2">{icon}</span>
                      {name}
                    </span>
                    <span className="text-xs text-ink/30">
                      {loading ? '…' : (categoryCounts[name] ?? 0)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="rounded-2xl bg-white p-5 shadow-card border border-ink/5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">Filters</h3>
                {activeFiltersCount > 0 && (
                  <span className="rounded-full bg-violet text-white text-[10px] font-bold px-1.5 py-0.5">
                    {activeFiltersCount}
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ink/40">
                    Skill Level
                  </label>
                  <select
                    className="field mt-1.5"
                    value={filters.level}
                    onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                  >
                    <option value="">Any level</option>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                    <option>Expert</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ink/40">
                    Availability
                  </label>
                  <select
                    className="field mt-1.5"
                    value={filters.availability}
                    onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
                  >
                    <option value="">Any time</option>
                    <option>Morning</option>
                    <option>Afternoon</option>
                    <option>Evening</option>
                    <option>Weekends</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ink/40">
                    Mode
                  </label>
                  <select
                    className="field mt-1.5"
                    value={filters.mode}
                    onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
                  >
                    <option value="">Online &amp; Offline</option>
                    <option>Online</option>
                    <option>Offline</option>
                  </select>
                </div>
              </div>

              <Button
                onClick={() => setFilters({ level: '', availability: '', mode: '' })}
                className="mt-4 w-full bg-surface text-ink/60 hover:bg-ink/5 text-xs"
              >
                Clear Filters
              </Button>
            </div>
          </aside>

          {/* ── Results ──────────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm text-ink/50">
                  {loading ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 size={13} className="animate-spin" /> Loading profiles…
                    </span>
                  ) : (
                    <>
                      <span className="font-bold text-ink">{filteredUsers.length}</span>{' '}
                      skill swapper{filteredUsers.length !== 1 ? 's' : ''} found
                      {debouncedQuery && (
                        <span className="ml-1 text-ink/40">for "{debouncedQuery}"</span>
                      )}
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {(debouncedQuery || activeFiltersCount > 0) && !loading && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-xs font-bold text-violet hover:underline"
                  >
                    <X size={12} /> Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink/60 shadow-sm border border-ink/5 lg:hidden"
                >
                  <Filter size={13} /> Filters
                  {activeFiltersCount > 0 && (
                    <span className="rounded-full bg-violet text-white text-[9px] font-extrabold px-1">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-3xl bg-white p-5 shadow-card border border-ink/5">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-full bg-ink/5 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 rounded-lg bg-ink/5 animate-pulse" />
                        <div className="h-3 w-24 rounded-lg bg-ink/5 animate-pulse" />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="h-16 rounded-xl bg-ink/5 animate-pulse" />
                      <div className="h-16 rounded-xl bg-ink/5 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <div className="text-center rounded-3xl bg-white p-16 border border-ink/5 shadow-card">
                <span className="text-5xl">⚠️</span>
                <p className="mt-4 font-display text-xl font-bold">Something went wrong</p>
                <p className="mt-2 text-sm text-ink/50">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 text-sm font-bold text-violet hover:underline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Results grid */}
            {!loading && !error && (
              <AnimatePresence mode="popLayout">
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredUsers.map((user, i) => (
                    <motion.div
                      key={user.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ delay: Math.min(i * 0.04, 0.4) }}
                      className="group rounded-3xl bg-white p-5 shadow-card border border-ink/5 hover-lift"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={user.name} size="lg" showStatus status={user.online ? 'online' : 'offline'} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <h3 className="font-bold text-ink truncate">{user.name}</h3>
                              {user.username && (
                                <p className="text-[10px] text-ink/40">@{user.username}</p>
                              )}
                            </div>
                            {user.online && (
                              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="mt-1 flex items-center gap-1 text-xs text-ink/50">
                            <MapPin size={11} /> {user.location}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-violet/5 p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-violet/60">Offers</p>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {user.skillsOffered.length > 0 ? (
                              user.skillsOffered.slice(0, 2).map((s: string) => (
                                <SkillTag key={s} skill={s} />
                              ))
                            ) : (
                              <span className="text-xs text-ink/35 italic">Not specified</span>
                            )}
                          </div>
                        </div>
                        <div className="rounded-xl bg-electric/5 p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-electric/60">Wants</p>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {user.skillsWanted.length > 0 ? (
                              user.skillsWanted.slice(0, 2).map((s: string) => (
                                <SkillTag key={s} skill={s} />
                              ))
                            ) : (
                              <span className="text-xs text-ink/35 italic">Open to anything</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-ink/50">
                          {user.rating !== null ? (
                            <span className="flex items-center gap-1 font-bold text-ink">
                              <Star size={12} className="text-warmyellow fill-warmyellow" />
                              {Number(user.rating).toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-ink/30 text-xs">New</span>
                          )}
                          {user.exchanges > 0 && <span>🔄 {user.exchanges}</span>}
                          <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold">
                            {user.level}
                          </span>
                        </div>
                        <Link to={`/users/${user.id}`} state={{ matchedUser: user._raw }}>
                          <Button className="bg-violet/10 text-violet hover:bg-violet hover:text-white text-xs py-2 px-3">
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}

            {/* Empty state */}
            {!loading && !error && filteredUsers.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center rounded-3xl bg-white p-16 border border-ink/5 shadow-card"
              >
                <span className="text-5xl">🔍</span>
                <p className="mt-4 font-display text-xl font-bold">No matches found</p>
                <p className="mt-2 text-sm text-ink/50">
                  {debouncedQuery
                    ? `No profiles match "${debouncedQuery}". Try a different search term.`
                    : 'Try adjusting your filters.'}
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-sm font-bold text-violet hover:underline"
                >
                  Clear all filters
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
