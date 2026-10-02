"use client";

import { useActionState } from "react";
import { passwordLoginAction, requestLoginAction } from "../actions";
import { FormMessage, SubmitButton } from "@/components/SubmitButton";

export function LoginForm() {
  const [state, action] = useActionState(requestLoginAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" placeholder="you@example.com" />
      </div>
      <SubmitButton pendingText="Sending…">Email me a sign-in link</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function PasswordLoginForm() {
  const [state, action] = useActionState(passwordLoginAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="pw-email" className="label">
          Email
        </label>
        <input id="pw-email" name="email" type="email" required autoComplete="username" className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      <SubmitButton className="btn-ghost" pendingText="Signing in…">
        Sign in with password
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
