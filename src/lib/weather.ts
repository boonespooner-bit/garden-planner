/**
 * Live forecast (Open-Meteo, free, no key) plus gardener-oriented warnings:
 * frost, heat, rain and wind, and which days are good for spraying.
 */
import { formatDate, parseIsoDate } from "./dates";

export interface ForecastDay {
  date: string; // YYYY-MM-DD (local)
  tMaxC: number;
  tMinC: number;
  precipMm: number;
  precipChance: number; // %
  windKmh: number;
  code: number; // WMO weather code
}

export type WarningKind = "freeze" | "frost" | "heat" | "rain" | "wind" | "dry";

export interface WeatherWarning {
  kind: WarningKind;
  date: string;
  title: string;
  advice: string;
}

export async function getForecast(lat: number, lon: number, days = 10): Promise<ForecastDay[]> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat.toFixed(3));
  url.searchParams.set("longitude", lon.toFixed(3));
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", String(days));
  const res = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Forecast failed (${res.status})`);
  const d = (await res.json()).daily as Record<string, (number | string | null)[]>;
  return (d.time as string[]).map((date, i) => ({
    date,
    tMaxC: Number(d.temperature_2m_max[i] ?? 0),
    tMinC: Number(d.temperature_2m_min[i] ?? 0),
    precipMm: Number(d.precipitation_sum[i] ?? 0),
    precipChance: Number(d.precipitation_probability_max[i] ?? 0),
    windKmh: Number(d.wind_speed_10m_max[i] ?? 0),
    code: Number(d.weather_code[i] ?? 0),
  }));
}

/** Forecast that never throws. The weather panel is nice-to-have, never a blocker. */
export async function getForecastSafe(lat: number | null, lon: number | null): Promise<ForecastDay[] | null> {
  if (lat == null || lon == null) return null;
  try {
    return await getForecast(lat, lon);
  } catch (err) {
    console.error("Forecast unavailable:", err);
    return null;
  }
}

export const isWet = (d: ForecastDay) => d.precipChance >= 60 || d.precipMm >= 5;

/** A day is good for spraying when it's dry, calm and mild, and no rain is due the next day. */
export function isSprayDay(d: ForecastDay, next?: ForecastDay): boolean {
  return !isWet(d) && d.windKmh < 20 && d.tMaxC <= 29 && d.tMaxC >= 7 && (!next || next.precipChance < 60);
}

export function buildWarnings(days: ForecastDay[], units: "imperial" | "metric", horizon = 7): WeatherWarning[] {
  const t = (c: number) => formatTemp(c, units);
  const warnings: WeatherWarning[] = [];
  const window = days.slice(0, horizon);
  const day = (d: ForecastDay) => formatDate(parseIsoDate(d.date), { weekday: "long" });

  const freeze = window.find((d) => d.tMinC <= -2);
  const frost = window.find((d) => d.tMinC <= 1);
  if (freeze) {
    warnings.push({
      kind: "freeze",
      date: freeze.date,
      title: `Hard freeze ${day(freeze)} night (low ${t(freeze.tMinC)})`,
      advice:
        "Bring tender potted plants inside. Cover blooming shrubs and new growth with frost cloth or old sheets to the ground. Water dry soil beforehand (moist soil holds heat). Hold off pruning until after the freeze.",
    });
  } else if (frost) {
    warnings.push({
      kind: "frost",
      date: frost.date,
      title: `Frost possible ${day(frost)} night (low ${t(frost.tMinC)})`,
      advice:
        "Cover tender plants and fresh transplants at dusk and uncover in the morning. Don't fertilize or prune tender plants right before a frost.",
    });
  }

  const hot = window.find((d) => d.tMaxC >= 32);
  if (hot) {
    warnings.push({
      kind: "heat",
      date: hot.date,
      title: `Heat on ${day(hot)} (high ${t(hot.tMaxC)})`,
      advice:
        "Water deeply in the early morning. Don't spray oils or sulfur above 85°F/29°C, as they burn leaves. Postpone transplanting and heavy pruning.",
    });
  }

  const rainy = window.filter(isWet);
  if (rainy.length) {
    const first = rainy[0];
    warnings.push({
      kind: "rain",
      date: first.date,
      title: `Rain expected ${rainy.map(day).slice(0, 3).join(", ")}`,
      advice:
        "Spray at least 24 hours before rain, or wait until after, so it doesn't wash off. A light rain right after spreading granular fertilizer is ideal for watering it in. Avoid pruning in wet weather, which spreads disease.",
    });
  } else if (window.length >= 5 && window.every((d) => d.precipMm < 1)) {
    warnings.push({
      kind: "dry",
      date: window[0].date,
      title: "Dry week ahead",
      advice: "Plan a deep watering this weekend, especially for new plantings, containers and shallow-rooted shrubs.",
    });
  }

  const windy = window.find((d) => d.windKmh >= 35);
  if (windy) {
    warnings.push({
      kind: "wind",
      date: windy.date,
      title: `Windy on ${day(windy)}`,
      advice: "Don't spray on windy days. It drifts and wastes product. Check stakes and ties on young trees and climbers.",
    });
  }
  return warnings;
}

export function sprayDays(days: ForecastDay[], horizon = 7): ForecastDay[] {
  return days.slice(0, horizon).filter((d, i) => isSprayDay(d, days[i + 1]));
}

export function formatTemp(c: number, units: "imperial" | "metric"): string {
  return units === "imperial" ? `${Math.round(c * 1.8 + 32)}°F` : `${Math.round(c)}°C`;
}

export function formatPrecip(mm: number, units: "imperial" | "metric"): string {
  return units === "imperial" ? `${(mm / 25.4).toFixed(2)} in` : `${mm.toFixed(1)} mm`;
}

export function weatherIcon(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 57) return "🌦️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌧️";
  if (code <= 86) return "🌨️";
  return "⛈️";
}

export function defaultUnits(countryCode: string | null | undefined): "imperial" | "metric" {
  return countryCode && ["US", "LR", "MM"].includes(countryCode.toUpperCase()) ? "imperial" : "metric";
}
