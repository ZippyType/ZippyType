import React, { useState, useEffect, useRef } from 'react';
import { ReplayEvent } from '../types';
import { Play, Pause, RotateCcw, FastForward, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReplayPlayerProps {
  replayData: ReplayEvent[];
  text: string;
  onClose?: () => void;
  autoPlay?: boolean;
}

export const ReplayPlayer: React.FC<ReplayPlayerProps> = ({ replayData, text, onClose, autoPlay = true }) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const interval = 50; // Smoother updates
      timerRef.current = window.setInterval(() => {
        setCurrentTime(t => {
          const nextTime = t + (interval * playbackSpeed);
          
          // Find all events that happened up to this point
          let nextIdx = currentIndex;
          while (nextIdx < replayData.length && replayData[nextIdx].timestamp <= nextTime) {
            nextIdx++;
          }
          
          if (nextIdx > currentIndex) {
            setCurrentIndex(nextIdx);
          }

          if (nextIdx >= replayData.length) {
            setIsPlaying(false);
            return replayData[replayData.length - 1]?.timestamp || nextTime;
          }

          return nextTime;
        });
      }, interval);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, currentIndex, replayData, playbackSpeed]);

  const reset = () => {
    setIsPlaying(true);
    setCurrentTime(0);
    setCurrentIndex(0);
  };

  const totalDuration = replayData[replayData.length - 1]?.timestamp || 1;
  const progress = (currentTime / totalDuration) * 100;

  return (
    <div className="glass p-8 rounded-[2.5rem] border border-white/10 space-y-8 w-full max-w-3xl shadow-3xl animate-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <RotateCcw size={20} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Race Replay</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Analyzing performance patterns</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="relative p-8 bg-black/40 rounded-3xl border border-white/5 min-h-[160px] flex items-center justify-center text-xl font-mono leading-relaxed select-none shadow-inner">
        <div className="w-full text-left">
          {text.split('').map((char, i) => {
            const event = replayData[i];
            const isTyped = i < currentIndex;
            const isCorrect = event?.isCorrect;
            const isCurrent = i === currentIndex;

            return (
              <span 
                key={i} 
                className={`inline-block transition-all duration-75 ${
                  isTyped 
                    ? (isCorrect ? 'text-emerald-400 font-bold' : 'text-rose-400 bg-rose-500/10 rounded px-0.5') 
                    : isCurrent ? 'text-white border-b-2 border-indigo-500 animate-pulse' : 'text-slate-700'
                }`}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="flex gap-2">
            <button 
              onClick={() => setIsPlaying(!isPlaying)} 
              className={`p-4 rounded-2xl transition-all shadow-lg ${isPlaying ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button 
              onClick={reset} 
              className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/5"
            >
              <RotateCcw size={20} />
            </button>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
              <span>{(currentTime / 1000).toFixed(1)}s</span>
              <span>{(totalDuration / 1000).toFixed(1)}s</span>
            </div>
            <div className="relative h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
              />
            </div>
          </div>

          <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
            {[1, 2, 4].map(speed => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${playbackSpeed === speed ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
