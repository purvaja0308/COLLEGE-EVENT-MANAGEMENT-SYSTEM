import { useEffect } from 'react';
import { motion } from 'motion/react';
import { useCems } from '../context/CemsContext';

interface FestSplashScreenProps {
  onDone: () => void;
}

export function FestSplashScreen({ onDone }: FestSplashScreenProps) {
  const { settings } = useCems();

  useEffect(() => {
    const timer = window.setTimeout(onDone, 1250);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35, ease: 'easeOut' } }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white px-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center text-center max-w-md"
      >
        {/* Geometric Fest Logo Emblem */}
        <div className="relative mb-6 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="w-24 h-24 rounded-2xl border border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_40px_rgba(34,211,238,0.28)]"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="absolute font-display text-2xl font-bold tracking-tight text-white"
          >
            AIML
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-1.5"
        >
          <div className="text-xs font-medium tracking-wide text-cyan-300">
            {settings.universityName}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {settings.festName}
          </h1>
          <div className="text-xs text-slate-400">
            {settings.departmentName} · Event &amp; Registration Portal
          </div>
        </motion.div>

        <div className="mt-8 w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'left' }}
            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
