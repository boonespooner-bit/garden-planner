"use client";

import { useActionState } from "react";
import { sendTestDigestAction, updateSettingsAction } from "@/app/actions";
import { FormMessage, SubmitButton } from "@/components/SubmitButton";

interface Props {
  hardinessZone: string;
  lastFrost: string;
  firstFrost: string;
  frostFree: boolean;
  units: "imperial" | "metric";
  treatmentPreference: "organic" | "both";
  weeklyEmail: boolean;
}

export function SettingsForm({ user }: { user: Props }) {
  const [state, action] = useActionState(updateSettingsAction, undefined);
  // Date inputs need a full date; the year is ignored when saving.
  const year = new Date().getFullYear();
  return (
    <form action={action} className="space-y-6">
      <section className="card space-y-4">
        <div>
          <h2 className="text-lg font-bold text-leaf-700">Climate</h2>
          <p className="text-sm text-muted">
            We estimated these from 10 years of local weather. If your local extension office or experience says otherwise,
            adjust them. All your task dates move with them.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="hardinessZone">
              Hardiness zone
            </label>
            <input id="hardinessZone" name="hardinessZone" defaultValue={user.hardinessZone} className="input" placeholder="7a" />
          </div>
          <div>
            <label className="label" htmlFor="lastFrost">
              Average last spring frost
            </label>
            <input id="lastFrost" name="lastFrost" type="date" defaultValue={`${year}-${user.lastFrost}`} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="firstFrost">
              Average first fall frost
            </label>
            <input id="firstFrost" name="firstFrost" type="date" defaultValue={`${year}-${user.firstFrost}`} className="input" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="frostFree" defaultChecked={user.frostFree} className="h-4 w-4 accent-leaf-700" />
          Frost is rare where I live (hides frost-protection tasks)
        </label>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-bold text-leaf-700">Preferences</h2>
        <fieldset>
          <legend className="label">Sprays &amp; fertilizers to show</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="treatmentPreference" value="both" defaultChecked={user.treatmentPreference === "both"} className="accent-leaf-700" />
            Organic and conventional (organic listed first)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="treatmentPreference" value="organic" defaultChecked={user.treatmentPreference === "organic"} className="accent-leaf-700" />
            Organic only 🌿
          </label>
        </fieldset>
        <fieldset>
          <legend className="label">Units</legend>
          <label className="mr-4 inline-flex items-center gap-2 text-sm">
            <input type="radio" name="units" value="imperial" defaultChecked={user.units === "imperial"} className="accent-leaf-700" />
            °F / inches
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="radio" name="units" value="metric" defaultChecked={user.units === "metric"} className="accent-leaf-700" />
            °C / mm
          </label>
        </fieldset>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="weeklyEmail" defaultChecked={user.weeklyEmail} className="h-4 w-4 accent-leaf-700" />
          Email me every Friday morning with my weekend garden plan
        </label>
      </section>

      <div>
        <SubmitButton pendingText="Saving…">Save settings</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function TestEmailButton() {
  const [state, action] = useActionState(sendTestDigestAction, undefined);
  return (
    <form action={action}>
      <SubmitButton className="btn-ghost" pendingText="Sending…">
        📬 Send me a preview
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
