import { passwordLoginStatus } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Setup check: reports which settings the server can see. Never returns secret values. */
export function GET() {
  const set = (name: string) => Boolean(process.env[name]?.trim());
  return Response.json({
    database: set("DATABASE_URL"),
    appUrl: set("APP_URL"),
    resendKey: set("RESEND_API_KEY"),
    emailFrom: set("EMAIL_FROM"),
    anthropicKey: set("ANTHROPIC_API_KEY"),
    testLogin: passwordLoginStatus(),
    // Any env var names containing "TEST" or "LOGIN", to catch typos in the key name.
    similarKeys: Object.keys(process.env).filter((k) => /TEST|LOGIN/i.test(k)),
  });
}
