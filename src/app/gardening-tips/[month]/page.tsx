import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MONTHS, REFERENCE_CLIMATES, SITE_NAME, TYPE_HEADINGS, jsonLd, monthName, siteUrl, tasksForMonth, type MonthSlug } from "@/lib/seo";
import type { TaskType } from "@/plants/types";

export function generateStaticParams() {
  return MONTHS.map((month) => ({ month }));
}

const isMonth = (m: string): m is MonthSlug => (MONTHS as readonly string[]).includes(m);

export async function generateMetadata({ params }: { params: Promise<{ month: string }> }): Promise<Metadata> {
  const { month } = await params;
  if (!isMonth(month)) return {};
  const M = monthName(month);
  const title = `${M} Gardening Tips: What to Prune & Feed in ${M}`;
  const description = `Your ${M} garden checklist: what to prune in ${M}, what to fertilize, which sprays to apply and how to protect plants, for cold, moderate and mild climates.`;
  return {
    title,
    description,
    alternates: { canonical: `/gardening-tips/${month}` },
    keywords: [`${M} gardening tips`, `what to prune in ${M}`, `${M} garden checklist`, `gardening in ${M}`, "gardening tips"],
    openGraph: { title, description, url: `/gardening-tips/${month}`, type: "article", images: ["/opengraph-image"] },
  };
}

const ORDER: TaskType[] = ["prune", "fertilize", "spray", "soil", "protect", "plant-care"];

export default async function MonthTips({ params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  if (!isMonth(month)) notFound();
  const M = monthName(month);
  const idx = MONTHS.indexOf(month);
  const prev = MONTHS[(idx + 11) % 12];
  const next = MONTHS[(idx + 1) % 12];

  const climates = REFERENCE_CLIMATES.map((c) => ({ climate: c, tasks: tasksForMonth(month, c) }));

  return (
    <article className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `${M} gardening tips: what to prune, feed and spray`,
          publisher: { "@type": "Organization", name: SITE_NAME, url: siteUrl() },
          mainEntityOfPage: siteUrl(`/gardening-tips/${month}`),
        })}
      />
      <header className="space-y-3">
        <p className="text-sm font-semibold text-muted">Gardening tips by month</p>
        <h1 className="text-3xl font-bold text-leaf-900 md:text-4xl">{M} gardening tips: what to prune, feed &amp; protect</h1>
        <p className="max-w-3xl text-lg text-muted">
          {/^[AEIOU]/.test(M) ? "An" : "A"} {M} garden checklist built from our plant care guides. Garden jobs depend on your local frost dates, so tasks are
          grouped for cold, moderate and mild climates. Find yours below, then tap any plant for full step-by-step instructions.
        </p>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Jump to climate">
          {REFERENCE_CLIMATES.map((c) => (
            <a key={c.id} href={`#${c.id}`} className="chip !py-1.5">
              {c.label} ({c.zones})
            </a>
          ))}
        </nav>
      </header>

      <aside className="card flex flex-col gap-3 bg-leaf-50 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          <b>Want a list for just your plants?</b> Tend Weekly emails you every Friday with exactly what your garden needs that
          weekend, timed to your frost dates and forecast.
        </p>
        <Link href="/login" className="btn shrink-0">
          Get my weekly garden plan
        </Link>
      </aside>

      {climates.map(({ climate, tasks }) => (
        <section key={climate.id} id={climate.id} className="space-y-4">
          <h2 className="text-2xl font-bold text-leaf-700">
            {M} in {climate.label.toLowerCase()} ({climate.zones})
          </h2>
          {tasks.size === 0 && <p className="text-muted">A quiet month. Enjoy the garden and plan for next season.</p>}
          {ORDER.filter((t) => tasks.has(t)).map((type) => (
            <div key={type} className="card space-y-2">
              <h3 className="font-sans text-lg font-bold">
                {TYPE_HEADINGS[type].title} in {M}
              </h3>
              <ul className="space-y-1 text-sm">
                {tasks.get(type)!.map(({ guide, task, window }) => (
                  <li key={`${guide.key}-${task.id}`}>
                    <Link href={`/plants/${guide.key}#${task.id}`} className="font-semibold text-leaf-700 hover:underline">
                      {guide.name}
                    </Link>
                    : {task.title.charAt(0).toLowerCase() + task.title.slice(1)}{" "}
                    <span className="text-muted">({window})</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}

      <nav className="flex justify-between text-sm font-semibold">
        <Link href={`/gardening-tips/${prev}`} className="text-leaf-700 hover:underline">
          ← {monthName(prev)} gardening tips
        </Link>
        <Link href={`/gardening-tips/${next}`} className="text-leaf-700 hover:underline">
          {monthName(next)} gardening tips →
        </Link>
      </nav>
    </article>
  );
}
