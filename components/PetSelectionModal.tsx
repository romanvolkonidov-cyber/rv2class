"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import PetAvatar, { AVAILABLE_PETS } from "./PetAvatar";
import { updateGameProfile, GameProfile } from "@/lib/gamification";

interface PetSelectionModalProps {
  isOpen: boolean;
  profile: GameProfile;
  onSelect: (updatedProfile: GameProfile) => void;
}

export default function PetSelectionModal({ isOpen, profile, onSelect }: PetSelectionModalProps) {
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // If already has a pet, don't show to prevent accidental rerolls (unless we want to allow changing later)
  if (profile.petId) return null;

  const handleConfirm = async () => {
    if (!selectedPetId) return;
    setIsSaving(true);
    try {
      // Initialize ALL care timestamps to NOW so the 3-day countdown
      // starts fresh from adoption — not from lastUpdated (which resets on deploys)
      const nowISO = new Date().toISOString();
      await updateGameProfile(profile.studentId, { 
        petId: selectedPetId,
        petLastCleaned: nowISO,
        petLastFed: nowISO,
        petLastPlayed: nowISO,
        petLastDrank: nowISO,
      });
      onSelect({ 
        ...profile, 
        petId: selectedPetId, 
        petLastCleaned: nowISO,
        petLastFed: nowISO,
        petLastPlayed: nowISO,
        petLastDrank: nowISO,
      });
    } catch (err) {
      console.error("Failed to select pet:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || profile.petId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-indigo-900/60 backdrop-blur-md" />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-gradient-to-br from-indigo-50 to-purple-50 sm:rounded-3xl border-0 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 sm:p-8 pb-0 text-center shrink-0">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
          </div>
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-indigo-900 tracking-tight flex justify-center">
              Choose Your Companion!
            </h2>
            <p className="text-lg text-indigo-600 mt-2 font-medium">
              This friend will accompany you on your learning journey.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {AVAILABLE_PETS.map((pet) => {
              const isSelected = selectedPetId === pet.id;
              return (
                <button
                  key={pet.id}
                  onClick={() => setSelectedPetId(pet.id)}
                  className={`relative flex flex-col items-center p-4 rounded-2xl transition-all duration-300 border-4 cursor-pointer text-left ${
                    isSelected 
                      ? "bg-white border-indigo-500 shadow-xl scale-105" 
                      : "bg-white/50 border-transparent hover:bg-white hover:shadow-md hover:scale-105"
                  }`}
                >
                  <PetAvatar petId={pet.id} size="lg" className="mb-3" />
                  <span className="font-bold text-gray-900 text-center">{pet.name}</span>
                  <span className="text-xs text-gray-500 text-center mt-1 leading-tight">{pet.description}</span>
                  
                  {isSelected && (
                    <div className="absolute -top-3 -right-3 bg-indigo-500 text-white p-1 rounded-full shadow-lg">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-8 pt-0 bg-white/30 backdrop-blur-sm border-t border-indigo-100 mt-4 flex justify-between items-center rounded-b-3xl">
          <div className="text-sm font-medium text-indigo-600">
            {selectedPetId 
              ? `You chose the ${AVAILABLE_PETS.find(p => p.id === selectedPetId)?.name}!` 
              : "Select a pet to continue..."}
          </div>
          <Button
            size="lg"
            onClick={handleConfirm}
            disabled={!selectedPetId || isSaving}
            className={`min-w-[150px] font-bold text-lg rounded-xl transition-all ${
              selectedPetId 
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl" 
                : "bg-indigo-200 text-indigo-400"
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              <>Let's Go! <ArrowRight className="w-5 h-5 ml-2" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
