/**
 * Local climate estimates derived from ~10 years of daily minimum
 * temperatures (Open-Meteo historical archive, free, no API key):
 *  - USDA hardiness zone from the average annual extreme minimum
 *  - median last spring frost and first fall frost (≤ 34°F / 1°C)
 *
 * Works anywhere in the world, either hemisphere. Gardeners can override
 * the results in Settings if they know better local numbers.
 */
import { addDays, isoDate, parseIsoDate, toMonthDay, utcDate } from "./dates";
import type { ClimateAnchors } from "./schedule";

export interface ClimateEstimate extends ClimateAnchors {
  hardinessZone: string;
  /** Average annual extreme minimum, °C. */
  extremeMinC: number;
  yearsAnalyzed: number;
  /** Average winter chill hours (0–7.2°C / 32–45°F), or null if unavailable. */
  chillHours: number | null;
}

export interface GeocodeResult {
  name: string;
  admin1?: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  postcodes?: string[];
}

export async function geocode(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", trimmed);
  url.searchParams.set("count", "8");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  const res = await fetch(url, { next: { revalidate: 86_400 } });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const data = (await res.json()) as {
    results?: {
      name: string;
      admin1?: string;
      country?: string;
      country_code?: string;
      latitude: number;
      longitude: number;
      timezone?: string;
      postcodes?: string[];
    }[];
  };
  return (data.results ?? []).map((r) => ({
    name: r.name,
    admin1: r.admin1,
    country: r.country,
    countryCode: r.country_code,
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone ?? "UTC",
    postcodes: r.postcodes,
  }));
}

export function placeLabel(r: Pick<GeocodeResult, "name" | "admin1" | "country">): string {
  return [r.name, r.admin1, r.country].filter(Boolean).join(", ");
}

/** USDA zone (e.g. "7a") from an average annual extreme minimum in °C. */
export function usdaZone(extremeMinC: number): string {
  const f = extremeMinC * 1.8 + 32;
  // Zone 1a starts at −60°F; each zone spans 10°F and each half-zone 5°F.
  const band = Math.min(25, Math.max(0, Math.floor((f + 60) / 5)));
  return `${Math.floor(band / 2) + 1}${band % 2 === 0 ? "a" : "b"}`;
}

export function zoneNumber(zone: string | null | undefined): number | null {
  const n = zone ? parseInt(zone, 10) : NaN;
  return Number.isFinite(n) ? n : null;
}

/**
 * A grid-cell air temperature of 1°C (34°F) is the usual "frost possible" cutoff.
 * Gridded reanalysis smooths out the cold pockets in real gardens, and 1°C
 * matched published frost dates better than 0°C across the reference cities we tested.
 */
const FROST_C = 1;

interface DailySeries {
  time: string[];
  temperature_2m_min: (number | null)[];
}

/** Pure analysis step, separated from fetching so it can be unit-tested. */
export function analyzeClimate(series: DailySeries, latitude: number): ClimateEstimate {
  const southern = latitude < 0;
  // Shift dates so the "frost year" starts mid-winter-free: Jan 1 in the north, Jul 1 in the south.
  // That way spring frosts always fall in the first half and fall frosts in the second.
  const shiftDays = southern ? -181 : 0;

  type Year = { min: number; lastSpring?: number; firstFall?: number; days: number };
  const years = new Map<number, Year>();
  const winterMins = new Map<number, number>();

  for (let i = 0; i < series.time.length; i++) {
    const t = series.temperature_2m_min[i];
    if (t == null) continue;
    const actual = parseIsoDate(series.time[i]);
    const shifted = addDays(actual, shiftDays);
    const fy = shifted.getUTCFullYear();
    const doy = Math.floor((shifted.getTime() - utcDate(fy, 1, 1).getTime()) / 86_400_000);
    const y = years.get(fy) ?? { min: Infinity, days: 0 };
    y.days++;
    y.min = Math.min(y.min, t);
    if (t <= FROST_C) {
      if (doy < 182) y.lastSpring = doy;
      else if (y.firstFall === undefined) y.firstFall = doy;
    }
    years.set(fy, y);

    // Winter extreme minimum: group by winter season (Jul–Jun in the north, Jan–Dec in the south).
    const winterKey = southern ? actual.getUTCFullYear() : actual.getUTCMonth() >= 6 ? actual.getUTCFullYear() : actual.getUTCFullYear() - 1;
    winterMins.set(winterKey, Math.min(winterMins.get(winterKey) ?? Infinity, t));
  }

  const full = [...years.values()].filter((y) => y.days > 330);
  const winters = [...winterMins.values()].filter(Number.isFinite);
  const extremeMinC = winters.length ? winters.reduce((a, b) => a + b, 0) / winters.length : 10;

  const springs = full.map((y) => y.lastSpring).filter((d): d is number => d !== undefined);
  const falls = full.map((y) => y.firstFall).filter((d): d is number => d !== undefined);
  const frostFree = full.length === 0 || springs.length < full.length / 2;

  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
  };

  // Frost-free climates still need anchor dates: use the start of the main
  // growing season (≈ Feb 1 / Aug 1) and an early-winter pseudo first frost.
  const lastDoy = frostFree ? 31 : median(springs);
  const firstDoy = frostFree ? 335 : falls.length ? median(falls) : 300;

  const toMd = (doy: number) => toMonthDay(addDays(utcDate(2001, 1, 1 + doy), -shiftDays));

  return {
    hardinessZone: usdaZone(extremeMinC),
    extremeMinC: Math.round(extremeMinC * 10) / 10,
    lastFrost: toMd(lastDoy),
    firstFrost: toMd(firstDoy),
    frostFree,
    yearsAnalyzed: full.length,
    chillHours: null,
  };
}

/* ---- Chill hours ----
 * Many fruit trees (apples, peaches, cherries, blueberries…) only flower and fruit
 * well after enough winter hours between 32°F and 45°F (0–7.2°C). We count those
 * hours over Nov–Feb (May–Aug in the southern hemisphere) for the last 5 winters.
 * Checked against published values: Richmond VA ≈1230, Atlanta ≈970, Dallas ≈730,
 * Sacramento ≈930, Houston ≈400, Los Angeles ≈230.
 */

interface HourlySeries {
  time: string[];
  temperature_2m: (number | null)[];
}

export function analyzeChill(series: HourlySeries, latitude: number): number | null {
  const southern = latitude < 0;
  const seasons = new Map<number, { chill: number; hours: number }>();
  for (let i = 0; i < series.time.length; i++) {
    const t = series.temperature_2m[i];
    if (t == null) continue;
    const year = Number(series.time[i].slice(0, 4));
    const month = Number(series.time[i].slice(5, 7));
    let key: number;
    if (southern) {
      if (month < 5 || month > 8) continue;
      key = year;
    } else {
      if (month > 2 && month < 11) continue;
      key = month >= 11 ? year : year - 1;
    }
    const s = seasons.get(key) ?? { chill: 0, hours: 0 };
    s.hours++;
    if (t >= 0 && t <= 7.2) s.chill++;
    seasons.set(key, s);
  }
  // Only count complete winters (~120 days of hourly data).
  const complete = [...seasons.values()].filter((s) => s.hours >= 110 * 24);
  if (complete.length === 0) return null;
  const avg = complete.reduce((a, s) => a + s.chill, 0) / complete.length;
  return Math.round(avg / 10) * 10;
}

async function fetchChillHours(latitude: number, longitude: number, now: Date): Promise<number | null> {
  // Last 5 complete winters.
  const y = now.getUTCFullYear();
  const southern = latitude < 0;
  const lastWinterEndYear = southern ? (now.getUTCMonth() >= 8 ? y : y - 1) : now.getUTCMonth() >= 2 ? y : y - 1;
  const start = southern ? utcDate(lastWinterEndYear - 4, 5, 1) : utcDate(lastWinterEndYear - 5, 11, 1);
  const end = southern ? utcDate(lastWinterEndYear, 8, 31) : utcDate(lastWinterEndYear, 2, 28);
  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.searchParams.set("latitude", latitude.toFixed(4));
  url.searchParams.set("longitude", longitude.toFixed(4));
  url.searchParams.set("start_date", isoDate(start));
  url.searchParams.set("end_date", isoDate(end));
  url.searchParams.set("hourly", "temperature_2m");
  url.searchParams.set("timezone", "auto");
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(30_000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { hourly: HourlySeries };
    return analyzeChill(data.hourly, latitude);
  } catch (err) {
    console.error("Chill hours lookup failed:", err);
    return null;
  }
}

export async function estimateClimate(latitude: number, longitude: number, now = new Date()): Promise<ClimateEstimate> {
  const endYear = now.getUTCFullYear() - 1;
  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.searchParams.set("latitude", latitude.toFixed(4));
  url.searchParams.set("longitude", longitude.toFixed(4));
  url.searchParams.set("start_date", isoDate(utcDate(endYear - 9, 1, 1)));
  url.searchParams.set("end_date", isoDate(utcDate(endYear, 12, 31)));
  url.searchParams.set("daily", "temperature_2m_min");
  url.searchParams.set("timezone", "auto");
  const [res, chillHours] = await Promise.all([
    fetch(url, { cache: "no-store", signal: AbortSignal.timeout(30_000) }),
    fetchChillHours(latitude, longitude, now),
  ]);
  if (!res.ok) throw new Error(`Climate lookup failed (${res.status})`);
  const data = (await res.json()) as { daily: DailySeries };
  return { ...analyzeClimate(data.daily, latitude), chillHours };
}
