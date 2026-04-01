"use client";

import React, { useState, useEffect } from 'react';
import { X, Trophy, Star, Medal, TrendingUp } from 'lucide-react';
import { fetchAllStudentRatings } from '@/lib/firebase';
import { getGameProfile, getLevelForXP, getLeagueForLevel, LeagueInfo, LEAGUES } from '@/lib/gamification';
import StudentProfileModal from './StudentProfileModal';

interface StudentRating {
  studentId: string;
  studentName: string;
  rank: number;
  overallRating: number;
  averagePercentage: number;
  completedHomeworks: number;
  totalAssigned: number;
  level: number;
  league: LeagueInfo;
}

interface StudentLeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudentId: string;
  teacherKey?: string;
}

const StudentLeaderboard: React.FC<StudentLeaderboardProps> = ({
  isOpen,
  onClose,
  currentStudentId,
  teacherKey
}) => {
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<StudentRating[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (isOpen && ratings.length === 0) {
      loadLeaderboard();
    }
  }, [isOpen]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      console.log("📊 Fetching all student ratings for leaderboard...");
      const allRatings = await fetchAllStudentRatings();
      
      // Filter out students who have never completed any homework or are test accounts
      const filteredRatings = allRatings.filter((rating: any) => 
        rating.completedHomeworks && 
        rating.completedHomeworks > 0 && 
        rating.studentName?.toLowerCase() !== "testingg"
      );
      
      // Fetch game profiles for all filtered students to get their Level and League
      const profilesData = await Promise.all(
        filteredRatings.map(async (r: any) => {
          try {
            const profile = await getGameProfile(r.studentId);
            return { studentId: r.studentId, profile };
          } catch (e) {
            return { studentId: r.studentId, profile: null };
          }
        })
      );
      const profileMap = new Map(profilesData.map(p => [p.studentId, p.profile]));
      
      const ratingsWithLeagues = filteredRatings.map((rating: any) => {
        const profile = profileMap.get(rating.studentId);
        const levelObj = profile ? getLevelForXP(profile.xp) : { level: 1 };
        const league = getLeagueForLevel(levelObj.level);
        return {
          ...rating,
          level: levelObj.level,
          league
        };
      });

      // Sort by average percentage (descending) within their leagues
      const sortedRatings = ratingsWithLeagues.sort((a: any, b: any) => b.averagePercentage - a.averagePercentage);
      sortedRatings.forEach((rating: any, index: number) => {
        rating.rank = index + 1;
      });

      setRatings(sortedRatings);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  const getRankBadgeStyle = (rank: number): string => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 shadow-lg shadow-yellow-500/30';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-gray-900 shadow-lg shadow-gray-500/30';
    if (rank === 3) return 'bg-gradient-to-r from-amber-400 to-amber-600 text-amber-900 shadow-lg shadow-amber-500/30';
    return 'bg-gray-200 text-gray-700';
  };

  const getCardStyle = (rank: number, isCurrentStudent: boolean): string => {
    let baseStyle = 'backdrop-blur-xl border rounded-xl p-4 transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-lg';
    
    if (isCurrentStudent) {
      return baseStyle + ' bg-gradient-to-r from-indigo-50/90 to-blue-50/90 border-indigo-300 shadow-md ring-2 ring-indigo-400/50';
    } 
    return baseStyle + ' bg-white/60 border-gray-200 hover:border-gray-300';
  };

  // Group ratings by League
  const leaguesMap = new Map<string, StudentRating[]>();
  ratings.forEach(r => {
    if (!leaguesMap.has(r.league.id)) leaguesMap.set(r.league.id, []);
    leaguesMap.get(r.league.id)!.push(r);
  });
  
  // Display all leagues from highest to lowest
  const displayLeagues = [...LEAGUES].reverse();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-yellow-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Modal content */}
      <div className="relative w-full max-w-4xl max-h-[95vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">🏆 Рейтинг учеников</h2>
                <p className="text-amber-100 mt-1">Сравни свои результаты с другими</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Загрузка рейтинга...</p>
              </div>
            </div>
          ) : ratings.length > 0 ? (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Общий рейтинг (Лиги)</h3>
                <p className="text-gray-600 text-sm">Ученики разделены по лигам на основе их уровня XP</p>
              </div>

              {displayLeagues.map(leagueInfo => {
                const leagueId = leagueInfo.id;
                const leagueRatings = leaguesMap.get(leagueId) || [];
                
                return (
                  <div key={leagueId} className="mb-8">
                    {/* League Header */}
                    <div className="flex items-center gap-3 mb-4 px-2">
                      <span className="text-4xl drop-shadow-md">{leagueInfo.emoji}</span>
                      <div className="flex-1">
                        <h3 className={`text-xl font-bold tracking-wide uppercase ${leagueInfo.color}`}>
                          {leagueInfo.name}
                        </h3>
                        <div className="h-0.5 w-full bg-gradient-to-r from-gray-200 to-transparent mt-1" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {leagueRatings.length === 0 ? (
                        <div className="bg-white/40 border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500 text-sm">
                          Пока никто не достиг этой лиги
                        </div>
                      ) : (
                        leagueRatings.map((rating, index) => {
                          const isCurrentStudent = rating.studentId === currentStudentId;
                          // Within a league, rank #1 gets gold badge, #2 silver, #3 bronze
                          const localRank = index + 1;
                          const medalEmoji = getMedalEmoji(localRank);

                          return (
                            <div 
                              key={rating.studentId} 
                            className={`${getCardStyle(localRank, isCurrentStudent)} cursor-pointer group/row`}
                            onClick={() => setSelectedStudent({ id: rating.studentId, name: rating.studentName })}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                {/* Rank within League */}
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${getRankBadgeStyle(localRank)}`}>
                                  {medalEmoji || `#${localRank}`}
                                </div>

                                {/* Student Info */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`font-semibold text-lg ${isCurrentStudent ? "text-indigo-900" : "text-gray-900"} group-hover/row:text-indigo-600 transition-colors`}>
                                      {rating.studentName}
                                    </span>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                                      Lv.{rating.level}
                                    </span>
                                    {isCurrentStudent && (
                                      <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full font-medium shadow-sm">
                                        Это ты!
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Stats */}
                                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Star className="h-3.5 w-3.5 text-amber-500" />
                                      {rating.completedHomeworks}/{rating.totalAssigned} выполнено
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                                      Успешность: {((rating.completedHomeworks / rating.totalAssigned) * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                </div>

                                {/* Score */}
                                <div className="text-right">
                                  <div className="text-xl font-bold text-gray-800">
                                    {rating.averagePercentage.toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium">Нет данных для отображения</p>
              <p className="text-gray-500 text-sm mt-2">
                Выполните домашние задания, чтобы увидеть рейтинг
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50/80 p-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Medal className="h-4 w-4" />
              <span>Медали: 🥇 🥈 🥉 для топ-3</span>
            </div>
            <span>Обновлено: {new Date().toLocaleTimeString('ru-RU')}</span>
          </div>
        </div>

        {/* Profile Modal */}
        {selectedStudent && (
          <StudentProfileModal
            isOpen={!!selectedStudent}
            onClose={() => setSelectedStudent(null)}
            studentId={selectedStudent.id}
            studentName={selectedStudent.name}
          />
        )}
      </div>
    </div>
  );
};

export default StudentLeaderboard;