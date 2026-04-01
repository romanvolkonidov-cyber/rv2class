"use client";

import React, { useState } from "react";
import { X, Coins } from "lucide-react";
import {
  PetNeeds,
  cleanPet,
  feedPet,
  playWithPet,
  PET_FOODS,
  PET_DRINKS,
  PET_TOYS,
  getHappyEmoji,
  GameProfile,
  giveDrinkToPet,
} from "@/lib/gamification";
import { playSound } from "@/lib/audioSystem";

type NeedType = "poop" | "hunger" | "boredom" | "thirst";

interface PetCarePopoverProps {
  needType: NeedType;
  needs: PetNeeds;
  profile: GameProfile;
  onProfileUpdate: (profile: GameProfile) => void;
  onClose: () => void;
  onHappyReaction: (emoji: string) => void;
}

export default function PetCarePopover({
  needType,
  needs,
  profile,
  onProfileUpdate,
  onClose,
  onHappyReaction,
}: PetCarePopoverProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClean = async () => {
    setLoading(true);
    setError(null);
    const result = await cleanPet(profile.studentId);
    if (result.success && result.profile) {
      onProfileUpdate(result.profile);
      playSound("petCare");
      onHappyReaction(getHappyEmoji(1));
      onClose();
    } else {
      setError(result.error || "Ошибка");
    }
    setLoading(false);
  };

  const handleFeed = async (foodId: string) => {
    setLoading(true);
    setError(null);
    const result = await feedPet(profile.studentId, foodId);
    if (result.success && result.profile) {
      onProfileUpdate(result.profile);
      playSound("petCare");
      onHappyReaction(getHappyEmoji(result.happiness || 1));
      onClose();
    } else {
      setError(result.error || "Ошибка");
    }
    setLoading(false);
  };

  const handleDrink = async (drinkId: string) => {
    setLoading(true);
    setError(null);
    const result = await giveDrinkToPet(profile.studentId, drinkId);
    if (result.success && result.profile) {
      onProfileUpdate(result.profile);
      playSound("petCare");
      onHappyReaction(getHappyEmoji(result.happiness || 1));
      onClose();
    } else {
      setError(result.error || "Ошибка");
    }
    setLoading(false);
  };

  const handlePlay = async (toyId: string) => {
    setLoading(true);
    setError(null);
    const result = await playWithPet(profile.studentId, toyId);
    if (result.success && result.profile) {
      onProfileUpdate(result.profile);
      playSound("petCare");
      onHappyReaction(getHappyEmoji(result.happiness || 1));
      onClose();
    } else {
      setError(result.error || "Ошибка");
    }
    setLoading(false);
  };

  return (
    <div className="absolute bottom-full right-0 mb-3 z-50 w-64 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className={`px-4 py-3 flex items-center justify-between ${
          needType === "poop" ? "bg-amber-50" : needType === "hunger" ? "bg-orange-50" : needType === "thirst" ? "bg-cyan-50" : "bg-blue-50"
        }`}>
          <span className="text-sm font-bold text-slate-800">
            {needType === "poop" && `💩 Убрать за питомцем? (${needs.poopCount})`}
            {needType === "hunger" && "🍽️ Питомец голоден!"}
            {needType === "thirst" && "💧 Питомец хочет пить!"}
            {needType === "boredom" && "😐 Питомцу скучно!"}
          </span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black/10 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center font-medium">
              {error}
            </div>
          )}

          {needType === "poop" && (
            <button
              onClick={handleClean}
              disabled={loading}
              className="w-full flex items-center justify-between bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl px-4 py-3 transition-colors disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">🧹</span>
                <span className="text-sm font-semibold text-slate-800">Убрать</span>
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 rounded-full px-2 py-1">
                <Coins className="h-3 w-3" /> 2
              </span>
            </button>
          )}

          {needType === "hunger" && (
            <div className="space-y-1.5">
              <p className="text-xs text-slate-500 font-medium px-1">Выбери еду:</p>
              {PET_FOODS.map(food => (
                <button
                  key={food.id}
                  onClick={() => handleFeed(food.id)}
                  disabled={loading || profile.shopCoins < food.cost}
                  className="w-full flex items-center justify-between bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl px-4 py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{food.emoji}</span>
                    <span className="text-sm font-semibold text-slate-800">{food.name}</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-100 rounded-full px-2 py-1">
                    <Coins className="h-3 w-3" /> {food.cost}
                  </span>
                </button>
              ))}
            </div>
          )}

          {needType === "thirst" && (
            <div className="space-y-1.5">
              <p className="text-xs text-slate-500 font-medium px-1">Дай попить:</p>
              {PET_DRINKS.map(drink => (
                <button
                  key={drink.id}
                  onClick={() => handleDrink(drink.id)}
                  disabled={loading || profile.shopCoins < drink.cost}
                  className="w-full flex items-center justify-between bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-xl px-4 py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{drink.emoji}</span>
                    <span className="text-sm font-semibold text-slate-800">{drink.name}</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-cyan-700 bg-cyan-100 rounded-full px-2 py-1">
                    <Coins className="h-3 w-3" /> {drink.cost}
                  </span>
                </button>
              ))}
            </div>
          )}

          {needType === "boredom" && (
            <div className="space-y-1.5">
              <p className="text-xs text-slate-500 font-medium px-1">Выбери игрушку:</p>
              {PET_TOYS.map(toy => (
                <button
                  key={toy.id}
                  onClick={() => handlePlay(toy.id)}
                  disabled={loading || profile.shopCoins < toy.cost}
                  className="w-full flex items-center justify-between bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl px-4 py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{toy.emoji}</span>
                    <span className="text-sm font-semibold text-slate-800">{toy.name}</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100 rounded-full px-2 py-1">
                    <Coins className="h-3 w-3" /> {toy.cost}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Coin balance footer */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 pt-1 border-t border-slate-100">
            <Coins className="h-3 w-3" />
            <span>У тебя: <span className="font-bold text-slate-600">{profile.shopCoins}</span> монет</span>
          </div>
        </div>
      </div>

      {/* Triangle pointer */}
      <div className="absolute right-6 -bottom-2 w-4 h-4 bg-white border-b border-r border-slate-200 rotate-45" />
    </div>
  );
}
