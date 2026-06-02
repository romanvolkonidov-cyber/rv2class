"use client";

import React, { useMemo, useState } from "react";
import { Badge, BADGES, ShopReward, SHOP_REWARDS } from "@/lib/gamification";
import { X } from "lucide-react";

interface BadgeDisplayProps {
  unlockedBadges: string[];
  compact?: boolean;
  purchasedRewards?: string[];
}

type CollectionItem =
  | { kind: "badge"; data: Badge; unlocked: boolean }
  | { kind: "reward"; data: ShopReward };

export default function BadgeDisplay({ unlockedBadges, compact = false, purchasedRewards = [] }: BadgeDisplayProps) {
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);
  const [showAllCompact, setShowAllCompact] = useState(false);
  const unlocked = useMemo(() => BADGES.filter(b => unlockedBadges.includes(b.id)), [unlockedBadges]);
  const purchased = useMemo(
    () => SHOP_REWARDS.filter(r => purchasedRewards.includes(r.id)),
    [purchasedRewards]
  );

  const getSourceLabel = (item: CollectionItem) => {
    if (item.kind === "reward") return `Куплено в магазине за ${item.data.cost} монет`;
    return item.unlocked ? "Получено за успехи в заданиях" : "Пока не получено";
  };

  if (compact) {
    if (unlocked.length === 0 && purchased.length === 0) return null;
    const allItems: CollectionItem[] = [
      ...unlocked.map(data => ({ kind: "badge" as const, data, unlocked: true })),
      ...purchased.map(data => ({ kind: "reward" as const, data })),
    ];
    const compactItems: CollectionItem[] = [
      ...unlocked.slice(0, 5).map(data => ({ kind: "badge" as const, data, unlocked: true })),
      ...purchased.slice(0, 3).map(data => ({ kind: "reward" as const, data })),
    ];
    return (
      <>
        <div className="flex flex-wrap gap-1">
          {compactItems.map(item => (
            <button
              key={`${item.kind}-${item.data.id}`}
              type="button"
              title={`${item.data.name}`}
              onClick={() => setSelectedItem(item)}
              className="text-lg hover:scale-125 transition-transform"
            >
              {item.data.emoji}
            </button>
          ))}
          {(unlocked.length > 5 || purchased.length > 3) && (
            <button
              type="button"
              onClick={() => setShowAllCompact(true)}
              className="text-xs text-gray-500 self-center hover:text-gray-700"
            >
              +{Math.max(0, unlocked.length - 5) + Math.max(0, purchased.length - 3)}
            </button>
          )}
        </div>

        {showAllCompact && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowAllCompact(false)} />
            <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border">
              <button
                type="button"
                onClick={() => setShowAllCompact(false)}
                className="absolute top-3 right-3 p-1 rounded-md hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="font-bold text-gray-900 mb-3">Все достижения и награды</div>
              <div className="flex flex-wrap gap-2">
                {allItems.map(item => (
                  <button
                    key={`all-${item.kind}-${item.data.id}`}
                    type="button"
                    onClick={() => {
                      setShowAllCompact(false);
                      setSelectedItem(item);
                    }}
                    className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700 hover:bg-slate-200"
                  >
                    {item.data.emoji} {item.data.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedItem && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedItem(null)} />
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="absolute top-3 right-3 p-1 rounded-md hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="text-4xl mb-2">{selectedItem.data.emoji}</div>
              <div className="font-bold text-gray-900">{selectedItem.data.name}</div>
              <div className="text-sm text-gray-600 mt-1">
                {selectedItem.kind === "badge" ? selectedItem.data.description : selectedItem.data.description}
              </div>
              <div className="text-xs text-indigo-600 mt-3 font-semibold">
                {getSourceLabel(selectedItem)}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {BADGES.map(badge => {
          const isUnlocked = unlockedBadges.includes(badge.id);
          return (
            <button
              type="button"
              key={badge.id}
              onClick={() => setSelectedItem({ kind: "badge", data: badge, unlocked: isUnlocked })}
              className={`relative rounded-xl p-3 text-center transition-all duration-300 border-2 ${
                isUnlocked
                  ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300 shadow-md hover:shadow-lg hover:scale-105"
                  : "bg-gray-100 border-gray-200 opacity-60 grayscale"
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
            </button>
          );
        })}
      </div>

      {purchased.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-semibold text-gray-600 mb-2">Купленные награды</div>
          <div className="flex flex-wrap gap-2">
            {purchased.map(reward => (
              <button
                type="button"
                key={reward.id}
                onClick={() => setSelectedItem({ kind: "reward", data: reward })}
                title={`${reward.name} • ${reward.cost} монет`}
                className="px-2 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs text-indigo-700 font-medium hover:bg-indigo-100"
              >
                {reward.emoji} {reward.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedItem(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border">
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="absolute top-3 right-3 p-1 rounded-md hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="text-4xl mb-2">{selectedItem.data.emoji}</div>
            <div className="font-bold text-gray-900">{selectedItem.data.name}</div>
            <div className="text-sm text-gray-600 mt-1">
              {selectedItem.kind === "badge" ? selectedItem.data.description : selectedItem.data.description}
            </div>
            <div className="text-xs text-indigo-600 mt-3 font-semibold">
              {getSourceLabel(selectedItem)}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
