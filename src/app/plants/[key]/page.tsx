import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlantIcon } from "@/components/PlantIcon";
import { TaskTypeChip } from "@/components/TaskCard";
import { CATEGORY_LABELS } from "@/lib/categories";
import { REFERENCE_CLIMATES, SITE_NAME, TYPE_HEADINGS, exampleWindow, jsonLd, siteUrl, suitsClimate, timingPhrase } from "@/lib/seo";
import { LIBRARY, getCuratedGuide } from "@/plants";
import type { CareTask, PlantGuide, TaskType } from "@/plants/types";

export function generateStaticParams() {
  return LIBRARY.map((g) => ({ key: g.key }));
}

const shortName = (g: PlantGuide) => g.name.split(" / ")[0].replace(/ tree$/i, "");

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const { key } = await params;
  const g = getCuratedGuide(key);
  if (!g) return {};
  const name = shortName(g);
  const title = `${name} Care: When to Prune, Fertilize & Spray`;
  const description = `${name} care made simple: when to prune ${name.toLowerCase()}, the best fertilizer, organic sprays, soil and common problems, with step-by-step how-to for your climate.`;
  return {
    title,
    description,
    alternates: { canonical: `/plants/${g.key}` },
    keywords: [`${name} care`, `how to prune ${name}`, `when to prune ${name}`, `${name} fertilizer`, `${name} problems`, g.botanical],
    openGraph: { title, description, url: `/plants/${g.key}`, type: "article", images: ["/opengraph-image"] },
  };
}

const ORDER: TaskType[] = ["prune", "fertilize", "spray", "soil", "protect", "plant-care"];

export default async function PlantGuidePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const g = getCuratedGuide(key);
  if (!g) notFound();
  const name = shortName(g);
  const lower = name.toLowerCase();

  const byType = new Map<TaskType, CareTask[]>();
  for (const t of g.tasks) byType.set(t.type, [...(byType.get(t.type) ?? []), t]);

  const prune = byType.get("prune") ?? [];
  const feed = byType.get("fertilize") ?? [];
  const sprays = byType.get("spray") ?? [];
  const productNames = (tasks: CareTask[]) => [...new Set(tasks.flatMap((t) => (t.products ?? []).map((p) => p.name)))];

  const refClimate = REFERENCE_CLIMATES.find((c) => c.id === "moderate" && suitsClimate(g, c)) ?? REFERENCE_CLIMATES.find((c) => suitsClimate(g, c)) ?? REFERENCE_CLIMATES[1];
  const faqs = [
    prune.length && {
      q: `When should I prune ${lower}?`,
      a: `${prune.map((t) => `${t.title}: ${timingPhrase(t.timing)} (around ${exampleWindow(g, t, refClimate) ?? "late winter"} in ${refClimate.zones}).`).join(" ")} ${g.overview}`,
    },
    feed.length && {
      q: `What is the best fertilizer for ${lower}?`,
      a: `${feed[0].why} Good options: ${productNames(feed).slice(0, 4).join("; ") || "a balanced slow-release fertilizer or compost"}.`,
    },
    sprays.length && {
      q: `What should I spray on ${lower}?`,
      a: `${sprays.map((t) => `${t.title} (${timingPhrase(t.timing)})`).join("; ")}. Products: ${productNames(sprays).slice(0, 5).join("; ")}. Always follow the label.`,
    },
    { q: `What soil does ${lower} need?`, a: `${g.soil.texture} Preferred pH ${g.soil.ph}. ${g.soil.amendments}` },
    { q: `How much sun and water does ${lower} need?`, a: `Sun: ${g.sun} Water: ${g.water}` },
    g.problems[0] && { q: `What are common ${lower} problems?`, a: g.problems.map((p) => `${p.name}: ${p.signs} ${p.treatment}`).join(" ") },
  ].filter(Boolean) as { q: string; a: string }[];

  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `${name} care guide: pruning, fertilizing & spraying`,
      description: g.overview,
      about: { "@type": "Thing", name: g.name, alternateName: g.botanical },
      publisher: { "@type": "Organization", name: SITE_NAME, url: siteUrl() },
      mainEntityOfPage: siteUrl(`/plants/${g.key}`),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Plant care guides", item: siteUrl("/plants") },
        { "@type": "ListItem", position: 2, name: g.name, item: siteUrl(`/plants/${g.key}`) },
      ],
    },
  ];

  const related = LIBRARY.filter((o) => o.category === g.category && o.key !== g.key).slice(0, 6);

  return (
    <article className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structured)} />
      <nav className="text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/plants" className="text-leaf-700 hover:underline">
          Plant care guides
        </Link>{" "}
        › {CATEGORY_LABELS[g.category]}
      </nav>

      <header className="space-y-3">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-leaf-900 md:text-4xl">
          <PlantIcon guide={g} size={56} />
          <span>{name} care guide: when &amp; how to prune, fertilize and spray</span>
        </h1>
        <p className="italic text-muted">
          {g.botanical} · USDA zones {g.zones.min}–{g.zones.max}
        </p>
        <p className="text-lg">{g.overview}</p>
      </header>

      <aside className="card flex flex-col gap-3 bg-leaf-50 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          <b>Get exact dates for your garden.</b> Tend Weekly works out your frost dates and emails you every Friday with what
          your {lower} needs that weekend, and how to do it.
        </p>
        <Link href="/login" className="btn shrink-0">
          Get my free schedule
        </Link>
      </aside>

      <section className="grid gap-3 md:grid-cols-3">
        <Fact title="☀️ Sun" body={g.sun} />
        <Fact title="💧 Water" body={g.water} />
        <Fact title="🪱 Soil" body={`pH ${g.soil.ph}. ${g.soil.texture} ${g.soil.amendments}`} />
      </section>

      {ORDER.filter((t) => byType.has(t)).map((type) => (
        <section key={type} className="space-y-3">
          <h2 className="text-2xl font-bold text-leaf-700">
            {type === "prune" ? `How and when to prune ${lower}` : type === "fertilize" ? `Fertilizing ${lower}` : `${TYPE_HEADINGS[type].title} for ${lower}`}
          </h2>
          {byType.get(type)!.map((t) => (
            <div key={t.id} id={t.id} className="card space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <TaskTypeChip type={t.type} />
                <h3 className="font-sans text-lg font-bold">{t.title}</h3>
              </div>
              <p className="text-sm">
                <b>When:</b> {timingPhrase(t.timing)}
                {t.repeat ? `, then every ${t.repeat.everyWeeks} weeks (${t.repeat.times} times a season)` : ""}.
              </p>
              <ul className="flex flex-wrap gap-2 text-xs">
                {REFERENCE_CLIMATES.filter((c) => suitsClimate(g, c)).map((c) => {
                  const w = exampleWindow(g, t, c);
                  return w ? (
                    <li key={c.id} className="rounded-full bg-cream px-2.5 py-1">
                      <b>{c.zones}:</b> about {w}
                    </li>
                  ) : null;
                })}
              </ul>
              <p className="text-sm text-muted">{t.why}</p>
              <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed">
                {t.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              {t.products && t.products.length > 0 && (
                <p className="text-sm">
                  <b>What to use:</b>{" "}
                  {[...t.products]
                    .sort((a, b) => Number(b.organic) - Number(a.organic))
                    .map((p) => `${p.organic ? "🌿 " : ""}${p.name}`)
                    .join(" · ")}
                </p>
              )}
              {t.tools && <p className="text-sm"><b>Tools:</b> {t.tools.join(", ")}</p>}
              {t.caution && <p className="rounded-md bg-warn-bg px-3 py-2 text-sm text-warn"><b>Caution:</b> {t.caution}</p>}
            </div>
          ))}
        </section>
      ))}

      {g.problems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-leaf-700">Common {lower} problems and how to fix them</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {g.problems.map((p) => (
              <div key={p.name} className="card text-sm">
                <h3 className="font-sans text-base font-bold">{p.name}</h3>
                <p className="mt-1"><b>Signs:</b> {p.signs}</p>
                <p className="mt-1"><b>What to do:</b> {p.treatment}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-leaf-700">{name} care FAQ</h2>
        {faqs.map((f) => (
          <details key={f.q} className="card">
            <summary className="font-semibold">{f.q}</summary>
            <p className="mt-2 text-sm">{f.a}</p>
          </details>
        ))}
      </section>

      {related.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-leaf-700">More {CATEGORY_LABELS[g.category].toLowerCase()} care guides</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((o) => (
              <Link key={o.key} href={`/plants/${o.key}`} className="chip !py-1.5 !text-sm hover:underline">
                {o.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="text-xs text-muted">
        Timings are given relative to your average frost dates, with examples for typical US climates. Always read and follow
        product labels.
      </p>
    </article>
  );
}

function Fact({ title, body }: { title: string; body: string }) {
  return (
    <div className="card text-sm">
      <h2 className="mb-1 font-sans text-base font-bold">{title}</h2>
      <p>{body}</p>
    </div>
  );
}
