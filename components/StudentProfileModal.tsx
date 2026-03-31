"use client";

import React, { useState, useEffect } from "react";
import { X, Trophy, Star, Zap, Target, Medal, Crown } from "lucide-react";
import { GameProfile, getLevelForXP, getThemeVisualConfig, getXPProgress, getLeagueForLevel } from "@/lib/gamification";
import { getGameProfile } from "@/lib/gamification";
import PetAvatar from "./PetAvatar";
import BadgeDisplay from "./BadgeDisplay";

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

export default function StudentProfileModal({ 
  isOpen, 
  onClose, 
  studentId, 
  studentName 
}: StudentProfileModalProps) {
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && studentId) {
      loadProfile();
    }
  }, [isOpen, studentId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getGameProfile(studentId);
      setProfile(data);
    } catch (err) {
      console.error("Error loading student profile:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const level = profile ? getLevelForXP(profile.xp) : null;
  const progress = profile ? getXPProgress(profile.xp) : null;
  const league = level ? getLeagueForLevel(level.level) : null;
  const themeVisual = getThemeVisualConfig(profile?.equippedTheme || null);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header / Banner */}
        <div className="h-32 relative shadow-inner" style={{ backgroundImage: themeVisual.buttonGradient }}>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>
          
          {/* Avatar / Pet Position */}
          <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-2xl shadow-xl">
            {profile?.petId ? (
              <PetAvatar 
                petId={profile.petId} 
                accessories={profile.petAccessories} 
                size="lg" 
                className="rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50"
              />
            ) : (
              <div className="w-32 h-32 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                <Target className="w-12 h-12" />
              </div>
            )}
          </div>

          {/* League Badge */}
          {league && (
            <div className="absolute -bottom-6 right-8 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-100 flex items-center gap-2">
              <span className="text-2xl">{league.emoji}</span>
              <span className={`font-bold uppercase tracking-wider text-sm ${league.color}`}>
                {league.name}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="pt-16 pb-8 px-8 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Name & Title */}
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{studentName}</h2>
            {profile?.equippedTitle && (
              <p className="text-indigo-600 font-semibold mt-1">
                🏆 {profile.equippedTitle}
              </p>
            )}
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 font-medium">Loading profile...</p>
            </div>
          ) : profile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Stats & XP */}
              <div className="space-y-6">
                {/* Level Card */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500" />
                      <span className="font-bold text-slate-700">Progress</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-white rounded-md border border-slate-200 text-slate-600">
                      Lv.{level?.level}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">{level?.title}</span>
                      <span className="text-slate-900 font-bold">{profile.xp} XP</span>
                    </div>
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000"
                        style={{ width: `${progress?.percent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">
                      {progress?.needed} XP to level {level?.level ? level.level + 1 : "?"}
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex flex-col items-center text-center">
                    <Trophy className="w-6 h-6 text-blue-500 mb-1" />
                    <span className="text-xl font-black text-blue-700">{profile.totalHomeworksCompleted}</span>
                    <span className="text-[10px] uppercase font-bold text-blue-500 tracking-tighter">Done</span>
                  </div>
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 flex flex-col items-center text-center">
                    <Star className="w-6 h-6 text-emerald-500 mb-1" />
                    <span className="text-xl font-black text-emerald-700">{profile.perfectScores}</span>
                    <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-tighter">Perfect</span>
                  </div>
                  <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100/50 flex flex-col items-center text-center">
                    <Flame className="w-6 h-6 text-orange-500 mb-1" />
                    <span className="text-xl font-black text-orange-700">{profile.currentStreak}</span>
                    <span className="text-[10px] uppercase font-bold text-orange-500 tracking-tighter">Streak</span>
                  </div>
                  <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100/50 flex flex-col items-center text-center">
                    <Medal className="w-6 h-6 text-purple-500 mb-1" />
                    <span className="text-xl font-black text-purple-700">{profile.highestStreak}</span>
                    <span className="text-[10px] uppercase font-bold text-purple-500 tracking-tighter">Best</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Badges */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <Crown className="w-5 h-5 text-indigo-500" />
                  <span className="font-bold text-slate-700">Badges Unlocked</span>
                </div>
                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 overflow-y-auto max-h-[250px]">
                  <BadgeDisplay unlockedBadges={profile.unlockedBadges} purchasedRewards={profile.purchasedRewards} />
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              Profile not found
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
           <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Rv2Class Gaming Profile</p>
        </div>
      </div>
    </div>
  );
}

// Flame icon for consistency
function Flame({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.206 1.143-3" />
    </svg>
  );
}
