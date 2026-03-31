"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserCircle, Video, BookOpen, GraduationCap, ShoppingBag, Coins, Zap, Flame } from "lucide-react";
import { useState, useEffect } from "react";
import { countUncompletedHomework } from "@/lib/firebase";
import { getGameProfile, getLevelForXP, getMasterTierInfo, getNextBadgeHint, getNextLevel, getNextShopUnlock, getThemeColors, getXPProgress, GameProfile, getLeagueForLevel } from "@/lib/gamification";
import GrowthTree from "@/components/GrowthTree";
import BadgeDisplay from "@/components/BadgeDisplay";
import RewardShop from "@/components/RewardShop";
import PetAvatar from "@/components/PetAvatar";

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
  petId: null,
  petAccessories: [],
  currentStreak: 0,
  highestStreak: 0,
  lastHomeworkWeek: null,
});

export default function StudentWelcome({ student }: { student: StudentData }) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [uncompletedCount, setUncompletedCount] = useState<number>(0);
  const [gameProfile, setGameProfile] = useState<GameProfile | null>(null);
  const [showShop, setShowShop] = useState(false);
  const [petReaction, setPetReaction] = useState<string | null>(null);

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
  const themeColors = gameProfile ? getThemeColors(gameProfile.equippedTheme) : null;
  const activeGradient = themeColors?.gradient || colors.gradient;
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
        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className={`bg-gradient-to-r ${activeGradient} p-6 sm:p-8`}>
            <div className="flex items-center gap-4">
              <div className="glass-surface-dark p-3 rounded-2xl">
                <UserCircle className="h-10 w-10 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                  Добро пожаловать, {student.name}! 👋
                </h1>
                <p className="text-white/90 text-sm sm:text-base mt-1">
                  Твоё личное учебное пространство
                </p>
              </div>
            </div>

            {/* XP Bar in header */}
            {level && progress && (
              <div className="mt-4 bg-white/15 rounded-xl p-3 backdrop-blur-sm">
                <div className="flex items-center justify-between text-white text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{level.emoji}</span>
                    <span className="font-bold">Lv.{level.level} {level.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs" title="Weekly Streak"><Flame className={`h-3 w-3 ${gameProfile?.currentStreak && gameProfile.currentStreak > 0 ? "text-orange-500" : "text-gray-400"}`} />{gameProfile?.currentStreak || 0}</span>
                    <span className="flex items-center gap-1 text-xs" title="Total XP"><Zap className="h-3 w-3 text-cyan-400" />{gameProfile?.xp} XP</span>
                    <span className="flex items-center gap-1 text-xs" title="Shop Coins"><Coins className="h-3 w-3 text-yellow-300" />{gameProfile?.shopCoins}</span>
                  </div>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-300 to-amber-400 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                {progress.needed > 0 && (
                  <div className="text-white/60 text-[10px] mt-1 text-right">{progress.current}/{progress.needed} to Lv.{level.level + 1}</div>
                )}
                <div className="mt-2 text-[10px] text-white/80">
                  Недельная серия: если каждую неделю делать хотя бы 1 ДЗ, серия растёт 🔥
                </div>
              </div>
            )}
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

                {/* Badges compact display */}
                {gameProfile && gameProfile.unlockedBadges.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-gray-500 font-medium">Badges:</span>
                    <BadgeDisplay
                      unlockedBadges={gameProfile.unlockedBadges}
                      purchasedRewards={gameProfile.purchasedRewards}
                      compact
                    />
                  </div>
                )}
              </div>
            </div>

            {gameProfile && nextShopUnlock && (
              <div className="glass-surface rounded-2xl p-4 sm:p-5">
                <div className="text-sm font-bold text-gray-800 mb-2">Следующая цель</div>
                <div className="space-y-1 text-sm text-gray-700">
                  {nextLevel ? (
                    <div>До следующего уровня {nextLevel.emoji} осталось: <span className="font-bold">{Math.max(0, nextLevel.xpRequired - gameProfile.xp)} XP</span></div>
                  ) : masterTier?.atMaxLevel ? (
                    <div>
                      Мастер-тир {masterTier.tier}: до следующего тира
                      <span className="font-bold"> {masterTier.xpPerTier - masterTier.xpIntoTier} XP</span>
                    </div>
                  ) : (
                    <div>Максимальный уровень уже достигнут 🏆</div>
                  )}
                  {nextShopUnlock.reward ? (
                    <div>
                      До награды {nextShopUnlock.reward.emoji} <span className="font-semibold">{nextShopUnlock.reward.name}</span>:
                      {nextShopUnlock.coinsNeeded > 0 ? (
                        <span className="font-bold"> {nextShopUnlock.coinsNeeded} монет</span>
                      ) : (
                        <span className="font-bold text-emerald-700"> можно купить прямо сейчас</span>
                      )}
                    </div>
                  ) : (
                    <div>Все награды магазина уже куплены 🎉</div>
                  )}
                  {nextBadgeHint && (
                    <div className="text-xs text-gray-600 mt-2">
                      Ближайший бейдж: <span className="font-semibold">{nextBadgeHint.emoji} {nextBadgeHint.name}</span> — {nextBadgeHint.description}
                    </div>
                  )}
                </div>
              </div>
            )}

            {isFirstTimeStudent && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                <div className="font-bold mb-1">Как работает игровой прогресс</div>
                <div>1) Делай ДЗ → получаешь XP и монеты</div>
                <div>2) В магазине покупай аксессуары и награды</div>
                <div>3) Открывай бейджи за достижения в заданиях</div>
              </div>
            )}

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

            {/* Shop Button */}
            {gameProfile && (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-11 border-2 border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold touch-manipulation active:scale-95"
                onClick={() => setShowShop(true)}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Магазин наград
                <span className="ml-2 flex items-center gap-1 text-xs bg-amber-100 rounded-full px-2 py-0.5">
                  <Coins className="h-3 w-3" /> {gameProfile.shopCoins}
                </span>
              </Button>
            )}

            {/* Join Lesson Button */}
            <div>
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${activeGradient} shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20`}>
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
          </div>
        </div>

        {/* Gamification Bottom Area */}
        {gameProfile && (
          <div className="glass-panel rounded-3xl overflow-hidden p-5">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-16">
              
              {/* Pet Display */}
              {gameProfile.petId && (
                <div className="flex flex-col items-center">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Твой питомец</h3>
                  <div className="relative animate-bounce" style={{ animationDuration: '3s' }}>
                    {petReaction && (
                      <div className="absolute -top-9 right-1 rounded-full bg-white/95 border border-indigo-200 px-2 py-1 text-lg shadow-md animate-bounce">
                        {petReaction}
                      </div>
                    )}
                    <PetAvatar petId={gameProfile.petId} accessories={gameProfile.petAccessories || []} size="lg" className="scale-110" />
                  </div>
                  <p className="text-xs text-gray-500 mt-3 font-medium">Покупай аксессуары в магазине!</p>
                </div>
              )}

              {/* Tree Display */}
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-bold text-gray-700 mb-3">🌳 Дерево знаний</h3>
                <div className="flex justify-center bg-white/40 p-3 rounded-full shadow-inner">
                  <GrowthTree health={gameProfile.treeHealth} size="md" />
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center px-4">
                  Выполняй задания вовремя,<br/>чтобы дерево росло и цвело!
                </p>
              </div>

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
