"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { GuideLimitError, getOrCreateCustomGuide } from "@/lib/ai-guide";
import { redeemLoginToken, requireUser, sendLoginLink, signOut, verifyUnsubscribeToken } from "@/lib/auth";
import { estimateClimate } from "@/lib/climate";
import { buildDigest } from "@/lib/digest";
import { sendEmail } from "@/lib/email";
import { setCompletion } from "@/lib/garden";
import { defaultUnits } from "@/lib/weather";
import { exactLibraryMatch, getCuratedGuide } from "@/plants";

export type FormState = { error?: string; message?: string } | undefined;

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/* ---------- Auth ---------- */

export async function requestLoginAction(_: FormState, form: FormData): Promise<FormState> {
  let result;
  try {
    result = await sendLoginLink(str(form, "email"));
  } catch (err) {
    console.error("Sign-in email failed:", err);
    return { error: "We couldn't send the sign-in email just now. Please try again in a few minutes." };
  }
  if (!result.ok) return { error: result.error };
  return { message: "Check your inbox for a sign-in link. It expires in 20 minutes." };
}

export async function redeemLoginAction(form: FormData) {
  const user = await redeemLoginToken(str(form, "token"));
  if (!user) redirect("/login?expired=1");
  redirect(user.lastFrost ? "/dashboard" : "/onboarding/location");
}

export async function signOutAction() {
  await signOut();
  redirect("/");
}

/* ---------- Location ---------- */

export async function setLocationAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const latitude = Number(form.get("latitude"));
  const longitude = Number(form.get("longitude"));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return { error: "That location couldn't be read. Please try searching again." };
  }
  const name = str(form, "name") || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
  const timezone = str(form, "timezone") || "UTC";
  const countryCode = str(form, "countryCode") || null;

  let climate;
  try {
    climate = await estimateClimate(latitude, longitude);
  } catch (err) {
    console.error(err);
    return { error: "We couldn't look up the climate for that location just now. Please try again in a minute." };
  }

  await db
    .update(schema.users)
    .set({
      locationName: name,
      latitude,
      longitude,
      timezone,
      countryCode,
      hardinessZone: climate.hardinessZone,
      lastFrost: climate.lastFrost,
      firstFrost: climate.firstFrost,
      frostFree: climate.frostFree,
      // Only pick units the first time; afterwards respect the user's choice.
      ...(user.lastFrost ? {} : { units: defaultUnits(countryCode) }),
    })
    .where(eq(schema.users.id, user.id));

  revalidatePath("/", "layout");
  redirect(user.lastFrost ? "/settings?saved=location" : "/garden?welcome=1");
}

/* ---------- Garden ---------- */

export async function addPlantAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const plantKey = str(form, "plantKey");
  const customName = str(form, "customName");
  const nickname = str(form, "nickname").slice(0, 80) || null;
  const quantity = Math.min(999, Math.max(1, Number(form.get("quantity")) || 1));

  if (plantKey) {
    if (!getCuratedGuide(plantKey)) return { error: "Unknown plant." };
    await db.insert(schema.gardenPlants).values({ userId: user.id, plantKey, nickname, quantity });
  } else if (customName) {
    const curated = exactLibraryMatch(customName);
    if (curated) {
      await db.insert(schema.gardenPlants).values({ userId: user.id, plantKey: curated.key, nickname, quantity });
    } else {
      try {
        const custom = await getOrCreateCustomGuide(customName, user.id);
        if (!custom) return { error: `We couldn't identify "${customName}" as a garden plant. Try its common or botanical name.` };
        await db.insert(schema.gardenPlants).values({ userId: user.id, customGuideId: custom.id, nickname, quantity });
      } catch (err) {
        if (err instanceof GuideLimitError) return { error: err.message };
        console.error(err);
        return { error: "Something went wrong writing a care guide for that plant. Please try again." };
      }
    }
  } else {
    return { error: "Choose a plant first." };
  }
  revalidatePath("/", "layout");
  return { message: "Added to your garden." };
}

export async function updatePlantAction(form: FormData) {
  const user = await requireUser();
  const id = str(form, "id");
  await db
    .update(schema.gardenPlants)
    .set({
      nickname: str(form, "nickname").slice(0, 80) || null,
      quantity: Math.min(999, Math.max(1, Number(form.get("quantity")) || 1)),
      notes: str(form, "notes").slice(0, 2000) || null,
    })
    .where(and(eq(schema.gardenPlants.id, id), eq(schema.gardenPlants.userId, user.id)));
  revalidatePath("/", "layout");
}

export async function removePlantAction(form: FormData) {
  const user = await requireUser();
  await db
    .delete(schema.gardenPlants)
    .where(and(eq(schema.gardenPlants.id, str(form, "id")), eq(schema.gardenPlants.userId, user.id)));
  revalidatePath("/", "layout");
  redirect("/garden");
}

export async function toggleTaskAction(form: FormData) {
  const user = await requireUser();
  const key = str(form, "key");
  // Keys look like "<gardenPlantId>:<taskId>:<round>:<season>". Only allow the user's own plants.
  const plantId = key.split(":")[0];
  const [owned] = await db
    .select({ id: schema.gardenPlants.id })
    .from(schema.gardenPlants)
    .where(and(eq(schema.gardenPlants.id, plantId), eq(schema.gardenPlants.userId, user.id)));
  if (!owned) return;
  await setCompletion(user.id, key, str(form, "done") === "1");
  revalidatePath("/", "layout");
}

/* ---------- Settings ---------- */

const MD = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export async function updateSettingsAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  // <input type="date"> sends YYYY-MM-DD; we store MM-DD.
  const toMd = (v: string) => (v.length === 10 ? v.slice(5) : v);
  const lf = toMd(str(form, "lastFrost"));
  const ff = toMd(str(form, "firstFrost"));
  if (!MD.test(lf) || !MD.test(ff)) return { error: "Please enter valid frost dates." };
  const zone = str(form, "hardinessZone");
  if (zone && !/^(1[0-3]|[1-9])[ab]?$/.test(zone)) return { error: "Zone should look like 7a or 10b." };

  await db
    .update(schema.users)
    .set({
      lastFrost: lf,
      firstFrost: ff,
      hardinessZone: zone || null,
      frostFree: form.get("frostFree") === "on",
      units: str(form, "units") === "metric" ? "metric" : "imperial",
      treatmentPreference: str(form, "treatmentPreference") === "organic" ? "organic" : "both",
      weeklyEmail: form.get("weeklyEmail") === "on",
    })
    .where(eq(schema.users.id, user.id));
  revalidatePath("/", "layout");
  return { message: "Settings saved." };
}

export async function sendTestDigestAction(): Promise<FormState> {
  const user = await requireUser();
  try {
    const digest = await buildDigest(user);
    if (!digest) return { error: "Nothing to send yet. Add some plants first." };
    await sendEmail({ ...digest.email, subject: `[Preview] ${digest.email.subject}` });
  } catch (err) {
    console.error("Preview email failed:", err);
    return { error: "We couldn't send the preview email just now. Please try again in a few minutes." };
  }
  return { message: `Sent a preview to ${user.email}.` };
}

export async function deleteAccountAction(form: FormData) {
  const user = await requireUser();
  if (str(form, "confirm") !== "DELETE") redirect("/settings?delete=confirm");
  await signOut();
  await db.delete(schema.users).where(eq(schema.users.id, user.id));
  redirect("/?deleted=1");
}

export async function unsubscribeAction(form: FormData) {
  const userId = str(form, "u");
  const token = str(form, "t");
  if (!verifyUnsubscribeToken(userId, token)) redirect("/unsubscribe?invalid=1");
  await db.update(schema.users).set({ weeklyEmail: false }).where(eq(schema.users.id, userId));
  redirect("/unsubscribe?done=1");
}
