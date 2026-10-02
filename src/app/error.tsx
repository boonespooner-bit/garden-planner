"use client";

/** Friendly fallback for unexpected server errors. Details go to the server logs. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md pt-10">
      <div className="card space-y-4 text-center">
        <div className="text-4xl" aria-hidden>
          🥀
        </div>
        <h1 className="text-2xl font-bold text-leaf-900">Something went wrong</h1>
        <p className="text-muted">Sorry about that. Please try again. If it keeps happening, let us know.</p>
        {error.digest && <p className="text-xs text-muted">Error reference: {error.digest}</p>}
        <button onClick={reset} className="btn">
          Try again
        </button>
      </div>
    </div>
  );
}
