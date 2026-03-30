"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Users, BookOpen, Calendar, Play, User, X, LogIn, MessageSquare } from "lucide-react";
import { db, countUnseenHomework } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import FeedbackList from "@/components/FeedbackList";

interface ActiveRoom {
  name: string;
  numParticipants: number;
  teacher: string;
}

export default function Home() {
  const router = useRouter();
  const [showTeacherSelect, setShowTeacherSelect] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<"Roman" | "Violet" | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [unseenHomeworkCount, setUnseenHomeworkCount] = useState<number>(0);

  const handleTeacherSelect = async (teacher: "Roman" | "Violet") => {
    setSelectedTeacher(teacher);
    setIsStarting(true);
    
    try {
      const teacherKey = teacher.toLowerCase(); // "roman" or "violet"
      
      // Both Roman and Violet use Zoom (managed by Zoom waiting room)
      if (teacherKey === "roman") {
        console.log(`🎥 Redirecting Roman to Zoom`);
        window.location.href = "https://us05web.zoom.us/j/7287155245?pwd=WS9TVDJWOTZpOTFxVFlxeGZwblJKUT09";
        return;
      }
      
      if (teacherKey === "violet") {
        console.log(`🎥 Redirecting Violet to Zoom`);
        window.location.href = "https://zoom.us/j/3429476489?pwd=dXBVVGdGKzRCaFRNS0tmLzBsWmdvdz09";
        return;
      }
      
      // For any future teachers, we would add their Zoom links here
      console.log(`🚀 Teacher ${teacher} selected, but no Zoom link configured.`);
      alert(`Meeting link for ${teacher} is not configured yet.`);
      setIsStarting(false);
    } catch (error) {
      console.error("Error starting lesson:", error);
      alert("Failed to start lesson. Please try again.");
      setIsStarting(false);
    }
  };

  const handleBack = () => {
    setShowTeacherSelect(false);
    setSelectedTeacher(null);
  };

  // Load unseen homework count
  useEffect(() => {
    const loadUnseenCount = async () => {
      const count = await countUnseenHomework();
      setUnseenHomeworkCount(count);
    };
    loadUnseenCount();
  }, []);

  const rejoinRoom = (roomName: string, teacher: string) => {
    const teacherName = teacher.charAt(0).toUpperCase() + teacher.slice(1); // "roman" -> "Roman"
    router.push(`/room?room=${roomName}&name=${teacherName}&isTutor=true&subject=English`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            RV2Class
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Professional Teaching Platform
          </p>
        </div>

        <div className="mb-8">
          <Card className="backdrop-blur-sm bg-gradient-to-br from-blue-500 to-purple-600 border-0 shadow-2xl hover:shadow-3xl transition-all duration-300">
            <CardContent className="p-8">
              {!showTeacherSelect ? (
                <Button
                  size="lg"
                  onClick={() => setShowTeacherSelect(true)}
                  className="w-full h-auto py-8 bg-white hover:bg-gray-50 text-blue-600 text-2xl font-bold shadow-xl hover:scale-105 transition-all duration-300 group"
                  disabled={isStarting}
                >
                  <Play className="h-12 w-12 mr-4 group-hover:scale-110 transition-transform" />
                  <div className="flex flex-col items-start">
                    <span>Start a Lesson</span>
                    <span className="text-sm font-normal text-gray-500 mt-1">
                      Begin teaching session immediately
                    </span>
                  </div>
                </Button>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-white text-xl font-semibold text-center mb-4">
                    Select Teacher
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      size="lg"
                      onClick={() => handleTeacherSelect("Roman")}
                      className="h-auto py-6 bg-white hover:bg-gray-50 text-blue-600 font-bold shadow-lg hover:scale-105 transition-all duration-300 group"
                      disabled={isStarting}
                    >
                      <User className="h-8 w-8 mr-3 group-hover:scale-110 transition-transform" />
                      <div className="flex flex-col items-start">
                        <span className="text-lg">Roman</span>
                        <span className="text-xs font-normal text-gray-500">Start as Roman</span>
                      </div>
                    </Button>
                    <Button
                      size="lg"
                      onClick={() => handleTeacherSelect("Violet")}
                      className="h-auto py-6 bg-white hover:bg-gray-50 text-purple-600 font-bold shadow-lg hover:scale-105 transition-all duration-300 group"
                      disabled={isStarting}
                    >
                      <User className="h-8 w-8 mr-3 group-hover:scale-110 transition-transform" />
                      <div className="flex flex-col items-start">
                        <span className="text-lg">Violet</span>
                        <span className="text-xs font-normal text-gray-500">Start as Violet</span>
                      </div>
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="w-full text-white hover:text-white hover:bg-white/10"
                    disabled={isStarting}
                  >
                    {isStarting ? "Starting..." : "Cancel"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/students")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-6 w-6 text-blue-600" />
                Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View and manage all registered students
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 hover:shadow-lg transition-shadow cursor-pointer relative" onClick={() => router.push("/teacher/homeworks")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-6 w-6 text-green-600" />
                Homework
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Review completed homework submissions
              </p>
            </CardContent>
            {unseenHomeworkCount > 0 && (
              <div className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                {unseenHomeworkCount}
              </div>
            )}
          </Card>

          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/schedule")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage your teaching schedule
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Feedbacks Section */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Последние отзывы
            </h2>
          </div>
          <FeedbackList maxFeedbacks={10} />
        </div>

        <div className="mt-8 p-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-600" />
            Quick Tips
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Click "Start a Lesson" to begin teaching immediately</li>
            <li>• Students can join via their personalized links</li>
            <li>• You can approve student join requests during the session</li>
            <li>• Use the whiteboard and screen sharing tools during lessons</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
