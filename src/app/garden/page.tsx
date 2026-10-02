import Link from "next/link";
import { requireOnboardedUser } from "@/lib/auth";
import { zoneNumber } from "@/lib/climate";
import { formatDate, fromMonthDay } from "@/lib/dates";
import { loadGarden } from "@/lib/garden";
import { LIBRARY, searchLibrary } from "@/plants";
import type { PlantCategory, PlantGuide } from "@/plants/types";
import { Steps } from "@/components/Steps";
import { AddCustomPlant, AddLibraryPlant } from "./AddPlant";

export const metadata = { title: "My plants" };

const CATEGORY_LABELS: Record<PlantCategory, string> = {
  rose: "Roses",
  shrub: "Flowering shrubs",
  evergreen: "Evergreens",
  tree: "Trees",
  fruit: "Fruit",
  vine: "Vines",
  perennial: "Perennials & grasses",
  herb: "Herbs",
  vegetable: "Vegetables",
  tropical: "Tropicals",
};

export default async function GardenPage({ searchParams }: { searchParams: Promise<{ q?: string; welcome?: string }> }) {
  const user = await requireOnboardedUser();
  const { q, welcome } = await searchParams;
  const garden = await loadGarden(user.id);
  const results = q ? searchLibrary(q) : [];
  const zone = zoneNumber(user.hardinessZone);
  const md = (s: string) => formatDate(fromMonthDay(2001, s), { month: "long", day: "numeric" });

  const zoneNote = (g: PlantGuide) =>
    zone != null && (zone < g.zones.min || zone > g.zones.max) ? ` · ⚠️ usually zones ${g.zones.min}–${g.zones.max}` : "";

  return (
    <div className="space-y-8">
      {(welcome || garden.length === 0) && <Steps current={2} />}
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold text-leaf-900">{garden.length ? "My plants" : "What's growing in your garden?"}</h1>
          <p className="mt-2 text-muted">
            {user.locationName} · Zone {user.hardinessZone ?? "?"} ·{" "}
            {user.frostFree ? "Frost is rare here" : `Last frost ≈ ${md(user.lastFrost)}, first frost ≈ ${md(user.firstFrost)}`}{" "}
            <Link href="/settings" className="text-leaf-700 underline">
              adjust
            </Link>
          </p>
        </div>
        {garden.length > 0 && (
          <Link href="/dashboard" className="btn">
            See this week&apos;s tasks →
          </Link>
        )}
      </section>

      {garden.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {garden.map((g) => (
            <Link key={g.id} href={`/garden/${g.id}`} className="card block transition hover:border-leaf-500">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-leaf-900">{g.displayName}</div>
                  <div className="text-xs italic text-muted">{g.guide.botanical}</div>
                </div>
                {g.quantity > 1 && <span className="chip">×{g.quantity}</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="chip !bg-cream !text-muted">{CATEGORY_LABELS[g.guide.category]}</span>
                {g.aiGenerated && <span className="chip !bg-sun/30 !text-warn">✨ AI-written guide</span>}
              </div>
            </Link>
          ))}
        </section>
      )}

      <section className="card space-y-4">
        <h2 className="text-xl font-bold text-leaf-700">Add a plant</h2>
        <form action="/garden" className="flex flex-col gap-3 sm:flex-row">
          <input
            name="q"
            defaultValue={q}
            className="input"
            placeholder="e.g. hydrangea, Knock Out rose, apple tree, Meyer lemon"
            aria-label="Search plants"
            required
          />
          <button className="btn shrink-0">Search</button>
        </form>

        {q && (
          <div className="space-y-2">
            {results.map((g) => (
              <AddLibraryPlant
                key={g.key}
                plantKey={g.key}
                name={g.name}
                detail={`${g.botanical} · zones ${g.zones.min}–${g.zones.max}${zoneNote(g)}`}
              />
            ))}
            {results.length === 0 && <p className="text-sm text-muted">No match in our library.</p>}
            <AddCustomPlant name={q} />
          </div>
        )}

        <details className="rounded-lg border border-line bg-cream p-3">
          <summary className="text-sm font-semibold text-leaf-700">Browse all {LIBRARY.length} plants in the library ▾</summary>
          <div className="mt-3 space-y-4">
            {(Object.keys(CATEGORY_LABELS) as PlantCategory[]).map((cat) => {
              const plants = LIBRARY.filter((g) => g.category === cat);
              if (!plants.length) return null;
              return (
                <div key={cat}>
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">{CATEGORY_LABELS[cat]}</h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    {plants.map((g) => (
                      <AddLibraryPlant key={g.key} plantKey={g.key} name={g.name} detail={`${g.botanical}${zoneNote(g)}`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      </section>
    </div>
  );
}
