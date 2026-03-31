"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchStudentHomework, fetchStudentHomework as _fsh, fetchQuestionsForHomework, submitHomeworkAnswers, fetchHomeworkReports, Question, HomeworkAssignment } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, CheckCircle, ArrowLeft, AlertCircle, Trophy, Volume2, Film, Image as ImageIcon, Clock, Zap, Star, Coins } from "lucide-react";
import { awardHomeworkXP, calculateXP, getLevelForXP, getNextLevel, getXPProgress, AwardResult, getGameProfile, saveQuestionProgress } from "@/lib/gamification";
import { playSound } from "@/lib/audioSystem";
import confetti from "canvas-confetti";
import PetAvatar from "@/components/PetAvatar";

interface HomeworkQuizProps {
  studentId: string;
  studentName: string;
  homeworkId: string;
}

export default function HomeworkQuiz({ studentId, studentName, homeworkId }: HomeworkQuizProps) {
  const router = useRouter();
  const [assignment, setAssignment] = useState<HomeworkAssignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [lockedAnswers, setLockedAnswers] = useState<{ [questionId: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<{ score: number; correctAnswers: number; totalQuestions: number } | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Gamification state
  const [startTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [feedbackState, setFeedbackState] = useState<"idle" | "correct" | "wrong">("idle");
  const [correctCount, setCorrectCount] = useState(0);
  const [awardResult, setAwardResult] = useState<AwardResult | null>(null);
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [quizPet, setQuizPet] = useState<{ petId: string; accessories: string[] } | null>(null);
  const [petReaction, setPetReaction] = useState<string | null>(null);

  // Timer
  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, submitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

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
    loadHomeworkQuiz();
  }, [homeworkId, studentId]);

  const loadHomeworkQuiz = async () => {
    setLoading(true);
    try {
      const assignments = await fetchStudentHomework(studentId);
      const hw = assignments.find(a => a.id === homeworkId);

      if (!hw) {
        router.replace(`/student/${studentId}/homework`);
        return;
      }

      if (hw.status === "completed") {
        router.replace(`/student/${studentId}/homework`);
        return;
      }

      setAssignment(hw);

      let topicIds = hw.topicIds || [];
      if (topicIds.length === 0 && hw.topicId) {
        topicIds = [hw.topicId];
      }

      const questionsData = await fetchQuestionsForHomework(topicIds);

      if (questionsData.length === 0) {
        alert("No questions found for this homework!");
        router.back();
        return;
      }

      setQuestions(questionsData);

      // Load partial progress
      try {
        const profile = await getGameProfile(studentId);
        if (profile.petId) {
          setQuizPet({ petId: profile.petId, accessories: profile.petAccessories || [] });
        }
        if (profile.progress && profile.progress[homeworkId]) {
          const hwProg = profile.progress[homeworkId];
          const restoredAnswers: Record<string, string> = {};
          const restoredLocked: Record<string, boolean> = {};
          let restoredCorrect = 0;
          
          Object.entries(hwProg.answers).forEach(([qId, data]) => {
            restoredAnswers[qId] = data.answer;
            restoredLocked[qId] = true;
            if (data.isCorrect) restoredCorrect++;
          });
          
          setAnswers(restoredAnswers);
          setLockedAnswers(restoredLocked);
          setCorrectCount(restoredCorrect);
        }
      } catch (err) {
        console.error("Error loading progress:", err);
      }
    } catch (error) {
      console.error("Error loading homework quiz:", error);
      alert("Failed to load homework. Please try again.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const checkAnswer = useCallback((questionId: string, answer: string): boolean => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return false;
    if (typeof question.correctAnswer === "number" && question.options) {
      const correctOption = question.options[question.correctAnswer];
      return normalizeAnswerText(answer) === normalizeAnswerText(correctOption);
    }
    return normalizeAnswerText(answer) === normalizeAnswerText(question.correctAnswer);
  }, [questions]);

  const handleAnswerSelect = (questionId: string, answer: string) => {
    if (feedbackState !== "idle" || lockedAnswers[questionId]) return; // Don't allow change during feedback or if locked

    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    setLockedAnswers(prev => ({ ...prev, [questionId]: true }));

    // Instant feedback
    const isCorrect = checkAnswer(questionId, answer);
    setFeedbackState(isCorrect ? "correct" : "wrong");
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      playSound("success");
      triggerPetReaction(["👏", "😄", "🎉", "⭐"][Math.floor(Math.random() * 4)]);
    } else {
      playSound("error");
      triggerPetReaction("💪");
    }

    // Save progress asynchronously
    saveQuestionProgress(studentId, homeworkId, questionId, answer, isCorrect);

    // Auto advance after delay
    setTimeout(() => {
      setFeedbackState("idle");
      setCurrentQuestionIndex(prev => prev < questions.length - 1 ? prev + 1 : prev); // Safer closure
    }, 1200);
  };

  const handleTextAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const fireConfetti = (score: number) => {
    if (score >= 100) {
      // Epic confetti for perfect score
      const duration = 3000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#FFD700", "#FFA500", "#FF6347"] });
        confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#FFD700", "#FFA500", "#FF6347"] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    } else if (score >= 80) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ["#4ade80", "#22c55e", "#16a34a"] });
    }
  };

  const handleSubmit = async () => {
    const unansweredCount = questions.length - Object.keys(answers).length;
    if (unansweredCount > 0) {
      const confirm = window.confirm(`You have ${unansweredCount} unanswered question(s). Submit anyway?`);
      if (!confirm) return;
    }

    setSubmitting(true);
    try {
      const answerArray = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }));

      if (answerArray.length === 0) {
        alert("Error: No answers to submit. Please answer at least one question.");
        setSubmitting(false);
        return;
      }

      const result = await submitHomeworkAnswers(homeworkId, studentId, answerArray, questions);

      if (result.success) {
        setResults(result);
        setSubmitted(true);
        playSound("complete");

        // Fire confetti
        setTimeout(() => fireConfetti(result.score), 300);

        // Award XP
        try {
          const allAssignments = await fetchStudentHomework(studentId);
          const allReports = await fetchHomeworkReports(studentId);
          const totalAssigned = allAssignments.length;
          const totalCompleted = allReports.length + 1; // +1 for this one

          // Check if early completion (within 24h)
          let wasEarly = false;
          if (assignment?.assignedAt) {
            const assignedTime = assignment.assignedAt.seconds
              ? assignment.assignedAt.seconds * 1000
              : new Date(assignment.assignedAt).getTime();
            wasEarly = Date.now() - assignedTime < 24 * 60 * 60 * 1000;
          }

          const award = await awardHomeworkXP(
            studentId,
            homeworkId,
            result.correctAnswers,
            result.totalQuestions,
            elapsedSeconds,
            totalAssigned,
            totalCompleted,
            wasEarly
          );
          setAwardResult(award);
          setShowXPAnimation(true);
        } catch (err) {
          console.error("Error awarding XP:", err);
        }
      } else {
        alert("Failed to submit homework. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting homework:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </main>
    );
  }

  // ─── Results Screen ─────────────────────────────────────────────────
  if (submitted && results) {
    const xp = awardResult?.xpBreakdown;
    const level = awardResult ? getLevelForXP(awardResult.updatedProfile.xp) : null;
    const progress = awardResult ? getXPProgress(awardResult.updatedProfile.xp) : null;
    const streakSummary = awardResult
      ? awardResult.streakOutcome === "kept"
        ? "Серия продолжена"
        : awardResult.streakOutcome === "same_week"
        ? "Эта неделя уже учтена"
        : awardResult.streakOutcome === "reset"
        ? "Серия начата заново"
        : "Первая неделя серии"
      : null;

    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto mt-8 space-y-6">
          {/* Score Card */}
          <Card className="backdrop-blur-sm bg-white/90 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center pb-8">
              <CheckCircle className="h-16 w-16 mx-auto mb-3" />
              <CardTitle className="text-3xl font-bold">Homework Complete!</CardTitle>
              <CardDescription className="text-green-100 text-lg mt-1">
                Great job, {studentName}! 🎉
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 pb-8">
              <div className="text-center space-y-6">
                {/* Score */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-300">
                  <Trophy className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                  <div className="text-5xl font-bold text-yellow-600 mb-1">{results.score}%</div>
                  <div className="text-lg text-gray-700">
                    {results.correctAnswers} out of {results.totalQuestions} correct
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    ⏱️ Completed in {formatTime(elapsedSeconds)}
                  </div>
                </div>

                {/* XP Breakdown */}
                {xp && showXPAnimation && (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border-2 border-indigo-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Zap className="h-6 w-6 text-indigo-600" />
                      <span className="text-xl font-bold text-indigo-700">XP Earned</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {xp.correctAnswerXP > 0 && (
                        <div className="flex justify-between px-4">
                          <span className="text-gray-600">✅ Correct answers ({results.correctAnswers} × 10)</span>
                          <span className="font-bold text-indigo-600">+{xp.correctAnswerXP} XP</span>
                        </div>
                      )}
                      <div className="flex justify-between px-4">
                        <span className="text-gray-600">📝 Completion bonus</span>
                        <span className="font-bold text-indigo-600">+{xp.completionXP} XP</span>
                      </div>
                      {xp.perfectBonusXP > 0 && (
                        <div className="flex justify-between px-4">
                          <span className="text-gray-600">💯 Perfect score!</span>
                          <span className="font-bold text-yellow-600">+{xp.perfectBonusXP} XP</span>
                        </div>
                      )}
                      {xp.highScoreBonusXP > 0 && (
                        <div className="flex justify-between px-4">
                          <span className="text-gray-600">⭐ High score bonus</span>
                          <span className="font-bold text-green-600">+{xp.highScoreBonusXP} XP</span>
                        </div>
                      )}
                      {xp.timerBonusXP > 0 && (
                        <div className="flex justify-between px-4">
                          <span className="text-gray-600">⚡ Speed bonus</span>
                          <span className="font-bold text-orange-600">+{xp.timerBonusXP} XP</span>
                        </div>
                      )}
                      <div className="border-t border-indigo-200 pt-2 mt-2 flex justify-between px-4">
                        <span className="font-bold text-gray-800">Total</span>
                        <span className="font-bold text-lg text-indigo-700">+{xp.totalXP} XP</span>
                      </div>
                      <div className="flex justify-between px-4">
                        <span className="text-gray-600">🪙 Coins earned</span>
                        <span className="font-bold text-amber-600">+{xp.coinsEarned} coins</span>
                      </div>
                      {awardResult && awardResult.comebackBonusCoins > 0 && (
                        <div className="flex justify-between px-4">
                          <span className="text-gray-600">🎁 Comeback bonus</span>
                          <span className="font-bold text-emerald-600">+{awardResult.comebackBonusCoins} coins</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {awardResult && (
                  <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl p-5 border-2 border-rose-200">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-gray-800">Недельная серия</div>
                        <div className="text-xs text-gray-600 mt-1">{streakSummary}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-rose-600">{awardResult.updatedProfile.currentStreak}</div>
                        <div className="text-[11px] text-gray-600">недель подряд</div>
                      </div>
                    </div>
                    <div className="text-[11px] text-gray-600 mt-2">
                      Рекорд: {awardResult.updatedProfile.highestStreak} недель
                      {awardResult.missedWeeks > 0 && ` • Пропущено недель: ${awardResult.missedWeeks}`}
                    </div>
                  </div>
                )}

                {/* Level Progress */}
                {awardResult && level && progress && (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border-2 border-emerald-200">
                    {awardResult.leveledUp && (
                      <div className="text-center mb-3 text-lg font-bold text-emerald-700 animate-bounce">
                        🎉 Level Up! You are now {level.emoji} {level.title}!
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{level.emoji}</div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold text-gray-700">Level {level.level}: {level.title}</span>
                          <span className="text-gray-500">{awardResult.updatedProfile.xp} XP</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-emerald-400 to-teal-500 h-3 rounded-full transition-all duration-1000"
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                        {progress.needed > 0 && (
                          <div className="text-xs text-gray-500 mt-1">{progress.current}/{progress.needed} to next level</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* New Badges */}
                {awardResult && awardResult.newBadges.length > 0 && (
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 border-2 border-amber-300">
                    <div className="text-lg font-bold text-amber-700 mb-3">🏅 New Badge{awardResult.newBadges.length > 1 ? "s" : ""} Unlocked!</div>
                    <div className="flex flex-wrap justify-center gap-4">
                      {awardResult.newBadges.map(badge => (
                        <div key={badge.id} className="text-center animate-bounce">
                          <div className="text-4xl mb-1">{badge.emoji}</div>
                          <div className="text-sm font-bold text-gray-800">{badge.name}</div>
                          <div className="text-xs text-gray-500">{badge.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Encouragement */}
                <p className="text-lg text-gray-600">
                  {results.score === 100 && "🎉 Perfect score! Outstanding work!"}
                  {results.score >= 80 && results.score < 100 && "⭐ Excellent work! Keep it up!"}
                  {results.score >= 60 && results.score < 80 && "👍 Good job! Keep practicing!"}
                  {results.score < 60 && "💪 Keep studying and you'll improve!"}
                </p>

                <Button
                  onClick={() => router.push(`/student/${studentId}/homework`)}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold px-8 py-6 text-lg"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back to Homework List
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        {quizPet && (
          <div className="fixed right-3 bottom-3 sm:right-6 sm:bottom-6 z-40 pointer-events-none">
            <div className="relative">
              {petReaction && (
                <div className="absolute -top-9 right-2 rounded-full bg-white/95 border border-indigo-200 px-2 py-1 text-lg shadow-md animate-bounce">
                  {petReaction}
                </div>
              )}
              <PetAvatar petId={quizPet.petId} accessories={quizPet.accessories} size="lg" className="scale-110 shadow-xl" />
            </div>
          </div>
        )}
      </main>
    );
  }

  // ─── Quiz View ──────────────────────────────────────────────────────
  const currentQ = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQ?.id];
  const isCurrentAnswered = !!currentAnswer;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 mt-8">
          <Button variant="outline" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <Card className="backdrop-blur-sm bg-white/90 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-8 w-8" />
                  <div>
                    <CardTitle className="text-2xl font-bold">
                      {assignment?.topicName || "Homework Quiz"}
                    </CardTitle>
                    <CardDescription className="text-purple-100 text-sm mt-1">
                      Answer all questions to complete
                    </CardDescription>
                  </div>
                </div>
                {/* Timer */}
                <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono font-bold text-sm">{formatTime(elapsedSeconds)}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              {/* Progress Bar */}
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-900">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-600 font-semibold">✅ {correctCount}</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600">{Object.keys(answers).length} answered</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Question */}
        {currentQ && (
          <Card className={`backdrop-blur-sm bg-white/80 transition-all duration-300 ${
            feedbackState === "correct" ? "ring-4 ring-green-400 shadow-green-200 shadow-lg" :
            feedbackState === "wrong" ? "ring-4 ring-red-400 shadow-red-200 shadow-lg animate-shake" :
            ""
          }`}>
            <CardContent className="pt-6">
              {/* Homework-level media */}
              {assignment?.homeworkMediaFiles && assignment.homeworkMediaFiles.length > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                    <span className="font-semibold text-indigo-900">Homework Materials</span>
                  </div>
                  <div className="space-y-3">
                    {assignment.homeworkMediaFiles.map((file, i) => (
                      <div key={i}>
                        {file.type === "image" && <img src={file.url} alt="Reference" className="w-full max-h-96 object-contain rounded-lg border" />}
                        {file.type === "audio" && <audio controls className="w-full" src={file.url} />}
                        {file.type === "video" && <video controls className="w-full max-h-64 rounded-lg" src={file.url} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Question Text */}
              <div className="mb-4">
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white ${
                    feedbackState === "correct" ? "bg-green-500" : feedbackState === "wrong" ? "bg-red-500" : "bg-purple-500"
                  } transition-colors duration-300`}>
                    {feedbackState === "correct" ? "✓" : feedbackState === "wrong" ? "✗" : currentQuestionIndex + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-xl font-medium text-gray-900 mb-4">{currentQ.text}</p>

                    {/* Question Media */}
                    <div className="space-y-3 mb-4">
                      {currentQ.mediaFiles && currentQ.mediaFiles.length > 0 && currentQ.mediaFiles.map((file, i) => (
                        <div key={i}>
                          {file.type === "image" && <img src={file.url} alt="Question" className="w-full max-h-96 object-contain rounded-lg border" />}
                          {file.type === "audio" && <audio controls className="w-full" src={file.url} />}
                          {file.type === "video" && <video controls className="w-full max-h-64 rounded-lg" src={file.url} />}
                        </div>
                      ))}
                      {!currentQ.mediaFiles && currentQ.mediaUrl && currentQ.mediaType === "image" && (
                        <img src={currentQ.mediaUrl} alt="Question" className="w-full max-h-96 object-contain rounded-lg border" />
                      )}
                      {!currentQ.mediaFiles && currentQ.mediaUrl && currentQ.mediaType === "audio" && (
                        <audio controls className="w-full" src={currentQ.mediaUrl} />
                      )}
                      {!currentQ.mediaFiles && currentQ.mediaUrl && currentQ.mediaType === "video" && (
                        <video controls className="w-full max-h-64 rounded-lg" src={currentQ.mediaUrl} />
                      )}
                      {currentQ.imageUrl && <img src={currentQ.imageUrl} alt="Question" className="w-full max-h-96 object-contain rounded-lg border" />}
                      {currentQ.audioUrl && <audio controls className="w-full" src={currentQ.audioUrl} />}
                      {currentQ.videoUrl && <video controls className="w-full max-h-64 rounded-lg" src={currentQ.videoUrl} />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Answer Options */}
              {currentQ.options && currentQ.options.length > 0 ? (
                <div className="space-y-3">
                  {currentQ.options.map((option, optionIndex) => {
                    const isSelected = currentAnswer === option;
                    const isCorrectOption = (() => {
                      if (typeof currentQ.correctAnswer === "number") return optionIndex === currentQ.correctAnswer;
                      return String(currentQ.correctAnswer).trim().toLowerCase() === String(option).trim().toLowerCase();
                    })();

                    const isLocked = lockedAnswers[currentQ.id];
                    const showResult = isLocked || feedbackState !== "idle";

                    let optionStyle = "bg-white border-gray-200 hover:border-purple-300";
                    if (showResult && isSelected && isCorrectOption) {
                      optionStyle = "bg-green-100 border-green-500 shadow-md";
                    } else if (showResult && isSelected && !isCorrectOption) {
                      optionStyle = "bg-red-100 border-red-500 shadow-md";
                    } else if (showResult && !isSelected && isCorrectOption && (feedbackState === "wrong" || (isLocked && !checkAnswer(currentQ.id, currentAnswer)))) {
                      optionStyle = "bg-green-50 border-green-400";
                    } else if (isSelected) {
                      optionStyle = "bg-purple-50 border-purple-500";
                    }

                    return (
                      <label
                        key={optionIndex}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all min-h-[52px] touch-manipulation active:scale-[0.98] select-none ${optionStyle} ${
                          showResult ? "pointer-events-none" : ""
                        }`}
                        onClick={() => {
                          if (!showResult && !isSelected) {
                            handleAnswerSelect(currentQ.id, option);
                          }
                        }}
                      >
                        <input
                          type="radio"
                          name={currentQ.id}
                          value={option}
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-6 h-6 text-purple-600 touch-manipulation"
                        />
                        <span className="text-lg text-gray-800">{option}</span>
                        {showResult && isSelected && isCorrectOption && (
                          <span className="ml-auto text-green-600 font-bold text-sm">✓ Correct!</span>
                        )}
                        {showResult && isSelected && !isCorrectOption && (
                          <span className="ml-auto text-red-600 font-bold text-sm">✗ Wrong</span>
                        )}
                        {showResult && !isSelected && isCorrectOption && (feedbackState === "wrong" || (isLocked && !checkAnswer(currentQ.id, currentAnswer))) && (
                          <span className="ml-auto text-green-600 font-bold text-sm">← Correct answer</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={answers[currentQ.id] || ""}
                    onChange={(e) => handleTextAnswer(currentQ.id, e.target.value)}
                    disabled={lockedAnswers[currentQ.id] || feedbackState !== "idle"}
                    placeholder="Type your answer here..."
                    rows={4}
                    className={`w-full p-4 text-lg border-2 rounded-lg focus:outline-none resize-none transition-colors ${
                      lockedAnswers[currentQ.id] 
                        ? (checkAnswer(currentQ.id, answers[currentQ.id]) ? 'border-green-500 bg-green-50 text-green-900' : 'border-red-500 bg-red-50 text-red-900')
                        : 'border-gray-200 focus:border-purple-500'
                    }`}
                  />
                  {!lockedAnswers[currentQ.id] && (
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg"
                      onClick={() => handleAnswerSelect(currentQ.id, answers[currentQ.id] || "")}
                      disabled={!answers[currentQ.id]?.trim() || feedbackState !== "idle"}
                    >
                      Check Answer
                    </Button>
                  )}
                  {lockedAnswers[currentQ.id] && !checkAnswer(currentQ.id, answers[currentQ.id]) && currentQ.correctAnswer && (
                    <div className="p-4 bg-green-100 text-green-800 rounded-lg border border-green-300">
                      <strong>Correct Answer:</strong> {currentQ.correctAnswer}
                    </div>
                  )}
                  {lockedAnswers[currentQ.id] && checkAnswer(currentQ.id, answers[currentQ.id]) && (
                    <div className="p-4 bg-green-100 text-green-800 rounded-lg border border-green-300 font-bold flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" /> Correct!
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="mt-8 mb-8">
          <Card className="backdrop-blur-sm bg-white/90">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between gap-4">
                <Button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  variant="outline"
                  className="px-6 py-6 min-h-[48px] touch-manipulation active:scale-95 select-none"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>

                <div className="text-center text-gray-600">
                  <div className="font-semibold text-lg">{currentQuestionIndex + 1} / {questions.length}</div>
                  <div className="text-sm">{isCurrentAnswered ? "✓ Answered" : "Not answered"}</div>
                </div>

                {currentQuestionIndex < questions.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!isCurrentAnswered}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold px-6 py-6 min-h-[48px] touch-manipulation active:scale-95 select-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-6 py-6 min-h-[48px] touch-manipulation active:scale-95 select-none"
                  >
                    {submitting ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...</>
                    ) : (
                      <><CheckCircle className="mr-2 h-5 w-5" /> Submit ({Object.keys(answers).length}/{questions.length})</>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Shake animation */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
      {quizPet && (
        <div className="fixed right-3 bottom-3 sm:right-6 sm:bottom-6 z-40 pointer-events-none">
          <div className="relative">
            {petReaction && (
              <div className="absolute -top-9 right-2 rounded-full bg-white/95 border border-indigo-200 px-2 py-1 text-lg shadow-md animate-bounce">
                {petReaction}
              </div>
            )}
            <PetAvatar petId={quizPet.petId} accessories={quizPet.accessories} size="lg" className="scale-110 shadow-xl" />
          </div>
        </div>
      )}
    </main>
  );
}
