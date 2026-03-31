"use client";

import { useEffect, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import { fetchStudentHomework, fetchHomeworkReports, fetchQuestionsForHomework, fetchStudentRatings, fetchAllStudentRatings, HomeworkAssignment, HomeworkReport, Question } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import StudentLeaderboard from "@/components/StudentLeaderboard";
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
} from "@mui/material";
import AssignmentIcon from '@mui/icons-material/Assignment';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { BookOpen, Loader2, Trophy, X, Check, Star, TrendingUp, XCircle, Zap, Coins } from "lucide-react";
import { getGameProfile, getLevelForXP, getXPProgress, GameProfile } from "@/lib/gamification";
import BadgeDisplay from "@/components/BadgeDisplay";
import PetSelectionModal from "@/components/PetSelectionModal";
import PetAvatar from "@/components/PetAvatar";

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
  const [isClient, setIsClient] = useState(false);
  const [gameProfile, setGameProfile] = useState<GameProfile | null>(null);
  const [petReaction, setPetReaction] = useState<string | null>(null);

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

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <Box 
        sx={{ 
          p: 3, 
          minHeight: '100vh', 
          background: 'linear-gradient(to bottom right, #f8fafc, #dbeafe, #e0e7ff)',
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
            bgcolor: 'rgba(96, 165, 250, 0.1)', 
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
            bgcolor: 'rgba(34, 211, 238, 0.1)', 
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
            bgcolor: 'rgba(129, 140, 248, 0.1)', 
            borderRadius: '50%', 
            filter: 'blur(80px)',
            animation: 'pulse 3s ease-in-out infinite',
            animationDelay: '2s'
          }} />
        </Box>

        <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Back Button */}
        <MuiButton
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ mb: 3, color: 'text.secondary' }}
        >
          Back to Welcome Page
        </MuiButton>

        <MuiCard sx={{ maxWidth: 980, mx: 'auto', borderRadius: 3, boxShadow: 6 }}>
          <MuiCardContent>
            {/* Header Section */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" gap={2}>
              <Stack>
                <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BookOpen size={28} />
                  {studentName}'s Homework
                </Typography>
                <Typography variant="body2" color="text.secondary">
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
                        bgcolor: '#6366f1',
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
                    background: 'linear-gradient(to right, #f59e0b, #d97706)',
                    '&:hover': {
                      background: 'linear-gradient(to right, #d97706, #b45309)',
                    },
                    fontWeight: 700,
                    px: 2,
                    py: 1,
                  }}
                >
                  Рейтинг учеников
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
                        alignItems="flex-start"
                        sx={{ px: 0.5, py: 1.5 }}
                        secondaryAction={
                          isCompleted ? (
                            <Stack direction="row" spacing={1} alignItems="center">
                              {scoreChipLabel && (
                                <Chip label={scoreChipLabel} size="small" sx={{ fontWeight: 600 }} />
                              )}
                              <MuiButton
                                variant="contained"
                                startIcon={<VisibilityIcon />}
                                onClick={() => handleViewResults(assignment)}
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
                          )
                        }
                      >
                        <ListItemAvatar>
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
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 sm:p-6 text-white">
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
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {gameProfile?.petId && (
        <div className="fixed right-3 bottom-3 sm:right-6 sm:bottom-6 z-40 pointer-events-none">
          <div className="relative">
            {petReaction && (
              <div className="absolute -top-9 right-2 rounded-full bg-white/95 border border-indigo-200 px-2 py-1 text-lg shadow-md animate-bounce">
                {petReaction}
              </div>
            )}
            <PetAvatar
              petId={gameProfile.petId}
              accessories={gameProfile.petAccessories || []}
              size="lg"
              className="scale-110 shadow-xl"
            />
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
    </Box>
    </ThemeProvider>
  );
}
