import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { liveFeedItems } from '../data/mock';
import { LiveBadge } from './ui/Primitives';

const typeIcons: Record<string, string> = {
  offer: '🟢',
  looking: '🔍',
  completed: '🎉',
  available: '🟢',
};

export default function LiveFeed({ compact = false }: { compact?: boolean }) {
  const [visibleItems, setVisibleItems] = useState(liveFeedItems.slice(0, 3));
  const [currentIndex, setCurrentIndex] = useState(3);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % liveFeedItems.length;
        setVisibleItems((prevItems) => {
          const newItems = [...prevItems.slice(1), liveFeedItems[nextIndex]];
          return newItems;
        });
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <LiveBadge />
        </div>
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
      </div>
    </div>
  );
}
