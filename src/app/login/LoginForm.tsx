"use client";

import { useActionState } from "react";
import { requestLoginAction } from "../actions";
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
