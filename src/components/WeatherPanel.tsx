import { formatDate, parseIsoDate } from "@/lib/dates";
import {
  buildWarnings,
  formatPrecip,
  formatTemp,
  isSprayDay,
  weatherIcon,
  type ForecastDay,
} from "@/lib/weather";

export function WeatherPanel({ forecast, units }: { forecast: ForecastDay[] | null; units: "imperial" | "metric" }) {
  if (!forecast) {
    return <div className="card text-sm text-muted">The weather forecast is unavailable right now.</div>;
  }
  const warnings = buildWarnings(forecast, units);
  const days = forecast.slice(0, 7);
  return (
    <section className="card space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold text-leaf-700">Weather this week</h2>
        <span className="text-xs text-muted">🧴 = good spray day</span>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {days.map((d, i) => (
          <div key={d.date} className="rounded-lg border border-line bg-cream p-2 text-center">
            <div className="text-xs font-semibold text-muted">
              {i === 0 ? "Today" : formatDate(parseIsoDate(d.date), { weekday: "short" })}
            </div>
            <div className="text-2xl" aria-hidden>
              {weatherIcon(d.code)}
            </div>
            <div className="text-sm">
              <span className="font-bold">{formatTemp(d.tMaxC, units)}</span>{" "}
              <span className="text-muted">{formatTemp(d.tMinC, units)}</span>
            </div>
            <div className="text-xs text-muted" title={formatPrecip(d.precipMm, units)}>
              💧 {d.precipChance}%
            </div>
            {isSprayDay(d, forecast[i + 1]) && (
              <div className="text-xs" title="Dry, calm and mild: a good day to spray">
                🧴
              </div>
            )}
          </div>
        ))}
      </div>
      {warnings.length > 0 && (
        <ul className="space-y-2">
          {warnings.map((w) => (
            <li key={w.kind} className="rounded-lg border-l-4 border-warn bg-warn-bg px-3 py-2 text-sm">
              <span className="font-semibold text-warn">⚠️ {w.title}</span>
              <p className="text-ink">{w.advice}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
