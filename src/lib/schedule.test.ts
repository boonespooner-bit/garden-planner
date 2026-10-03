import { describe, expect, it } from "vitest";
import { getCuratedGuide, LIBRARY, searchLibrary } from "@/plants";
import { chillAdvice } from "./chill";
import { analyzeChill, analyzeClimate, usdaZone } from "./climate";
import { isoDate, utcDate } from "./dates";
import { bucketSchedule, buildSchedule, seasonAnchors } from "./schedule";
import { buildWarnings, type ForecastDay } from "./weather";

const temperate = { lastFrost: "04-15", firstFrost: "10-20", frostFree: false };
const southern = { lastFrost: "09-20", firstFrost: "05-10", frostFree: false };

describe("plant library", () => {
  it("has unique keys and unique task ids per guide", () => {
    expect(new Set(LIBRARY.map((g) => g.key)).size).toBe(LIBRARY.length);
    for (const g of LIBRARY) {
      const ids = g.tasks.map((t) => t.id);
      expect(new Set(ids).size, g.key).toBe(ids.length);
    }
  });

  it("has sane task windows and how-to steps", () => {
    for (const g of LIBRARY) {
      expect(g.tasks.length, g.key).toBeGreaterThan(0);
      for (const t of g.tasks) {
        expect(t.timing.endWeeks, `${g.key}/${t.id}`).toBeGreaterThanOrEqual(t.timing.startWeeks);
        expect(t.steps.length, `${g.key}/${t.id}`).toBeGreaterThan(0);
      }
    }
  });

  it("covers roughly 60+ plants", () => {
    expect(LIBRARY.length).toBeGreaterThanOrEqual(60);
  });

  it("finds plants by alias", () => {
    expect(searchLibrary("knock out rose")[0].key).toBe("shrub-rose");
    expect(searchLibrary("Limelight")[0].key).toBe("panicle-hydrangea");
    expect(searchLibrary("meyer lemon")[0].key).toBe("citrus");
    expect(searchLibrary("persimmon")[0].key).toBe("persimmon");
    expect(searchLibrary("pomegranite")[0].key).toBe("pomegranate");
    expect(searchLibrary("kiwi")[0].key).toBe("kiwi");
    expect(searchLibrary("strawberry tree")[0].key).toBe("strawberry-tree");
    expect(searchLibrary("strawberry")[0].key).toBe("strawberry");
    expect(searchLibrary("tangerine")[0].key).toBe("mandarin");
    expect(searchLibrary("satsuma")[0].key).toBe("mandarin");
    expect(searchLibrary("apricot")[0].key).toBe("apricot");
    expect(searchLibrary("asian pear")[0].key).toBe("asian-pear");
    expect(searchLibrary("pear")[0].key).toBe("pear");
    expect(searchLibrary("quince")[0].key).toBe("quince");
    expect(searchLibrary("medlar")[0].key).toBe("medlar");
    expect(searchLibrary("juneberry")[0].key).toBe("serviceberry");
  });
});

describe("schedule", () => {
  const rose = getCuratedGuide("hybrid-tea-rose")!;
  const plants = [{ gardenPlantId: "p1", displayName: "Roses", guide: rose }];

  it("places a late-winter prune before last frost", () => {
    const occ = buildSchedule(temperate, plants, utcDate(2027, 1, 1), utcDate(2027, 12, 31));
    const prune = occ.find((o) => o.task.id === "spring-prune")!;
    expect(isoDate(prune.start)).toBe("2027-03-18"); // 4 weeks before Apr 15
    expect(isoDate(prune.end)).toBe("2027-04-08");
  });

  it("expands repeating feedings", () => {
    const occ = buildSchedule(temperate, plants, utcDate(2027, 1, 1), utcDate(2027, 12, 31));
    const feeds = occ.filter((o) => o.task.id === "feed");
    expect(feeds.map((f) => isoDate(f.start))).toEqual(["2027-04-15", "2027-05-20", "2027-06-24", "2027-07-29"]);
  });

  it("handles the southern hemisphere (first frost falls the following year)", () => {
    const { lastFrost, firstFrost } = seasonAnchors(southern, 2026);
    expect(isoDate(lastFrost)).toBe("2026-09-20");
    expect(isoDate(firstFrost)).toBe("2027-05-10");
    const occ = buildSchedule(southern, plants, utcDate(2026, 7, 1), utcDate(2027, 6, 30));
    const prune = occ.find((o) => o.task.id === "spring-prune")!;
    expect(isoDate(prune.start).slice(0, 7)).toBe("2026-08");
  });

  it("skips frost-only tasks in frost-free climates", () => {
    const occ = buildSchedule({ ...temperate, frostFree: true }, plants, utcDate(2027, 1, 1), utcDate(2027, 12, 31));
    expect(occ.some((o) => o.task.id === "winter-protect")).toBe(false);
  });

  it("hides cold-climate tasks in warmer zones", () => {
    const hydrangea = [{ gardenPlantId: "h", displayName: "Hydrangea", guide: getCuratedGuide("bigleaf-hydrangea")! }];
    const range = [utcDate(2027, 1, 1), utcDate(2027, 12, 31)] as const;
    const cold = buildSchedule({ ...temperate, zone: 6 }, hydrangea, ...range);
    const warm = buildSchedule({ ...temperate, zone: 8 }, hydrangea, ...range);
    expect(cold.some((o) => o.task.id === "winter-protect")).toBe(true);
    expect(warm.some((o) => o.task.id === "winter-protect")).toBe(false);
  });

  it("buckets tasks around today and hides completed ones", () => {
    const occ = buildSchedule(temperate, plants, utcDate(2027, 1, 1), utcDate(2027, 12, 31));
    const today = utcDate(2027, 3, 26);
    const buckets = bucketSchedule(occ, today, new Set());
    expect(buckets.thisWeek.some((o) => o.task.id === "spring-prune")).toBe(true);
    const pruneKey = buckets.thisWeek.find((o) => o.task.id === "spring-prune")!.key;
    const after = bucketSchedule(occ, today, new Set([pruneKey]));
    expect(after.thisWeek.some((o) => o.task.id === "spring-prune")).toBe(false);
  });
});

describe("climate", () => {
  it("maps temperatures to USDA zones", () => {
    expect(usdaZone(-17.5)).toBe("7a"); // 0.5°F
    expect(usdaZone(-20.5)).toBe("6b"); // −4.9°F
    expect(usdaZone(-31)).toBe("4b"); // −23.8°F
    expect(usdaZone(3)).toBe("10b"); // 37.4°F
  });

  it("derives frost dates from a synthetic temperature series", () => {
    const time: string[] = [];
    const temps: number[] = [];
    for (let y = 2015; y <= 2024; y++) {
      for (let d = utcDate(y, 1, 1); d.getUTCFullYear() === y; d = new Date(d.getTime() + 86_400_000)) {
        time.push(isoDate(d));
        const md = isoDate(d).slice(5);
        temps.push(md < "04-10" || md > "10-25" ? -5 : 10);
      }
    }
    const est = analyzeClimate({ time, temperature_2m_min: temps }, 40);
    expect(est.lastFrost).toBe("04-09");
    expect(est.firstFrost).toBe("10-26");
    expect(est.frostFree).toBe(false);
  });
});

describe("weather warnings", () => {
  const day = (date: string, over: Partial<ForecastDay> = {}): ForecastDay => ({
    date, tMaxC: 20, tMinC: 10, precipMm: 0, precipChance: 10, windKmh: 10, code: 0, ...over,
  });

  it("flags frost and rain", () => {
    const w = buildWarnings(
      [day("2027-04-09"), day("2027-04-10", { tMinC: 0 }), day("2027-04-11", { precipChance: 80, precipMm: 12 })],
      "imperial",
    );
    expect(w.map((x) => x.kind)).toEqual(["frost", "rain"]);
    expect(w[0].title).toContain("32°F");
  });
});

describe("chill hours", () => {
  it("counts hours between 0 and 7.2°C over Nov–Feb", () => {
    const time: string[] = [];
    const temps: number[] = [];
    for (let d = utcDate(2022, 11, 1); d < utcDate(2023, 3, 1); d = new Date(d.getTime() + 3_600_000)) {
      time.push(d.toISOString().slice(0, 16));
      // 6 chill hours per day (hours 0–5 at 3°C), the rest warm.
      temps.push(d.getUTCHours() < 6 ? 3 : 15);
    }
    expect(analyzeChill({ time, temperature_2m: temps }, 40)).toBe(720); // 120 days × 6
  });

  it("advises low-chill varieties in mild-winter areas", () => {
    const peach = getCuratedGuide("peach")!;
    expect(chillAdvice(peach, 1000)?.level).toBe("ok");
    expect(chillAdvice(peach, 300)?.level).toBe("choose-low");
    expect(chillAdvice(peach, 50)?.level).toBe("too-warm");
    expect(chillAdvice(peach, null)).toBeNull();
    expect(chillAdvice(getCuratedGuide("lavender")!, 100)).toBeNull();
  });
});
