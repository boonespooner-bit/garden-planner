import { timingSafeEqual } from "node:crypto";
import { sendDueDigests } from "@/lib/weekly";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Called hourly by the Render cron job. Sends the Friday digest to every
 * user whose local time is Friday 7am or later and hasn't had this week's email.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || given.length !== secret.length || !timingSafeEqual(Buffer.from(given), Buffer.from(secret))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await sendDueDigests();
  console.log("Weekly digest run:", result);
  return Response.json(result);
}
