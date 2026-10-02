"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText,
  className = "btn",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (pendingText ?? "Working…") : children}
    </button>
  );
}

export function FormMessage({ state }: { state: { error?: string; message?: string } | undefined }) {
  if (!state) return null;
  if (state.error)
    return (
      <p role="alert" className="mt-3 rounded-lg bg-warn-bg px-3 py-2 text-sm text-warn">
        {state.error}
      </p>
    );
  if (state.message) return <p className="mt-3 rounded-lg bg-leaf-50 px-3 py-2 text-sm text-leaf-700">{state.message}</p>;
  return null;
}
