import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LIBRARY } from "@/plants";

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

  return (
    <div className="space-y-14">
      {deleted && <p className="rounded-lg bg-leaf-50 px-4 py-3 text-sm text-leaf-700">Your account and data have been deleted.</p>}
      <section className="grid items-center gap-8 pt-6 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
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
    </div>
  );
}
