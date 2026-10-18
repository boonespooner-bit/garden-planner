import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlantIcon } from "@/components/PlantIcon";
import { getCurrentUser } from "@/lib/auth";
import { MONTHS, SITE_NAME, jsonLd, monthName, siteUrl } from "@/lib/seo";
import { LIBRARY, getCuratedGuide } from "@/plants";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const POPULAR = [
  "bigleaf-hydrangea", "hybrid-tea-rose", "apple", "peach", "blueberry", "lavender",
  "crape-myrtle", "fig", "citrus", "boxwood", "japanese-maple", "grape",
];

const FAQS = [
  {
    q: "What is Tend Weekly?",
    a: "Tend Weekly is a free garden planner. Tell it where you live and what you grow, and it builds a year-round schedule for pruning, fertilizing, spraying, soil care and frost protection, with step-by-step instructions, then emails you every Friday with what to do that weekend.",
  },
  {
    q: "How does it know when I should prune?",
    a: "Every task is timed relative to your local average last spring frost and first fall frost, which we estimate from 10 years of weather data for your exact location. It also knows whether each plant flowers on old or new wood, which decides whether to prune in late winter or right after flowering.",
  },
  {
    q: "Does it recommend organic products?",
    a: "Yes. Every fertilizer and spray suggestion lists organic options first, followed by conventional alternatives, and you can switch to organic-only in settings.",
  },
  {
    q: "Will it work where I live?",
    a: "Yes. It works anywhere in the world and in both hemispheres. It also checks your winter chill hours, so it can warn you when a fruit tree needs a low-chill variety to fruit in a mild climate.",
  },
  {
    q: "Is it free?",
    a: "Yes. Creating your garden plan and getting the Friday email is free.",
  },
];

export default async function Home({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(user.lastFrost ? "/dashboard" : "/onboarding/location");
  const { deleted } = await searchParams;

  const features = [
    { icon: "✂️", title: "Pruning, timed to your climate", body: "Knows whether each plant blooms on old or new wood, and turns that into real dates for where you live." },
    { icon: "📖", title: "Step-by-step how-to", body: "Where to cut, how much to take off, and which tools to use. Written for gardeners, not botanists." },
    { icon: "🌱", title: "Feeding, soil & sprays", body: "What fertilizer, soil amendment or spray to use, and when. Organic options first, with conventional alternatives." },
    { icon: "📬", title: "Friday morning email", body: "A weekend plan with everything that's due, plus what the forecast means for it." },
    { icon: "🌦️", title: "Live weather warnings", body: "Frost, heat, rain and wind alerts, and which days are good for spraying." },
    { icon: "🌍", title: "Works anywhere", body: `Hardiness zone and frost dates estimated for your exact location, in either hemisphere. ${LIBRARY.length} plants built in, and any other plant on request.` },
  ];

  const thisMonth = MONTHS[new Date().getMonth()];
  const popular = POPULAR.map((k) => getCuratedGuide(k)).filter((g) => g != null);

  return (
    <div className="space-y-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd([
          { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: siteUrl() },
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: SITE_NAME,
            url: siteUrl(),
            applicationCategory: "LifestyleApplication",
            operatingSystem: "Any",
            description: "A free garden planner with pruning, fertilizing and spraying schedules timed to your climate, plus a weekly email.",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
        ])}
      />
      {deleted && <p className="rounded-lg bg-leaf-50 px-4 py-3 text-sm text-leaf-700">Your account and data have been deleted.</p>}
      <section className="grid items-center gap-8 pt-6 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <p className="text-sm font-bold uppercase tracking-wide text-leaf-700">
            Free garden planner · gardening tips &amp; pruning schedules
          </p>
          <h1 className="text-4xl font-bold leading-tight text-leaf-900 md:text-5xl">
            Know exactly what your garden needs this weekend.
          </h1>
          <p className="text-lg text-muted">
            Tell us where you live and what you grow. We&apos;ll build a year-round pruning, feeding, spraying and soil plan,
            and email you every Friday with what to do and how to do it.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className="btn text-base">
              Start my garden plan, free
            </Link>
          </div>
        </div>
        <div className="card space-y-3 bg-leaf-50">
          <div className="text-xs font-bold uppercase tracking-wide text-leaf-700">Example · Friday email</div>
          <div className="rounded-lg border-l-4 border-warn bg-warn-bg px-3 py-2 text-sm">
            <b className="text-warn">⚠️ Frost possible Sunday night (31°F)</b>
            <p>Cover new transplants at dusk.</p>
          </div>
          <div className="rounded-lg bg-paper p-3 text-sm">
            <span className="chip">✂️ Prune</span>
            <p className="mt-1 font-semibold">Roses: main spring prune</p>
            <p className="text-muted">Keep 3–5 strong canes, cut to 12–24 in above an outward-facing bud…</p>
          </div>
          <div className="rounded-lg bg-paper p-3 text-sm">
            <span className="chip">🌱 Fertilize</span>
            <p className="mt-1 font-semibold">Blueberries: acid feeding at bud break</p>
            <p className="text-muted">🌿 Holly-tone 4-3-4 · ⚗️ ammonium sulfate</p>
          </div>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="card">
            <div className="text-2xl" aria-hidden>
              {f.icon}
            </div>
            <h3 className="mt-2 text-lg font-bold text-leaf-900">{f.title}</h3>
            <p className="mt-1 text-sm text-muted">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl font-bold text-leaf-900">Free plant care guides</h2>
          <Link href="/plants" className="text-sm font-semibold text-leaf-700 hover:underline">
            All {LIBRARY.length} plant guides →
          </Link>
        </div>
        <p className="max-w-3xl text-muted">
          Gardening help for the plants people ask about most: when and how to prune, the right fertilizer, organic sprays,
          soil and common problems.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((g) => (
            <Link key={g.key} href={`/plants/${g.key}`} className="card flex items-center gap-3 !p-3 transition hover:border-leaf-500">
              <PlantIcon guide={g} size={36} />
              <span className="text-sm font-semibold text-leaf-900">How to care for {g.name.split(" / ")[0].toLowerCase()}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="card flex flex-col gap-3 bg-leaf-50 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-leaf-900">{monthName(thisMonth)} gardening tips</h2>
          <p className="text-sm text-muted">
            What to prune, feed, spray and protect this month, for cold, moderate and mild climates.
          </p>
        </div>
        <Link href={`/gardening-tips/${thisMonth}`} className="btn shrink-0">
          See this month&apos;s garden checklist
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-leaf-900">Gardening help, answered</h2>
        {FAQS.map((f) => (
          <details key={f.q} className="card">
            <summary className="font-semibold">{f.q}</summary>
            <p className="mt-2 text-sm text-muted">{f.a}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
