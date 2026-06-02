"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MessageSquare, Calendar, User } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import { cn } from "@/lib/utils";

interface Feedback {
  id: string;
  rating: number;
  comment: string;
  studentName: string;
  teacherName: string;
  subject: string;
  createdAt: string;
  timestamp: number;
}

interface FeedbackListProps {
  teacherName?: string; // Filter by teacher if provided
  maxFeedbacks?: number; // Default 10
}

export default function FeedbackList({ teacherName, maxFeedbacks = 10 }: FeedbackListProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("📚 Loading feedbacks...", { teacherName, maxFeedbacks });

    // Build query
    const feedbacksRef = collection(db, "feedbacks");
    let q = query(
      feedbacksRef,
      orderBy("timestamp", "desc"),
      limit(maxFeedbacks)
    );

    // Filter by teacher if provided
    if (teacherName) {
      q = query(
        feedbacksRef,
        where("teacherName", "==", teacherName),
        orderBy("timestamp", "desc"),
        limit(maxFeedbacks)
      );
    }

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const feedbackList: Feedback[] = [];
      snapshot.forEach((doc) => {
        feedbackList.push({
          id: doc.id,
          ...doc.data(),
        } as Feedback);
      });

      console.log(`✅ Loaded ${feedbackList.length} feedbacks`);
      setFeedbacks(feedbackList);
      setLoading(false);
    }, (error) => {
      console.error("Error loading feedbacks:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [teacherName, maxFeedbacks]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} мин. назад`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ч. назад`;
    } else if (diffInHours < 48) {
      return "Вчера";
    } else {
      return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 text-sm">
            Пока нет отзывов
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {feedbacks.map((feedback) => (
        <Card 
          key={feedback.id}
          className="hover:shadow-md transition-shadow duration-200 border-l-4"
          style={{
            borderLeftColor: 
              feedback.rating === 5 ? "#10b981" :
              feedback.rating === 4 ? "#3b82f6" :
              feedback.rating === 3 ? "#f59e0b" :
              "#ef4444"
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              {/* Left side - Student info and rating */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {feedback.studentName}
                    </p>
                    <p className="text-xs text-gray-500">
                      для {feedback.teacherName} • {feedback.subject}
                    </p>
                  </div>
                </div>

                {/* Star Rating */}
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "w-4 h-4",
                        star <= feedback.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      )}
                    />
                  ))}
                  <span className="text-sm font-semibold text-gray-700 ml-1">
                    {feedback.rating === 5 && "Отлично"}
                    {feedback.rating === 4 && "Хорошо"}
                    {feedback.rating === 3 && "Нормально"}
                    {feedback.rating === 2 && "Слабо"}
                    {feedback.rating === 1 && "Плохо"}
                  </span>
                </div>

                {/* Comment */}
                {feedback.comment && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    "{feedback.comment}"
                  </p>
                )}

                {/* Date */}
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  {formatDate(feedback.createdAt)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
