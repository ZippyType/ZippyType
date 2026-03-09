import React, { useState, useEffect } from 'react';
import { User, Trophy, Zap, Target, Rocket, Lock, CheckCircle2, Loader2, RotateCcw, Camera, Activity } from 'lucide-react';
import { supabase, loadUserPreferences, fetchHistory } from '../services/supabaseService';
import { UserProfile, Achievement, TypingResult } from '../types';
import DailyQuests from './DailyQuests';
import HistoryChart from './HistoryChart';

interface ProfileViewProps {
  username: string; // From URL
  currentUser: any;
  currentProfile: UserProfile;
  onUpdateProfile: (newProfile: UserProfile) => void;
  achievements: Achievement[];
  history: TypingResult[];
}

const AVATARS = ['😊', '😎', '🤖', '🦊', '🐱', '🐶', '🦄', '🌈', '⚡', '✨', '🛸', '🚀', '👾', '🎮', '🏆', '💎'];

const ProfileView: React.FC<ProfileViewProps> = ({ 
  username, 
  currentUser, 
  currentProfile, 
  onUpdateProfile,
  achievements,
  history
}) => {
  const isOwnProfile = username.toLowerCase() === (currentProfile.handle || currentProfile.username).toLowerCase();
  const [loading, setLoading] = useState(!isOwnProfile);
  const [profile, setProfile] = useState<UserProfile>(currentProfile);
  const [userHistory, setUserHistory] = useState<TypingResult[]>(history);
  const [userAchievements, setUserAchievements] = useState<Achievement[]>(achievements);
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(currentProfile.username);
  const [newAvatar, setNewAvatar] = useState(currentProfile.avatar);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOwnProfile) {
      fetchPublicProfile();
    } else {
      setProfile(currentProfile);
      setUserHistory(history);
      setUserAchievements(achievements);
      setNewUsername(currentProfile.username);
      setNewAvatar(currentProfile.avatar);
    }
  }, [username, isOwnProfile, currentProfile, history, achievements]);

  const fetchPublicProfile = async () => {
    setLoading(true);
    try {
      // 1. Get user_id from username
      const { data: userData, error: userError } = await supabase
        .from('usernames')
        .select('user_id')
        .eq('username', username.toLowerCase())
        .single();

      if (userError || !userData) throw new Error("User not found");

      // 2. Load preferences (profile)
      const prefs = await loadUserPreferences(userData.user_id);
      if (prefs) {
        setProfile(prefs.user_profile);
      }

      // 3. Load history
      const hist = await fetchHistory(userData.user_id);
      setUserHistory(hist);

      // Note: Achievements are currently local-only, so we can't show them for others yet
      // unless we move them to the database.
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedProfile = { ...profile, username: newUsername, avatar: newAvatar };
      onUpdateProfile(updatedProfile);
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Scanning Pilot Data...</p>
      </div>
    );
  }

  const stats = {
    avgWpm: userHistory.length > 0 ? Math.round(userHistory.reduce((acc, curr) => acc + curr.wpm, 0) / userHistory.length) : 0,
    avgAcc: userHistory.length > 0 ? Math.round(userHistory.reduce((acc, curr) => acc + curr.accuracy, 0) / userHistory.length) : 0,
    totalRaces: userHistory.length,
    bestWpm: userHistory.length > 0 ? Math.max(...userHistory.map(h => h.wpm)) : 0
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Profile Header */}
      <div className="glass rounded-[2.5rem] p-8 md:p-12 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-white/10 flex items-center justify-center text-6xl md:text-7xl shadow-2xl group-hover:scale-105 transition-transform duration-500">
              {editing ? (
                <div className="grid grid-cols-4 gap-2 p-4 overflow-y-auto max-h-full no-scrollbar">
                  {AVATARS.map(a => (
                    <button 
                      key={a} 
                      onClick={() => setNewAvatar(a)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors ${newAvatar === a ? 'bg-indigo-500/30 ring-2 ring-indigo-500' : ''}`}
                    >
                      <span className="text-xl">{a}</span>
                    </button>
                  ))}
                </div>
              ) : (
                profile.avatar
              )}
            </div>
            {isOwnProfile && !editing && (
              <button 
                onClick={() => setEditing(true)}
                className="absolute -bottom-2 -right-2 p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-xl transition-all hover:scale-110 active:scale-95 border border-white/20"
              >
                <Camera size={18} />
              </button>
            )}
          </div>

          <div className="text-center md:text-left space-y-4 flex-1">
            <div className="space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-3">
                {editing ? (
                  <input 
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-2xl font-black text-white outline-none focus:border-indigo-500 transition-all w-full max-w-xs"
                  />
                ) : (
                  <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter italic">
                    {profile.username}
                  </h2>
                )}
                {profile.is_pro && (
                  <div className="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-600 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-orange-500/20">
                    PRO
                  </div>
                )}
              </div>
              <p className="text-indigo-400 font-mono font-bold tracking-widest text-sm">@{username}</p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
                <Zap size={14} className="text-amber-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Speed:</span>
                <span className="text-xs font-black text-white">{stats.avgWpm} WPM</span>
              </div>
              <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
                <Target size={14} className="text-emerald-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accuracy:</span>
                <span className="text-xs font-black text-white">{stats.avgAcc}%</span>
              </div>
              <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
                <Rocket size={14} className="text-purple-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Races:</span>
                <span className="text-xs font-black text-white">{stats.totalRaces}</span>
              </div>
            </div>

            {editing && (
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                  Save Changes
                </button>
                <button 
                  onClick={() => { setEditing(false); setNewUsername(profile.username); setNewAvatar(profile.avatar); }}
                  className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass rounded-[2rem] p-8 border border-white/10 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity size={20} className="text-indigo-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Performance Analytics</h3>
              </div>
            </div>
            <HistoryChart history={userHistory} speedUnit="wpm" />
          </div>

          <div className="glass rounded-[2rem] p-8 border border-white/10 shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <Trophy size={20} className="text-amber-500" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Pilot Achievements</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {userAchievements.map(a => (
                <div 
                  key={a.id} 
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center text-center gap-2 ${
                    a.unlockedAt 
                      ? 'bg-indigo-500/10 border-indigo-500/30' 
                      : 'bg-black/20 border-white/5 opacity-40 grayscale'
                  }`}
                >
                  <span className="text-3xl">{a.icon}</span>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">{a.title}</p>
                    <p className="text-[8px] font-medium text-slate-500 leading-tight">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {isOwnProfile && <DailyQuests quests={profile.quests || []} />}
          
          <div className="glass rounded-[2rem] p-8 border border-white/10 shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <Rocket size={20} className="text-emerald-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Personal Bests</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Peak Speed</span>
                <span className="text-xl font-black text-white italic">{stats.bestWpm} <span className="text-[10px] not-italic text-slate-500">WPM</span></span>
              </div>
              <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Words</span>
                <span className="text-xl font-black text-white italic">{Math.round(userHistory.reduce((acc, curr) => acc + (curr.textLength / 5), 0)).toLocaleString()}</span>
              </div>
              <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Time Raced</span>
                <span className="text-xl font-black text-white italic">{Math.round(userHistory.reduce((acc, curr) => acc + curr.time, 0) / 60)} <span className="text-[10px] not-italic text-slate-500">MIN</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
