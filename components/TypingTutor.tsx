
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Target, Zap, ShieldCheck, Keyboard, Sparkles, ChevronRight, RotateCcw, CheckCircle2, AlertCircle, Loader2, Trophy } from 'lucide-react';
import { generateTypingLesson } from '../services/aiService';
import { AIProvider } from '../types';
import TypingGuide from './TypingGuide';

interface TypingTutorProps {
  provider: AIProvider;
  token?: string;
  isPro: boolean;
  accentColor: string;
}

interface Lesson {
  title: string;
  content: string;
  exercise: string;
  tips: string[];
}

const FALLBACK_LESSON: Lesson = {
  title: "Home Row Mastery",
  content: "The home row is the base for all touch typing. Keep your fingers anchored on ASDF and JKL;.",
  exercise: "all sad lads fall as dad asks for a flask",
  tips: ["Keep your wrists level", "Don't look at the keys", "Return to home row after every stroke"]
};

const TypingTutor: React.FC<TypingTutorProps> = ({ provider, token, isPro, accentColor }) => {
  const [level, setLevel] = useState(1);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [userInput, setUserInput] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [results, setResults] = useState<{ wpm: number; accuracy: number } | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchLesson = async (currentLevel: number) => {
    setLoading(true);
    setResults(null);
    setUserInput("");
    setIsActive(false);
    try {
      const data = await generateTypingLesson(provider, token, isPro, currentLevel);
      setLesson(data);
    } catch (error) {
      console.error("Failed to fetch lesson:", error);
      setLesson(FALLBACK_LESSON);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLesson(level);
  }, [level]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (!isActive && value.length > 0) {
      setIsActive(true);
      setStartTime(Date.now());
    }
    setUserInput(value);

    if (lesson && value === lesson.exercise) {
      const endTime = Date.now();
      const timeInMinutes = (endTime - (startTime || endTime)) / 60000;
      const words = lesson.exercise.split(' ').length;
      const wpm = Math.round(words / timeInMinutes);
      
      // Calculate accuracy (simple version for tutor)
      let correct = 0;
      for (let i = 0; i < value.length; i++) {
        if (value[i] === lesson.exercise[i]) correct++;
      }
      const accuracy = Math.round((correct / lesson.exercise.length) * 100);

      setResults({ wpm, accuracy });
      setShowFeedback(true);
      setIsActive(false);
    }
  };

  const nextLevel = () => {
    setLevel(prev => prev + 1);
    setShowFeedback(false);
  };

  const retryLesson = () => {
    setUserInput("");
    setIsActive(false);
    setResults(null);
    setShowFeedback(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const nextChar = lesson ? lesson.exercise[userInput.length] || '' : '';

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <BookOpen className="text-indigo-400" />
            Tactical Tutor
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.5em]">AI-Powered Neural Training • Level {level}</p>
        </div>
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i} 
              className={`w-2 h-2 rounded-full transition-all duration-500 ${i < level ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-800'}`} 
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass p-20 rounded-[3rem] flex flex-col items-center justify-center gap-6 border border-white/5"
          >
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <div className="text-center space-y-2">
              <p className="text-white font-black uppercase tracking-widest text-sm">Generating Lesson...</p>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Consulting the Tactical AI</p>
            </div>
          </motion.div>
        ) : lesson ? (
          <motion.div 
            key="lesson"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Lesson Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 glass p-8 rounded-[2.5rem] border border-white/10 space-y-4">
                <div className="flex items-center gap-3 text-indigo-400">
                  <Sparkles size={20} />
                  <h3 className="text-lg font-black uppercase tracking-tight">{lesson.title}</h3>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed font-medium">
                  {lesson.content}
                </p>
              </div>
              <div className="glass p-8 rounded-[2.5rem] border border-white/10 space-y-4 bg-indigo-500/5">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Tactical Tips</h4>
                <ul className="space-y-3">
                  {lesson.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-[10px] font-bold text-slate-400 uppercase leading-tight">
                      <div className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Interactive Exercise */}
            <div className="space-y-6">
              <div className="glass p-10 rounded-[3rem] border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                
                <div className="relative z-10 space-y-8">
                  <div className="text-2xl font-mono tracking-tight leading-relaxed text-center select-none">
                    {lesson.exercise.split('').map((char, i) => {
                      let color = "text-slate-600";
                      if (i < userInput.length) {
                        color = userInput[i] === char ? "text-emerald-400" : "text-rose-400 bg-rose-400/10 rounded";
                      } else if (i === userInput.length) {
                        color = "text-white border-b-2 border-indigo-500 animate-pulse";
                      }
                      return <span key={i} className={`${color} transition-colors duration-150`}>{char}</span>;
                    })}
                  </div>

                  <textarea
                    ref={inputRef}
                    value={userInput}
                    onChange={handleInputChange}
                    className="absolute inset-0 opacity-0 cursor-default resize-none"
                    autoFocus
                    spellCheck={false}
                    disabled={showFeedback}
                  />

                  {!isActive && !showFeedback && (
                    <div className="flex justify-center">
                      <div className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] animate-bounce">
                        Start typing to begin drill
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Finger Placement Guide */}
              <TypingGuide nextChar={nextChar} accentColor={accentColor} />
            </div>

            {/* Feedback Modal */}
            <AnimatePresence>
              {showFeedback && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass p-10 rounded-[3rem] border border-indigo-500/30 bg-indigo-500/10 flex flex-col items-center text-center gap-6"
                >
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 size={48} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Drill Complete</h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Neural pathways reinforced</p>
                  </div>

                  <div className="flex gap-12">
                    <div className="text-center">
                      <div className="text-3xl font-black text-white">{results?.wpm}</div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">WPM</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black text-white">{results?.accuracy}%</div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Accuracy</div>
                    </div>
                  </div>

                  <div className="flex gap-4 w-full max-w-xs">
                    <button 
                      onClick={retryLesson}
                      className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={16} />
                      Retry
                    </button>
                    <button 
                      onClick={nextLevel}
                      className="flex-1 px-6 py-4 rounded-2xl bg-indigo-500 text-white font-black uppercase tracking-widest text-xs hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                    >
                      Next Level
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass p-20 rounded-[3rem] flex flex-col items-center justify-center gap-6 border border-white/5 text-center"
          >
            <AlertCircle className="w-12 h-12 text-rose-500" />
            <div className="space-y-2">
              <p className="text-white font-black uppercase tracking-widest text-sm">Neural Link Failed</p>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Could not establish connection to Tactical AI</p>
            </div>
            <button 
              onClick={() => fetchLesson(level)}
              className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
            >
              Re-establish Link
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Technique', value: '85%', icon: <ShieldCheck size={16} /> },
          { label: 'Precision', value: '98%', icon: <Target size={16} /> },
          { label: 'Velocity', value: '42 WPM', icon: <Zap size={16} /> },
          { label: 'Rank', value: 'Novice', icon: <Trophy size={16} /> },
        ].map((stat, i) => (
          <div key={i} className="glass p-4 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="p-2 bg-white/5 rounded-lg text-slate-400">
              {stat.icon}
            </div>
            <div>
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
              <div className="text-sm font-black text-white uppercase">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TypingTutor;
