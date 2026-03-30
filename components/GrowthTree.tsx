"use client";

import React from "react";

interface GrowthTreeProps {
  health: number; // 0 to 100
  size?: "sm" | "md" | "lg";
}

export default function GrowthTree({ health, size = "md" }: GrowthTreeProps) {
  const h = Math.max(0, Math.min(100, health));

  const dimensions = size === "sm" ? { w: 120, h: 140 } : size === "md" ? { w: 200, h: 220 } : { w: 280, h: 300 };

  // Colors based on health
  const trunkColor = h > 30 ? "#8B5E3C" : "#A0826D";
  const leafColor =
    h >= 80 ? "#22c55e" : h >= 60 ? "#4ade80" : h >= 40 ? "#86efac" : h >= 20 ? "#d4a574" : "#a0826d";
  const groundColor = h >= 50 ? "#86efac" : h >= 25 ? "#d4c090" : "#c4a882";

  // Elements that appear at higher health
  const showLeaves = h > 10;
  const leafOpacity = Math.min(1, h / 60);
  const leafScale = 0.3 + (h / 100) * 0.7;
  const showFlowers = h >= 60;
  const showFruits = h >= 80;
  const showBirds = h >= 90;
  const showSun = h >= 70;

  return (
    <div className="relative flex flex-col items-center" style={{ width: dimensions.w, height: dimensions.h }}>
      <svg
        viewBox="0 0 200 220"
        width={dimensions.w}
        height={dimensions.h}
        className="drop-shadow-lg"
      >
        {/* Sky gradient */}
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={h >= 50 ? "#87CEEB" : "#D4C090"} />
            <stop offset="100%" stopColor={h >= 50 ? "#E0F0FF" : "#E8DCC8"} />
          </linearGradient>
          <radialGradient id="sunGrad">
            <stop offset="0%" stopColor="#FFE066" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background */}
        <rect width="200" height="220" rx="16" fill="url(#skyGrad)" />

        {/* Sun */}
        {showSun && (
          <g>
            <circle cx="160" cy="35" r="20" fill="url(#sunGrad)" opacity="0.8">
              <animate attributeName="r" values="18;22;18" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="160" cy="35" r="12" fill="#FFE066" />
          </g>
        )}

        {/* Ground */}
        <ellipse cx="100" cy="195" rx="90" ry="20" fill={groundColor} opacity="0.7" />
        {h >= 50 && (
          <>
            {/* Grass tufts */}
            <line x1="30" y1="195" x2="35" y2="185" stroke="#4ade80" strokeWidth="2" opacity="0.6" />
            <line x1="33" y1="195" x2="37" y2="187" stroke="#22c55e" strokeWidth="2" opacity="0.5" />
            <line x1="160" y1="193" x2="165" y2="183" stroke="#4ade80" strokeWidth="2" opacity="0.6" />
            <line x1="163" y1="193" x2="167" y2="185" stroke="#22c55e" strokeWidth="2" opacity="0.5" />
          </>
        )}

        {/* Trunk */}
        <path
          d={`M95,190 Q93,160 90,130 Q88,110 92,95 L100,85 L108,95 Q112,110 110,130 Q107,160 105,190 Z`}
          fill={trunkColor}
        />
        {/* Branches */}
        {h > 20 && (
          <g opacity={Math.min(1, h / 40)}>
            <path d="M94,130 Q75,120 60,110" stroke={trunkColor} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M106,125 Q125,115 140,108" stroke={trunkColor} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M96,110 Q80,98 68,85" stroke={trunkColor} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M104,105 Q120,93 135,83" stroke={trunkColor} strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        )}

        {/* Leaf canopy */}
        {showLeaves && (
          <g opacity={leafOpacity} transform={`translate(100,85) scale(${leafScale})`}>
            <ellipse cx="0" cy="-15" rx="45" ry="35" fill={leafColor} />
            <ellipse cx="-30" cy="5" rx="30" ry="25" fill={leafColor} opacity="0.9" />
            <ellipse cx="30" cy="5" rx="30" ry="25" fill={leafColor} opacity="0.9" />
            <ellipse cx="-15" cy="-30" rx="25" ry="20" fill={leafColor} opacity="0.85" />
            <ellipse cx="15" cy="-30" rx="25" ry="20" fill={leafColor} opacity="0.85" />
            <ellipse cx="0" cy="-40" rx="20" ry="15" fill={leafColor} opacity="0.8" />
          </g>
        )}

        {/* Flowers */}
        {showFlowers && (
          <g>
            {[
              { cx: 67, cy: 70 },
              { cx: 130, cy: 72 },
              { cx: 85, cy: 55 },
              { cx: 115, cy: 58 },
            ].map((pos, i) => (
              <g key={i}>
                <circle cx={pos.cx} cy={pos.cy} r="5" fill="#f472b6" opacity="0.9">
                  <animate attributeName="r" values="4;6;4" dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
                </circle>
                <circle cx={pos.cx} cy={pos.cy} r="2" fill="#fbbf24" />
              </g>
            ))}
          </g>
        )}

        {/* Fruits */}
        {showFruits && (
          <g>
            {[
              { cx: 75, cy: 80 },
              { cx: 120, cy: 78 },
              { cx: 95, cy: 65 },
            ].map((pos, i) => (
              <circle key={i} cx={pos.cx} cy={pos.cy} r="6" fill="#ef4444" opacity="0.9">
                <animate attributeName="cy" values={`${pos.cy - 1};${pos.cy + 1};${pos.cy - 1}`} dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </g>
        )}

        {/* Birds */}
        {showBirds && (
          <g>
            <path d="M35,45 Q40,38 45,45" stroke="#374151" strokeWidth="1.5" fill="none">
              <animateTransform attributeName="transform" type="translate" values="0,0;5,-3;0,0" dur="4s" repeatCount="indefinite" />
            </path>
            <path d="M150,30 Q155,23 160,30" stroke="#374151" strokeWidth="1.5" fill="none">
              <animateTransform attributeName="transform" type="translate" values="0,0;-4,-2;0,0" dur="3.5s" repeatCount="indefinite" />
            </path>
          </g>
        )}

        {/* Health label */}
        <text x="100" y="215" textAnchor="middle" fontSize="11" fill="#6b7280" fontWeight="600">
          {h >= 80 ? "🌳 Thriving!" : h >= 60 ? "🌿 Growing" : h >= 40 ? "🌱 Sprouting" : h >= 20 ? "🍂 Needs care" : "🥀 Wilting"}
        </text>
      </svg>
    </div>
  );
}
