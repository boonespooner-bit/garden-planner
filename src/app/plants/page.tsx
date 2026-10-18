import type { Metadata } from "next";
import Link from "next/link";
import { PlantIcon } from "@/components/PlantIcon";
import { CATEGORY_LABELS } from "@/lib/categories";
import { MONTHS, guidesByCategory, jsonLd, monthName, siteUrl } from "@/lib/seo";
import { LIBRARY } from "@/plants";
import type { PlantCategory } from "@/plants/types";

export const metadata: Metadata = {
  title: "Plant Care Guides: Pruning & Gardening Tips",
  description: `Free gardening help for ${LIBRARY.length} plants: when and how to prune, what fertilizer and organic sprays to use, soil needs and common problems for roses, hydrangeas, fruit trees, nut trees, shrubs and more.`,
  alternates: { canonical: "/plants" },
};

export default function PlantsIndex() {
  const groups = guidesByCategory();
  const order = Object.keys(CATEGORY_LABELS) as PlantCategory[];
  const thisMonth = MONTHS[new Date().getMonth()];

  return (
    <div className="space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Plant care guides",
          url: siteUrl("/plants"),
          hasPart: LIBRARY.map((g) => ({ "@type": "Article", name: `${g.name} care guide`, url: siteUrl(`/plants/${g.key}`) })),
        })}
      />
      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-leaf-900 md:text-4xl">Plant care guides &amp; gardening tips</h1>
        <p className="max-w-3xl text-lg text-muted">
          Step-by-step gardening help for {LIBRARY.length} plants: exactly when to prune, how much to cut, which fertilizer and
          organic sprays to use, the soil each plant likes, and how to fix common problems. Timing is based on your local
          frost dates, so it works in any climate.
        </p>
        <p className="text-sm">
          Looking for what to do right now?{" "}
          <Link href={`/gardening-tips/${thisMonth}`} className="font-semibold text-leaf-700 underline">
            {monthName(thisMonth)} gardening tips →
          </Link>
        </p>
      </header>

      {order.map((cat) => {
        const plants = groups.get(cat);
        if (!plants?.length) return null;
        return (
          <section key={cat} className="space-y-3">
            <h2 className="text-2xl font-bold text-leaf-700">{CATEGORY_LABELS[cat]}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {plants.map((g) => (
                <Link key={g.key} href={`/plants/${g.key}`} className="card flex items-center gap-3 !p-4 transition hover:border-leaf-500">
                  <PlantIcon guide={g} size={40} />
                  <span>
                    <span className="block font-semibold text-leaf-900">{g.name} care</span>
                    <span className="block text-xs italic text-muted">{g.botanical}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
