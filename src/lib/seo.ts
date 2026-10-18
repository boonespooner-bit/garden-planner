/**
 * Helpers for the public, search-friendly pages: plant care guides and
 * monthly gardening tips. Timing is shown for reference climates, since
 * visitors haven't told us where they garden yet.
 */
import { LIBRARY } from "@/plants";
import type { CareTask, PlantGuide, TaskType, Timing } from "@/plants/types";
import { formatRange, utcDate } from "./dates";
import { buildSchedule, type ClimateAnchors } from "./schedule";

export const SITE_NAME = "Tend Weekly";

export function siteUrl(path = ""): string {
  const base = (process.env.APP_URL || "https://tendweekly.com").replace(/\/$/, "");
  return `${base}${path}`;
}

export interface ReferenceClimate {
  id: "cold" | "moderate" | "warm";
  label: string;
  zones: string;
  anchors: ClimateAnchors;
}

/** Typical US climates used to turn frost-relative timing into example dates. */
export const REFERENCE_CLIMATES: ReferenceClimate[] = [
  { id: "cold", label: "Cold winters", zones: "zones 3–5", anchors: { lastFrost: "05-10", firstFrost: "10-01", frostFree: false, zone: 5 } },
  { id: "moderate", label: "Moderate winters", zones: "zones 6–7", anchors: { lastFrost: "04-15", firstFrost: "10-25", frostFree: false, zone: 7 } },
  { id: "warm", label: "Mild winters", zones: "zones 8–10", anchors: { lastFrost: "02-25", firstFrost: "12-01", frostFree: false, zone: 9 } },
];

export const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
] as const;
export type MonthSlug = (typeof MONTHS)[number];

export const monthName = (m: MonthSlug) => m[0].toUpperCase() + m.slice(1);

export const TYPE_HEADINGS: Record<TaskType, { title: string; verb: string }> = {
  prune: { title: "Pruning", verb: "Prune" },
  fertilize: { title: "Fertilizing", verb: "Feed" },
  spray: { title: "Spraying & disease prevention", verb: "Spray" },
  soil: { title: "Soil, compost & mulch", verb: "Soil care for" },
  protect: { title: "Frost & winter protection", verb: "Protect" },
  "plant-care": { title: "Other care", verb: "Care for" },
};

/** "4–1 weeks before the last spring frost" etc. */
export function timingPhrase(t: Timing): string {
  const anchor = t.anchor === "lastFrost" ? "the last spring frost" : "the first fall frost";
  const s = t.startWeeks, e = t.endWeeks;
  const w = (n: number) => `${Math.abs(n)} week${Math.abs(n) === 1 ? "" : "s"}`;
  const range = (a: number, b: number) => (a === b ? w(a) : `${Math.min(a, b)}–${Math.max(a, b)} weeks`);
  if (s < 0 && e <= 0) return e === 0 ? `from ${w(s)} before ${anchor} until ${anchor}` : `${range(-s, -e)} before ${anchor}`;
  if (s >= 0 && e > 0) return s === 0 ? `from ${anchor} to ${w(e)} after` : `${range(s, e)} after ${anchor}`;
  return `from ${w(s)} before to ${w(e)} after ${anchor}`;
}

/** Whether a plant is grown in a reference climate (its zone range, with one zone of leeway). */
export function suitsClimate(guide: PlantGuide, climate: ReferenceClimate): boolean {
  const z = climate.anchors.zone ?? 7;
  return z >= guide.zones.min - 1 && z <= guide.zones.max + 1;
}

/** Example date window for a task in a reference climate (first occurrence in the year). */
export function exampleWindow(guide: PlantGuide, task: CareTask, climate: ReferenceClimate): string | null {
  if (task.skipIfFrostFree && climate.anchors.frostFree) return null;
  if (task.maxZone != null && (climate.anchors.zone ?? 0) > task.maxZone) return null;
  const occ = buildSchedule(climate.anchors, [{ gardenPlantId: "x", displayName: guide.name, guide: { ...guide, tasks: [task] } }], utcDate(2027, 1, 1), utcDate(2027, 12, 31));
  // Prefer the occurrence belonging to the 2027 season so windows don't wrap oddly.
  const first = occ.find((o) => o.key.endsWith(":2027")) ?? occ[0];
  return first ? formatRange(first.start, first.end) : null;
}

export interface MonthItem {
  guide: PlantGuide;
  task: CareTask;
  window: string;
}

/** Tasks across the whole library whose window overlaps the given month in a reference climate. */
export function tasksForMonth(month: MonthSlug, climate: ReferenceClimate): Map<TaskType, MonthItem[]> {
  const m = MONTHS.indexOf(month) + 1;
  const from = utcDate(2027, m, 1);
  const to = utcDate(2027, m + 1, 1);
  const plants = LIBRARY.filter((g) => suitsClimate(g, climate)).map((g) => ({ gardenPlantId: g.key, displayName: g.name, guide: g }));
  const occ = buildSchedule(climate.anchors, plants, from, new Date(to.getTime() - 1));
  const byType = new Map<TaskType, MonthItem[]>();
  const seen = new Set<string>();
  for (const o of occ) {
    const id = `${o.gardenPlantId}:${o.task.id}`;
    if (seen.has(id)) continue; // repeating tasks: list once per month
    seen.add(id);
    const guide = LIBRARY.find((g) => g.key === o.gardenPlantId)!;
    const list = byType.get(o.task.type) ?? [];
    list.push({ guide, task: o.task, window: formatRange(o.start, o.end) });
    byType.set(o.task.type, list);
  }
  for (const list of byType.values()) list.sort((a, b) => a.guide.name.localeCompare(b.guide.name));
  return byType;
}

export function guidesByCategory() {
  const map = new Map<PlantGuide["category"], PlantGuide[]>();
  for (const g of LIBRARY) map.set(g.category, [...(map.get(g.category) ?? []), g]);
  return map;
}

/** Plain-language summary of when a plant gets pruned, for titles and FAQs. */
export function pruningSummary(guide: PlantGuide): string | null {
  const prune = guide.tasks.filter((t) => t.type === "prune");
  if (!prune.length) return null;
  const main = prune[0];
  return `${main.title}: ${timingPhrase(main.timing)}`;
}

export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
