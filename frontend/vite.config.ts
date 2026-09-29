import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['jotai', 'jotai/utils'],
    },
    target: 'es2022',
  },
  optimizeDeps: {
    exclude: ['jotai', 'jotai/utils'],
  },
})
