"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserCircle, Video, BookOpen, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";
import { countUncompletedHomework } from "@/lib/firebase";
import { getGameProfile, getLevelForXP, getMasterTierInfo, getNextBadgeHint, getNextLevel, getNextShopUnlock, getShopRewardById, getThemeVisualConfig, getXPProgress, GameProfile, getLeagueForLevel, getPetNeeds, PetNeeds } from "@/lib/gamification";
import GrowthTree from "@/components/GrowthTree";
import BadgeDisplay from "@/components/BadgeDisplay";
import RewardShop from "@/components/RewardShop";
import PetAvatar from "@/components/PetAvatar";
import PetCarePopover from "@/components/PetCarePopover";

interface StudentData {
  id: string;
  name: string;
  teacher?: string;
  subjects?: { English?: boolean; IT?: boolean };
  price?: number;
  currency?: string;
}

const createFallbackProfile = (studentId: string): GameProfile => ({
  studentId,
  xp: 0,
  shopCoins: 0,
  totalHomeworksCompleted: 0,
  perfectScores: 0,
  highScores: 0,
  bestTimerBonus: 0,
  earlyCompletions: 0,
  treeHealth: 50,
  unlockedBadges: [],
  purchasedRewards: [],
  equippedTheme: null,
  equippedFrame: null,
  equippedTitle: null,
  equippedVehicle: null,
  equippedBackground: null,
  petId: null,
  petAccessories: [],
  currentStreak: 0,
  highestStreak: 0,
  lastHomeworkWeek: null,
  petLastCleaned: null,
  petLastFed: null,
  petLastPlayed: null,
  petLastDrank: null,
});

export default function StudentWelcome({ student }: { student: StudentData }) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [uncompletedCount, setUncompletedCount] = useState<number>(0);
  const [gameProfile, setGameProfile] = useState<GameProfile | null>(null);
  const [showShop, setShowShop] = useState(false);
  const [petReaction, setPetReaction] = useState<string | null>(null);
  const [petPhrase, setPetPhrase] = useState<string | null>(null);
  const [activeCareNeed, setActiveCareNeed] = useState<"poop" | "hunger" | "boredom" | "thirst" | null>(null);

  const petNeeds: PetNeeds = gameProfile ? getPetNeeds(gameProfile) : { poopCount: 0, isHungry: false, isBored: false, isThirsty: false };

  const teacherName = student.teacher || "Roman";

  useEffect(() => {
    const loadData = async () => {
      const [countResult, profileResult] = await Promise.allSettled([
        countUncompletedHomework(student.id),
        getGameProfile(student.id),
      ]);

      if (countResult.status === "fulfilled") {
        setUncompletedCount(countResult.value);
      } else {
        setUncompletedCount(0);
      }

      if (profileResult.status === "fulfilled") {
        setGameProfile(profileResult.value);
      } else {
        setGameProfile(createFallbackProfile(student.id));
      }
    };
    loadData();
  }, [student.id]);

  const getTeacherColor = (teacher?: string) => {
    switch (teacher?.toLowerCase()) {
      case "roman":
        return {
          gradient: "from-blue-500/90 via-blue-600/90 to-cyan-600/90",
          accent: "text-blue-500",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-200 dark:border-blue-800",
        };
      case "violet":
        return {
          gradient: "from-purple-500/90 via-violet-600/90 to-fuchsia-600/90",
          accent: "text-purple-500",
          bg: "bg-purple-50 dark:bg-purple-900/20",
          border: "border-purple-200 dark:border-purple-800",
        };
      default:
        return {
          gradient: "from-blue-500/90 via-blue-600/90 to-cyan-600/90",
          accent: "text-blue-500",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-200 dark:border-blue-800",
        };
    }
  };

  const colors = getTeacherColor(student.teacher);

  const triggerPetReaction = (emoji: string) => {
    setPetReaction(emoji);
    setTimeout(() => setPetReaction(null), 2000);
  };
  const hasNeeds = gameProfile?.petId ? (petNeeds.poopCount > 0 || petNeeds.isHungry || petNeeds.isBored || petNeeds.isThirsty) : false;

  const togglePetPhrase = () => {
    if (petPhrase) {
      setPetPhrase(null);
      return;
    }
    setPetPhrase("Купи мне что-нибудь! 🥺");
    triggerPetReaction("🤩");
    setTimeout(() => setShowShop(true), 1500);
  };

  const handleJoinClass = async () => {
    setIsJoining(true);
    const teacherKey = teacherName.toLowerCase();
    if (teacherKey === "roman") {
      window.location.href = "https://us05web.zoom.us/j/7287155245?pwd=WS9TVDJWOTZpOTFxVFlxeGZwblJKUT09";
      return;
    }
    if (teacherKey === "violet") {
      window.location.href = "https://zoom.us/j/3429476489?pwd=dXBVVGdGKzRCaFRNS0tmLzBsWmdvdz09";
      return;
    }
    alert(`Zoom link for ${teacherName} is not configured yet.`);
    setIsJoining(false);
  };

  const handleHomeworks = () => {
    if (gameProfile?.petId) {
      triggerPetReaction("👋");
      setTimeout(() => router.push(`/student/${student.id}/homework`), 220);
      return;
    }
    router.push(`/student/${student.id}/homework`);
  };

  const activeSubjects = student.subjects
    ? Object.entries(student.subjects)
        .filter(([_, isActive]) => isActive)
        .map(([subject]) => subject)
    : [];

  const level = gameProfile ? getLevelForXP(gameProfile.xp) : null;
  const progress = gameProfile ? getXPProgress(gameProfile.xp) : null;
  const masterTier = gameProfile ? getMasterTierInfo(gameProfile.xp) : null;
  const nextLevel = level ? getNextLevel(level.level) : null;
  const nextShopUnlock = gameProfile ? getNextShopUnlock(gameProfile) : null;
  const nextBadgeHint = gameProfile ? getNextBadgeHint(gameProfile) : null;
  const themeVisual = getThemeVisualConfig(gameProfile?.equippedTheme || null);
  const equippedTitleReward = getShopRewardById(gameProfile?.equippedTitle);
  const welcomeHeaderGradient = gameProfile?.equippedTheme
    ? themeVisual.buttonGradient
    : "linear-gradient(to right, rgba(59,130,246,0.92), rgba(8,145,178,0.92))";
  const isFirstTimeStudent = gameProfile
    ? gameProfile.totalHomeworksCompleted === 0 && gameProfile.purchasedRewards.length === 0 && gameProfile.unlockedBadges.length === 0
    : false;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-2xl w-full space-y-4 relative z-10">
        {/* Welcome Card */}
        <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
          <div
            className="p-6 sm:p-8 text-white"
            style={{ backgroundImage: welcomeHeaderGradient }}
          >
            <div className="flex items-center gap-4">
              <div className="glass-surface-dark p-3 rounded-2xl">
                <UserCircle className="h-10 w-10 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-md">
                  Добро пожаловать, {student.name}! 👋
                </h1>
                {equippedTitleReward && (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-sm">
                    <span>{equippedTitleReward.emoji}</span>
                    <span>{equippedTitleReward.name}</span>
                  </div>
                )}
                <p className="text-white/95 font-medium text-sm sm:text-base mt-1 drop-shadow-sm">
                  Твоё личное учебное пространство
                </p>
              </div>
            </div>


          </div>

          <div className="p-6 sm:p-8 space-y-5">
            {/* Student Info */}
            <div className="glass-surface rounded-2xl p-4 sm:p-5">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="glass-accent-blue p-2 rounded-xl">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-600">Твой учитель:</span>
                  <span className="font-semibold text-lg text-gray-900">{teacherName}</span>
                </div>

                {activeSubjects.length > 0 && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="glass-accent-blue p-2 rounded-xl">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-600">Твои предметы:</span>
                    {activeSubjects.map((subject) => (
                      <span
                        key={subject}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                          subject === "English" ? "glass-accent-green text-green-700" : "glass-accent-blue text-blue-700"
                        }`}
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                )}

              </div>
            </div>

            {/* Homework Button - Enhanced */}
            <div>
              <Button
                size="sm"
                className={`w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transition-all duration-300 shadow-lg hover:shadow-xl font-semibold touch-manipulation active:scale-95 select-none h-14 px-4 border-0 relative ${
                  uncompletedCount > 0 ? "animate-subtle-glow" : ""
                }`}
                onClick={handleHomeworks}
              >
                <div className="flex items-center gap-2 justify-center">
                  <BookOpen className="h-5 w-5" />
                  <span className="text-base">📚 Домашние задания</span>
                </div>
                {uncompletedCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-lg animate-bounce">
                    {uncompletedCount}
                  </div>
                )}
              </Button>
            </div>


            {/* Join Lesson Button */}
            <div>
              <div
                className="relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20"
                style={{ backgroundImage: welcomeHeaderGradient }}
              >
                <button
                  onClick={handleJoinClass}
                  disabled={isJoining}
                  className="w-full h-auto py-5 min-h-[64px] px-6 flex items-center justify-between bg-transparent hover:bg-white/5 active:bg-white/10 transition-all duration-300 touch-manipulation select-none group"
                >
                  <div className="flex items-center gap-3">
                    <div className="backdrop-blur-xl bg-white/10 p-2 rounded-xl group-hover:bg-white/20 transition-all duration-300">
                      <Video className="h-5 w-5 text-white group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="flex flex-col items-start text-white">
                      <span className="font-semibold text-base">Войти на урок</span>
                      <span className="text-xs opacity-80">Подключиться к {teacherName}</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>


            {gameProfile && (
              <div className="flex flex-col items-center pt-6 border-t border-slate-200 mt-8">
                <h3 className="text-sm font-bold text-gray-700 mb-3">🌳 Дерево знаний</h3>
                <div className="flex justify-center bg-white/40 p-3 rounded-full shadow-inner">
                  <GrowthTree health={gameProfile.treeHealth} size="md" />
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center px-4">
                  Выполняй задания вовремя,<br/>чтобы дерево росло и цвело!
                </p>
              </div>
            )}
          </div>
        </div>

        {gameProfile?.petId && (
          <div className="fixed right-3 bottom-3 sm:right-6 sm:bottom-6 z-40">
            <div className="relative">
              {petReaction && (
                <div
                  className={`absolute rounded-full bg-white/95 border border-indigo-200 px-2 py-1 text-lg shadow-md ${
                    petNeeds.poopCount > 0 && petReaction === "🤢"
                      ? "-top-10 left-1/2 -translate-x-1/2"
                      : "-top-9 right-2 animate-bounce"
                  }`}
                >
                  {petReaction}
                </div>
              )}
              {petPhrase && (
                <div
                  className="absolute -top-14 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 rounded-xl bg-white/95 border border-indigo-200 px-3 py-1 text-xs font-semibold text-gray-700 shadow-md whitespace-normal text-center break-words"
                  style={{ maxWidth: "min(16rem, calc(100vw - 1rem))" }}
                >
                  {petPhrase}
                </div>
              )}
              {/* Pet Care Need Emojis */}
              {petNeeds.poopCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeCareNeed === "poop") {
                      setActiveCareNeed(null);
                    } else {
                      setActiveCareNeed("poop");
                      setPetPhrase("Здесь плохо пахнет... Нужно убраться! 🧹");
                      triggerPetReaction("🤢");
                    }
                  }}
                  className="absolute -bottom-4 -left-8 z-30 text-3xl hover:scale-125 transition-transform cursor-pointer animate-bounce"
                  style={{ animationDuration: '2s' }}
                  title="Убрать!"
                >
                  {Array.from({ length: Math.min(petNeeds.poopCount, 5) }).map((_, i) => (
                    <span key={i} className="inline-block drop-shadow-lg relative" style={{ marginLeft: i > 0 ? '-8px' : '0', transform: `rotate(${(i - 2) * 15}deg)` }}>
                      💩
                    </span>
                  ))}
                </button>
              )}
              {petNeeds.isHungry && (
                <button
                  type="button"
                  onClick={() => setActiveCareNeed(activeCareNeed === "hunger" ? null : "hunger")}
                  className="absolute -top-6 -right-6 z-30 text-3xl hover:scale-125 transition-transform cursor-pointer"
                  title="Покормить!"
                >
                  <span className="animate-pulse drop-shadow-lg">🍽️</span>
                </button>
              )}
              {petNeeds.isBored && (
                <button
                  type="button"
                  onClick={() => setActiveCareNeed(activeCareNeed === "boredom" ? null : "boredom")}
                  className="absolute -top-6 -left-6 z-30 text-3xl hover:scale-125 transition-transform cursor-pointer"
                  title="Поиграть!"
                >
                  <span className="animate-pulse drop-shadow-lg">😐</span>
                </button>
              )}
              {petNeeds.isThirsty && (
                <button
                  type="button"
                  onClick={() => setActiveCareNeed(activeCareNeed === "thirst" ? null : "thirst")}
                  className="absolute bottom-4 -right-8 z-30 text-3xl hover:scale-125 transition-transform cursor-pointer"
                  title="Попоить!"
                >
                  <span className="animate-pulse drop-shadow-xl">💧</span>
                </button>
              )}
              {!hasNeeds && (
                <button 
                  type="button"
                  onClick={() => {
                    setPetPhrase("Я очень счастлив! 💖");
                    triggerPetReaction("🤩");
                  }}
                  className="absolute -top-2 -right-4 z-40 text-4xl animate-pulse cursor-pointer drop-shadow-xl hover:scale-125 transition-transform"
                  title="Питомец счастлив!"
                >
                  💖
                </button>
              )}

              {/* Care Popover */}
              {activeCareNeed && gameProfile && (
                <PetCarePopover
                  needType={activeCareNeed}
                  needs={petNeeds}
                  profile={gameProfile}
                  onProfileUpdate={(updated) => setGameProfile(updated)}
                  onClose={() => setActiveCareNeed(null)}
                  onHappyReaction={(emoji) => {
                    setPetReaction(emoji);
                    setTimeout(() => setPetReaction(null), 3000);
                  }}
                />
              )}

              <button type="button" onClick={togglePetPhrase} className="rounded-2xl relative">
                <PetAvatar
                  petId={gameProfile.petId}
                  accessories={gameProfile.petAccessories || []}
                  frameId={gameProfile.equippedFrame}
                  vehicleId={gameProfile.equippedVehicle}
                  backgroundId={gameProfile.equippedBackground}
                  size="lg"
                  className="scale-110 shadow-xl"
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reward Shop Modal */}
      {gameProfile && (
        <RewardShop
          isOpen={showShop}
          onClose={() => setShowShop(false)}
          profile={gameProfile}
          onProfileUpdate={(updated) => setGameProfile(updated)}
        />
      )}



      {/* Glow animation */}
      <style jsx global>{`
        @keyframes subtle-glow {
          0%, 100% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.3); }
          50% { box-shadow: 0 0 25px rgba(16, 185, 129, 0.6); }
        }
        .animate-subtle-glow { animation: subtle-glow 2s ease-in-out infinite; }
      `}</style>
    </main>
  );
}
