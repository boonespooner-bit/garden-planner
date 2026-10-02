import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { User } from "@/db/schema";
import { getCuratedGuide } from "@/plants";
import type { CareTask, PlantGuide, Product } from "@/plants/types";
import { zoneNumber } from "./climate";
import { addWeeks, todayIn } from "./dates";
import { buildSchedule, type ClimateAnchors, type ScheduledPlant } from "./schedule";

export interface GardenEntry {
  id: string;
  displayName: string;
  nickname: string | null;
  quantity: number;
  notes: string | null;
  guide: PlantGuide;
  aiGenerated: boolean;
}

export async function loadGarden(userId: string): Promise<GardenEntry[]> {
  const rows = await db
    .select({ plant: schema.gardenPlants, custom: schema.customGuides })
    .from(schema.gardenPlants)
    .leftJoin(schema.customGuides, eq(schema.gardenPlants.customGuideId, schema.customGuides.id))
    .where(eq(schema.gardenPlants.userId, userId))
    .orderBy(schema.gardenPlants.createdAt);

  const entries: GardenEntry[] = [];
  for (const { plant, custom } of rows) {
    const guide = plant.plantKey ? getCuratedGuide(plant.plantKey) : custom?.guide;
    if (!guide) continue;
    entries.push({
      id: plant.id,
      displayName: plant.nickname || guide.name,
      nickname: plant.nickname,
      quantity: plant.quantity,
      notes: plant.notes,
      guide,
      aiGenerated: !plant.plantKey,
    });
  }
  return entries;
}

export async function loadGardenEntry(userId: string, id: string): Promise<GardenEntry | null> {
  const garden = await loadGarden(userId);
  return garden.find((g) => g.id === id) ?? null;
}

export async function loadCompletions(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ key: schema.taskCompletions.occurrenceKey })
    .from(schema.taskCompletions)
    .where(eq(schema.taskCompletions.userId, userId));
  return new Set(rows.map((r) => r.key));
}

export async function setCompletion(userId: string, key: string, done: boolean): Promise<void> {
  if (done) {
    await db.insert(schema.taskCompletions).values({ userId, occurrenceKey: key }).onConflictDoNothing();
  } else {
    await db
      .delete(schema.taskCompletions)
      .where(and(eq(schema.taskCompletions.userId, userId), eq(schema.taskCompletions.occurrenceKey, key)));
  }
}

export function climateOf(user: User): ClimateAnchors {
  return {
    lastFrost: user.lastFrost ?? "04-15",
    firstFrost: user.firstFrost ?? "10-20",
    frostFree: user.frostFree,
    zone: zoneNumber(user.hardinessZone),
  };
}

export function toScheduled(garden: GardenEntry[]): ScheduledPlant[] {
  return garden.map((g) => ({ gardenPlantId: g.id, displayName: g.displayName, guide: g.guide }));
}

/** Schedule from a few weeks ago through the next `weeksAhead` weeks, in the user's local calendar. */
export function scheduleFor(user: User, garden: GardenEntry[], weeksAhead = 52) {
  const today = todayIn(user.timezone ?? "UTC");
  const occurrences = buildSchedule(climateOf(user), toScheduled(garden), addWeeks(today, -4), addWeeks(today, weeksAhead));
  return { today, occurrences };
}

export function visibleProducts(task: CareTask, pref: User["treatmentPreference"]): Product[] {
  const products = task.products ?? [];
  const filtered = pref === "organic" ? products.filter((p) => p.organic) : products;
  return [...filtered].sort((a, b) => Number(b.organic) - Number(a.organic));
}

export const TASK_LABELS: Record<CareTask["type"], { label: string; icon: string }> = {
  prune: { label: "Prune", icon: "✂️" },
  fertilize: { label: "Fertilize", icon: "🌱" },
  spray: { label: "Spray", icon: "💧" },
  soil: { label: "Soil & mulch", icon: "🪱" },
  protect: { label: "Protect", icon: "🛡️" },
  "plant-care": { label: "Care", icon: "🌿" },
};
