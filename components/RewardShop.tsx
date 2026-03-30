"use client";

import React, { useState } from "react";
import { ShopReward, SHOP_REWARDS, purchaseReward, equipReward, GameProfile } from "@/lib/gamification";
import { playSound } from "@/lib/audioSystem";
import { X, ShoppingBag, Check, Coins } from "lucide-react";

interface RewardShopProps {
  isOpen: boolean;
  onClose: () => void;
  profile: GameProfile;
  onProfileUpdate: (profile: GameProfile) => void;
}

export default function RewardShop({ isOpen, onClose, profile, onProfileUpdate }: RewardShopProps) {
  const [buying, setBuying] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchase = async (reward: ShopReward) => {
    setBuying(reward.id);
    setMessage(null);
    const result = await purchaseReward(profile.studentId, reward.id);
    if (result.success && result.profile) {
      onProfileUpdate(result.profile);
      setMessage(`🎉 Куплено: ${reward.name}`);
      playSound("purchase");
    } else {
      setMessage(`❌ ${result.error}`);
    }
    setBuying(null);
  };

  const handleEquip = async (reward: ShopReward) => {
    let currentEquipped;
    if (reward.type === "theme") currentEquipped = profile.equippedTheme;
    else if (reward.type === "frame") currentEquipped = profile.equippedFrame;
    else if (reward.type === "title") currentEquipped = profile.equippedTitle;
    else if (reward.type === "accessory") currentEquipped = (profile.petAccessories || []).includes(reward.id) ? reward.id : null;

    const newValue = currentEquipped === reward.id ? null : reward.id;
    const valueToPersist = reward.type === "accessory" ? reward.id : newValue;
    await equipReward(profile.studentId, valueToPersist, reward.type);

    // Update local profile
    const updated = { ...profile };
    if (reward.type === "theme") updated.equippedTheme = newValue;
    if (reward.type === "frame") updated.equippedFrame = newValue;
    if (reward.type === "title") updated.equippedTitle = newValue;
    if (reward.type === "accessory") {
      const currentAccs = [...(updated.petAccessories || [])];
      if (newValue === null) {
        updated.petAccessories = currentAccs.filter(id => id !== reward.id);
      } else {
        const sameSlotIds = SHOP_REWARDS
          .filter(r => r.type === "accessory" && r.slot === reward.slot && r.id !== reward.id)
          .map(r => r.id);
        updated.petAccessories = [
          ...currentAccs.filter(id => !sameSlotIds.includes(id)),
          reward.id
        ];
      }
    }
    onProfileUpdate(updated);
    if (newValue === null) {
      setMessage(`✅ Снято: ${reward.name}`);
    } else if (reward.type === "accessory" && !profile.petId) {
      setMessage(`✅ Надето: ${reward.name}. Выбери питомца, чтобы видеть аксессуар.`);
    } else {
      setMessage(`✅ Надето: ${reward.name}`);
    }
  };

  const groupedRewards: Record<string, ShopReward[]> = {
    theme: SHOP_REWARDS.filter(r => r.type === "theme"),
    accessory: SHOP_REWARDS.filter(r => r.type === "accessory"),
    frame: SHOP_REWARDS.filter(r => r.type === "frame"),
    title: SHOP_REWARDS.filter(r => r.type === "title"),
  };

  const typeLabels: Record<string, string> = {
    theme: "🎨 Темы",
    accessory: "🐾 Аксессуары питомца",
    frame: "✨ Рамки",
    title: "📝 Титулы",
  };
  const slotLabels: Record<NonNullable<ShopReward["slot"]>, string> = {
    head: "Голова",
    face: "Лицо",
    neck: "Шея",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-7 w-7" />
              <div>
                <h2 className="text-xl font-bold">Магазин наград</h2>
                <p className="text-amber-100 text-sm">Покупай улучшения за монеты</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5">
                <Coins className="h-4 w-4 text-yellow-200" />
                <span className="font-bold">{profile.shopCoins}</span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mx-4 mt-4 p-3 rounded-lg text-center font-semibold text-sm ${
            message.startsWith("❌") ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
          }`}>
            {message}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto p-4 max-h-[65vh] space-y-6">
          {Object.entries(groupedRewards).map(([type, rewards]) => (
            <div key={type}>
              <h3 className="text-lg font-bold text-gray-800 mb-3">{typeLabels[type]}</h3>
              {type === "accessory" && (
                <div className="text-xs text-gray-500 -mt-2 mb-3">Можно надеть только 1 аксессуар на каждый слот.</div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {rewards.map(reward => {
                  const isPurchased = profile.purchasedRewards.includes(reward.id);
                  const isEquipped =
                    (reward.type === "theme" && profile.equippedTheme === reward.id) ||
                    (reward.type === "frame" && profile.equippedFrame === reward.id) ||
                    (reward.type === "title" && profile.equippedTitle === reward.id) ||
                    (reward.type === "accessory" && (profile.petAccessories || []).includes(reward.id));
                  const canAfford = profile.shopCoins >= reward.cost;

                  return (
                    <div
                      key={reward.id}
                      className={`rounded-xl border-2 p-3 transition-all ${
                        isEquipped
                          ? "border-amber-400 bg-amber-50 shadow-md"
                          : isPurchased
                          ? "border-green-300 bg-green-50"
                          : canAfford
                          ? "border-gray-200 bg-white hover:border-amber-300 hover:shadow-md"
                          : "border-gray-200 bg-gray-50 opacity-60"
                      }`}
                    >
                      <div className="text-center">
                        <span className="text-2xl">{reward.emoji}</span>
                        <div className="font-semibold text-sm mt-1 text-gray-900">{reward.name}</div>
                        <div className="text-[11px] text-gray-500">{reward.description}</div>
                        {reward.type === "accessory" && reward.slot && (
                          <div className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            Слот: {slotLabels[reward.slot]}
                          </div>
                        )}
                      </div>

                      <div className="mt-2">
                        {isPurchased ? (
                          <button
                            onClick={() => handleEquip(reward)}
                            className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isEquipped
                                ? "bg-amber-500 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {isEquipped ? (
                              <span className="flex items-center justify-center gap-1">
                                <Check className="h-3 w-3" /> Снять
                              </span>
                            ) : "Надеть"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePurchase(reward)}
                            disabled={!canAfford || buying === reward.id}
                            className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all ${
                              canAfford
                                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-md active:scale-95"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            {buying === reward.id ? (
                              "Покупка..."
                            ) : (
                              <span className="flex items-center justify-center gap-1">
                                <Coins className="h-3 w-3" /> {reward.cost}
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
