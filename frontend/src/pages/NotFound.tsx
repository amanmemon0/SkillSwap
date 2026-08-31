import { Link } from 'react-router-dom';
import { ArrowLeft, Home, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-ink flex items-center justify-center p-6 text-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-violet/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-cyan/20 blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg text-center"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-[150px] font-bold leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-violet via-electric to-cyan"
        >
          404
        </motion.div>
        
        <h1 className="mt-8 text-3xl font-display font-bold">Page not found</h1>
        <p className="mt-4 text-white/60 leading-relaxed text-lg max-w-md mx-auto">
          Oops! It looks like the page you are looking for has been moved, deleted, or never existed in the first place.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            to="/" 
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet to-electric text-white font-bold shadow-glow hover:shadow-glow-lg transition flex items-center justify-center gap-2 group"
          >
            <Home size={18} className="group-hover:-translate-y-0.5 transition-transform" />
            Back to Home
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold transition flex items-center justify-center gap-2 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>
        </div>
      </motion.div>
    </main>
  );
}
