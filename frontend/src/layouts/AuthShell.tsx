import type { ReactNode } from 'react';
import { Sparkles, ArrowRightLeft } from 'lucide-react';

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_.9fr]">
      {/* Left Illustration Panel */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-ink via-violet/90 to-electric p-10 text-white lg:flex lg:flex-col lg:justify-between">
        {/* Decorative blurs */}
        <div className="absolute -right-20 top-24 h-80 w-80 rounded-full bg-electric/30 blur-[100px]" />
        <div className="absolute -left-20 bottom-20 h-60 w-60 rounded-full bg-violet/40 blur-[80px]" />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5 font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 backdrop-blur-sm text-white">
            <Sparkles size={17} />
          </span>
          <span className="font-display text-lg">SkillSwap</span>
        </div>

        {/* Main Content */}
        <div className="relative max-w-xl">
          <p className="eyebrow text-cyan/80">Exchange Skills. Not Money.</p>
          <h1 className="mt-5 font-display text-6xl font-bold leading-[.98]">
            Learn something new. Teach what you love.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-white/65">
            Trade what you know for what you want to learn, with real people in your community.
          </p>

          {/* Exchange Illustration */}
          <div className="mt-10 flex items-center gap-4 rounded-2xl bg-white/10 backdrop-blur-sm p-5 max-w-sm">
            <div className="text-center flex-1">
              <span className="text-3xl">💻</span>
              <p className="mt-2 text-sm font-bold">Web Dev</p>
            </div>
            <div className="flex flex-col items-center">
              <ArrowRightLeft className="text-cyan animate-exchange-pulse" size={24} />
            </div>
            <div className="text-center flex-1">
              <span className="text-3xl">🎸</span>
              <p className="mt-2 text-sm font-bold">Guitar</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative max-w-sm border-t border-white/20 pt-5 text-sm text-white/55">
          Share what you know. Learn what you love. 🔄
        </div>
      </section>

      {/* Right Form Panel */}
      <section className="relative flex items-center justify-center overflow-hidden p-5 sm:p-10 bg-surface">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-violet/10 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-48 w-48 rounded-full bg-electric/10 blur-3xl" />
        <div className="relative w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
