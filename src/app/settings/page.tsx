import Link from "next/link";
import { deleteAccountAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { SettingsForm, TestEmailButton } from "./SettingsForm";

export const metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; delete?: string }> }) {
  const user = await requireUser();
  const { saved, delete: del } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-leaf-900">Settings</h1>
      {saved === "location" && (
        <p className="rounded-lg bg-leaf-50 px-3 py-2 text-sm text-leaf-700">
          Location updated, and your zone and frost dates have been recalculated.
        </p>
      )}

      <section className="card space-y-2">
        <h2 className="text-lg font-bold text-leaf-700">Location</h2>
        <p>{user.locationName ?? "Not set"}</p>
        <Link href="/onboarding/location" className="btn-ghost">
          Change location
        </Link>
      </section>

      {user.lastFrost && user.firstFrost ? (
        <SettingsForm
          user={{
            hardinessZone: user.hardinessZone ?? "",
            lastFrost: user.lastFrost,
            firstFrost: user.firstFrost,
            frostFree: user.frostFree,
            chillHours: user.chillHours,
            units: user.units,
            treatmentPreference: user.treatmentPreference,
            weeklyEmail: user.weeklyEmail,
          }}
        />
      ) : (
        <p className="text-muted">Set your location first to configure your garden.</p>
      )}

      <section className="card space-y-2">
        <h2 className="text-lg font-bold text-leaf-700">Preview the Friday email</h2>
        <p className="text-sm text-muted">Send this week&apos;s plan to {user.email} right now.</p>
        <TestEmailButton />
      </section>

      <section className="card space-y-3 border-clay/40">
        <h2 className="text-lg font-bold text-clay">Delete account</h2>
        <p className="text-sm text-muted">Permanently deletes your account, plants and history. This can&apos;t be undone.</p>
        <form action={deleteAccountAction} className="flex flex-col gap-2 sm:flex-row">
          <input
            name="confirm"
            className="input"
            placeholder='Type "DELETE" to confirm'
            aria-label="Type DELETE to confirm"
            autoComplete="off"
          />
          <button className="btn !bg-clay hover:!bg-clay/80 shrink-0">Delete my account</button>
        </form>
        {del === "confirm" && <p className="text-sm text-warn">Please type DELETE to confirm.</p>}
      </section>
    </div>
  );
}
