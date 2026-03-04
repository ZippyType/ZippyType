
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseService';
import { motion } from 'motion/react';
import { Zap, Target, Trophy, Timer } from 'lucide-react';

interface MultiplayerRaceProps {
  roomId: string;
  userId: string;
  username: string;
  opponent: { id: string, name: string };
  text: string;
  onComplete: (result: any) => void;
  onQuit: () => void;
}

const MultiplayerRace: React.FC<MultiplayerRaceProps> = ({ roomId, userId, username, opponent, text, onComplete, onQuit }) => {
  const [userInput, setUserInput] = useState("");
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isFinished, setIsFinished] = useState(false);
  const [opponentFinished, setOpponentFinished] = useState(false);
  
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Setup Realtime Channel
    const channel = supabase.channel(roomId, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('broadcast', { event: 'progress' }, payload => {
        if (payload.userId !== userId) {
          setOpponentProgress(payload.progress);
          if (payload.progress >= 100) setOpponentFinished(true);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setStartTime(Date.now());
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, userId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished) return;
    
    const val = e.target.value;
    setUserInput(val);

    // Calculate progress
    const progress = Math.min(100, (val.length / text.length) * 100);
    
    // Broadcast progress
    channelRef.current?.send({
      type: 'broadcast',
      event: 'progress',
      userId,
      progress
    });

    // Calculate WPM
    if (startTime) {
      const timeElapsed = (Date.now() - startTime) / 1000 / 60;
      const currentWpm = Math.round((val.length / 5) / timeElapsed);
      setWpm(currentWpm);
    }

    // Check if finished
    if (val === text) {
      setIsFinished(true);
      const finalTime = (Date.now() - (startTime || 0)) / 1000;
      onComplete({
        wpm,
        accuracy,
        time: finalTime,
        mode: 'multiplayer'
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Self Progress */}
        <div className="p-6 glass border border-indigo-500/30 rounded-3xl space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={40} /></div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-white uppercase tracking-widest">{username} (You)</span>
            <span className="text-xl font-black text-indigo-400 font-mono">{wpm} WPM</span>
          </div>
          <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              className="h-full bg-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${(userInput.length / text.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Opponent Progress */}
        <div className="p-6 glass border border-rose-500/30 rounded-3xl space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Target size={40} /></div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-white uppercase tracking-widest">{opponent.name}</span>
            {opponentFinished && <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1"><Trophy size={12} /> Finished</span>}
          </div>
          <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              className="h-full bg-rose-500"
              initial={{ width: 0 }}
              animate={{ width: `${opponentProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-10 glass border border-white/10 rounded-[3rem] space-y-8">
        <div className="text-2xl font-bold text-slate-400 leading-relaxed font-mono select-none">
          {text.split('').map((char, i) => {
            let color = "text-slate-600";
            if (i < userInput.length) {
              color = userInput[i] === char ? "text-white" : "text-rose-500";
            }
            return <span key={i} className={color}>{char}</span>;
          })}
        </div>

        <input 
          autoFocus
          value={userInput}
          onChange={handleInputChange}
          className="w-full bg-black/50 border border-white/10 rounded-2xl p-6 text-white font-mono text-xl focus:border-indigo-500 transition-all outline-none"
          placeholder="Type the text above..."
        />
      </div>

      <div className="flex justify-center">
        <button onClick={onQuit} className="px-8 py-3 bg-white/5 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/30 rounded-xl text-[10px] font-black text-slate-500 hover:text-rose-400 uppercase tracking-widest transition-all">
          Surrender Match
        </button>
      </div>
    </div>
  );
};

export default MultiplayerRace;
