/**
 * Sends the Friday digest. Called hourly by a cron job; each user gets their
 * email once, at or after 7am Friday in their own timezone.
 */
import "server-only";
import { and, eq, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { isoDate, todayIn } from "./dates";
import { buildDigest } from "./digest";
import { sendEmail } from "./email";

const SEND_HOUR = 7;

function localWeekdayAndHour(timeZone: string, now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(now);
  return {
    weekday: parts.find((p) => p.type === "weekday")?.value,
    hour: Number(parts.find((p) => p.type === "hour")?.value ?? 0),
  };
}

export async function sendDueDigests(now = new Date()) {
  const users = await db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.weeklyEmail, true), isNotNull(schema.users.lastFrost), isNotNull(schema.users.timezone)));

  const result = { checked: users.length, sent: 0, skipped: 0, failed: 0 };
  for (const user of users) {
    const tz = user.timezone!;
    const { weekday, hour } = localWeekdayAndHour(tz, now);
    if (weekday !== "Fri" || hour < SEND_HOUR) {
      result.skipped++;
      continue;
    }
    const weekOf = isoDate(todayIn(tz, now));

    // Claim this user's Friday first so overlapping cron runs can't double-send.
    const claimed = await db.insert(schema.emailLog).values({ userId: user.id, weekOf }).onConflictDoNothing().returning();
    if (claimed.length === 0) {
      result.skipped++;
      continue;
    }
    try {
      const digest = await buildDigest(user);
      if (!digest) {
        result.skipped++;
        continue;
      }
      await sendEmail(digest.email);
      result.sent++;
    } catch (err) {
      console.error(`Digest failed for ${user.id}:`, err);
      result.failed++;
      // Release the claim so the next hourly run retries.
      await db.delete(schema.emailLog).where(and(eq(schema.emailLog.userId, user.id), eq(schema.emailLog.weekOf, weekOf)));
    }
  }
  return result;
}
