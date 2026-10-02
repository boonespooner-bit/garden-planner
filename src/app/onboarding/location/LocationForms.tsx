"use client";

import { useActionState, useState } from "react";
import { setLocationAction } from "@/app/actions";
import { FormMessage, SubmitButton } from "@/components/SubmitButton";

export function LocationChoice(props: {
  label: string;
  latitude: number;
  longitude: number;
  timezone: string;
  countryCode: string;
}) {
  const [state, action] = useActionState(setLocationAction, undefined);
  return (
    <form action={action} className="card flex items-center justify-between gap-3 !py-3">
      <input type="hidden" name="name" value={props.label} />
      <input type="hidden" name="latitude" value={props.latitude} />
      <input type="hidden" name="longitude" value={props.longitude} />
      <input type="hidden" name="timezone" value={props.timezone} />
      <input type="hidden" name="countryCode" value={props.countryCode} />
      <div>
        <div className="font-semibold">{props.label}</div>
        <FormMessage state={state} />
      </div>
      <SubmitButton className="btn-ghost shrink-0" pendingText="Analyzing climate…">
        Use this
      </SubmitButton>
    </form>
  );
}

export function UseMyLocation() {
  const [state, action] = useActionState(setLocationAction, undefined);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  function locate() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Your browser doesn't support location. Please search instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        // Round to ~1 km. That's plenty for climate and weather, and better for privacy.
        setCoords({ lat: Math.round(pos.coords.latitude * 100) / 100, lon: Math.round(pos.coords.longitude * 100) / 100 });
      },
      () => {
        setLocating(false);
        setGeoError("We couldn't get your location. Please search for your town instead.");
      },
      { timeout: 15_000 },
    );
  }

  return (
    <div className="card space-y-3">
      {!coords ? (
        <button type="button" onClick={locate} className="btn-ghost w-full" disabled={locating}>
          📍 {locating ? "Finding you…" : "Use my current location"}
        </button>
      ) : (
        <form action={action} className="space-y-3">
          <input type="hidden" name="latitude" value={coords.lat} />
          <input type="hidden" name="longitude" value={coords.lon} />
          <input type="hidden" name="timezone" value={Intl.DateTimeFormat().resolvedOptions().timeZone} />
          <div>
            <label className="label" htmlFor="loc-name">
              Name this location
            </label>
            <input id="loc-name" name="name" className="input" defaultValue="My garden" />
            <p className="mt-1 text-xs text-muted">
              Approximately {coords.lat}, {coords.lon}
            </p>
          </div>
          <SubmitButton pendingText="Analyzing your climate…">Use this location</SubmitButton>
        </form>
      )}
      {geoError && <p className="text-sm text-warn">{geoError}</p>}
      <FormMessage state={state} />
    </div>
  );
}
