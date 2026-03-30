import { db, ensureAuth } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

// ─── Level System ───────────────────────────────────────────────────

export interface LevelInfo {
  level: number;
  title: string;
  emoji: string;
  xpRequired: number;
}

export const LEVELS: LevelInfo[] = [
  { level: 1,  title: "Sprout",        emoji: "🌱", xpRequired: 0 },
  { level: 2,  title: "Seedling",      emoji: "🌿", xpRequired: 100 },
  { level: 3,  title: "Blossom",       emoji: "🌾", xpRequired: 300 },
  { level: 4,  title: "Sapling",       emoji: "🌳", xpRequired: 600 },
  { level: 5,  title: "Oak",           emoji: "🌲", xpRequired: 1000 },
  { level: 6,  title: "Summit",        emoji: "🏔️", xpRequired: 1500 },
  { level: 7,  title: "Star Scholar",  emoji: "⭐", xpRequired: 2100 },
  { level: 8,  title: "Luminary",      emoji: "🌟", xpRequired: 2800 },
  { level: 9,  title: "Champion",      emoji: "👑", xpRequired: 3600 },
  { level: 10, title: "Grand Master",  emoji: "🏆", xpRequired: 4500 },
];

export function getLevelForXP(xp: number): LevelInfo {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.xpRequired) current = lvl;
    else break;
  }
  return current;
}

export function getNextLevel(currentLevel: number): LevelInfo | null {
  const idx = LEVELS.findIndex(l => l.level === currentLevel);
  return idx >= 0 && idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

export function getXPProgress(xp: number): { current: number; needed: number; percent: number } {
  const level = getLevelForXP(xp);
  const next = getNextLevel(level.level);
  if (!next) return { current: xp - level.xpRequired, needed: 0, percent: 100 };
  const current = xp - level.xpRequired;
  const needed = next.xpRequired - level.xpRequired;
  return { current, needed, percent: Math.min(100, Math.round((current / needed) * 100)) };
}

// ─── League System ──────────────────────────────────────────────────

export interface LeagueInfo {
  id: string;
  name: string;
  emoji: string;
  minLevel: number;
  maxLevel: number;
  color: string;
}

export const LEAGUES: LeagueInfo[] = [
  { id: "bronze",  name: "Bronze League",  emoji: "🥉", minLevel: 1,  maxLevel: 3,  color: "text-amber-700" },
  { id: "silver",  name: "Silver League",  emoji: "🥈", minLevel: 4,  maxLevel: 7,  color: "text-slate-400" },
  { id: "gold",    name: "Gold League",    emoji: "🥇", minLevel: 8,  maxLevel: 12, color: "text-yellow-500" },
  { id: "diamond", name: "Diamond League", emoji: "💎", minLevel: 13, maxLevel: 17, color: "text-cyan-400" },
  { id: "master",  name: "Master League",  emoji: "👑", minLevel: 18, maxLevel: 999, color: "text-purple-500" },
];

export function getLeagueForLevel(level: number): LeagueInfo {
  return LEAGUES.find(l => level >= l.minLevel && level <= l.maxLevel) || LEAGUES[0];
}

// ─── Streak Helper ──────────────────────────────────────────────────

export function getYearWeekString(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

export function parseYearWeek(yearWeek: string): { year: number; week: number } {
  const [y, w] = yearWeek.split("-W");
  return { year: parseInt(y, 10), week: parseInt(w, 10) };
}

// ─── Badge System ───────────────────────────────────────────────────

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  condition: (profile: GameProfile) => boolean;
}

export const BADGES: Badge[] = [
  {
    id: "first_steps",
    name: "First Steps",
    emoji: "🌱",
    description: "Complete your first homework",
    condition: (p) => p.totalHomeworksCompleted >= 1,
  },
  {
    id: "bookworm",
    name: "Bookworm",
    emoji: "📚",
    description: "Complete 5 homeworks",
    condition: (p) => p.totalHomeworksCompleted >= 5,
  },
  {
    id: "rising_star",
    name: "Rising Star",
    emoji: "🌟",
    description: "Complete 10 homeworks",
    condition: (p) => p.totalHomeworksCompleted >= 10,
  },
  {
    id: "perfectionist",
    name: "Perfectionist",
    emoji: "💯",
    description: "Get 100% on any homework",
    condition: (p) => p.perfectScores >= 1,
  },
  {
    id: "on_fire",
    name: "On Fire",
    emoji: "🔥",
    description: "Get 100% three times",
    condition: (p) => p.perfectScores >= 3,
  },
  {
    id: "sharpshooter",
    name: "Sharpshooter",
    emoji: "🎯",
    description: "Get ≥90% five times",
    condition: (p) => p.highScores >= 5,
  },
  {
    id: "speed_learner",
    name: "Speed Learner",
    emoji: "⚡",
    description: "Earn a big timer bonus",
    condition: (p) => p.bestTimerBonus >= 15,
  },
  {
    id: "deep_roots",
    name: "Deep Roots",
    emoji: "🌳",
    description: "Complete 20 homeworks",
    condition: (p) => p.totalHomeworksCompleted >= 20,
  },
  {
    id: "scholar",
    name: "Scholar",
    emoji: "🏆",
    description: "Reach Level 5",
    condition: (p) => getLevelForXP(p.xp).level >= 5,
  },
  {
    id: "grand_master",
    name: "Grand Master",
    emoji: "👑",
    description: "Reach Level 10",
    condition: (p) => getLevelForXP(p.xp).level >= 10,
  },
  {
    id: "early_bird",
    name: "Early Bird",
    emoji: "🐦",
    description: "Complete homework within 1 day",
    condition: (p) => p.earlyCompletions >= 1,
  },
  {
    id: "full_bloom",
    name: "Full Bloom",
    emoji: "🌸",
    description: "Tree reaches 100% health",
    condition: (p) => p.treeHealth >= 100,
  },
];

// ─── Reward Shop ────────────────────────────────────────────────────

export interface ShopReward {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cost: number;
  type: "theme" | "frame" | "title" | "accessory";
  slot?: "head" | "face" | "neck";
}

export const SHOP_REWARDS: ShopReward[] = [
  // --- THEMES ---
  { id: "theme_blue",      name: "Blue Theme",       emoji: "🎨", description: "Cool blue dashboard",     cost: 10,  type: "theme" },
  { id: "theme_purple",    name: "Purple Theme",     emoji: "💜", description: "Royal purple dashboard",  cost: 10,  type: "theme" },
  { id: "theme_sunset",    name: "Sunset Theme",     emoji: "🌅", description: "Warm sunset colors",      cost: 20,  type: "theme" },
  { id: "theme_ocean",     name: "Ocean Theme",      emoji: "🌊", description: "Deep ocean vibes",        cost: 20,  type: "theme" },
  { id: "theme_forest",    name: "Forest Theme",     emoji: "🌲", description: "Natural green forest",    cost: 20,  type: "theme" },
  { id: "theme_cyber",     name: "Cyber Neon",       emoji: "🛸", description: "Futuristic neon dark theme",cost: 150, type: "theme" },
  { id: "theme_gold",      name: "Golden Dawn",      emoji: "🌅", description: "Luxurious gold interface",  cost: 500, type: "theme" },
  { id: "theme_diamond",   name: "Diamond Sparkle",  emoji: "💎", description: "Shimmering bright crystals",cost: 2500, type: "theme" },
  
  // --- FRAMES ---
  { id: "frame_silver",    name: "Silver Frame",     emoji: "⚽", description: "Sleek silver avatar frame", cost: 15,  type: "frame" },
  { id: "frame_gold",      name: "Gold Frame",       emoji: "✨", description: "Golden avatar frame",     cost: 30,  type: "frame" },
  { id: "frame_flower",    name: "Flower Frame",     emoji: "🌸", description: "Floral avatar frame",     cost: 30,  type: "frame" },
  { id: "frame_star",      name: "Star Frame",       emoji: "⭐", description: "Starry avatar frame",     cost: 30,  type: "frame" },
  { id: "frame_fire",      name: "Burning Ring",     emoji: "🔥", description: "Avatar ring of fire",      cost: 100, type: "frame" },
  { id: "frame_emerald",   name: "Emerald Frame",    emoji: "📗", description: "Solid emerald gemstone",   cost: 500, type: "frame" },
  { id: "frame_ruby",      name: "Ruby Frame",       emoji: "🔴", description: "Deep ruby red frame",      cost: 1000, type: "frame" },
  { id: "frame_diamond",   name: "Diamond Frame",    emoji: "💎", description: "The ultimate flex frame",  cost: 5000, type: "frame" },
  
  // --- TITLES ---
  { id: "title_bookworm",  name: "Bookworm",         emoji: "📖", description: "\"Bookworm\" title",       cost: 15,  type: "title" },
  { id: "title_star",      name: "Star Student",     emoji: "🌟", description: "\"Star Student\" title",   cost: 25,  type: "title" },
  { id: "title_climber",   name: "Mountain Climber", emoji: "🏔️", description: "\"Mountain Climber\" title",cost: 40,  type: "title" },
  { id: "title_hacker",    name: "Hacker",           emoji: "💻", description: "\"Hacker\" tech title",     cost: 100, type: "title" },
  { id: "title_professor", name: "The Professor",    emoji: "📚", description: "\"The Professor\" title",   cost: 250, type: "title" },
  { id: "title_king",      name: "Homework King",    emoji: "👑", description: "\"Homework King\" title",   cost: 1000, type: "title" },
  { id: "title_legend",    name: "Living Legend",    emoji: "🦅", description: "\"Living Legend\" title",   cost: 5000, type: "title" },
  { id: "title_ceo",       name: "CEO of Homework",  emoji: "🏢", description: "The rarest title of them all",cost: 10000, type: "title" },
  
  // --- PET ACCESSORIES ---
  // Head Slot
  { id: "acc_cap",         name: "Baseball Cap",     emoji: "🧢", description: "Casual everyday hat",      cost: 30,  type: "accessory", slot: "head" },
  { id: "acc_headphones",  name: "Cool Headphones",  emoji: "🎧", description: "Listening to lo-fi beats", cost: 50,  type: "accessory", slot: "head" },
  { id: "acc_tophat",      name: "Fancy Top Hat",    emoji: "🎩", description: "Very distinguished",       cost: 75,  type: "accessory", slot: "head" },
  { id: "acc_crown",       name: "Royal Crown",      emoji: "👑", description: "Fit for a monarch",        cost: 300, type: "accessory", slot: "head" },
  { id: "acc_pilot",       name: "Pilot Goggles",    emoji: "🛩️", description: "Ready to take flight",      cost: 750, type: "accessory", slot: "head" },
  { id: "acc_astronaut",   name: "Space Helmet",     emoji: "🚀", description: "To the moon!",             cost: 1000, type: "accessory", slot: "head" },
  { id: "acc_golden_crown",name: "Solid Gold Crown", emoji: "🏆", description: "The rarest item in the game",cost: 10000, type: "accessory", slot: "head" },
  
  // Face Slot
  { id: "acc_glasses",     name: "Smart Glasses",    emoji: "👓", description: "For reading books",        cost: 15,  type: "accessory", slot: "face" },
  { id: "acc_shades",      name: "Sunglasses",       emoji: "🕶️", description: "Too cool for school",       cost: 100, type: "accessory", slot: "face" },
  { id: "acc_vr_headset",  name: "VR Headset",       emoji: "🥽", description: "Livin' in the metaverse",  cost: 2500, type: "accessory", slot: "face" },

  // Neck Slot
  { id: "acc_scarf",       name: "Warm Scarf",       emoji: "🧣", description: "Cozy for winter",          cost: 20,  type: "accessory", slot: "neck" },
  { id: "acc_bowtie",      name: "Red Bowtie",       emoji: "🎀", description: "Sharp and snazzy",         cost: 20,  type: "accessory", slot: "neck" },
  { id: "acc_diamond_chain",name: "Diamond Chain",   emoji: "💎", description: "Massive bling-bling",      cost: 5000, type: "accessory", slot: "neck" },
];

// ─── Game Profile ───────────────────────────────────────────────────

export interface GameProfile {
  studentId: string;
  xp: number;
  shopCoins: number;
  totalHomeworksCompleted: number;
  perfectScores: number;
  highScores: number; // ≥90% count
  bestTimerBonus: number;
  earlyCompletions: number;
  treeHealth: number; // 0-100
  unlockedBadges: string[];
  purchasedRewards: string[]; // used for shop purchases
  equippedTheme: string | null;
  equippedFrame: string | null;
  equippedTitle: string | null;
  
  // Phase 2 Additions
  petId: string | null;
  petAccessories: string[];
  currentStreak: number;
  highestStreak: number;
  lastHomeworkWeek: string | null; // e.g. "2023-W42"
  
  // Progress tracker to prevent re-answering
  progress?: Record<string, {
    answers: Record<string, { isCorrect: boolean; answer: string }>; // questionId -> answer info
    completed: boolean;
  }>;
  lastUpdated?: any;
}

const DEFAULT_PROFILE: Omit<GameProfile, "studentId"> = {
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
};

// ─── Firebase Operations ────────────────────────────────────────────

export async function getGameProfile(studentId: string): Promise<GameProfile> {
  await ensureAuth();
  const ref = doc(db, "studentGameProfiles", studentId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { studentId, ...DEFAULT_PROFILE, ...snap.data() } as GameProfile;
  }
  // Create default profile
  const profile: GameProfile = { studentId, ...DEFAULT_PROFILE };
  await setDoc(ref, { ...DEFAULT_PROFILE, lastUpdated: serverTimestamp() });
  return profile;
}

export async function updateGameProfile(studentId: string, updates: Partial<GameProfile>): Promise<void> {
  await ensureAuth();
  const ref = doc(db, "studentGameProfiles", studentId);
  await setDoc(ref, { ...updates, lastUpdated: serverTimestamp() }, { merge: true });
}

// ─── XP Calculation ─────────────────────────────────────────────────

export interface XPBreakdown {
  correctAnswerXP: number;
  completionXP: number;
  perfectBonusXP: number;
  highScoreBonusXP: number;
  timerBonusXP: number;
  totalXP: number;
  coinsEarned: number;
}

export function calculateXP(
  correctAnswers: number,
  totalQuestions: number,
  timeSpentSeconds: number,
  expectedTimeSeconds: number // e.g., 30s per question
): XPBreakdown {
  const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

  const correctAnswerXP = correctAnswers * 10;
  const completionXP = 5;
  const perfectBonusXP = score === 100 ? 25 : 0;
  const highScoreBonusXP = score >= 80 && score < 100 ? 15 : 0;

  // Timer bonus: up to 20 XP. Full bonus if done in ≤50% of expected time, 0 if ≥ expected time
  let timerBonusXP = 0;
  if (expectedTimeSeconds > 0 && timeSpentSeconds < expectedTimeSeconds) {
    const ratio = 1 - timeSpentSeconds / expectedTimeSeconds;
    timerBonusXP = Math.round(ratio * 20);
  }

  const totalXP = correctAnswerXP + completionXP + perfectBonusXP + highScoreBonusXP + timerBonusXP;
  const coinsEarned = Math.floor(totalXP / 10);

  return { correctAnswerXP, completionXP, perfectBonusXP, highScoreBonusXP, timerBonusXP, totalXP, coinsEarned };
}

// ─── Award XP & Check Badges ────────────────────────────────────────

export interface AwardResult {
  xpBreakdown: XPBreakdown;
  newLevel: LevelInfo;
  previousLevel: LevelInfo;
  leveledUp: boolean;
  newBadges: Badge[];
  updatedProfile: GameProfile;
}

/**
 * Award XP, Level Up, and calculate streaks when a homework is completed.
 */
export async function awardHomeworkXP(
  studentId: string, 
  homeworkId: string,
  correctAnswers: number,
  totalQuestions: number,
  timeSpentSeconds: number,
  totalAssigned: number,
  totalCompleted: number,
  wasEarlyCompletion: boolean
): Promise<AwardResult> {
  const profile = await getGameProfile(studentId);
  const previousLevel = getLevelForXP(profile.xp);
  const expectedTime = totalQuestions * 30; // 30s per question

  const xpBreakdown = calculateXP(correctAnswers, totalQuestions, timeSpentSeconds, expectedTime);
  const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

  // Update profile
  profile.xp += xpBreakdown.totalXP;
  profile.shopCoins += xpBreakdown.coinsEarned;
  profile.totalHomeworksCompleted += 1;
  if (score === 100) profile.perfectScores += 1;
  if (score >= 90) profile.highScores += 1;
  if (xpBreakdown.timerBonusXP > profile.bestTimerBonus) {
    profile.bestTimerBonus = xpBreakdown.timerBonusXP;
  }
  if (wasEarlyCompletion) profile.earlyCompletions += 1;

  // Streak Logic calculation
  const currentWeekStr = getYearWeekString(new Date());
  if (profile.lastHomeworkWeek) {
    const last = parseYearWeek(profile.lastHomeworkWeek);
    const curr = parseYearWeek(currentWeekStr);
    
    // Check if it's the exact next week
    if ((curr.year === last.year && curr.week === last.week + 1) || 
        (curr.year === last.year + 1 && curr.week === 1 && last.week >= 52)) {
      profile.currentStreak += 1; // Kept the streak
    } else if (curr.year === last.year && curr.week === last.week) {
      // Same week, do nothing to streak count
    } else {
      // Missed a week
      profile.currentStreak = 1;
    }
  } else {
    profile.currentStreak = 1; // First ever
  }
  profile.lastHomeworkWeek = currentWeekStr;
  
  if (profile.currentStreak > profile.highestStreak) {
    profile.highestStreak = profile.currentStreak;
  }

  // Compute tree health: based on completion ratio
  profile.treeHealth = totalAssigned > 0
    ? Math.round((totalCompleted / totalAssigned) * 100)
    : 50;

  // Check for new badges
  const newBadges: Badge[] = [];
  for (const badge of BADGES) {
    if (!profile.unlockedBadges.includes(badge.id) && badge.condition(profile)) {
      profile.unlockedBadges.push(badge.id);
      newBadges.push(badge);
    }
  }

  const newLevel = getLevelForXP(profile.xp);
  const leveledUp = newLevel.level > previousLevel.level;

  // Persist
  await updateGameProfile(studentId, {
    xp: profile.xp,
    shopCoins: profile.shopCoins,
    totalHomeworksCompleted: profile.totalHomeworksCompleted,
    perfectScores: profile.perfectScores,
    highScores: profile.highScores,
    bestTimerBonus: profile.bestTimerBonus,
    earlyCompletions: profile.earlyCompletions,
    treeHealth: profile.treeHealth,
    unlockedBadges: profile.unlockedBadges,
    currentStreak: profile.currentStreak,
    highestStreak: profile.highestStreak,
    lastHomeworkWeek: profile.lastHomeworkWeek,
  });

  return {
    xpBreakdown,
    newLevel,
    previousLevel,
    leveledUp,
    newBadges,
    updatedProfile: profile,
  };
}

// ─── Shop Operations ────────────────────────────────────────────────

export async function purchaseReward(
  studentId: string,
  rewardId: string
): Promise<{ success: boolean; error?: string; profile?: GameProfile }> {
  const reward = SHOP_REWARDS.find(r => r.id === rewardId);
  if (!reward) return { success: false, error: "Reward not found" };

  const profile = await getGameProfile(studentId);

  if (profile.purchasedRewards.includes(rewardId)) {
    return { success: false, error: "Already purchased" };
  }
  if (profile.shopCoins < reward.cost) {
    return { success: false, error: "Not enough coins" };
  }

  profile.shopCoins -= reward.cost;
  profile.purchasedRewards.push(rewardId);

  await updateGameProfile(studentId, {
    shopCoins: profile.shopCoins,
    purchasedRewards: profile.purchasedRewards,
  });

  return { success: true, profile };
}

export async function equipReward(
  studentId: string,
  rewardId: string | null,
  type: "theme" | "frame" | "title" | "accessory"
): Promise<void> {
  const profile = await getGameProfile(studentId);
  const updates: Partial<GameProfile> = {};
  
  if (type === "theme") updates.equippedTheme = rewardId;
  if (type === "frame") updates.equippedFrame = rewardId;
  if (type === "title") updates.equippedTitle = rewardId;
  
  if (type === "accessory") {
    if (!rewardId) return;
    const reward = SHOP_REWARDS.find(r => r.id === rewardId);
    if (!reward || !reward.slot) return;

    const currentAccs = [...(profile.petAccessories || [])];
    const isAlreadyEquipped = currentAccs.includes(rewardId);

    if (isAlreadyEquipped) {
      updates.petAccessories = currentAccs.filter(id => id !== rewardId);
    } else {
      const otherItemsInSameSlot = SHOP_REWARDS
        .filter(r => r.type === "accessory" && r.slot === reward.slot && r.id !== rewardId)
        .map(r => r.id);

      updates.petAccessories = [
        ...currentAccs.filter(id => !otherItemsInSameSlot.includes(id)),
        rewardId
      ];
    }
  }
  if (Object.keys(updates).length === 0) return;
  await updateGameProfile(studentId, updates);
}

// ─── Tree Health Helper ─────────────────────────────────────────────

export function getTreeStage(health: number): {
  stage: "dead" | "dry" | "sparse" | "growing" | "green" | "full";
  description: string;
} {
  if (health <= 10) return { stage: "dead", description: "Bare trunk" };
  if (health <= 30) return { stage: "dry", description: "Dry branches" };
  if (health <= 50) return { stage: "sparse", description: "Some leaves" };
  if (health <= 70) return { stage: "growing", description: "Growing strong" };
  if (health <= 90) return { stage: "green", description: "Lush and green" };
  return { stage: "full", description: "Full bloom!" };
}

// ─── Theme Colors ───────────────────────────────────────────────────

export function getThemeColors(themeId: string | null): {
  gradient: string;
  accent: string;
  bg: string;
} {
  switch (themeId) {
    case "theme_blue":
      return { gradient: "from-blue-500 to-cyan-500", accent: "text-blue-500", bg: "bg-blue-50" };
    case "theme_purple":
      return { gradient: "from-purple-500 to-violet-600", accent: "text-purple-500", bg: "bg-purple-50" };
    case "theme_sunset":
      return { gradient: "from-orange-400 to-rose-500", accent: "text-orange-500", bg: "bg-orange-50" };
    case "theme_ocean":
      return { gradient: "from-teal-500 to-blue-600", accent: "text-teal-500", bg: "bg-teal-50" };
    case "theme_forest":
      return { gradient: "from-green-500 to-emerald-600", accent: "text-green-500", bg: "bg-green-50" };
    default:
      return { gradient: "from-blue-500 to-indigo-600", accent: "text-blue-500", bg: "bg-blue-50" };
  }
}

/**
 * Save partial progress (e.g., answering a single question) so it persists on refresh.
 */
export async function saveQuestionProgress(studentId: string, homeworkId: string, questionId: string, answer: string, isCorrect: boolean) {
  try {
    const profile = await getGameProfile(studentId);

    const currentProgress = profile.progress || {};
    const hwProgress = currentProgress[homeworkId] || { answers: {}, completed: false };

    // Update the specific question's answer
    hwProgress.answers[questionId] = { isCorrect, answer };

    const updates: Partial<GameProfile> = {
      progress: {
        ...currentProgress,
        [homeworkId]: hwProgress
      }
    };

    await updateGameProfile(studentId, updates);
  } catch (err) {
    console.error("Error saving question progress:", err);
  }
}

