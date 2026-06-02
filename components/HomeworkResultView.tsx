"use client";

import React from "react";
import {
  Trophy,
  X,
  Check,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeworkAssignment, HomeworkReport, Question } from "@/lib/firebase";

interface HomeworkResultViewProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: HomeworkAssignment | null;
  report: HomeworkReport | null;
  resultsQuestions: Question[];
  themeVisual: {
    buttonGradient: string;
  };
}

export default function HomeworkResultView({
  isOpen,
  onClose,
  assignment,
  report,
  resultsQuestions,
  themeVisual,
}: HomeworkResultViewProps) {
  if (!isOpen || !assignment) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 text-white" style={{ background: themeVisual.buttonGradient }}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <Trophy className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-2xl font-bold truncate">Homework Results</h2>
                <p className="text-blue-100 mt-1 text-sm sm:text-base truncate">
                  {assignment.topicName || "Homework"} - Score: {report?.score}% 
                  ({report?.correctAnswers ?? 0} / {report?.totalQuestions ?? 0} correct)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          {resultsQuestions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading questions...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {resultsQuestions.map((question, index) => {
                const submittedAnswer = report?.submittedAnswers?.find(
                  (ans: any) => ans.questionId === question.id
                )?.answer;

                const isCorrect = (() => {
                  if (typeof question.correctAnswer === 'number' && question.options) {
                    return question.options[question.correctAnswer] === submittedAnswer;
                  }
                  return question.correctAnswer === submittedAnswer;
                })();

                return (
                  <div key={question.id} className="border-b pb-8 last:border-0">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {question.text}
                        </h3>
                        {question.sentence && (
                          <p className="text-gray-600 mt-2 italic">
                            "{question.sentence}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Options / Answer */}
                    {question.options && question.options.length > 0 ? (
                      <div className="grid gap-3 ml-12">
                        {question.options.map((option, optIndex) => {
                          const isThisSelected = option === submittedAnswer;
                          const isThisCorrect = typeof question.correctAnswer === 'number' 
                            ? optIndex === question.correctAnswer 
                            : option === question.correctAnswer;

                          let bgColor = 'bg-gray-50 border-gray-200';
                          let icon = null;

                          if (isThisSelected && isThisCorrect) {
                            bgColor = 'bg-green-100 border-green-400 text-green-800';
                            icon = <Check className="h-5 w-5 text-green-600" />;
                          } else if (isThisSelected && !isThisCorrect) {
                            bgColor = 'bg-red-100 border-red-400 text-red-800';
                            icon = <XCircle className="h-5 w-5 text-red-600" />;
                          } else if (isThisCorrect) {
                            bgColor = 'bg-green-50 border-green-400 text-green-700 opacity-60';
                          }

                          return (
                            <div
                              key={optIndex}
                              className={`p-4 rounded-xl border-2 flex items-center justify-between ${bgColor}`}
                            >
                              <span className="font-medium">{option}</span>
                              {icon}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="ml-12 space-y-4">
                        <div className={`p-4 rounded-xl border-2 ${
                          isCorrect ? 'bg-green-100 border-green-400 text-green-800' : 'bg-red-100 border-red-400 text-red-800'
                        }`}>
                          <div className="text-sm font-semibold mb-1">Your Answer:</div>
                          <div className="font-bold flex items-center gap-2">
                            {submittedAnswer || "(No answer)"}
                            {isCorrect ? <Check className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
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
                      <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 ml-12">
                        <div className="text-sm font-bold text-amber-800 mb-1 flex items-center gap-2">
                          💡 Explanation:
                        </div>
                        <div className="text-gray-700 text-sm leading-relaxed">
                          {question.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 sm:p-6 bg-gray-50 flex justify-end">
          <Button
            onClick={onClose}
            className="w-full sm:w-auto px-12 py-6 text-lg font-bold text-white shadow-lg"
            style={{ background: themeVisual.buttonGradient }}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
