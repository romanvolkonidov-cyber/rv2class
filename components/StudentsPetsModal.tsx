"use client";

import React, { useState, useEffect } from "react";
import { X, PawPrint, Loader2 } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db, fetchStudents, Student } from "@/lib/firebase";
import { GameProfile, getPetNeeds, PetNeeds } from "@/lib/gamification";
import PetAvatar from "./PetAvatar";
import StudentProfileModal from "./StudentProfileModal";

interface StudentsPetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StudentsPetsModal({ isOpen, onClose }: StudentsPetsModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ profile: GameProfile; studentName: string; needs: PetNeeds }[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProfiles();
    }
  }, [isOpen]);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      // 1. Fetch all students to get names
      const students = await fetchStudents();
      const studentMap = new Map<string, string>();
      students.forEach(s => studentMap.set(s.id, s.name));

      // 2. Fetch all game profiles
      const snapshot = await getDocs(collection(db, "studentGameProfiles"));
      const profiles: any[] = [];
      snapshot.forEach(doc => {
        profiles.push({ studentId: doc.id, ...doc.data() });
      });

      // 3. Combine and transform
      const result = profiles
        .filter(p => !!p.petId && studentMap.has(p.studentId)) // Only students with active pets
        .map(p => ({
          profile: p as GameProfile,
          studentName: studentMap.get(p.studentId) || "Ученик",
          needs: getPetNeeds(p as GameProfile)
        }))
        .filter(item => item.studentName.toLowerCase() !== "testingg")
        // Sort by needs descending (pets that need most care first) or alphabetically
        .sort((a, b) => {
           const needsA = (a.needs.poopCount > 0 ? 1 : 0) + (a.needs.isHungry ? 1 : 0) + (a.needs.isBored ? 1 : 0) + (a.needs.isThirsty ? 1 : 0);
           const needsB = (b.needs.poopCount > 0 ? 1 : 0) + (b.needs.isHungry ? 1 : 0) + (b.needs.isBored ? 1 : 0) + (b.needs.isThirsty ? 1 : 0);
           if (needsB !== needsA) return needsB - needsA;
           return a.studentName.localeCompare(b.studentName);
        });

      setData(result);
    } catch (err) {
      console.error("Error loading pets data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-5xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 shrink-0 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <PawPrint className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Животные учеников</h2>
                <p className="text-indigo-100 text-sm mt-1">Посмотри на питомцев своих друзей</p>
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
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              <p className="text-indigo-900/60 font-medium">Загружаем питомцев...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-6xl mb-4">🐾</span>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Пока нет питомцев</h3>
              <p className="text-slate-500">Ученики еще не выбрали своих питомцев.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {data.map(({ profile, studentName, needs }) => {
                const totalNeeds = (needs.poopCount > 0 ? 1 : 0) + (needs.isHungry ? 1 : 0) + (needs.isBored ? 1 : 0) + (needs.isThirsty ? 1 : 0);
                
                return (
                  <div 
                    key={profile.studentId}
                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative flex flex-col items-center justify-between text-center min-h-[220px]"
                    onClick={() => setSelectedStudent({ id: profile.studentId, name: studentName })}
                  >
                    {/* Pet Needs Overlay */}
                    <div className="absolute top-2 right-2 flex flex-col gap-2 z-20">
                      {needs.poopCount > 0 && <span className="text-2xl bg-white/90 rounded-full w-10 h-10 flex items-center justify-center shadow-md animate-bounce" style={{animationDuration: '3s'}} title="Нужна уборка">💩</span>}
                      {needs.isHungry && <span className="text-2xl bg-white/90 rounded-full w-10 h-10 flex items-center justify-center shadow-md animate-pulse" title="Голоден">🍽️</span>}
                      {needs.isThirsty && <span className="text-2xl bg-white/90 rounded-full w-10 h-10 flex items-center justify-center shadow-md animate-pulse" title="Хочет пить">💧</span>}
                      {needs.isBored && <span className="text-2xl bg-white/90 rounded-full w-10 h-10 flex items-center justify-center shadow-md animate-pulse" title="Скучно">😐</span>}
                    </div>

                    <div className="relative mb-4 flex-1 flex items-center justify-center">
                      <PetAvatar 
                        petId={profile.petId!}
                        accessories={profile.petAccessories}
                        vehicleId={profile.equippedVehicle}
                        backgroundId={profile.equippedBackground}
                        size="md"
                        className={`rounded-xl transition-transform group-hover:scale-105 duration-300 ${totalNeeds === 0 ? "drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]" : ""}`}
                      />
                    </div>

                    <div className="w-full mt-auto">
                      <h3 className="font-bold text-slate-800 truncate px-2">{studentName}</h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium bg-slate-100/80 mx-2 py-1 rounded-md">
                        {totalNeeds === 0 ? "Счастлив 💖" : "Требует ухода 🥺"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedStudent && (
        <StudentProfileModal
          isOpen={true}
          onClose={() => setSelectedStudent(null)}
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
        />
      )}
    </div>
  );
}
