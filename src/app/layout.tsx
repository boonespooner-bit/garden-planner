import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { signOutAction } from "./actions";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Garden Planner", template: "%s · Garden Planner" },
  description:
    "Pruning, feeding, spraying and soil schedules for your plants and your climate, with a Friday email so you can plan the weekend.",
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
              <span className="font-[family-name:var(--font-display)]">Garden Planner</span>
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
              <Link href="/login" className="btn">
                Sign in
              </Link>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-10 pt-4 text-xs text-muted">
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
