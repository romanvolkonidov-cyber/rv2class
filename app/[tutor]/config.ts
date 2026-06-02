export const TUTOR_CONFIG = {
  roman: {
    name: "Roman",
    room: "roman-room",
    accent: "text-blue-600",
  },
  violet: {
    name: "Violet",
    room: "violet-room",
    accent: "text-purple-600",
  },
} as const;

export type TutorKey = keyof typeof TUTOR_CONFIG;

export const getTutorConfig = (key: string | null | undefined) => {
  if (!key) return undefined;
  const normalized = key.trim().toLowerCase() as TutorKey;
  return TUTOR_CONFIG[normalized];
};
