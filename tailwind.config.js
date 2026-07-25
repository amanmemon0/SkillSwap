/** @type {import('tailwindcss').Config} */
export default { content: ['./index.html', './src/**/*.{ts,tsx}'], safelist: ['bg-indigo-50','text-indigo-600','bg-cyan-50','text-cyan-600','bg-violet-50','text-violet-600','bg-amber-50','text-amber-600'], theme: { extend: { colors: { primary: '#4F46E5', accent: '#06B6D4' }, boxShadow: { glow: '0 18px 50px rgba(79,70,229,.15)' } } }, plugins: [] }
