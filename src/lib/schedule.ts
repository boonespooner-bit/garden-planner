import type { CareTask, PlantGuide } from "@/plants/types";
import { addWeeks, diffDays, fromMonthDay, isoDate } from "./dates";

export interface ClimateAnchors {
  /** Average last spring frost, "MM-DD". */
  lastFrost: string;
  /** Average first fall frost, "MM-DD". */
  firstFrost: string;
  frostFree: boolean;
  /** USDA zone number, used to hide cold-climate-only tasks. */
  zone?: number | null;
}

export interface ScheduledPlant {
  gardenPlantId: string;
  displayName: string;
  guide: PlantGuide;
}

export interface TaskOccurrence {
  /** Unique, stable key for checking this occurrence off. */
  key: string;
  gardenPlantId: string;
  plantName: string;
  guideKey: string;
  task: CareTask;
  /** 1-based index for repeating tasks, e.g. "feeding 2 of 4". */
  round: number;
  rounds: number;
  start: Date;
  end: Date;
}

/**
 * Anchor dates for the growing season that starts in `year`. In the southern
 * hemisphere (last frost ~Sep, first frost ~May) the first frost falls in the
 * following calendar year, which this handles automatically.
 */
export function seasonAnchors(climate: ClimateAnchors, year: number) {
  const lastFrost = fromMonthDay(year, climate.lastFrost);
  let firstFrost = fromMonthDay(year, climate.firstFrost);
  if (diffDays(firstFrost, lastFrost) <= 30) firstFrost = fromMonthDay(year + 1, climate.firstFrost);
  return { lastFrost, firstFrost };
}

export function occurrenceKey(gardenPlantId: string, taskId: string, round: number, season: number): string {
  return `${gardenPlantId}:${taskId}:${round}:${season}`;
}

/** All task windows for the given plants that overlap [from, to]. */
export function buildSchedule(
  climate: ClimateAnchors,
  plants: ScheduledPlant[],
  from: Date,
  to: Date,
): TaskOccurrence[] {
  const out: TaskOccurrence[] = [];
  const firstYear = from.getUTCFullYear() - 1;
  const lastYear = to.getUTCFullYear() + 1;

  for (let season = firstYear; season <= lastYear; season++) {
    const anchors = seasonAnchors(climate, season);
    for (const plant of plants) {
      for (const task of plant.guide.tasks) {
        if (task.skipIfFrostFree && climate.frostFree) continue;
        if (task.maxZone != null && climate.zone != null && climate.zone > task.maxZone) continue;
        const anchor = anchors[task.timing.anchor];
        const rounds = task.repeat?.times ?? 1;
        for (let i = 0; i < rounds; i++) {
          const shift = i * (task.repeat?.everyWeeks ?? 0);
          const start = addWeeks(anchor, task.timing.startWeeks + shift);
          const end = addWeeks(anchor, Math.max(task.timing.endWeeks, task.timing.startWeeks) + shift);
          if (end < from || start > to) continue;
          out.push({
            key: occurrenceKey(plant.gardenPlantId, task.id, i + 1, season),
            gardenPlantId: plant.gardenPlantId,
            plantName: plant.displayName,
            guideKey: plant.guide.key,
            task,
            round: i + 1,
            rounds,
            start,
            end,
          });
        }
      }
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime() || a.plantName.localeCompare(b.plantName));
}

export interface ScheduleBuckets {
  overdue: TaskOccurrence[];
  thisWeek: TaskOccurrence[];
  upcoming: TaskOccurrence[];
}

/**
 * Split occurrences around `today`:
 *  - overdue: window closed in the last 3 weeks and not done
 *  - thisWeek: window is open at any point in the next 9 days (covers the coming weekend + week)
 *  - upcoming: opens within `upcomingWeeks`
 */
export function bucketSchedule(
  occurrences: TaskOccurrence[],
  today: Date,
  done: Set<string>,
  upcomingWeeks = 6,
): ScheduleBuckets {
  const weekEnd = addWeeks(today, 9 / 7);
  const overdueFrom = addWeeks(today, -3);
  const upcomingEnd = addWeeks(today, upcomingWeeks);
  const buckets: ScheduleBuckets = { overdue: [], thisWeek: [], upcoming: [] };
  for (const o of occurrences) {
    if (done.has(o.key)) continue;
    if (o.end < today && o.end >= overdueFrom) buckets.overdue.push(o);
    else if (o.start <= weekEnd && o.end >= today) buckets.thisWeek.push(o);
    else if (o.start > weekEnd && o.start <= upcomingEnd) buckets.upcoming.push(o);
  }
  return buckets;
}

/** Group occurrences by calendar month ("2026-04") for the year view. */
export function groupByMonth(occurrences: TaskOccurrence[]): Map<string, TaskOccurrence[]> {
  const map = new Map<string, TaskOccurrence[]>();
  for (const o of occurrences) {
    const month = isoDate(o.start).slice(0, 7);
    const list = map.get(month) ?? [];
    list.push(o);
    map.set(month, list);
  }
  return map;
}
