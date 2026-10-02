import { redeemLoginAction } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata = { title: "Sign in" };

/**
 * The emailed link lands here, and signing in needs one more click. That stops
 * email security scanners, which pre-open links, from using up the one-time token.
 */
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="mx-auto max-w-md pt-10">
      <div className="card space-y-4 text-center">
        <div className="text-4xl" aria-hidden>
          🌿
        </div>
        <h1 className="text-2xl font-bold text-leaf-900">Welcome to Tend Weekly</h1>
        {token ? (
          <form action={redeemLoginAction}>
            <input type="hidden" name="token" value={token} />
            <SubmitButton pendingText="Signing in…">Continue to my garden</SubmitButton>
          </form>
        ) : (
          <p className="text-muted">This link is incomplete. Please request a new sign-in email.</p>
        )}
      </div>
    </div>
  );
}
