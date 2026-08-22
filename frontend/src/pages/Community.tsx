import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Send, UserPlus } from 'lucide-react';
import Navbar from '../components/Navbar';
import { Avatar, Button, LiveBadge, SkillTag, StatusDot } from '../components/ui/Primitives';
import LiveFeed from '../components/LiveFeed';
import { featuredSwappers } from '../data/mock';
import { supabase } from '../auth/supabaseClient';

export default function Community() {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    fetchUserId();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data: dbPosts } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles:author_id (full_name)
        `)
        .order('created_at', { ascending: false });

      const mapped = (dbPosts || []).map(p => ({
        id: p.id,
        user: p.profiles?.full_name || 'Member',
        avatar: p.profiles?.full_name ? p.profiles.full_name.charAt(0) : 'M',
        time: new Date(p.created_at).toLocaleDateString(),
        content: p.content,
        likes: p.likes_count || 0,
        comments: 0
      }));
      setPosts(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleLike = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    try {
      await supabase
        .from('community_posts')
        .update({ likes_count: (post.likes || 0) + 1 })
        .eq('id', postId);
      await fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !userId) return;
    try {
      await supabase.from('community_posts').insert({
        author_id: userId,
        content: newPost.trim()
      });
      setNewPost('');
      await fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar />

      <section className="section-container py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="eyebrow">Together</p>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">SkillSwap Community</h1>
          <p className="mt-3 text-ink/55 max-w-lg">
            See what's happening, share your experiences, and connect with fellow skill swappers.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_.42fr]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Live Now */}
            <div className="rounded-3xl bg-white p-6 shadow-card border border-ink/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-bold">🟢 Live Now</h2>
                <LiveBadge />
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {featuredSwappers
                  .filter((s) => s.online)
                  .map((person) => (
                    <div
                      key={person.name}
                      className="flex shrink-0 flex-col items-center gap-2 rounded-2xl bg-surface p-4 min-w-[120px] border border-ink/5"
                    >
                      <Avatar name={person.name} showStatus status="online" />
                      <p className="text-xs font-bold text-center">{person.name.split(' ')[0]}</p>
                      <SkillTag skill={person.offers[0]} />
                    </div>
                  ))}
              </div>
            </div>

            {/* Post Composer */}
            <form
              onSubmit={handlePost}
              className="rounded-3xl bg-white p-5 shadow-card border border-ink/5"
            >
              <div className="flex gap-3">
                <Avatar name="You" />
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share your skill swap experience or ask the community..."
                  className="field min-h-20 resize-none"
                />
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  type="submit"
                  disabled={!newPost.trim()}
                  className="bg-gradient-to-r from-violet to-electric text-white disabled:opacity-40"
                >
                  <Send size={14} /> Post
                </Button>
              </div>
            </form>

            {/* Recent Exchanges */}
            <div className="rounded-3xl bg-gradient-card p-6 border border-violet/10">
              <h3 className="font-display text-lg font-bold mb-4">🎉 Recent Exchanges</h3>
              <div className="space-y-3">
                {[
                  { users: 'Aarav & Riya', skills: 'Web Development ↔ Guitar', time: '2 hours ago' },
                  { users: 'Meera & Priya', skills: 'Spoken English ↔ Graphic Design', time: '5 hours ago' },
                  { users: 'Arjun & Karan', skills: 'Photography ↔ Python', time: '1 day ago' },
                ].map((exchange, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-500 text-sm">
                      🤝
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold">{exchange.users}</p>
                      <p className="text-xs text-ink/50">{exchange.skills}</p>
                    </div>
                    <span className="text-[10px] font-mono text-ink/30">{exchange.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Posts */}
            <div className="space-y-4">
              <h3 className="font-display text-lg font-bold">Community Posts</h3>
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl bg-white p-5 shadow-card border border-ink/5"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={post.user} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm">{post.user}</p>
                        <span className="text-[10px] text-ink/30 font-mono">{post.time}</span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-ink/70">{post.content}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4 border-t border-ink/5 pt-3">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-ink/50 hover:text-coral transition"
                    >
                      <Heart size={14} /> {post.likes}
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-bold text-ink/50 hover:text-violet transition">
                      <MessageCircle size={14} /> {post.comments}
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-bold text-ink/50 hover:text-electric transition">
                      <UserPlus size={14} /> Connect
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <LiveFeed compact />

            {/* Top Swappers */}
            <div className="rounded-3xl bg-white p-5 shadow-card border border-ink/5">
              <h3 className="font-bold text-sm mb-4">🏆 Top Skill Swappers</h3>
              <div className="space-y-3">
                {featuredSwappers.slice(0, 3).map((person, i) => (
                  <div key={person.name} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-ink/30 w-5">#{i + 1}</span>
                    <Avatar name={person.name} size="sm" showStatus status={person.online ? 'online' : 'offline'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{person.name}</p>
                      <p className="text-[10px] text-ink/40">{person.exchanges} exchanges</p>
                    </div>
                    <span className="text-xs font-bold text-warmyellow">⭐ {person.rating}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* People Near You */}
            <div className="rounded-3xl bg-white p-5 shadow-card border border-ink/5">
              <h3 className="font-bold text-sm mb-4">📍 People Near You</h3>
              <div className="space-y-3">
                {[
                  { name: 'Meera Iyer', distance: '0.8 km', skill: 'Spoken English' },
                  { name: 'Riya Patel', distance: '1.2 km', skill: 'Guitar' },
                  { name: 'Ananya Desai', distance: '1.9 km', skill: 'Cooking' },
                ].map((person) => (
                  <div key={person.name} className="flex items-center gap-2">
                    <Avatar name={person.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{person.name}</p>
                      <p className="text-[10px] text-ink/40">{person.distance} · {person.skill}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
