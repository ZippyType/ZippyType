import React from 'react';
import { Quest } from '../types';
import { CheckCircle2, Circle, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

interface DailyQuestsProps {
  quests: Quest[];
}

const DailyQuests: React.FC<DailyQuestsProps> = ({ quests }) => {
  if (!quests || quests.length === 0) return null;

  return (
    <div className="glass border border-white/10 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Trophy size={16} className="text-amber-400" />
        <h3 className="text-xs font-black text-white uppercase tracking-widest">Daily Quests</h3>
      </div>
      <div className="space-y-3">
        {quests.map((quest, index) => (
          <div key={quest.id} className="relative group">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wide ${quest.completed ? 'text-emerald-400 line-through' : 'text-slate-300'}`}>
                {quest.description}
              </span>
              <span className="text-[9px] font-mono text-slate-500">
                {quest.progress} / {quest.target}
              </span>
            </div>
            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                className={`h-full ${quest.completed ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }}
              />
            </div>
            {quest.completed && (
              <div className="absolute right-0 top-0 -mt-1 -mr-1">
                <CheckCircle2 size={12} className="text-emerald-400 bg-black rounded-full" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyQuests;
