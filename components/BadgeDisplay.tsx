"use client";

import React from "react";
import { Badge, BADGES } from "@/lib/gamification";

interface BadgeDisplayProps {
  unlockedBadges: string[];
  compact?: boolean;
}

export default function BadgeDisplay({ unlockedBadges, compact = false }: BadgeDisplayProps) {
  if (compact) {
    // Show only unlocked badges in a row
    const unlocked = BADGES.filter(b => unlockedBadges.includes(b.id));
    if (unlocked.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1">
        {unlocked.slice(0, 5).map(badge => (
          <span
            key={badge.id}
            title={`${badge.name}: ${badge.description}`}
            className="text-lg cursor-default hover:scale-125 transition-transform"
          >
            {badge.emoji}
          </span>
        ))}
        {unlocked.length > 5 && (
          <span className="text-xs text-gray-500 self-center">+{unlocked.length - 5}</span>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {BADGES.map(badge => {
        const isUnlocked = unlockedBadges.includes(badge.id);
        return (
          <div
            key={badge.id}
            className={`relative rounded-xl p-3 text-center transition-all duration-300 border-2 ${
              isUnlocked
                ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300 shadow-md hover:shadow-lg hover:scale-105"
                : "bg-gray-100 border-gray-200 opacity-50 grayscale"
            }`}
          >
            <div className={`text-3xl mb-1 ${isUnlocked ? "animate-bounce-gentle" : ""}`}>
              {badge.emoji}
            </div>
            <div className={`text-xs font-bold ${isUnlocked ? "text-gray-900" : "text-gray-500"}`}>
              {badge.name}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">
              {badge.description}
            </div>
            {isUnlocked && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-[10px]">✓</span>
              </div>
            )}
          </div>
        );
      })}

      <style jsx>{`
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
