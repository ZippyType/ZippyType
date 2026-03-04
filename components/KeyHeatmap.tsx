
import React from 'react';
import { motion } from 'motion/react';

interface KeyHeatmapProps {
  keySpeeds: Record<string, number[]>;
}

const KeyHeatmap: React.FC<KeyHeatmapProps> = ({ keySpeeds }) => {
  const keys = Object.keys(keySpeeds);
  if (keys.length === 0) return null;

  const averages = keys.reduce((acc, key) => {
    const speeds = keySpeeds[key];
    const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    acc[key] = avg;
    return acc;
  }, {} as Record<string, number>);

  const maxAvg = Math.max(...Object.values(averages));
  const minAvg = Math.min(...Object.values(averages));

  const getColor = (avg: number) => {
    const ratio = (avg - minAvg) / (maxAvg - minAvg || 1);
    // Green (fast) to Red (slow)
    const r = Math.round(255 * ratio);
    const g = Math.round(255 * (1 - ratio));
    return `rgb(${r}, ${g}, 50)`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Key Speed Heatmap</h4>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[rgb(0,255,50)]" />
            <span className="text-[8px] text-slate-500 font-bold uppercase">Fast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[rgb(255,0,50)]" />
            <span className="text-[8px] text-slate-500 font-bold uppercase">Slow</span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {keys.sort().map(key => (
          <motion.div
            key={key}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-10 h-10 rounded-lg flex flex-col items-center justify-center border border-white/5 shadow-lg relative group"
            style={{ backgroundColor: `${getColor(averages[key])}22`, borderColor: `${getColor(averages[key])}44` }}
          >
            <span className="text-xs font-black text-white uppercase">{key === ' ' ? '␣' : key}</span>
            <span className="text-[7px] font-mono text-slate-400">{Math.round(averages[key])}ms</span>
            
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 border border-white/10 rounded text-[8px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Avg: {Math.round(averages[key])}ms ({keySpeeds[key].length} samples)
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default KeyHeatmap;
