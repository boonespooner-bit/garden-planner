import type { PlantGuide } from "@/plants/types";

export interface ChillAdvice {
  level: "ok" | "choose-low" | "too-warm";
  short: string;
  message: string;
}

/** Compares a plant's winter-chill needs with the chill hours a garden gets. */
export function chillAdvice(guide: PlantGuide, chillHours: number | null | undefined): ChillAdvice | null {
  const need = guide.chill;
  if (!need || chillHours == null) return null;
  const name = guide.name.toLowerCase();

  if (chillHours < need.low * 0.8) {
    return {
      level: "too-warm",
      short: "Winters here are likely too mild to fruit",
      message: `Your area gets about ${chillHours} winter chill hours, but even the lowest-chill ${name} varieties need around ${need.low}. It may grow but is unlikely to flower and fruit well. If you want to try: ${need.lowChillVarieties}.`,
    };
  }
  if (chillHours < need.typical) {
    return {
      level: "choose-low",
      short: `Choose a low-chill variety (≤ ${chillHours} hours)`,
      message: `Your area gets about ${chillHours} winter chill hours, fewer than the ${need.typical}+ that most common ${name} varieties need. Choose varieties rated at ${chillHours} chill hours or fewer, for example: ${need.lowChillVarieties}. Check the chill rating on the tag before you buy.`,
    };
  }
  return {
    level: "ok",
    short: "Enough winter chill for most varieties",
    message: `Your area gets about ${chillHours} winter chill hours, enough for most ${name} varieties (typically ${need.typical}).`,
  };
}
