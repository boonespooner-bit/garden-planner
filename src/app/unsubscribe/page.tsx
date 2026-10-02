import { unsubscribeAction } from "@/app/actions";

export const metadata = { title: "Unsubscribe" };

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string; t?: string; done?: string; invalid?: string }>;
}) {
  const { u, t, done, invalid } = await searchParams;
  return (
    <div className="mx-auto max-w-md pt-10">
      <div className="card space-y-4 text-center">
        {done ? (
          <>
            <h1 className="text-2xl font-bold text-leaf-900">You&apos;re unsubscribed</h1>
            <p className="text-muted">You won&apos;t get Friday emails anymore. You can turn them back on in Settings anytime.</p>
          </>
        ) : invalid || !u || !t ? (
          <>
            <h1 className="text-2xl font-bold text-leaf-900">Link not valid</h1>
            <p className="text-muted">Sign in and turn off emails in Settings instead.</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-leaf-900">Stop Friday garden emails?</h1>
            <form action={unsubscribeAction}>
              <input type="hidden" name="u" value={u} />
              <input type="hidden" name="t" value={t} />
              <button className="btn">Unsubscribe</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
