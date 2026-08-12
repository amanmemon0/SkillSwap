/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Outfit', 'ui-sans-serif', 'system-ui'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['DM Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: '#1a1440',
        violet: '#7c3aed',
        electric: '#3b82f6',
        mint: '#bdf4d1',
        coral: '#ff937f',
        cyan: {
          DEFAULT: '#06b6d4',
          700: '#0e7490',
        },
        softpink: '#f9a8d4',
        warmyellow: '#fbbf24',
        surface: '#f8f7fc',
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #06b6d4 100%)',
        'gradient-cta': 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
        'gradient-card': 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%)',
        'gradient-warm': 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
        'gradient-match': 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
      },
      boxShadow: {
        float: '0 24px 64px rgba(26, 20, 64, 0.12)',
        card: '0 4px 24px rgba(26, 20, 64, 0.06)',
        glow: '0 0 40px rgba(124, 58, 237, 0.15)',
        'glow-blue': '0 0 40px rgba(59, 130, 246, 0.15)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      keyframes: {
        'pulse-live': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.2)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'exchange-pulse': {
          '0%, 100%': { transform: 'scaleX(1)' },
          '50%': { transform: 'scaleX(1.15)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'pulse-live': 'pulse-live 2s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.4s ease-out forwards',
        'exchange-pulse': 'exchange-pulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}
