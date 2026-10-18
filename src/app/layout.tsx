import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { siteUrl } from "@/lib/seo";
import { signOutAction } from "./actions";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Tend Weekly: Gardening Tips & Pruning Schedules for Your Garden",
    template: "%s | Tend Weekly",
  },
  description:
    "Free gardening help: when and how to prune, fertilize and spray every plant in your garden, timed to your local frost dates, with a Friday email that tells you what to do this weekend.",
  applicationName: "Tend Weekly",
  keywords: [
    "gardening tips",
    "gardening help",
    "pruning schedule",
    "when to prune",
    "how to prune",
    "plant care guide",
    "fertilizer schedule",
    "fruit tree care",
    "garden calendar",
    "garden planner",
  ],
  openGraph: { type: "website", siteName: "Tend Weekly", locale: "en_US" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const onboarded = Boolean(user?.lastFrost);
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-line bg-paper/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-lg font-bold text-leaf-700">
              <span aria-hidden>🌿</span>
              <span className="font-[family-name:var(--font-display)]">Tend Weekly</span>
            </Link>
            {user ? (
              <nav className="flex flex-wrap items-center gap-1 text-sm font-semibold">
                {onboarded && (
                  <>
                    <NavLink href="/dashboard">This week</NavLink>
                    <NavLink href="/garden">My plants</NavLink>
                    <NavLink href="/calendar">Calendar</NavLink>
                  </>
                )}
                <NavLink href="/settings">Settings</NavLink>
                <form action={signOutAction}>
                  <button className="rounded-md px-3 py-1.5 text-muted hover:text-ink">Sign out</button>
                </form>
              </nav>
            ) : (
              <nav className="flex flex-wrap items-center gap-1 text-sm font-semibold">
                <NavLink href="/plants">Plant guides</NavLink>
                <NavLink href="/gardening-tips">Gardening tips</NavLink>
                <Link href="/login" className="btn ml-1">
                  Sign in
                </Link>
              </nav>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl space-y-2 px-4 pb-10 pt-4 text-xs text-muted">
          <nav className="flex flex-wrap gap-x-4 gap-y-1 font-semibold" aria-label="Footer">
            <Link href="/plants" className="hover:text-leaf-700">Plant care guides</Link>
            <Link href="/gardening-tips" className="hover:text-leaf-700">Gardening tips by month</Link>
            <Link href="/plants/bigleaf-hydrangea" className="hover:text-leaf-700">Pruning hydrangeas</Link>
            <Link href="/plants/hybrid-tea-rose" className="hover:text-leaf-700">Pruning roses</Link>
            <Link href="/plants/apple" className="hover:text-leaf-700">Fruit tree care</Link>
          </nav>
          Care advice is general guidance. Always read and follow product labels. Weather data by{" "}
          <a className="underline" href="https://open-meteo.com/">
            Open-Meteo
          </a>
          .
        </footer>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-md px-3 py-1.5 text-ink hover:bg-leaf-50 hover:text-leaf-700">
      {children}
    </Link>
  );
}
