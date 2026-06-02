"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAllCompletedHomework, markHomeworkAsSeen, markAllHomeworkAsSeen, fetchQuestionsForHomework, HomeworkReport, Question } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Loader2, ArrowLeft, User, Clock, Trophy, CheckCircle, Eye, X, Check } from "lucide-react";

export default function TeacherHomeworksPage() {
  const router = useRouter();
  const [homeworks, setHomeworks] = useState<Array<HomeworkReport & { studentName?: string; topicIds?: string[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [viewingReport, setViewingReport] = useState<(HomeworkReport & { studentName?: string; topicIds?: string[] }) | null>(null);
  const [viewingQuestions, setViewingQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  useEffect(() => {
    loadHomeworks();
  }, []);

  const loadHomeworks = async () => {
    setLoading(true);
    try {
      const data = await fetchAllCompletedHomework();
      setHomeworks(data);
      
      // Mark all homework as seen when teacher visits this page
      await markAllHomeworkAsSeen();
      
      // Update local state to reflect all homework as seen
      setHomeworks(prev => prev.map(hw => ({ ...hw, seenByTeacher: true })));
    } catch (error) {
      console.error("Error loading homeworks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (report: HomeworkReport & { studentName?: string; topicIds?: string[] }) => {
    setViewingReport(report);
    setLoadingQuestions(true);
    
    try {
      // Load questions based on topicIds
      if (report.topicIds && report.topicIds.length > 0) {
        const questions = await fetchQuestionsForHomework(report.topicIds);
        setViewingQuestions(questions);
      }
    } catch (error) {
      console.error("Error viewing report:", error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date";
    
    try {
      let date: Date;
      
      if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else {
        date = new Date(timestamp);
      }
      
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date error";
    }
  };

  const unseenCount = homeworks.filter(hw => !hw.seenByTeacher).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-6 mt-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4 glass-card hover:glass-hover min-h-[44px] touch-manipulation active:scale-95 select-none"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          {/* Header */}
          <div className="glass-panel rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500/90 via-purple-600/90 to-indigo-600/90 p-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="glass-surface-dark p-3 rounded-2xl">
                    <BookOpen className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-semibold text-white tracking-tight">
                      All Completed Homework
                    </h1>
                    <p className="text-white/90 text-base mt-1">
                      Review student submissions
                    </p>
                  </div>
                </div>
                {unseenCount > 0 && (
                  <div className="bg-red-500 text-white rounded-full px-4 py-2 font-bold text-lg shadow-lg">
                    {unseenCount} new
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : homeworks.length === 0 ? (
          <div className="glass-panel rounded-3xl overflow-hidden">
            <div className="py-12 text-center px-6">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                No homework submissions yet.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {homeworks.map((homework) => (
              <div
                key={homework.id}
                className={`glass-card rounded-3xl overflow-hidden ${
                  !homework.seenByTeacher ? 'ring-2 ring-red-400' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <User className="h-5 w-5 text-purple-600" />
                        <h3 className="font-bold text-xl text-gray-900">
                          {homework.studentName || "Unknown Student"}
                        </h3>
                        {!homework.seenByTeacher && (
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            NEW
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDate(homework.completedAt)}</span>
                        </div>
                        {homework.score !== undefined && (
                          <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4 text-yellow-600" />
                            <span className="font-bold text-yellow-600">
                              {homework.score}%
                            </span>
                          </div>
                        )}
                        {homework.correctAnswers !== undefined && homework.totalQuestions !== undefined && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="font-medium">
                              {homework.correctAnswers}/{homework.totalQuestions} correct
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleViewReport(homework)}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Trophy className="h-8 w-8" />
                  <div>
                    <h2 className="text-2xl font-bold">{viewingReport.studentName}</h2>
                    <p className="text-blue-100 mt-1">
                      Score: {viewingReport.score}% | {viewingReport.correctAnswers}/{viewingReport.totalQuestions} correct
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setViewingReport(null)}
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingQuestions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : viewingQuestions.length > 0 ? (
                <div className="space-y-6">
                  {viewingQuestions.map((question, index) => {
                    // Get submitted answer for this question
                    const submittedAnswerObj = viewingReport.submittedAnswers?.find(
                      (a: any) => a.questionId === question.id
                    );
                    const submittedAnswer = submittedAnswerObj?.answer;
                    
                    // Check if answer is correct
                    let isCorrect = false;
                    if (submittedAnswer !== undefined && submittedAnswer !== null && submittedAnswer !== "") {
                      if (typeof question.correctAnswer === 'number' && question.options) {
                        const correctOption = question.options[question.correctAnswer];
                        isCorrect = String(submittedAnswer).trim().toLowerCase() === String(correctOption).trim().toLowerCase();
                      } else {
                        isCorrect = String(submittedAnswer).trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
                      }
                    }
                    
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
                                isThisCorrect = optIndex === question.correctAnswer;
                              } else {
                                isThisCorrect = String(question.correctAnswer).trim().toLowerCase() === String(option).trim().toLowerCase();
                              }
                              
                              // Determine if this option was selected by the student
                              let isThisSelected = false;
                              if (submittedAnswer !== undefined && submittedAnswer !== null && submittedAnswer !== "") {
                                const submittedStr = String(submittedAnswer).trim().toLowerCase();
                                const optionStr = String(option).trim().toLowerCase();
                                isThisSelected = submittedStr === optionStr;
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
                                              <Check className="h-4 w-4" /> Student's Answer
                                            </>
                                          ) : (
                                            <>
                                              <X className="h-4 w-4" /> Student's Answer
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
                                  Student's Answer:
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
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">No questions available</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-4 bg-gray-50">
              <div className="flex gap-2 justify-between">
                <div className="text-sm text-gray-600">
                  Completed: {formatDate(viewingReport.completedAt)}
                </div>
                <Button
                  onClick={() => setViewingReport(null)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
