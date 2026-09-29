import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiveBadge } from './ui/Primitives';
import { supabase } from '../auth/supabaseClient';
import { api } from '../utils/api';

const typeIcons: Record<string, string> = {
  offer: '🟢',
  looking: '🔍',
  completed: '🎉',
  available: '🟢',
};

export default function LiveFeed({ compact = false }: { compact?: boolean }) {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [visibleItems, setVisibleItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const items: any[] = [];

        // If logged in, fetch exchanges via backend API
        try {
          const dbExchanges = await api.getExchanges();
          (dbExchanges || []).slice(0, 5).forEach((ex: any) => {
            if (ex.status === 'completed') {
              items.push({
                id: `ex-comp-${ex.id}`,
                type: 'completed',
                user: ex.sender?.full_name || 'Member',
                action: 'completed a skill exchange',
                skill: `${ex.sender_skill_name} ↔ ${ex.receiver_skill_name}`,
                time: 'Recent'
              });
            } else {
              items.push({
                id: `ex-req-${ex.id}`,
                type: 'looking',
                user: ex.sender?.full_name || 'Member',
                action: 'is looking for',
                skill: ex.receiver_skill_name,
                time: 'Recent'
              });
            }
          });
        } catch {
          // Unauthenticated visitors: skip private exchanges query
        }

        const allProfiles = await api.getProfiles().catch(() => []);
        (allProfiles || []).slice(0, 8).forEach((p: any) => {
          if (p.primary_skill) {
            items.push({
              id: `prof-${p.id}`,
              type: 'available',
              user: p.full_name || 'Member',
              action: 'is currently available for',
              skill: p.primary_skill,
              time: 'Active'
            });
          }
          if (Array.isArray(p.learning_skills) && p.learning_skills.length > 0) {
            items.push({
              id: `prof-learn-${p.id}`,
              type: 'looking',
              user: p.full_name || 'Member',
              action: 'wants to learn',
              skill: p.learning_skills[0],
              time: 'Active'
            });
          }
        });

        setFeedItems(items);
      } catch (err) {
        console.error('Error fetching live feed:', err);
      }
    };
    fetchFeed();
  }, []);

  useEffect(() => {
    if (feedItems.length === 0) return;
    setVisibleItems(feedItems.slice(0, 3));
    setCurrentIndex(Math.min(feedItems.length - 1, 3));
  }, [feedItems]);

  useEffect(() => {
    if (feedItems.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % feedItems.length;
        setVisibleItems((prevItems) => {
          const newItems = [...prevItems.slice(1), feedItems[nextIndex]];
          return newItems;
        });
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [feedItems]);

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <LiveBadge />
        </div>
        {visibleItems.length === 0 ? (
          <p className="text-xs text-ink/40 py-2">No active swaps yet.</p>
        ) : (
          <AnimatePresence mode="popLayout">
            {visibleItems.slice(0, 2).map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2 rounded-xl bg-white/60 p-2.5 text-xs"
              >
                <span>{typeIcons[item.type]}</span>
                <span>
                  <b>{item.user}</b> {item.action} <b>{item.skill}</b>
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card border border-ink/5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="eyebrow text-ink/40">Community</p>
          <h3 className="mt-1 font-display text-xl font-bold">What's happening in SkillSwap</h3>
        </div>
        <LiveBadge />
      </div>

      <div className="space-y-2">
        {visibleItems.length === 0 ? (
          <p className="text-xs text-ink/40 py-6 text-center">No community activity yet.</p>
        ) : (
          <AnimatePresence mode="popLayout">
            {visibleItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 transition-colors hover:bg-violet/5"
              >
                <span className="text-lg">{typeIcons[item.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-bold">{item.user}</span>{' '}
                    <span className="text-ink/60">{item.action}</span>{' '}
                    <span className="font-bold text-violet">{item.skill}</span>
                  </p>
                  <p className="text-[10px] text-ink/40 font-mono mt-0.5">{item.time}</p>
                </div>
                {item.type === 'available' && (
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
