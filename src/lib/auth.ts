/**
 * Passwordless sign-in: we email a one-time link, then keep a session cookie.
 * Only SHA-256 hashes of tokens are stored, so a database leak can't be replayed.
 */
import "server-only";
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { User } from "@/db/schema";
import { appUrl, escapeHtml, sendEmail } from "./email";

const SESSION_COOKIE = "gp_session";
const SESSION_DAYS = 60;
const LOGIN_TOKEN_MINUTES = 20;
const MAX_LOGIN_EMAILS_PER_HOUR = 5;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const newToken = () => randomBytes(32).toString("base64url");

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export async function sendLoginLink(rawEmail: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) return { ok: false, error: "Please enter a valid email address." };

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.loginTokens)
    .where(and(eq(schema.loginTokens.email, email), gt(schema.loginTokens.createdAt, new Date(Date.now() - 3_600_000))));
  if (count >= MAX_LOGIN_EMAILS_PER_HOUR) {
    return { ok: false, error: "Too many sign-in emails. Please wait a while and check your inbox (and spam folder)." };
  }

  const token = newToken();
  await db.insert(schema.loginTokens).values({
    tokenHash: hash(token),
    email,
    expiresAt: new Date(Date.now() + LOGIN_TOKEN_MINUTES * 60_000),
  });

  const link = appUrl(`/auth/verify?token=${token}`);
  await sendEmail({
    to: email,
    subject: "Your Tend Weekly sign-in link",
    text: `Sign in to Tend Weekly:\n\n${link}\n\nThis link expires in ${LOGIN_TOKEN_MINUTES} minutes. If you didn't request it, you can ignore this email.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px;color:#1f2a1f">
      <h2 style="color:#2f5d34;margin-top:0">🌿 Sign in to Tend Weekly</h2>
      <p>Click the button below to sign in. This link expires in ${LOGIN_TOKEN_MINUTES} minutes.</p>
      <p><a href="${escapeHtml(link)}" style="display:inline-block;background:#2f5d34;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Sign in</a></p>
      <p style="color:#6b6b6b;font-size:13px">If you didn't request this, you can safely ignore it.</p>
    </div>`,
  });
  return { ok: true };
}

/** Exchanges a one-time login token for a session. Returns the user, or null if the link is invalid/expired. */
export async function redeemLoginToken(token: string): Promise<User | null> {
  const now = new Date();
  const [row] = await db
    .update(schema.loginTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(schema.loginTokens.tokenHash, hash(token)),
        isNull(schema.loginTokens.usedAt),
        gt(schema.loginTokens.expiresAt, now),
      ),
    )
    .returning();
  if (!row) return null;

  return startSession(row.email);
}

/** Finds or creates the user for this email and sets a session cookie. */
async function startSession(email: string): Promise<User> {
  const [user] = await db
    .insert(schema.users)
    .values({ email })
    .onConflictDoUpdate({ target: schema.users.email, set: { email } })
    .returning();

  const sessionToken = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(schema.sessions).values({ tokenHash: hash(sessionToken), userId: user.id, expiresAt });

  (await cookies()).set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return user;
}

/* ---- Optional password sign-in (for testing before email is set up) ----
 * Enabled only when both TEST_LOGIN_EMAIL and TEST_LOGIN_PASSWORD_HASH are set.
 * Create the hash with `npm run hash-password`; the plain password is never stored.
 */

const MAX_PASSWORD_FAILURES = 10;
const FAILURE_WINDOW_MS = 15 * 60_000;
const passwordFailures: number[] = [];

/** Reads an env var, ignoring stray whitespace or quotes picked up when pasting into a dashboard. */
function envValue(name: string): string {
  return (process.env[name] ?? "").trim().replace(/^["']|["']$/g, "").trim();
}

export function passwordLoginEnabled(): boolean {
  return Boolean(envValue("TEST_LOGIN_EMAIL") && envValue("TEST_LOGIN_PASSWORD_HASH"));
}

/** Which test-login settings the server can see (booleans only, never values). */
export function passwordLoginStatus() {
  const hash = envValue("TEST_LOGIN_PASSWORD_HASH");
  return {
    emailSet: Boolean(envValue("TEST_LOGIN_EMAIL")),
    hashSet: Boolean(hash),
    hashLooksValid: /^[0-9a-f]{32}:[0-9a-f]{128}$/.test(hash),
  };
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function signInWithPassword(rawEmail: string, password: string): Promise<User | null> {
  if (!passwordLoginEnabled()) return null;
  const now = Date.now();
  while (passwordFailures.length && passwordFailures[0] < now - FAILURE_WINDOW_MS) passwordFailures.shift();
  if (passwordFailures.length >= MAX_PASSWORD_FAILURES) return null;

  const email = normalizeEmail(rawEmail);
  const emailOk = email === normalizeEmail(envValue("TEST_LOGIN_EMAIL"));
  // Always run the hash check so timing doesn't reveal whether the email matched.
  const passwordOk = verifyPassword(password, envValue("TEST_LOGIN_PASSWORD_HASH"));
  if (!emailOk || !passwordOk) {
    passwordFailures.push(now);
    return null;
  }
  return startSession(email);
}

export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(and(eq(schema.sessions.tokenHash, hash(token)), gt(schema.sessions.expiresAt, new Date())));
  return row?.user ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Signed-in user who has also finished setting a location. */
export async function requireOnboardedUser(): Promise<User & { lastFrost: string; firstFrost: string; timezone: string }> {
  const user = await requireUser();
  if (!user.lastFrost || !user.firstFrost || !user.timezone) redirect("/onboarding/location");
  return user as User & { lastFrost: string; firstFrost: string; timezone: string };
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.tokenHash, hash(token)));
  jar.delete(SESSION_COOKIE);
}

/* ---- Signed unsubscribe links (work without signing in) ---- */

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is not set");
  return s ?? "dev-secret";
}

export function unsubscribeToken(userId: string): string {
  return createHmac("sha256", secret()).update(`unsubscribe:${userId}`).digest("base64url");
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  const expected = Buffer.from(unsubscribeToken(userId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
