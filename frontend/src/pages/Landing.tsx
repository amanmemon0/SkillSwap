import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowRightLeft,
  Check,
  Github,
  Heart,
  Instagram,
  Linkedin,
  MapPin,
  Search,
  Sparkles,
  Star,
  Twitter,
  Users,
} from 'lucide-react';
import { Avatar, Button, LiveBadge, SkillTag } from '../components/ui/Primitives';
import LiveFeed from '../components/LiveFeed';
import { popularSkills, featuredSwappers } from '../data/mock';
import Navbar from '../components/Navbar';

const reveal = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <main className="min-h-screen bg-surface text-ink overflow-hidden">
      <Navbar variant="public" />

      {/* ═══════ HERO SECTION ═══════ */}
      <section className="relative section-container pb-20 pt-12 lg:pb-28 lg:pt-20">
        {/* Background gradients */}
        <div className="absolute left-1/2 top-0 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-violet/15 blur-[140px]" />
        <div className="absolute right-0 top-20 -z-10 h-[400px] w-[400px] rounded-full bg-electric/10 blur-[120px]" />

        <div className="grid gap-12 lg:grid-cols-[1fr_.9fr] lg:items-center">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            {/* Badge */}
            <motion.div variants={reveal} className="inline-flex items-center gap-2 rounded-full border border-violet/20 bg-violet/5 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-violet">● 1,248 Skill Exchanges Happening</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={reveal} className="mt-7 max-w-2xl font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
              Exchange Skills.{' '}
              <span className="gradient-text">Not Money.</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p variants={reveal} className="mt-6 max-w-xl text-lg leading-8 text-ink/60">
              Learn something new. Teach what you love. Build connections in your community.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={reveal} className="mt-9 flex flex-wrap gap-3">
              <Link to="/explore">
                <Button className="bg-gradient-to-r from-violet to-electric text-white shadow-glow hover:shadow-lg hover:scale-105">
                  <Search size={16} /> Find a Skill
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-white text-ink shadow-card ring-1 ring-ink/10 hover:bg-violet/5 hover:text-violet">
                  Offer Your Skill <ArrowRight size={16} />
                </Button>
              </Link>
            </motion.div>

            {/* Social Proof */}
            <motion.div variants={reveal} className="mt-12 flex items-center gap-4">
              <div className="flex -space-x-2">
                {['Aarav Sharma', 'Riya Patel', 'Arjun Rao', 'Meera Iyer'].map((name) => (
                  <span className="rounded-full ring-2 ring-surface" key={name}>
                    <Avatar name={name} size="sm" />
                  </span>
                ))}
              </div>
              <div>
                <p className="text-sm font-extrabold">12,486+ members swapping skills</p>
                <p className="mt-0.5 text-xs text-ink/45">Join the community today</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, rotate: 3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.7, delay: 0.15, type: 'spring' }}
            className="relative mx-auto h-[420px] w-full max-w-[480px] sm:h-[480px]"
          >
            {/* Background shape */}
            <div className="absolute inset-6 rounded-[2.5rem] bg-gradient-to-br from-violet/10 to-electric/10 border border-violet/10" />

            {/* Main match card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              className="absolute left-0 top-8 w-[88%] rounded-[2rem] bg-ink p-6 text-white shadow-float sm:p-7"
            >
              <div className="flex items-center justify-between">
                <span className="eyebrow text-cyan">Your possible match</span>
                <span className="rounded-full bg-gradient-to-r from-violet to-electric px-3 py-1 text-[10px] font-bold">
                  93% fit
                </span>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-cyan to-electric text-xl font-extrabold text-white">
                  R
                </span>
                <div>
                  <p className="font-display text-2xl font-bold">Riya Patel</p>
                  <p className="mt-1 text-sm text-white/60">Guitar enthusiast from Mumbai</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-[10px] font-bold text-cyan">SHE SHARES</p>
                  <p className="mt-1 text-sm font-bold">🎸 Guitar</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-[10px] font-bold text-cyan">YOU SHARE</p>
                  <p className="mt-1 text-sm font-bold">💻 Web Dev</p>
                </div>
              </div>
              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet to-electric py-3 text-sm font-extrabold text-white hover:shadow-glow transition">
                <ArrowRightLeft size={16} /> Propose Exchange
              </button>
            </motion.div>

            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
              className="absolute bottom-4 right-0 w-56 rounded-2xl bg-white p-4 shadow-float"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-emerald-500">
                  <Check size={15} />
                </span>
                <p className="text-xs font-bold">
                  Exchange completed!
                  <br />
                  <span className="font-normal text-ink/45">Photography ↔ Cooking</span>
                </p>
              </div>
            </motion.div>

            {/* Decorative circle */}
            <span className="absolute right-4 top-1 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-warmyellow to-coral text-white shadow-sm">
              <Sparkles size={22} />
            </span>
          </motion.div>
        </div>
      </section>

      {/* ═══════ SKILL TICKER ═══════ */}
      <section className="overflow-hidden border-y border-ink/5 bg-white py-4">
        <motion.div
          initial={{ x: '0%' }}
          animate={{ x: '-50%' }}
          transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
          className="flex w-max gap-8 px-5 text-sm font-bold text-ink/50"
        >
          {[...popularSkills, ...popularSkills, ...popularSkills, ...popularSkills].map((skill, i) => (
            <span key={`${skill.name}-${i}`} className="flex shrink-0 items-center gap-2">
              <span className="text-lg">{skill.icon}</span>
              {skill.name}
            </span>
          ))}
        </motion.div>
      </section>

      {/* ═══════ SEARCH SECTION ═══════ */}
      <section className="section-container py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Find your next skill</p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            What skill do you want to learn?
          </h2>
          <div className="mt-8 flex items-center gap-3 rounded-2xl bg-white p-2 pl-5 shadow-card border border-ink/5">
            <Search size={20} className="text-ink/30" />
            <input
              className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-ink/35"
              placeholder="Search for Guitar, Python, Photoshop…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Link to="/explore">
              <Button className="bg-gradient-to-r from-violet to-electric text-white">
                Find Matches
              </Button>
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['Guitar', 'Python', 'Photography', 'Cooking', 'UI/UX'].map((skill) => (
              <button
                key={skill}
                className="rounded-full border border-ink/10 bg-white px-3 py-1.5 text-xs font-bold text-ink/60 transition hover:border-violet hover:text-violet"
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ POPULAR SKILLS ═══════ */}
      <section className="section-container pb-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="eyebrow">Trending skills</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Popular Skills</h2>
          </div>
          <Link to="/explore" className="text-sm font-bold text-violet hover:text-ink transition">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {popularSkills.map((skill, i) => (
            <motion.div
              key={skill.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="group rounded-2xl bg-white p-5 shadow-card border border-ink/5 transition-shadow hover:shadow-float cursor-pointer"
            >
              <span className="text-3xl">{skill.icon}</span>
              <h3 className="mt-3 font-bold text-ink">{skill.name}</h3>
              <p className="mt-1 text-xs text-ink/50">{skill.count} people offering</p>
              <button className="mt-3 rounded-full bg-violet/10 px-3 py-1.5 text-[11px] font-bold text-violet opacity-0 transition-all group-hover:opacity-100">
                Explore →
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section id="how" className="bg-white border-y border-ink/5">
        <div className="section-container py-20">
          <div className="text-center mb-14">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              Three simple steps to start swapping
            </h2>
            <p className="mt-4 mx-auto max-w-xl text-ink/55">
              SkillSwap makes it easy to find the right person, agree on an exchange, and make it happen.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {[
              {
                num: '01',
                icon: '👤',
                title: 'Create Your Profile',
                desc: 'Tell the community what you can teach and what you want to learn.',
                accent: false,
              },
              {
                num: '02',
                icon: '🔍',
                title: 'Find Your Match',
                desc: 'Discover people whose skills complement yours.',
                accent: true,
              },
              {
                num: '03',
                icon: '🤝',
                title: 'Swap & Learn',
                desc: 'Connect, exchange skills and grow together.',
                accent: false,
              },
            ].map((step, i) => (
              <motion.article
                key={step.num}
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className={`group rounded-3xl p-7 ${
                  step.accent
                    ? 'bg-gradient-to-br from-violet to-electric text-white'
                    : 'bg-surface border border-ink/5'
                }`}
              >
                <span className={`font-mono text-xs font-bold ${step.accent ? 'text-cyan' : 'text-violet'}`}>
                  {step.num}
                </span>
                <span className="mt-10 block text-4xl">{step.icon}</span>
                <h3 className="mt-5 font-display text-2xl font-bold">{step.title}</h3>
                <p className={`mt-3 text-sm leading-6 ${step.accent ? 'text-white/70' : 'text-ink/55'}`}>
                  {step.desc}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ LIVE COMMUNITY SECTION ═══════ */}
      <section className="section-container py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_.9fr] lg:items-start">
          <div>
            <p className="eyebrow">Live activity</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              What's happening in SkillSwap
            </h2>
            <p className="mt-4 text-ink/55 max-w-lg">
              See real-time activity from the community. People are learning, teaching, and connecting right now.
            </p>

            {/* Sample activity cards */}
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card border border-ink/5">
                <Avatar name="Aarav" showStatus status="online" />
                <div className="flex-1">
                  <p className="text-sm font-bold">Aarav is online</p>
                  <p className="text-xs text-ink/50">
                    Offering: <span className="font-bold text-violet">Web Development</span> · Looking for: <span className="font-bold text-electric">Guitar</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card border border-ink/5">
                <Avatar name="Riya" showStatus status="online" />
                <div className="flex-1">
                  <p className="text-sm font-bold">Riya completed a swap</p>
                  <p className="text-xs text-ink/50">
                    <span className="font-bold">Photoshop</span> ↔ <span className="font-bold">Spoken English</span>
                  </p>
                </div>
                <span className="text-lg">🎉</span>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
                <span className="text-2xl">✨</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-emerald-800">3 new skills added today</p>
                  <div className="mt-1 flex gap-1.5">
                    <SkillTag skill="UI/UX" />
                    <SkillTag skill="Python" />
                    <SkillTag skill="Photography" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <LiveFeed />
        </div>
      </section>

      {/* ═══════ FEATURED SWAPPERS ═══════ */}
      <section className="bg-white border-y border-ink/5">
        <div className="section-container py-20">
          <div className="text-center mb-12">
            <p className="eyebrow">Featured members</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Top Skill Swappers</h2>
            <p className="mt-4 text-ink/55">Discover active members ready to exchange skills</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredSwappers.map((person, i) => (
              <motion.div
                key={person.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group rounded-3xl bg-surface p-6 text-center transition hover-lift border border-ink/5"
              >
                <div className="mx-auto">
                  <Avatar name={person.name} size="xl" showStatus status={person.online ? 'online' : 'offline'} />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">{person.name}</h3>
                <p className="mt-1 flex items-center justify-center gap-1 text-xs text-ink/50">
                  <MapPin size={11} /> {person.location}
                </p>

                <div className="mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Offers</p>
                  <div className="mt-1.5 flex flex-wrap justify-center gap-1">
                    {person.offers.map((s) => (
                      <SkillTag key={s} skill={s} />
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Wants</p>
                  <div className="mt-1.5 flex flex-wrap justify-center gap-1">
                    {person.wants.map((s) => (
                      <SkillTag key={s} skill={s} />
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-3 text-xs">
                  <span className="flex items-center gap-1 font-bold">
                    <Star size={12} className="text-warmyellow fill-warmyellow" /> {person.rating}
                  </span>
                  <span className="text-ink/30">·</span>
                  <span className="text-ink/60">🔄 {person.exchanges} exchanges</span>
                </div>

                <Link
                  to="/register"
                  className="mt-4 inline-flex rounded-full bg-violet/10 px-4 py-2 text-xs font-bold text-violet opacity-0 transition-all group-hover:opacity-100 hover:bg-violet hover:text-white"
                >
                  View Profile
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA SECTION ═══════ */}
      <section className="section-container py-20">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-ink via-violet/90 to-electric p-10 text-white sm:p-16">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-electric/20 blur-[80px]" />
          <div className="absolute -left-20 -bottom-20 h-60 w-60 rounded-full bg-violet/30 blur-[60px]" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
                You already have something valuable to teach.
              </h2>
              <p className="mt-5 max-w-lg text-lg leading-8 text-white/70">
                Join people who are learning, teaching and exchanging skills without money.
              </p>
            </div>
            <Link to="/register">
              <Button className="bg-white text-ink hover:bg-cyan hover:text-ink shadow-lg hover:scale-105 text-base px-8 py-4">
                Start Swapping <ArrowRight size={18} />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="relative mt-12 grid grid-cols-2 gap-6 border-t border-white/20 pt-8 sm:grid-cols-4">
            {[
              { label: 'Active Members', value: '12,486+' },
              { label: 'Skills Available', value: '2,318' },
              { label: 'Exchanges Done', value: '8,294' },
              { label: 'Avg Rating', value: '4.8 ⭐' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-extrabold">{stat.value}</p>
                <p className="mt-1 text-xs text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-ink/5 bg-white">
        <div className="section-container py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 text-lg font-extrabold">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet to-electric text-white">
                  <Sparkles size={14} />
                </span>
                <span className="font-display">SkillSwap</span>
              </div>
              <p className="mt-3 text-sm text-ink/50 leading-6">
                Exchange Skills. Not Money.
                <br />
                A more human way to learn and grow.
              </p>
              <div className="mt-4 flex gap-3">
                {[Twitter, Instagram, Linkedin, Github].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="grid h-9 w-9 place-items-center rounded-full bg-surface text-ink/40 transition hover:bg-violet hover:text-white"
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Platform</p>
              <ul className="mt-3 space-y-2">
                {['How It Works', 'Explore Skills', 'Community', 'About'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-ink/60 hover:text-violet transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Support</p>
              <ul className="mt-3 space-y-2">
                {['Help Center', 'Safety', 'Terms', 'Privacy'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-ink/60 hover:text-violet transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Connect</p>
              <ul className="mt-3 space-y-2">
                {['Contact Us', 'Feedback', 'Blog', 'Careers'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-ink/60 hover:text-violet transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-ink/5 pt-6 sm:flex-row">
            <p className="text-xs text-ink/40">
              © 2026 SkillSwap. Made with <Heart size={11} className="inline text-coral fill-coral" /> for the community.
            </p>
            <p className="text-xs text-ink/40">Exchange Skills. Not Money. 🔄</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
