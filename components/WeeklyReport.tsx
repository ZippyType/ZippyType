
import React from 'react';
import { TypingResult } from '../types';
import { Activity, TrendingUp, Target, Clock } from 'lucide-react';

interface WeeklyReportProps {
  history: TypingResult[];
  isPro?: boolean;
  onUpgradeClick?: () => void;
}

const WeeklyReport: React.FC<WeeklyReportProps> = ({ history, isPro = false, onUpgradeClick }) => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const weeklyHistory = history.filter(h => new Date(h.date) >= oneWeekAgo);
  
  if (weeklyHistory.length === 0) {
    return (
      <div className="p-8 text-center glass border border-white/5 rounded-3xl">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No data for the last 7 days</p>
      </div>
    );
  }

  const avgWpm = Math.round(weeklyHistory.reduce((acc, h) => acc + h.wpm, 0) / weeklyHistory.length);
  const avgAcc = Math.round(weeklyHistory.reduce((acc, h) => acc + h.accuracy, 0) / weeklyHistory.length);
  const totalWords = weeklyHistory.reduce((acc, h) => acc + (h.textLength / 5), 0);
  const bestWpm = Math.max(...weeklyHistory.map(h => h.wpm));

  return (
    <div className="space-y-6 p-8 glass border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
      {!isPro && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md p-6 text-center">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl mb-3 border border-amber-500/20">
            <TrendingUp size={24} />
          </div>
          <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1.5">Weekly Performance Reports</h4>
          <p className="text-[10px] text-slate-400 max-w-sm mb-4 leading-relaxed">
            Upgrade to ZippyType Pro to get comprehensive performance audits, speed trends, and word count statistics over your last 7 days.
          </p>
          <button 
            onClick={onUpgradeClick}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black rounded-xl text-[9px] uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95"
          >
            Unlock with Pro
          </button>
        </div>
      )}

      <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
        <Activity size={120} />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
          <TrendingUp className="text-emerald-400" /> Weekly Performance Report
        </h3>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Last 7 days of activity</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Avg Speed</span>
          <p className="text-xl font-black text-white font-mono">{avgWpm} <span className="text-[10px] text-slate-500">WPM</span></p>
        </div>
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Avg Accuracy</span>
          <p className="text-xl font-black text-white font-mono">{avgAcc}%</p>
        </div>
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Words</span>
          <p className="text-xl font-black text-white font-mono">{Math.round(totalWords)}</p>
        </div>
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Peak Speed</span>
          <p className="text-xl font-black text-emerald-400 font-mono">{bestWpm} <span className="text-[10px] text-slate-500">WPM</span></p>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Growth Trend: {avgWpm > 40 ? 'Stable' : 'Improving'}</span>
          </div>
          <button className="text-[9px] font-black text-indigo-400 hover:text-white uppercase tracking-widest transition-colors">Share Report</button>
        </div>
      </div>
    </div>
  );
};

export default WeeklyReport;
