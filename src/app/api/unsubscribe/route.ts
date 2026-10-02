import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { verifyUnsubscribeToken } from "@/lib/auth";

/** RFC 8058 one-click unsubscribe, triggered by the mail client's "Unsubscribe" button. */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const u = url.searchParams.get("u") ?? "";
  const t = url.searchParams.get("t") ?? "";
  if (!verifyUnsubscribeToken(u, t)) return new Response("Invalid link", { status: 400 });
  await db.update(schema.users).set({ weeklyEmail: false }).where(eq(schema.users.id, u));
  return new Response("Unsubscribed");
}
