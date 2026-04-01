import React from "react";

interface PetAvatarProps {
  petId: string;
  accessories?: string[];
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  frameId?: string | null;
  vehicleId?: string | null;
  backgroundId?: string | null;
}

export const AVAILABLE_PETS = [
  { id: "pet_bear", name: "Brown Bear", emoji: "🐻", color: "bg-amber-100 border-amber-300", description: "Strong and steady learning." },
  { id: "pet_fox", name: "Red Fox", emoji: "🦊", color: "bg-orange-100 border-orange-300", description: "Clever and quick-witted." },
  { id: "pet_owl", name: "Wise Owl", emoji: "🦉", color: "bg-emerald-100 border-emerald-300", description: "Observant and wise." },
  { id: "pet_cat", name: "Curious Cat", emoji: "🐱", color: "bg-purple-100 border-purple-300", description: "Curious and independent." },
  { id: "pet_dog", name: "Loyal Dog", emoji: "🐶", color: "bg-blue-100 border-blue-300", description: "Friendly and eager to learn." },
  { id: "pet_tiger", name: "Tiger Cub", emoji: "🐯", color: "bg-yellow-100 border-yellow-400", description: "Fierce focus and energy." },
  { id: "pet_rabbit", name: "Swift Rabbit", emoji: "🐰", color: "bg-pink-100 border-pink-300", description: "Fast and energetic progress." },
  { id: "pet_panda", name: "Red Panda", emoji: "🐼", color: "bg-red-100 border-red-300", description: "Playful and rare." },
];

const sizeClasses = {
  sm: "w-12 h-12 text-2xl",
  md: "w-20 h-20 text-4xl",
  lg: "w-32 h-32 text-6xl",
  xl: "w-48 h-48 text-8xl",
};

const vehicleSizeMap = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-6xl",
};

const VEHICLE_EMOJIS: Record<string, string> = {
  veh_bicycle: "🚲", veh_football: "⚽", veh_basketball: "🏀", veh_skateboard: "🛹",
  veh_guitar: "🎸", veh_scooter: "🛴", veh_gaming: "🎮", veh_tennis: "🎾",
  veh_motorcycle: "🏍️", veh_car: "🚗", veh_sportscar: "🏎️", veh_ufo: "🛸", veh_rocket: "🚀",
};

const BACKGROUND_STYLES: Record<string, string> = {
  bg_park:    "bg-gradient-to-b from-green-100 to-green-200 border-green-300",
  bg_beach:   "bg-gradient-to-b from-sky-100 to-amber-100 border-sky-300",
  bg_city:    "bg-gradient-to-b from-slate-200 to-slate-300 border-slate-400",
  bg_space:   "bg-gradient-to-b from-indigo-900 to-purple-900 border-indigo-500",
  bg_gaming:  "bg-gradient-to-b from-violet-200 to-fuchsia-200 border-violet-400",
  bg_rainbow: "bg-gradient-to-br from-red-100 via-yellow-100 to-blue-100 border-pink-300",
  bg_crystal: "bg-gradient-to-b from-cyan-100 to-teal-200 border-cyan-400",
};

const frameStyles: Record<string, string> = {
  frame_silver: "ring-4 ring-slate-400 shadow-[0_0_0_4px_rgba(255,255,255,0.95),0_0_0_9px_rgba(148,163,184,0.55)]",
  frame_gold: "ring-4 ring-amber-400 shadow-[0_0_0_6px_rgba(251,191,36,0.35)]",
  frame_flower: "ring-4 ring-pink-300 shadow-[0_0_0_6px_rgba(244,114,182,0.2)]",
  frame_star: "ring-4 ring-yellow-300 shadow-[0_0_0_6px_rgba(253,224,71,0.25)]",
  frame_fire: "ring-4 ring-orange-500 shadow-[0_0_0_6px_rgba(249,115,22,0.35)]",
  frame_emerald: "ring-4 ring-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.3)]",
  frame_ruby: "ring-4 ring-rose-500 shadow-[0_0_0_6px_rgba(244,63,94,0.3)]",
  frame_diamond: "ring-4 ring-cyan-300 shadow-[0_0_0_7px_rgba(125,211,252,0.35)]",
};

const frameDecorations: Record<string, string> = {
  frame_silver: "◈",
  frame_flower: "🌸",
  frame_star: "⭐",
  frame_fire: "🔥",
  frame_emerald: "💚",
  frame_ruby: "❤️",
  frame_diamond: "💎",
};

export default function PetAvatar({ petId, accessories = [], size = "md", className = "", frameId = null, vehicleId = null, backgroundId = null }: PetAvatarProps) {
  const pet = AVAILABLE_PETS.find(p => p.id === petId) || AVAILABLE_PETS[0];
  const frameClass = frameId ? frameStyles[frameId] || "" : "";
  const frameDecoration = frameId ? frameDecorations[frameId] : null;
  const bgClass = backgroundId ? (BACKGROUND_STYLES[backgroundId] || "") : "";
  const petColorClass = bgClass || `${pet.color}`;
  const vehicleEmoji = vehicleId ? VEHICLE_EMOJIS[vehicleId] : null;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative flex items-center justify-center rounded-3xl border-4 ${petColorClass} shadow-inner ${sizeClasses[size]} ${frameClass} ${className}`}>
        {/* Base Pet Emoji */}
        <span className="relative z-10 transform hover:scale-110 transition-transform duration-300">
          {pet.emoji}
        </span>

        {frameDecoration && (
          <>
            <span className="absolute -top-2 -left-1 z-30 text-lg">{frameDecoration}</span>
            <span className="absolute -top-2 -right-1 z-30 text-lg">{frameDecoration}</span>
            <span className="absolute -bottom-2 -left-1 z-30 text-lg">{frameDecoration}</span>
            <span className="absolute -bottom-2 -right-1 z-30 text-lg">{frameDecoration}</span>
          </>
        )}

        {/* NECK SLOT */}
        {accessories.includes("acc_scarf") && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none" style={{ top: "35%" }}>
            <span style={{ fontSize: "1em" }}>🧣</span>
          </div>
        )}
        {accessories.includes("acc_bowtie") && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none" style={{ top: "40%" }}>
            <span style={{ fontSize: "0.8em" }}>🎀</span>
          </div>
        )}
        {accessories.includes("acc_diamond_chain") && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none" style={{ top: "45%" }}>
            <span style={{ fontSize: "0.9em" }}>💎</span>
          </div>
        )}

        {/* FACE SLOT */}
        {accessories.includes("acc_glasses") && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ top: "5%" }}>
            <span style={{ fontSize: "1em" }}>👓</span>
          </div>
        )}
        {accessories.includes("acc_shades") && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ top: "5%" }}>
            <span style={{ fontSize: "1em" }}>🕶️</span>
          </div>
        )}
        {accessories.includes("acc_vr_headset") && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ top: "5%" }}>
            <span style={{ fontSize: "1em" }}>🥽</span>
          </div>
        )}

        {/* HEAD SLOT */}
        {accessories.includes("acc_cap") && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none" style={{ top: "-25%" }}>
            <span style={{ fontSize: "1.1em" }}>🧢</span>
          </div>
        )}
        {accessories.includes("acc_tophat") && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none" style={{ top: "-30%" }}>
            <span style={{ fontSize: "1.1em" }}>🎩</span>
          </div>
        )}
        {accessories.includes("acc_crown") && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none" style={{ top: "-30%" }}>
            <span style={{ fontSize: "0.9em" }}>👑</span>
          </div>
        )}
        {accessories.includes("acc_golden_crown") && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none" style={{ top: "-35%" }}>
            <span style={{ fontSize: "1.1em" }}>🏆</span>
          </div>
        )}
        {accessories.includes("acc_headphones") && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none" style={{ top: "-5%" }}>
            <span style={{ fontSize: "1.2em" }}>🎧</span>
          </div>
        )}
        {accessories.includes("acc_pilot") && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none" style={{ top: "-20%" }}>
            <span style={{ fontSize: "1em" }}>🛩️</span>
          </div>
        )}
        {accessories.includes("acc_astronaut") && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none" style={{ top: "-10%" }}>
            <span style={{ fontSize: "1.4em", opacity: 0.7 }}>🚀</span>
          </div>
        )}
      </div>

      {/* Vehicle shown below the pet */}
      {vehicleEmoji && (
        <div className={`leading-none -mt-1 drop-shadow-sm transition-all duration-500 ${
          (vehicleId === 'veh_football' || vehicleId === 'veh_car') ? 'scale-[1.6] mt-1 origin-top' : 
          (vehicleId === 'veh_ufo' || vehicleId === 'veh_rocket') ? 'scale-[2.4] mt-5 origin-top brightness-110 drop-shadow-2xl' : ''
        } ${vehicleId === 'veh_football' ? 'animate-bounce' : ''} ${
          vehicleId === 'veh_ufo' ? 'animate-pulse' : ''
        }`}
        style={{ 
          animationDuration: vehicleId === 'veh_football' ? '3s' : (vehicleId === 'veh_ufo' ? '2s' : undefined),
          fontSize: (vehicleId === 'veh_ufo' || vehicleId === 'veh_rocket') ? '2.5rem' : vehicleSizeMap[size]
        }}>
          {vehicleEmoji}
        </div>
      )}
    </div>
  );
}
