"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchStudents, Student } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Loader2, Tag } from "lucide-react";

const TAG_COLORS = {
  red: {
    bg: "bg-red-100 dark:bg-red-900/30",
    border: "border-red-300 dark:border-red-700",
    hover: "hover:bg-red-200 dark:hover:bg-red-900/50",
    text: "text-red-900 dark:text-red-100",
    dot: "bg-red-500",
  },
  orange: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    border: "border-orange-300 dark:border-orange-700",
    hover: "hover:bg-orange-200 dark:hover:bg-orange-900/50",
    text: "text-orange-900 dark:text-orange-100",
    dot: "bg-orange-500",
  },
  yellow: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    border: "border-yellow-300 dark:border-yellow-700",
    hover: "hover:bg-yellow-200 dark:hover:bg-yellow-900/50",
    text: "text-yellow-900 dark:text-yellow-100",
    dot: "bg-yellow-500",
  },
  green: {
    bg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-300 dark:border-green-700",
    hover: "hover:bg-green-200 dark:hover:bg-green-900/50",
    text: "text-green-900 dark:text-green-100",
    dot: "bg-green-500",
  },
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-300 dark:border-blue-700",
    hover: "hover:bg-blue-200 dark:hover:bg-blue-900/50",
    text: "text-blue-900 dark:text-blue-100",
    dot: "bg-blue-500",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    border: "border-purple-300 dark:border-purple-700",
    hover: "hover:bg-purple-200 dark:hover:bg-purple-900/50",
    text: "text-purple-900 dark:text-purple-100",
    dot: "bg-purple-500",
  },
  pink: {
    bg: "bg-pink-100 dark:bg-pink-900/30",
    border: "border-pink-300 dark:border-pink-700",
    hover: "hover:bg-pink-200 dark:hover:bg-pink-900/50",
    text: "text-pink-900 dark:text-pink-100",
    dot: "bg-pink-500",
  },
  gray: {
    bg: "bg-gray-100 dark:bg-gray-900/30",
    border: "border-gray-300 dark:border-gray-700",
    hover: "hover:bg-gray-200 dark:hover:bg-gray-900/50",
    text: "text-gray-900 dark:text-gray-100",
    dot: "bg-gray-500",
  },
};

export default function TagStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const tagColor = params.tagColor as string;
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, [tagColor]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const allStudents = await fetchStudents();
      // Filter students by tag
      const taggedStudents = allStudents.filter((s) => s.tag === tagColor);
      setStudents(taggedStudents);
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = (studentId: string) => {
    router.push(`/student/${studentId}`);
  };

  const colorScheme = TAG_COLORS[tagColor as keyof typeof TAG_COLORS] || TAG_COLORS.gray;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements - Apple-style subtle orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-2xl w-full relative z-10">
        {/* Glass morphism card */}
        <div className="backdrop-blur-2xl bg-white/60 border border-gray-200/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500/90 via-blue-600/90 to-cyan-600/90 p-8">
            <div className="flex items-center justify-center gap-4">
              <div className="backdrop-blur-xl bg-white/20 p-3 rounded-2xl border border-white/30">
                <Users className="h-10 w-10 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-3xl font-semibold text-white tracking-tight">
                  Выберите ваше имя
                </h1>
                <p className="text-white/90 text-base mt-1">
                  Нажмите на своё имя, чтобы продолжить
                </p>
              </div>
            </div>
          </div>
          <div className="pt-8 pb-8 px-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  Нет учеников в этой группе
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {students.map((student) => (
                  <Button
                    key={student.id}
                    size="lg"
                    onClick={() => handleStudentClick(student.id)}
                    className="h-auto py-6 min-h-[64px] bg-white/40 hover:bg-white/60 border border-gray-200/50 hover:border-gray-300/50 text-gray-900 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-100 backdrop-blur-xl touch-manipulation select-none"
                    variant="outline"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="font-bold text-xl">{student.name}</span>
                      {student.teacher && (
                        <span className="text-xs text-gray-600">
                          Учитель: {student.teacher}
                        </span>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
