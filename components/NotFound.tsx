import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="relative mb-8"
      >
        <div className="absolute inset-0 bg-rose-500/20 blur-[100px] rounded-full" />
        <div className="relative p-8 bg-black/40 border border-white/10 rounded-[2.5rem] backdrop-blur-xl">
          <ShieldAlert size={80} className="text-rose-500 mx-auto mb-4" />
          <h1 className="text-8xl font-black text-white tracking-tighter mb-2">404</h1>
          <p className="text-xl font-bold text-slate-400 uppercase tracking-widest">Page Not Found</p>
        </div>
      </motion.div>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-slate-500 max-w-md mb-12"
      >
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </motion.p>

      <div className="flex flex-col sm:flex-row gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all border border-white/10"
        >
          <ArrowLeft size={16} />
          Go Back
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-indigo-500/20"
        >
          <Home size={16} />
          Back to Home
        </motion.button>
      </div>
    </div>
  );
};

export default NotFound;
