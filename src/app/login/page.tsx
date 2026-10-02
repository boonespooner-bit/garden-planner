import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { expired } = await searchParams;
  return (
    <div className="mx-auto max-w-md space-y-6 pt-6">
      <div>
        <h1 className="text-3xl font-bold text-leaf-900">Sign in or sign up</h1>
        <p className="mt-2 text-muted">
          Enter your email and we&apos;ll send you a sign-in link. No password needed. It&apos;s also where your Friday garden
          plan will arrive.
        </p>
      </div>
      {expired && (
        <p className="rounded-lg bg-warn-bg px-3 py-2 text-sm text-warn">
          That sign-in link has expired or was already used. Request a new one below.
        </p>
      )}
      <div className="card">
        <LoginForm />
      </div>
    </div>
  );
}
