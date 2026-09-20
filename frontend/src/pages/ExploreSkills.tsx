import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, MapPin, Search, SlidersHorizontal, Star, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import { Avatar, Button, MatchScore, SkillTag, StatusDot } from '../components/ui/Primitives';
import { exploreCategories, getSkillCategory } from '../data/mock';
import { api } from '../utils/api';

export default function ExploreSkills() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    level: '',
    availability: '',
    mode: '',
    distance: '',
  });

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const dbProfiles = await api.getProfiles();

          const mapped = (dbProfiles || []).map(p => {
          const wantsList = Array.isArray(p.learning_skills) ? p.learning_skills : [];
          const distVal = ((p.full_name?.length || 5) % 5) + 0.8;
          return {
            id: p.id,
            name: p.full_name || 'Member',
            location: p.location || 'Nearby',
            skillOffered: p.primary_skill || 'Various Skills',
            skillWanted: wantsList[0] || 'Guitar',
            rating: p.rating ? Number(p.rating).toFixed(1) : '4.8',
            exchanges: p.completed_swaps || 8,
            distance: `${distVal.toFixed(1)} km`,
            level: p.skill_level || 'Intermediate',
            online: true,
            mode: p.learning_mode || 'Online',
            availability: Array.isArray(p.availability) ? p.availability : [],
            _raw: p,
          };
        });
        setUsers(mapped);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching explore users:', err);
      }
    };
    fetchProfiles();
  }, []);

  const categoryNameToKey: Record<string, string> = {
    'Technology': 'tech',
    'Design': 'design',
    'Music': 'music',
    'Languages': 'language',
    'Fitness': 'fitness',
    'Photography': 'photo',
    'Cooking': 'cooking',
    'Business': 'business',
    'Academics': 'academics',
    'Hobbies': 'hobby',
  };

  const filteredUsers = users.filter((user) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        user.name.toLowerCase().includes(q) ||
        user.skillOffered.toLowerCase().includes(q) ||
        user.skillWanted.toLowerCase().includes(q);
      if (!matchesQuery) return false;
    }
    if (activeCategory !== 'All') {
      const catKey = categoryNameToKey[activeCategory];
      if (catKey) {
        const userCatOffered = getSkillCategory(user.skillOffered);
        const userCatWanted = getSkillCategory(user.skillWanted);
        if (userCatOffered !== catKey && userCatWanted !== catKey) return false;
      }
    }
    if (filters.level && user.level !== filters.level) return false;
    if (filters.mode && user.mode !== filters.mode) return false;
    if (filters.availability) {
      const hasAvailability = user.availability.some((a: string) =>
        a.toLowerCase().includes(filters.availability.toLowerCase())
      );
      if (!hasAvailability) return false;
    }
    if (filters.distance) {
      const maxDistance = parseFloat(filters.distance.replace(/[^\d.]/g, ''));
      const userDistance = parseFloat(user.distance.replace(/[^\d.]/g, ''));
      if (!isNaN(maxDistance) && !isNaN(userDistance) && userDistance > maxDistance) {
        return false;
      }
    }
    return true;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const aOfferedMatch = a.skillOffered.toLowerCase().includes(q);
      const aWantedMatch = a.skillWanted.toLowerCase().includes(q);
      const bOfferedMatch = b.skillOffered.toLowerCase().includes(q);
      const bWantedMatch = b.skillWanted.toLowerCase().includes(q);
      
      const aMatches = aOfferedMatch || aWantedMatch;
      const bMatches = bOfferedMatch || bWantedMatch;
      
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      
      if (aMatches && bMatches) {
        return Number(b.rating) - Number(a.rating);
      }
    }
    return Number(b.rating) - Number(a.rating);
  });

  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar />

      {/* Header */}
      <section className="section-container pt-8 pb-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet/10 to-electric/10 p-8 sm:p-10 border border-violet/10">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-violet/10 blur-[80px]" />
          <div className="relative">
            <p className="eyebrow">Marketplace</p>
            <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Explore Skills</h1>
            <p className="mt-3 max-w-lg text-ink/55">
              Find someone who knows what you want to learn. Browse by category, filter by location, and discover your perfect skill swap partner.
            </p>

            {/* Search */}
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white p-2 pl-5 shadow-card max-w-2xl">
              <Search size={18} className="text-ink/30" />
              <input
                className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-ink/35"
                placeholder="Search for Guitar, Python, Photoshop…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className={`${showFilters ? 'bg-violet text-white' : 'bg-surface text-ink/60'} hover:bg-violet hover:text-white`}
              >
                <SlidersHorizontal size={15} /> Filters
              </Button>
              <Button className="bg-gradient-to-r from-violet to-electric text-white">
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="section-container pb-16">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Sidebar Filters */}
          <aside className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            {/* Categories */}
            <div className="rounded-2xl bg-white p-5 shadow-card border border-ink/5">
              <h3 className="font-bold text-sm">Categories</h3>
              <div className="mt-3 space-y-1">
                <button
                  onClick={() => setActiveCategory('All')}
                  className={`w-full text-left rounded-xl px-3 py-2 text-sm font-medium transition ${
                    activeCategory === 'All' ? 'bg-violet/10 text-violet font-bold' : 'text-ink/60 hover:bg-surface'
                  }`}
                >
                  All Skills
                </button>
                {exploreCategories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`w-full text-left rounded-xl px-3 py-2 text-sm transition ${
                      activeCategory === cat.name
                        ? 'bg-violet/10 text-violet font-bold'
                        : 'text-ink/60 hover:bg-surface font-medium'
                    }`}
                  >
                    <span className="mr-2">{cat.icon}</span>
                    {cat.name}
                    <span className="float-right text-xs text-ink/30">{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="rounded-2xl bg-white p-5 shadow-card border border-ink/5">
              <h3 className="font-bold text-sm">Filters</h3>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Skill Level</label>
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
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Availability</label>
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
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Mode</label>
                  <select
                    className="field mt-1.5"
                    value={filters.mode}
                    onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
                  >
                    <option value="">Online & Offline</option>
                    <option>Online</option>
                    <option>Offline</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Distance</label>
                  <select
                    className="field mt-1.5"
                    value={filters.distance}
                    onChange={(e) => setFilters({ ...filters, distance: e.target.value })}
                  >
                    <option value="">Any distance</option>
                    <option>Within 2 km</option>
                    <option>Within 5 km</option>
                    <option>Within 10 km</option>
                    <option>Within 25 km</option>
                  </select>
                </div>
              </div>

              <Button
                onClick={() => setFilters({ level: '', availability: '', mode: '', distance: '' })}
                className="mt-4 w-full bg-surface text-ink/60 hover:bg-ink/5 text-xs"
              >
                Clear Filters
              </Button>
            </div>
          </aside>

          {/* Results Grid */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-ink/50">
                <span className="font-bold text-ink">{sortedUsers.length}</span> skill swappers found
              </p>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink/60 shadow-sm border border-ink/5 lg:hidden"
              >
                <Filter size={13} /> Filters
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {sortedUsers.map((user, i) => (
                <motion.div
                  key={user.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group rounded-3xl bg-white p-5 shadow-card border border-ink/5 hover-lift"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={user.name} size="lg" showStatus status={user.online ? 'online' : 'offline'} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-ink truncate">{user.name}</h3>
                        {user.online && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                            Available today
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-ink/50">
                        <MapPin size={11} /> {user.location}
                        <span className="text-ink/30">·</span>
                        {user.distance}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-violet/5 p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-violet/60">Offers</p>
                      <div className="mt-1.5">
                        <SkillTag skill={user.skillOffered} />
                      </div>
                    </div>
                    <div className="rounded-xl bg-electric/5 p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-electric/60">Wants</p>
                      <div className="mt-1.5">
                        <SkillTag skill={user.skillWanted} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-ink/50">
                      <span className="flex items-center gap-1 font-bold text-ink">
                        <Star size={12} className="text-warmyellow fill-warmyellow" /> {user.rating}
                      </span>
                      <span>🔄 {user.exchanges}</span>
                      <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold">{user.level}</span>
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

            {sortedUsers.length === 0 && (
              <div className="text-center rounded-3xl bg-white p-16 border border-ink/5 shadow-card">
                <span className="text-5xl">🔍</span>
                <p className="mt-4 font-display text-xl font-bold">No matches found</p>
                <p className="mt-2 text-sm text-ink/50">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
