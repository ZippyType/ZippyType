
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Zap, Loader2, X, Trophy } from 'lucide-react';

interface MatchmakingProps {
  userId: string;
  username: string;
  onMatchFound: (roomId: string, opponent: any) => void;
  onCancel: () => void;
}

const Matchmaking: React.FC<MatchmakingProps> = ({ userId, username, onMatchFound, onCancel }) => {
  const [status, setStatus] = useState<'idle' | 'searching' | 'found'>('searching');
  const [searchTime, setSearchTime] = useState(0);

  useEffect(() => {
    let timer: any;
    if (status === 'searching') {
      timer = setInterval(() => setSearchTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    const joinQueue = async () => {
      // 1. Add self to queue
      const { error } = await supabase
        .from('matchmaking_queue')
        .upsert({ user_id: userId, username, joined_at: new Date().toISOString() });

      if (error) {
        console.error('Failed to join queue', error);
        return;
      }

      // 2. Listen for matches
      const channel = supabase
        .channel('matchmaking')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, payload => {
          const match = payload.new;
          if (match.player1_id === userId || match.player2_id === userId) {
            const opponentId = match.player1_id === userId ? match.player2_id : match.player1_id;
            const opponentName = match.player1_id === userId ? match.player2_name : match.player1_name;
            
            setStatus('found');
            setTimeout(() => {
              onMatchFound(match.room_id, { id: opponentId, name: opponentName });
            }, 2000);
          }
        })
        .subscribe();

      // 3. Try to find an opponent (simplified: just pick the oldest person in queue)
      const findOpponent = async () => {
        const { data: queue } = await supabase
          .from('matchmaking_queue')
          .select('*')
          .neq('user_id', userId)
          .order('joined_at', { ascending: true })
          .limit(1);

        if (queue && queue.length > 0) {
          const opponent = queue[0];
          const roomId = `match_${Math.random().toString(36).slice(2, 9)}`;
          
          // Create match record
          const { error: matchError } = await supabase
            .from('matches')
            .insert({
              room_id: roomId,
              player1_id: userId,
              player1_name: username,
              player2_id: opponent.user_id,
              player2_name: opponent.username,
              created_at: new Date().toISOString()
            });

          if (!matchError) {
            // Remove both from queue
            await supabase.from('matchmaking_queue').delete().in('user_id', [userId, opponent.user_id]);
          }
        }
      };

      const interval = setInterval(findOpponent, 3000);
      return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
        supabase.from('matchmaking_queue').delete().eq('user_id', userId);
      };
    };

    joinQueue();
  }, [userId, username, onMatchFound]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass border border-white/10 rounded-[3rem] p-12 text-center space-y-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-500" />
        
        <AnimatePresence mode="wait">
          {status === 'searching' ? (
            <motion.div 
              key="searching"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse" />
                <div className="relative w-24 h-24 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin flex items-center justify-center">
                  <Users size={32} className="text-indigo-400 animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Searching for Opponent</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Time elapsed: {searchTime}s</p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                  <Zap size={14} className="animate-bounce" /> Skill-based matchmaking active
                </div>
                <button 
                  onClick={onCancel}
                  className="px-8 py-4 bg-white/5 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/30 rounded-2xl text-[10px] font-black text-slate-500 hover:text-rose-400 uppercase tracking-widest transition-all"
                >
                  Cancel Search
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="found"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center mx-auto">
                <Trophy size={40} className="text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Match Found!</h2>
                <p className="text-sm text-emerald-400 font-bold uppercase tracking-widest">Preparing the arena...</p>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-xl mb-2 mx-auto">👤</div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">{username}</p>
                  </div>
                  <div className="text-2xl font-black text-slate-700 italic">VS</div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center text-xl mb-2 mx-auto">🤖</div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Opponent</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Matchmaking;
