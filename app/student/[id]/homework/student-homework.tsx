"use client";

import { useEffect, useState, Fragment, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchStudentHomework, fetchHomeworkReports, fetchQuestionsForHomework, fetchStudentRatings, fetchAllStudentRatings, HomeworkAssignment, HomeworkReport, Question } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import StudentLeaderboard from "@/components/StudentLeaderboard";
import StudentsPetsModal from "@/components/StudentsPetsModal";
import { 
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Typography,
  Card as MuiCard,
  CardContent as MuiCardContent,
  Button as MuiButton,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Badge,
  Tooltip,
} from "@mui/material";
import AssignmentIcon from '@mui/icons-material/Assignment';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { BookOpen, Loader2, Trophy, X, Check, Star, TrendingUp, XCircle, Zap, Coins, Flame, ShoppingBag } from "lucide-react";
import { 
  getGameProfile, 
  getLevelForXP, 
  getThemeVisualConfig, 
  getXPProgress, 
  GameProfile, 
  getPetNeeds, 
  PetNeeds, 
  getMasterTierInfo, 
  getNextLevel, 
  getNextShopUnlock, 
  getNextBadgeHint,
  getShopRewardById 
} from "@/lib/gamification";
import BadgeDisplay from "@/components/BadgeDisplay";
import PetSelectionModal from "@/components/PetSelectionModal";
import PetAvatar from "@/components/PetAvatar";
import PetCarePopover from "@/components/PetCarePopover";
import RewardShop from "@/components/RewardShop";

// Light theme to match the app
const lightTheme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    primary: {
      main: "#3b82f6",
    },
    secondary: {
      main: "#8b5cf6",
    },
    success: {
      main: "#10b981",
    },
    warning: {
      main: "#f59e0b",
    },
    text: {
      primary: "#1e293b",
      secondary: "#64748b",
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
  },
});

interface HomeworkPageProps {
  studentId: string;
  studentName: string;
}

export default function StudentHomework({ studentId, studentName }: HomeworkPageProps) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [reports, setReports] = useState<HomeworkReport[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, { total: number; incomplete: number }>>({});
  const [loading, setLoading] = useState(true);
  const [viewingResultsFor, setViewingResultsFor] = useState<string | null>(null);
  const [resultsQuestions, setResultsQuestions] = useState<Question[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [studentRating, setStudentRating] = useState<any>(null);
  const [loadingRating, setLoadingRating] = useState(true);
  const [showRatingDetails, setShowRatingDetails] = useState(false);
  const [showPets, setShowPets] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [gameProfile, setGameProfile] = useState<GameProfile | null>(null);
  const [petReaction, setPetReaction] = useState<string | null>(null);
  const [petPhrase, setPetPhrase] = useState<string | null>(null);
  const [activeCareNeed, setActiveCareNeed] = useState<"poop" | "hunger" | "boredom" | "thirst" | null>(null);
  const [showShop, setShowShop] = useState(false);

  // Draggable pet state
  const [petPosition, setPetPosition] = useState<{ x: number; y: number } | null>(null);
  const petDragRef = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
    hasMoved: boolean;
  }>({ isDragging: false, startX: 0, startY: 0, startPosX: 0, startPosY: 0, hasMoved: false });
  const petContainerRef = useRef<HTMLDivElement>(null);

  const getPetDefaultPosition = useCallback(() => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    return {
      x: window.innerWidth - 160,
      y: window.innerHeight - 180,
    };
  }, []);

  // Initialize pet position on mount
  useEffect(() => {
    if (gameProfile?.petId && !petPosition) {
      setPetPosition(getPetDefaultPosition());
    }
  }, [gameProfile?.petId]);

  const handlePetPointerDown = useCallback((e: React.PointerEvent) => {
    const pos = petPosition || getPetDefaultPosition();
    petDragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
      hasMoved: false,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }, [petPosition, getPetDefaultPosition]);

  const handlePetPointerMove = useCallback((e: React.PointerEvent) => {
    if (!petDragRef.current.isDragging) return;
    const dx = e.clientX - petDragRef.current.startX;
    const dy = e.clientY - petDragRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      petDragRef.current.hasMoved = true;
    }
    const newX = Math.max(0, Math.min(window.innerWidth - 140, petDragRef.current.startPosX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 160, petDragRef.current.startPosY + dy));
    setPetPosition({ x: newX, y: newY });
  }, []);

  const handlePetPointerUp = useCallback((e: React.PointerEvent) => {
    const wasDragging = petDragRef.current.hasMoved;
    petDragRef.current.isDragging = false;
    petDragRef.current.hasMoved = false;
    // If the pet was actually dragged, prevent the click/tap from triggering togglePetPhrase
    if (wasDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const normalizeAnswerText = (value: string | number | null | undefined) =>
    String(value ?? "")
      .normalize("NFKC")
      .replace(/\u00A0/g, " ")
      .replace(/[’‘`´]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const triggerPetReaction = (emoji: string) => {
    setPetReaction(emoji);
    setTimeout(() => setPetReaction(null), 2000);
  };
  const petNeeds: PetNeeds = gameProfile ? getPetNeeds(gameProfile) : { poopCount: 0, isHungry: false, isBored: false, isThirsty: false };
  const hasNeeds = gameProfile?.petId ? (petNeeds.poopCount > 0 || petNeeds.isHungry || petNeeds.isBored || petNeeds.isThirsty) : false;

  // Get the single worst pet need message (priority: poop > hunger > thirst > boredom)
  const getWorstNeedPhrase = (): string | null => {
    if (petNeeds.poopCount > 0) return "Фу, тут плохо пахнет... 💩";
    if (petNeeds.isHungry) return "Я голоден! 🍽️";
    if (petNeeds.isThirsty) return "Я хочу пить! 💧";
    if (petNeeds.isBored) return "Мне скучно... 😐";
    return null;
  };

  // Auto-show the worst need message when needs change
  useEffect(() => {
    if (hasNeeds && gameProfile?.petId) {
      const worstPhrase = getWorstNeedPhrase();
      if (worstPhrase) {
        setPetPhrase(worstPhrase);
      }
    }
  }, [petNeeds.poopCount, petNeeds.isHungry, petNeeds.isThirsty, petNeeds.isBored]);

  const togglePetPhrase = () => {
    if (petPhrase) {
      setPetPhrase(null);
      return;
    }

    // If there are needs, show the worst one; otherwise open shop
    const worstPhrase = getWorstNeedPhrase();
    if (worstPhrase) {
      setPetPhrase(worstPhrase);
    } else {
      setPetPhrase("Купи мне что-нибудь! 🥺");
      triggerPetReaction("🤩");
      setTimeout(() => setShowShop(true), 1500);
    }
  };

  const level = gameProfile ? getLevelForXP(gameProfile.xp) : null;
  const progress = gameProfile ? getXPProgress(gameProfile.xp) : null;
  const masterTier = gameProfile ? getMasterTierInfo(gameProfile.xp) : null;
  const nextLevel = level ? getNextLevel(level.level) : null;
  const nextShopUnlock = gameProfile ? getNextShopUnlock(gameProfile) : null;
  const nextBadgeHint = gameProfile ? getNextBadgeHint(gameProfile) : null;
  const equippedTitleReward = getShopRewardById(gameProfile?.equippedTitle);

  useEffect(() => {
    setIsClient(true);
    loadHomework();
    loadRatings();
    loadGameProfile();
  }, [studentId]);

  const loadGameProfile = async () => {
    try {
      const profile = await getGameProfile(studentId);
      setGameProfile(profile);
    } catch (err) {
      console.error("Error loading game profile:", err);
    }
  };
  
  const loadRatings = async () => {
    setLoadingRating(true);
    try {
      // Calculate rating client-side instead of using Cloud Function
      const reportsData = await fetchHomeworkReports(studentId);
      
      if (reportsData.length === 0) {
        setStudentRating(null);
        return;
      }

      let totalCorrect = 0;
      let totalQuestions = 0;

      reportsData.forEach(report => {
        if (report.totalQuestions && report.totalQuestions > 0) {
          totalCorrect += report.correctAnswers || 0;
          totalQuestions += report.totalQuestions;
        }
      });

      if (totalQuestions === 0) {
        setStudentRating(null);
        return;
      }

      const averagePercentage = (totalCorrect / totalQuestions) * 100;
      const overallRating = averagePercentage / 10; // Convert to 0-10 scale

      setStudentRating({
        overallRating,
        averagePercentage,
        completedHomeworks: reportsData.length,
      });
    } catch (error) {
      console.error("Error loading ratings:", error);
      setStudentRating(null);
    } finally {
      setLoadingRating(false);
    }
  };

  const handleShowRatingDetails = async () => {
    setShowRatingDetails(true);
  };

  const loadHomework = async () => {
    setLoading(true);
    try {
      const [assignmentsData, reportsData] = await Promise.all([
        fetchStudentHomework(studentId),
        fetchHomeworkReports(studentId)
      ]);
      
      // Sort: Newest first (latest assigned on top)
      const sortedAssignments = assignmentsData.sort((a, b) => {
        const getTime = (dateValue: any) => {
          if (!dateValue) return 0;
          if (dateValue.toDate && typeof dateValue.toDate === "function") {
            return dateValue.toDate().getTime();
          } else if (dateValue instanceof Date) {
            return dateValue.getTime();
          } else if (dateValue.seconds !== undefined) {
            return dateValue.seconds * 1000;
          } else if (typeof dateValue === "string" || typeof dateValue === "number") {
            return new Date(dateValue).getTime();
          }
          return 0;
        };
        
        return getTime(b.assignedAt) - getTime(a.assignedAt); // Descending order
      });
      
      setAssignments(sortedAssignments);
      setReports(reportsData);
      
      // Fetch question counts for each assignment
      const counts: Record<string, { total: number; incomplete: number }> = {};
      await Promise.all(
        sortedAssignments.map(async (assignment) => {
          const topicIds = assignment.topicIds || (assignment.topicId ? [assignment.topicId] : []);
          if (topicIds.length > 0) {
            const questions = await fetchQuestionsForHomework(topicIds);
            counts[assignment.id] = {
              total: questions.length,
              incomplete: 0
            };
          }
        })
      );
      setQuestionCounts(counts);
    } catch (error) {
      console.error("Error loading homework:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartHomework = (assignmentId: string) => {
    if (gameProfile?.petId) {
      triggerPetReaction("🚀");
      setTimeout(() => router.push(`/student/${studentId}/homework/${assignmentId}`), 220);
      return;
    }
    router.push(`/student/${studentId}/homework/${assignmentId}`);
  };
  
  const handleViewResults = async (assignment: HomeworkAssignment) => {
    setLoadingResults(true);
    setViewingResultsFor(assignment.id);
    
    try {
      const topicIds = assignment.topicIds || (assignment.topicId ? [assignment.topicId] : []);
      const questions = await fetchQuestionsForHomework(topicIds);
      setResultsQuestions(questions);
    } catch (error) {
      console.error("Error loading questions for results:", error);
      alert("Failed to load results. Please try again.");
      setViewingResultsFor(null);
    } finally {
      setLoadingResults(false);
    }
  };

  const getReportForAssignment = (assignmentId: string) => {
    return reports.find(r => r.homeworkId === assignmentId);
  };

  useEffect(() => {
    if (gameProfile?.petId) {
      triggerPetReaction("👋");
    }
  }, [gameProfile?.petId]);

  const getStatusInfo = (assignment: HomeworkAssignment) => {
    const report = getReportForAssignment(assignment.id);
    
    if (report || assignment.status === "completed") {
      return { status: "completed" as const };
    }

    return { status: "pending" as const };
  };

  const formatDate = (dateValue: any) => {
    // Return placeholder during SSR to prevent hydration mismatch
    if (!isClient) return "Loading...";
    if (!dateValue) return "Unknown date";
    
    try {
      let date;
      
      if (dateValue.toDate && typeof dateValue.toDate === "function") {
        date = dateValue.toDate();
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else if (dateValue.seconds !== undefined) {
        date = new Date(dateValue.seconds * 1000);
      } else if (typeof dateValue === "string" || typeof dateValue === "number") {
        date = new Date(dateValue);
      } else {
        return "Invalid date";
      }
      
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date error";
    }
  };

  const completedCount = assignments.filter(a => {
    const status = getStatusInfo(a);
    return status.status === "completed";
  }).length;

  const totalCount = assignments.length;
  const themeVisual = getThemeVisualConfig(gameProfile?.equippedTheme || null);

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <Box 
        sx={{ 
          p: 3, 
          minHeight: '100vh', 
          background: themeVisual.surfaceGradient,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Animated background elements - matching welcome page style */}
        <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <Box sx={{ 
            position: 'absolute', 
            top: '25%', 
            left: '25%', 
            width: '500px', 
            height: '500px', 
            bgcolor: `${themeVisual.primary}1A`, 
            borderRadius: '50%', 
            filter: 'blur(80px)',
            animation: 'pulse 3s ease-in-out infinite'
          }} />
          <Box sx={{ 
            position: 'absolute', 
            bottom: '25%', 
            right: '25%', 
            width: '500px', 
            height: '500px', 
            bgcolor: `${themeVisual.secondary}1A`, 
            borderRadius: '50%', 
            filter: 'blur(80px)',
            animation: 'pulse 3s ease-in-out infinite',
            animationDelay: '1s'
          }} />
          <Box sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            width: '400px', 
            height: '400px', 
            bgcolor: `${themeVisual.primary}1A`, 
            borderRadius: '50%', 
            filter: 'blur(80px)',
            animation: 'pulse 3s ease-in-out infinite',
            animationDelay: '2s'
          }} />
        </Box>

        <Box sx={{ position: 'relative', zIndex: 1 }}>
        <MuiButton
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(`/student/${studentId}`)}
          sx={{ mb: 3, color: 'text.secondary' }}
        >
          Вернуться на главную
        </MuiButton>

        {gameProfile && level && progress && (
          <Box sx={{ maxWidth: 980, mx: 'auto', mb: 2 }}>
            {/* Themed Header Bar */}
            <Box sx={{ 
              mb: 2, 
              p: 2, 
              borderRadius: 3, 
              background: gameProfile?.equippedTheme ? themeVisual.buttonGradient : 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, display: 'flex' }}>
                   <Trophy size={20} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, letterSpacing: '0.02em' }}>
                    ЛИЧНЫЙ КАБИНЕТ СТУДЕНТА
                  </Typography>
                  {equippedTitleReward && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.25, fontWeight: 700, opacity: 0.95 }}>
                      {equippedTitleReward.emoji} {equippedTitleReward.name}
                    </Typography>
                  )}
                </Box>
              </Stack>
              <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9 }}>
                ID: {studentId.slice(0, 8)}
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              {/* XP & Level Card */}
              <MuiCard sx={{ 
                flex: 2, 
                p: 0,
                background: 'rgba(255, 255, 255, 0.85)', 
                backdropFilter: 'blur(12px)', 
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: 4,
                boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
                overflow: 'hidden'
              }}>
                <Box sx={{ p: {xs: 2, sm: 3} }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="h3" sx={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}>{level.emoji}</Typography>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 850, color: '#1e293b', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                          Lv.{level.level} {level.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                          Текущий ранг
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={2.5}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: 850, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Flame size={20} fill="#f59e0b" /> {gameProfile.currentStreak}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>Серия</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 850, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Zap size={20} fill="#3b82f6" /> {gameProfile.xp}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>Всего XP</Typography>
                      </Box>
                    </Stack>
                  </Box>

                  <Box sx={{ width: '100%', mb: 1 }}>
                     <Box sx={{ position: 'relative', height: 12, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 6, overflow: 'hidden' }}>
                       <Box 
                         sx={{ 
                           position: 'absolute', 
                           height: '100%', 
                           width: `${progress.percent}%`, 
                           background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
                           borderRadius: 6,
                           transition: 'width 1s ease-in-out',
                           boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
                         }} 
                       />
                     </Box>
                     <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.75, fontWeight: 800, color: '#64748b' }}>
                       {progress.needed > 0 ? `${progress.current} / ${progress.needed} XP до Lv.${level.level + 1}` : 'Максимальный уровень! 🎉'}
                     </Typography>
                  </Box>
                </Box>
              </MuiCard>

              {/* Next Goals Card */}
              <MuiCard sx={{ 
                flex: 1, 
                p: {xs: 2, sm: 3}, 
                background: 'rgba(255, 255, 255, 0.85)', 
                backdropFilter: 'blur(12px)', 
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: 4,
                boxShadow: '0 8px 32px rgba(0,0,0,0.05)'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 850, color: '#1e293b', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  🎯 Следующая цель
                </Typography>
                <Stack spacing={1.25}>
                  {nextLevel && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ color: '#3b82f6', display: 'flex' }}><Trophy size={16} /></Box>
                      <Typography variant="body2" sx={{ color: '#4b5563', fontSize: '0.85rem', fontWeight: 600 }}>
                        До {nextLevel.emoji}: <strong>{nextLevel.xpRequired - gameProfile.xp} XP</strong>
                      </Typography>
                    </Box>
                  )}
                  {nextShopUnlock?.reward && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ color: '#f59e0b', display: 'flex' }}><ShoppingBag size={16} /></Box>
                      <Typography variant="body2" sx={{ color: '#4b5563', fontSize: '0.85rem', fontWeight: 600 }}>
                        Награда {nextShopUnlock.reward.emoji}: {nextShopUnlock.coinsNeeded > 0 ? <strong>{nextShopUnlock.coinsNeeded} монеты</strong> : <strong style={{color: '#059669'}}>доступно!</strong>}
                      </Typography>
                    </Box>
                  )}
                  {nextBadgeHint && (
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 1.5 }}>
                      <Box sx={{ color: '#ec4899', display: 'flex', mt: 0.2 }}><Star size={16} /></Box>
                      <Typography variant="body2" sx={{ color: '#4b5563', fontSize: '0.85rem', lineHeight: 1.3, fontWeight: 600 }}>
                        Бейдж {nextBadgeHint.emoji}: <em>{nextBadgeHint.description}</em>
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ mt: 1.5, p: 2, bgcolor: 'rgba(245, 158, 11, 0.08)', borderRadius: 2, border: '1px dashed rgba(245, 158, 11, 0.4)' }}>
                    <Typography variant="subtitle2" sx={{ color: '#b45309', fontWeight: 900, mb: 0.5, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      💡 Как получить бонус?
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600, display: 'block', lineHeight: 1.3 }}>
                      Выполняй задания каждую неделю без пропусков (не оставляй дз более чем на 7 дней). Через <strong>3 недели</strong> активируется <strong>1.2x множитель монет</strong> и будет действовать, пока ты не прервёшь серию!
                    </Typography>
                  </Box>
                </Stack>
              </MuiCard>
            </Stack>

            {/* Badges Row - Integrated into stats section */}
            {gameProfile.unlockedBadges.length > 0 && (
              <MuiCard sx={{ 
                mt: 2, 
                p: 1.5, 
                px: 2.5,
                background: 'rgba(255, 255, 255, 0.65)', 
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 4,
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
              }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="caption" sx={{ fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05rem', whiteSpace: 'nowrap' }}>Достижения:</Typography>
                  <BadgeDisplay 
                    unlockedBadges={gameProfile.unlockedBadges} 
                    purchasedRewards={gameProfile.purchasedRewards} 
                    compact 
                  />
                </Stack>
              </MuiCard>
            )}
          </Box>
        )}

        {/* Multipliers - Compact Indicator Row */}
        {gameProfile && (
          <Box sx={{ 
            maxWidth: 980, 
            mx: 'auto', 
            mb: 4, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            flexWrap: 'wrap',
            px: {xs: 1, sm: 0}
          }}>
            <Typography variant="caption" sx={{ fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mr: 0.5 }}>
              🚀 Комбо-бустеры:
            </Typography>

            {(() => {
              const isOverdue = assignments.some(a => {
                if (a.status === 'completed') return false;
                const assignedTime = a.assignedAt?.seconds ? a.assignedAt.seconds * 1000 : new Date(a.assignedAt).getTime();
                return (Date.now() - assignedTime) > (7 * 24 * 60 * 60 * 1000);
              });

              return (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  {/* Streak Multiplier */}
                  <Tooltip 
                    title={gameProfile.currentStreak >= 3 ? "Серия зафиксирована! Множитель 1.2x активен." : "Нужна серия из 3 недель без пропусков (текущая: " + gameProfile.currentStreak + ")."}
                    arrow
                  >
                    <Chip 
                      icon={<Flame size={14} color="white" fill={gameProfile.currentStreak >= 3 ? "white" : "transparent"} />}
                      label="1.2x Серия"
                      size="small"
                      sx={{ 
                        fontWeight: 800, 
                        bgcolor: gameProfile.currentStreak >= 3 ? '#f59e0b' : '#e2e8f0',
                        color: gameProfile.currentStreak >= 3 ? 'white' : '#94a3b8',
                        '& .MuiChip-icon': { color: 'inherit' },
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </Tooltip>

                  {/* Speed Multiplier */}
                  <Tooltip 
                    title={!isOverdue ? "Все уроки в срок! Множитель 1.3x за скорость активен." : "У тебя есть долги старше 7 дней. Закрой их, чтобы вернуть бонус."}
                    arrow
                  >
                    <Chip 
                      icon={<Zap size={14} color="white" fill={!isOverdue ? "white" : "transparent"} />}
                      label="1.3x Скорость"
                      size="small"
                      sx={{ 
                        fontWeight: 800, 
                        bgcolor: !isOverdue ? '#10b981' : '#e2e8f0',
                        color: !isOverdue ? 'white' : '#94a3b8',
                        '& .MuiChip-icon': { color: 'inherit' },
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </Tooltip>

                  {/* Weekend Multiplier */}
                  <Tooltip 
                    title={[0, 6].includes(new Date().getDay()) ? "Бонус выходного дня 1.5x активен!" : "Выполняй задания в Сб или Вс, чтобы получить 1.5x монет."}
                    arrow
                  >
                    <Chip 
                      icon={<Star size={14} color="white" fill={[0, 6].includes(new Date().getDay()) ? "white" : "transparent"} />}
                      label="1.5x Выходной"
                      size="small"
                      sx={{ 
                        fontWeight: 800, 
                        bgcolor: [0, 6].includes(new Date().getDay()) ? '#ec4899' : '#e2e8f0',
                        color: [0, 6].includes(new Date().getDay()) ? 'white' : '#94a3b8',
                        '& .MuiChip-icon': { color: 'inherit' },
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </Tooltip>

                  {/* How-to Tooltip */}
                  <Tooltip 
                    title={(
                      <Box sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: '#fcd34d', display: 'flex', alignItems: 'center', gap: 1 }}>
                          ❓ Как работают множители?
                        </Typography>
                        <Stack spacing={1}>
                          <Typography variant="caption" sx={{ lineHeight: 1.4, display: 'block' }}>
                            Все активные множители **умножаются**!
                          </Typography>
                          <Typography variant="caption" sx={{ lineHeight: 1.4, display: 'block', color: '#fbbf24' }}>
                            Пример: 1.2x × 1.3x × 1.5x = **2.34x монет**.
                          </Typography>
                          <Typography variant="caption" sx={{ lineHeight: 1.4, display: 'block', fontStyle: 'italic', opacity: 0.8 }}>
                            Просто не пропускай недели и делай уроки сразу!
                          </Typography>
                        </Stack>
                      </Box>
                    )}
                    arrow
                  >
                    <Box sx={{ 
                      ml: 1,
                      width: 22, 
                      height: 22, 
                      borderRadius: '50%', 
                      border: '1.5px solid #cbd5e1', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#94a3b8',
                      cursor: 'help',
                      fontSize: '0.7rem',
                      fontWeight: 900,
                      '&:hover': { bgcolor: '#f1f5f9', color: '#64748b', borderColor: '#94a3b8' },
                      transition: 'all 0.2s ease'
                    }}>
                      ?
                    </Box>
                  </Tooltip>
                </Stack>
              );
            })()}
          </Box>
        )}

        <MuiCard sx={{ maxWidth: 980, mx: 'auto', borderRadius: 3, boxShadow: 6 }}>
          <MuiCardContent>
            {/* Header Section */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" gap={2}>
              <Stack>
                <Typography variant="h5" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BookOpen size={28} />
                  {studentName}&apos;s Homework
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Track your assignments and progress
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip label={`Total: ${totalCount}`} color="primary" />
                <Chip label={`Completed: ${completedCount}`} color="success" variant="outlined" />
                <Chip label={`Pending: ${totalCount - completedCount}`} color="warning" variant="outlined" />
                
                {/* XP Badge */}
                {gameProfile && (() => {
                  const level = getLevelForXP(gameProfile.xp);
                  return (
                    <Chip
                      icon={<Zap size={14} />}
                      label={`${level.emoji} Lv.${level.level} • ${gameProfile.xp} XP`}
                      sx={{
                        bgcolor: themeVisual.primary,
                        color: 'white',
                        fontWeight: 700,
                        '& .MuiChip-icon': { color: 'white' }
                      }}
                    />
                  );
                })()}
                
                {/* Coins */}
                {gameProfile && (
                  <Chip
                    icon={<Coins size={14} />}
                    label={`${gameProfile.shopCoins}`}
                    sx={{
                      bgcolor: '#f59e0b',
                      color: 'white',
                      fontWeight: 700,
                      '& .MuiChip-icon': { color: 'white' }
                    }}
                  />
                )}
                
                {/* Leaderboard Button */}
                <MuiButton
                  variant="contained"
                  startIcon={<Trophy size={18} />}
                  onClick={handleShowRatingDetails}
                  sx={{
                    background: themeVisual.buttonGradient,
                    '&:hover': {
                      background: themeVisual.buttonHoverGradient,
                    },
                    fontWeight: 700,
                    px: 2,
                    py: 1,
                  }}
                >
                  Рейтинг
                </MuiButton>

                {/* Shop Button */}
                <MuiButton
                  variant="contained"
                  startIcon={<ShoppingBag size={18} />}
                  onClick={() => setShowShop(true)}
                  sx={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #d97706 0%, #c2410c 100%)',
                    },
                    fontWeight: 700,
                    px: 2,
                    py: 1,
                  }}
                >
                  Магазин
                </MuiButton>

                {/* Pets Button */}
                <MuiButton
                  variant="contained"
                  onClick={() => setShowPets(true)}
                  sx={{
                    background: 'linear-gradient(135deg, #a855f7 0%, #d946ef 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #9333ea 0%, #c026d3 100%)',
                    },
                    fontWeight: 700,
                    px: 2,
                    py: 1,
                  }}
                >
                  🐾 Животные учеников
                </MuiButton>
                
                {/* Rating Badge */}
                {!loadingRating && studentRating && studentRating.overallRating && (
                  <Stack alignItems="center">
                    <Chip
                      icon={<Star size={16} />}
                      label={`${studentRating.overallRating.toFixed(1)}/10`}
                      sx={{
                        bgcolor: '#f59e0b',
                        color: 'white',
                        fontWeight: 700,
                        '& .MuiChip-icon': { color: 'white' }
                      }}
                    />
                    <MuiButton
                      size="small"
                      startIcon={<TrendingUp size={16} />}
                      onClick={handleShowRatingDetails}
                      sx={{ mt: 0.5, fontSize: '0.7rem' }}
                    >
                      Details
                    </MuiButton>
                  </Stack>
                )}
              </Stack>
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* Loading State */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </Box>
            ) : assignments.length === 0 ? (
              /* Empty State */
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <BookOpen size={64} style={{ margin: '0 auto', color: '#6b7280' }} />
                <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
                  No homework assignments yet.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Your teacher will assign homework for you to complete.
                </Typography>
              </Box>
            ) : (
              <List>
                {assignments.map((assignment, index) => {
                  const statusInfo = getStatusInfo(assignment);
                  const report = getReportForAssignment(assignment.id);
                  const questionInfo = questionCounts[assignment.id];
                  const isCompleted = statusInfo.status === "completed";
                  const displayTitle = assignment.topicName || assignment.chapterName || assignment.courseName || "Homework";
                  const scoreChipLabel = report
                    ? report.totalQuestions
                      ? `${report.correctAnswers ?? 0}/${report.totalQuestions}`
                      : typeof report.score === "number"
                        ? `${report.score}%`
                        : null
                    : null;

                  return (
                    <Fragment key={assignment.id}>
                      <ListItem
                        sx={{ 
                          px: { xs: 1, sm: 2 }, 
                          py: 1.5,
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'stretch', sm: 'center' },
                          gap: { xs: 2, sm: 0 }
                        }}
                      >
                        {/* Avatar and Text Area */}
                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', flex: 1, width: '100%' }}>
                          <ListItemAvatar sx={{ mt: 0, minWidth: 56 }}>
                            <Badge
                              color="secondary"
                              overlap="circular"
                              badgeContent={
                                isCompleted ? <AssignmentIcon sx={{ fontSize: 16 }} /> : null
                              }
                            >
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                {displayTitle.charAt(0)}
                              </Avatar>
                            </Badge>
                          </ListItemAvatar>
                          <ListItemText
                            sx={{ m: 0 }}
                            primary={
                              <Typography sx={{ fontWeight: 600 }}>
                                {displayTitle}
                              </Typography>
                            }
                            secondaryTypographyProps={{ component: 'div' }}
                            secondary={
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, flexWrap: 'wrap', rowGap: 0.5 }}>
                                <Typography component="span" variant="body2" color="text.secondary">
                                  Assigned: {formatDate(assignment.assignedAt)}
                                </Typography>
                                {questionInfo && (
                                  <Typography component="span" variant="body2" color="text.secondary">
                                    • {questionInfo.total} question{questionInfo.total !== 1 ? 's' : ''}
                                  </Typography>
                                )}
                                {isCompleted && (
                                  <Typography component="span" variant="body2" sx={{ color: 'text.primary' }}>
                                    — Completed
                                  </Typography>
                                )}
                              </Stack>
                            }
                          />
                        </Box>
                        
                        {/* Action Buttons */}
                        <Box sx={{ 
                          width: { xs: '100%', sm: 'auto' }, 
                          display: 'flex', 
                          justifyContent: { xs: 'flex-start', sm: 'flex-end' }, 
                          pl: { xs: 7, sm: 2 },
                          mt: { xs: -0.5, sm: 0 }
                        }}>
                          {isCompleted ? (
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: {xs: 1, sm: 0} }}>
                              {scoreChipLabel && (
                                <Chip label={scoreChipLabel} size="small" sx={{ fontWeight: 600, mb: {xs: 1, sm: 0} }} />
                              )}
                              <MuiButton
                                variant="contained"
                                startIcon={<VisibilityIcon />}
                                onClick={() => handleViewResults(assignment)}
                                sx={{ mb: {xs: 1, sm: 0} }}
                              >
                                View results
                              </MuiButton>
                            </Stack>
                          ) : (
                            <MuiButton
                              variant="outlined"
                              startIcon={<PlayArrowIcon />}
                              onClick={() => handleStartHomework(assignment.id)}
                            >
                              Start homework
                            </MuiButton>
                          )}
                        </Box>
                      </ListItem>
                      {index < assignments.length - 1 && (
                        <Divider component="li" sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
                      )}
                    </Fragment>
                  );
                })}
              </List>
            )}

            {/* Footer Note */}
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
              📝 Answer quiz questions to complete your homework and see your score
            </Typography>
          </MuiCardContent>
        </MuiCard>
        </Box>
        
      {/* Results Modal */}
      {viewingResultsFor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-6 text-white" style={{ background: themeVisual.buttonGradient }}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <Trophy className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-2xl font-bold truncate">Homework Results</h2>
                    {(() => {
                      const assignment = assignments.find(a => a.id === viewingResultsFor);
                      const report = getReportForAssignment(viewingResultsFor);
                      return (
                        <p className="text-blue-100 mt-1 text-sm sm:text-base truncate">
                          {assignment?.topicName || "Homework"} - Score: {report?.score}%
                        </p>
                      );
                    })()}
                  </div>
                </div>
                <button
                  onClick={() => setViewingResultsFor(null)}
                  className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {loadingResults ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" style={{ color: themeVisual.primary }} />
                </div>
              ) : (
                <div className="space-y-6">
                  {resultsQuestions.map((question, index) => {
                    const report = getReportForAssignment(viewingResultsFor);
                    
                    // Enhanced answer extraction with better debugging
                    const submittedAnswerObj = report?.submittedAnswers?.find(
                      (a: any) => a.questionId === question.id
                    );
                    const submittedAnswer = submittedAnswerObj?.answer;
                    
                    // Debug: Log the first question to understand the data structure
                    if (index === 0) {
                      console.log('🔍 First Question Debug:', {
                        questionId: question.id,
                        submittedAnswerObj,
                        submittedAnswer,
                        allSubmittedAnswers: report?.submittedAnswers,
                        reportExists: !!report,
                        submittedAnswersExists: !!report?.submittedAnswers,
                        submittedAnswersLength: report?.submittedAnswers?.length
                      });
                    }
                    
                    // More robust correctness check
                    let isCorrect = false;
                    if (submittedAnswer !== undefined && submittedAnswer !== null && submittedAnswer !== "") {
                      // If correctAnswer is a number (index), compare it with the option at that index
                      if (typeof question.correctAnswer === 'number' && question.options) {
                        const correctOption = question.options[question.correctAnswer];
                        isCorrect = normalizeAnswerText(submittedAnswer) === normalizeAnswerText(correctOption);
                      } else {
                        // Direct string comparison
                        isCorrect = normalizeAnswerText(submittedAnswer) === normalizeAnswerText(question.correctAnswer);
                      }
                    }
                    
                    // Debug logging to see what data we have
                    console.log(`Question ${index + 1}:`, {
                      questionId: question.id,
                      submittedAnswer,
                      correctAnswer: question.correctAnswer,
                      correctAnswerType: typeof question.correctAnswer,
                      options: question.options,
                      isCorrect,
                      allSubmittedAnswers: report?.submittedAnswers
                    });
                    
                    return (
                      <div
                        key={question.id}
                        className={`border-2 rounded-2xl p-5 ${
                          isCorrect
                            ? "bg-green-50/50 border-green-300"
                            : "bg-red-50/50 border-red-300"
                        }`}
                      >
                        {/* Question Header */}
                        <div className="flex items-start gap-3 mb-4">
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              isCorrect
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900">
                              {question.text || question.question}
                            </h3>
                            {question.sentence && (
                              <p className="text-gray-700 mt-1">{question.sentence}</p>
                            )}
                          </div>
                          {isCorrect ? (
                            <Check className="h-6 w-6 text-green-600 flex-shrink-0" />
                          ) : (
                            <X className="h-6 w-6 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                        
                        {/* Media */}
                        {(question.mediaUrl || question.imageUrl || question.audioUrl || question.videoUrl) && (
                          <div className="mb-4">
                            {(question.mediaType === "image" || question.imageUrl) && (
                              <img
                                src={question.mediaUrl || question.imageUrl}
                                alt="Question media"
                                className="max-w-full h-auto rounded-lg"
                              />
                            )}
                            {(question.mediaType === "audio" || question.audioUrl) && (
                              <audio controls className="w-full">
                                <source src={question.mediaUrl || question.audioUrl} />
                              </audio>
                            )}
                            {(question.mediaType === "video" || question.videoUrl) && (
                              <video controls className="w-full max-h-64 rounded-lg">
                                <source src={question.mediaUrl || question.videoUrl} />
                              </video>
                            )}
                          </div>
                        )}
                        
                        {/* Options (for multiple choice) */}
                        {question.options && question.options.length > 0 && (
                          <div className="space-y-2 mb-4">
                            {question.options.map((option, optIndex) => {
                              // Determine if this option is the correct answer
                              let isThisCorrect = false;
                              if (typeof question.correctAnswer === 'number') {
                                // correctAnswer is an index
                                isThisCorrect = optIndex === question.correctAnswer;
                              } else {
                                // correctAnswer is the text
                                isThisCorrect = String(question.correctAnswer).trim().toLowerCase() === String(option).trim().toLowerCase();
                              }
                              
                              // Determine if this option was selected by the student
                              // Fixed: More lenient comparison that handles undefined/null/empty string cases
                              let isThisSelected = false;
                              if (submittedAnswer !== undefined && submittedAnswer !== null && submittedAnswer !== "") {
                                const submittedStr = String(submittedAnswer).trim().toLowerCase();
                                const optionStr = String(option).trim().toLowerCase();
                                isThisSelected = submittedStr === optionStr;
                                
                                // Debug log for ALL options to see what's happening
                                console.log(`Q${index + 1} Option ${optIndex + 1} comparison:`, {
                                  option,
                                  submittedAnswer,
                                  submittedStr,
                                  optionStr,
                                  isThisSelected,
                                  isThisCorrect,
                                  match: submittedStr === optionStr
                                });
                              } else {
                                // Debug when submittedAnswer is empty/null/undefined
                                console.log(`Q${index + 1} Option ${optIndex + 1} - NO submitted answer:`, {
                                  submittedAnswer,
                                  submittedAnswerType: typeof submittedAnswer,
                                  option
                                });
                              }
                              
                              return (
                                <div
                                  key={optIndex}
                                  className={`p-3 rounded-lg border-2 transition-all ${
                                    isThisCorrect && isThisSelected
                                      ? "bg-green-100 border-green-400 font-semibold shadow-md"
                                      : isThisCorrect
                                      ? "bg-green-50 border-green-300"
                                      : isThisSelected
                                      ? "bg-red-100 border-red-400 shadow-md"
                                      : "bg-white border-gray-200"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className={isThisSelected ? "font-bold text-gray-900" : "text-gray-700"}>{option}</span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {isThisSelected && (
                                        <span className={`text-sm font-bold flex items-center gap-1 px-2 py-1 rounded-md ${
                                          isThisCorrect 
                                            ? "text-green-700 bg-green-200" 
                                            : "text-red-700 bg-red-200"
                                        }`}>
                                          {isThisCorrect ? (
                                            <>
                                              <Check className="h-4 w-4" /> Your Answer ✓
                                            </>
                                          ) : (
                                            <>
                                              <X className="h-4 w-4" /> Your Answer
                                            </>
                                          )}
                                        </span>
                                      )}
                                      {isThisCorrect && !isThisSelected && (
                                        <span className="text-green-700 text-sm font-bold flex items-center gap-1 px-2 py-1 rounded-md bg-green-200">
                                          <Check className="h-4 w-4" /> Correct Answer
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Answer Summary (for text answers or fill-in-blank) */}
                        {(!question.options || question.options.length === 0) && (
                          <div className="space-y-2 mb-3">
                            <div className={`p-4 rounded-lg border-2 ${
                              isCorrect 
                                ? "bg-green-50 border-green-300" 
                                : "bg-red-50 border-red-300"
                            }`}>
                              <div className="flex items-center gap-2 mb-2">
                                {isCorrect ? (
                                  <Check className="h-5 w-5 text-green-600" />
                                ) : (
                                  <X className="h-5 w-5 text-red-600" />
                                )}
                                <div className={`text-sm font-bold ${
                                  isCorrect ? "text-green-700" : "text-red-700"
                                }`}>
                                  Your Answer:
                                </div>
                              </div>
                              <div className={`font-bold text-lg ${
                                isCorrect ? "text-green-900" : "text-red-900"
                              }`}>
                                {submittedAnswer || "(No answer provided)"}
                              </div>
                            </div>
                            {!isCorrect && (
                              <div className="p-4 rounded-lg bg-green-50 border-2 border-green-300">
                                <div className="flex items-center gap-2 mb-2">
                                  <Check className="h-5 w-5 text-green-600" />
                                  <div className="text-sm font-bold text-green-700">Correct Answer:</div>
                                </div>
                                <div className="font-bold text-lg text-green-900">
                                  {typeof question.correctAnswer === 'number' && question.options 
                                    ? question.options[question.correctAnswer] 
                                    : question.correctAnswer}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Explanation */}
                        {question.explanation && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-sm font-semibold text-blue-700 mb-1">💡 Explanation:</div>
                            <div className="text-sm text-gray-700">{question.explanation}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="border-t p-4 bg-gray-50">
              <Button
                onClick={() => setViewingResultsFor(null)}
                  className="w-full text-white"
                  style={{ background: themeVisual.buttonGradient }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {gameProfile?.petId && petPosition && (
        <div
          ref={petContainerRef}
          className="fixed z-40 select-none"
          style={{
            left: petPosition.x,
            top: petPosition.y,
            touchAction: 'none',
            cursor: petDragRef.current.isDragging ? 'grabbing' : 'grab',
            transition: petDragRef.current.isDragging ? 'none' : 'filter 0.2s ease',
            filter: petDragRef.current.isDragging ? 'drop-shadow(0 8px 24px rgba(0,0,0,0.25))' : 'none',
          }}
          onPointerDown={handlePetPointerDown}
          onPointerMove={handlePetPointerMove}
          onPointerUp={handlePetPointerUp}
        >
          <div className="relative">
            {petReaction && (
              <div className="absolute -top-9 right-2 rounded-full bg-white/95 border border-indigo-200 px-2 py-1 text-lg shadow-md animate-bounce">
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
                    setPetPhrase("Фу, тут плохо пахнет... Нужно убраться! 🧹");
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
                onClick={() => {
                  if (activeCareNeed === "hunger") {
                    setActiveCareNeed(null);
                  } else {
                    setActiveCareNeed("hunger");
                    setPetPhrase("Я голоден! Покорми меня! 🍽️");
                  }
                }}
                className="absolute -top-6 -right-6 z-30 text-3xl hover:scale-125 transition-transform cursor-pointer"
                title="Покормить!"
              >
                <span className="animate-pulse drop-shadow-lg">🍽️</span>
              </button>
            )}
            {petNeeds.isBored && (
              <button
                type="button"
                onClick={() => {
                  if (activeCareNeed === "boredom") {
                    setActiveCareNeed(null);
                  } else {
                    setActiveCareNeed("boredom");
                    setPetPhrase("Мне скучно... Поиграй со мной! 🎮");
                  }
                }}
                className="absolute -top-6 -left-6 z-30 text-3xl hover:scale-125 transition-transform cursor-pointer"
                title="Поиграть!"
              >
                <span className="animate-pulse drop-shadow-lg">😐</span>
              </button>
            )}
            {petNeeds.isThirsty && (
              <button
                type="button"
                onClick={() => {
                  if (activeCareNeed === "thirst") {
                    setActiveCareNeed(null);
                  } else {
                    setActiveCareNeed("thirst");
                    setPetPhrase("Я хочу пить! Дай мне воды! 💧");
                  }
                }}
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

            <button
              type="button"
              onClick={(e) => {
                // Only trigger phrase toggle if we didn't just finish dragging
                if (!petDragRef.current.hasMoved) {
                  togglePetPhrase();
                }
              }}
              className="rounded-2xl relative"
              style={{ pointerEvents: 'auto' }}
            >
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
      
      {/* Pet Selection */}
      {gameProfile && !gameProfile.petId && (
        <PetSelectionModal
          isOpen={true}
          profile={gameProfile}
          onSelect={setGameProfile}
        />
      )}
      
      {/* Student Leaderboard Modal */}
      <StudentLeaderboard
        isOpen={showRatingDetails}
        onClose={() => setShowRatingDetails(false)}
        currentStudentId={studentId}
      />

      <StudentsPetsModal
        isOpen={showPets}
        onClose={() => setShowPets(false)}
      />

      {gameProfile && (
        <RewardShop
          isOpen={showShop}
          onClose={() => setShowShop(false)}
          profile={gameProfile}
          onProfileUpdate={(updated) => setGameProfile(updated)}
        />
      )}
    </Box>
    </ThemeProvider>
  );
}
