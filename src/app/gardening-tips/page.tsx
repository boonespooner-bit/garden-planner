import type { Metadata } from "next";
import Link from "next/link";
import { MONTHS, monthName } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Gardening Tips by Month: Your Year-Round Garden Calendar",
  description:
    "Month-by-month gardening tips: what to prune, fertilize, spray and protect each month of the year, for cold, moderate and mild climates.",
  alternates: { canonical: "/gardening-tips" },
};

export default function GardeningTipsIndex() {
  const current = MONTHS[new Date().getMonth()];
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-leaf-900 md:text-4xl">Gardening tips by month</h1>
        <p className="max-w-3xl text-lg text-muted">
          A year-round garden calendar: what to prune, feed, spray and protect each month, for cold, moderate and mild
          climates. Every task links to a step-by-step plant care guide.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {MONTHS.map((m) => (
          <Link
            key={m}
            href={`/gardening-tips/${m}`}
            className={`card !p-4 font-semibold transition hover:border-leaf-500 ${m === current ? "border-leaf-500 bg-leaf-50" : ""}`}
          >
            {monthName(m)} gardening tips
            {m === current && <span className="ml-2 chip">This month</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
