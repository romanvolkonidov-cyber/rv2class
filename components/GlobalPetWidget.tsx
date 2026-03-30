"use client";

import { useEffect, useState } from "react";
import { GameProfile, getLevelForXP } from "@/lib/gamification";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import PetAvatar from "./PetAvatar";

interface GlobalPetWidgetProps {
  studentId: string;
}

export default function GlobalPetWidget({ studentId }: GlobalPetWidgetProps) {
  const [profile, setProfile] = useState<GameProfile | null>(null);

  useEffect(() => {
    if (!studentId) return;
    
    // Subscribe to real-time GameProfile updates
    const unsubscribe = onSnapshot(doc(db, "studentGameProfiles", studentId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as GameProfile;
        setProfile(data);
      }
    });

    return () => unsubscribe();
  }, [studentId]);

  // If no profile or no pet is chosen yet, don't show the widget
  if (!profile || !profile.petId) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 pointer-events-auto flex flex-col items-end justify-end group">
      {/* Tooltip that shows on hover using Tailwind group-hover */}
      <div className="mb-4 mr-2 bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl shadow-xl border border-indigo-100 dark:border-indigo-900 pointer-events-none w-max max-w-[200px] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 relative">
        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
          Level {getLevelForXP(profile.xp).level} Pet
        </p>
        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
          "Let's learn together!"
        </p>
        {/* Speech bubble pointer */}
        <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white dark:bg-gray-800 border-b border-r border-indigo-100 dark:border-indigo-900 transform rotate-45" />
      </div>

      <div className="cursor-pointer">
        <PetAvatar 
          petId={profile.petId} 
          accessories={profile.petAccessories || []} 
          size="sm" 
          className="shadow-xl ring-4 ring-indigo-50/50 hover:scale-110 transition-transform duration-300"
        />
      </div>
    </div>
  );
}
