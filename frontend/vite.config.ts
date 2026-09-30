import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    rollupOptions: {
      // Split the 1.6 MB bundle into smaller async chunks.
      // Each key is a chunk name; each value lists packages that go into it.
      output: {
        manualChunks: {
          // React core — never changes; cached forever after first visit
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Animation library — large but rarely changes
          'vendor-motion': ['framer-motion'],
          // Icon library
          'vendor-icons': ['lucide-react'],
          // Chart library — only loaded on dashboard
          'vendor-charts': ['recharts'],
          // Supabase — needed only for auth pages
          'vendor-supabase': ['@supabase/supabase-js'],
          // Daily.co video SDK — only loaded on LiveLecture page
          'vendor-daily': ['@daily-co/daily-js', '@daily-co/daily-react'],
          // Form validation
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Spreadsheet export — large, only used in Admin import
          'vendor-xlsx': ['xlsx'],
        },
      },
    },
  },
  optimizeDeps: {
    // Pre-bundle heavy deps so the dev server first-load is faster
    include: [
      'react', 'react-dom', 'react-router-dom',
      'framer-motion', 'lucide-react', 'recharts',
    ],
    exclude: ['jotai', 'jotai/utils'],
  },
})
