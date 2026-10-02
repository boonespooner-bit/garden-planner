import { requireUser } from "@/lib/auth";
import { geocode, placeLabel, type GeocodeResult } from "@/lib/climate";
import { LocationChoice, UseMyLocation } from "./LocationForms";
import { Steps } from "@/components/Steps";

export const metadata = { title: "Your location" };

export default async function LocationPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser();
  const { q } = await searchParams;
  let results: GeocodeResult[] = [];
  let error: string | null = null;
  if (q) {
    try {
      results = await geocode(q);
    } catch {
      error = "Location search is unavailable right now. Please try again shortly.";
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Steps current={1} />
      <div>
        <h1 className="text-3xl font-bold text-leaf-900">Where is your garden?</h1>
        <p className="mt-2 text-muted">
          Your location sets your hardiness zone and average frost dates, which decide when every task falls. It also drives
          your weather forecast. We only store the town or the coordinates you choose.
        </p>
        {user.locationName && (
          <p className="mt-2 text-sm">
            Current location: <b>{user.locationName}</b>
          </p>
        )}
      </div>

      <form className="card flex flex-col gap-3 sm:flex-row" action="/onboarding/location">
        <input
          name="q"
          defaultValue={q}
          required
          className="input"
          placeholder="Town, city or postcode, e.g. Richmond, Virginia"
          aria-label="Search for your town"
        />
        <button className="btn shrink-0">Search</button>
      </form>

      {error && <p className="rounded-lg bg-warn-bg px-3 py-2 text-sm text-warn">{error}</p>}
      {q && !error && results.length === 0 && (
        <p className="text-sm text-muted">No places found for &ldquo;{q}&rdquo;. Try the nearest town or city name.</p>
      )}
      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Choose your location:</p>
          {results.map((r) => (
            <LocationChoice
              key={`${r.latitude},${r.longitude}`}
              label={placeLabel(r)}
              latitude={r.latitude}
              longitude={r.longitude}
              timezone={r.timezone}
              countryCode={r.countryCode ?? ""}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>
      <UseMyLocation />
    </div>
  );
}
