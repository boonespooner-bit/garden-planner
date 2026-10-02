import type { PlantGuide } from "./types";
import { rosesAndHydrangeas } from "./library/roses-hydrangeas";
import { evergreens, shrubs, trees } from "./library/shrubs";
import { fruit } from "./library/fruit";
import { herbsAndVeg, perennials, tropicals } from "./library/perennials";

export const LIBRARY: PlantGuide[] = [
  ...rosesAndHydrangeas,
  ...shrubs,
  ...evergreens,
  ...trees,
  ...fruit,
  ...perennials,
  ...herbsAndVeg,
  ...tropicals,
].sort((a, b) => a.name.localeCompare(b.name));

const byKey = new Map(LIBRARY.map((g) => [g.key, g]));

export function getCuratedGuide(key: string): PlantGuide | undefined {
  return byKey.get(key);
}

export function normalizePlantName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’"]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Rank library guides against a free-text query; best matches first. */
export function searchLibrary(query: string, limit = 8): PlantGuide[] {
  const q = normalizePlantName(query);
  if (!q) return [];
  const scored: { guide: PlantGuide; score: number }[] = [];
  for (const guide of LIBRARY) {
    const names = [guide.name, guide.botanical, ...guide.aliases].map(normalizePlantName);
    let score = 0;
    for (const n of names) {
      if (n === q) score = Math.max(score, 100);
      else if (n.startsWith(q)) score = Math.max(score, 80);
      else if (n.split(" ").some((w) => w.startsWith(q))) score = Math.max(score, 60);
      else if (n.includes(q)) score = Math.max(score, 40);
      else if (q.includes(n) && n.length > 3) score = Math.max(score, 30);
    }
    if (score > 0) scored.push({ guide, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.guide.name.localeCompare(b.guide.name))
    .slice(0, limit)
    .map((s) => s.guide);
}

/** Returns a curated guide only when the query is an unambiguous name or alias match. */
export function exactLibraryMatch(query: string): PlantGuide | undefined {
  const q = normalizePlantName(query);
  return LIBRARY.find((g) => [g.name, g.botanical, ...g.aliases].some((n) => normalizePlantName(n) === q));
}
