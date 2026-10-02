import Link from "next/link";
import { notFound } from "next/navigation";
import { removePlantAction, updatePlantAction } from "@/app/actions";
import { TaskHowTo, TaskTypeChip } from "@/components/TaskCard";
import { requireOnboardedUser } from "@/lib/auth";
import { formatRange } from "@/lib/dates";
import { loadCompletions, loadGardenEntry, scheduleFor } from "@/lib/garden";

export default async function PlantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireOnboardedUser();
  const entry = await loadGardenEntry(user.id, id);
  if (!entry) notFound();

  const { guide } = entry;
  const { today, occurrences } = scheduleFor(user, [entry], 52);
  const done = await loadCompletions(user.id);
  // Next date for each task, so the guide reads as a timeline for this garden.
  const nextByTask = new Map<string, { start: Date; end: Date; done: boolean }>();
  for (const o of occurrences) {
    if (o.end < today || nextByTask.has(o.task.id)) continue;
    nextByTask.set(o.task.id, { start: o.start, end: o.end, done: done.has(o.key) });
  }
  const tasks = [...guide.tasks].sort(
    (a, b) => (nextByTask.get(a.id)?.start.getTime() ?? Infinity) - (nextByTask.get(b.id)?.start.getTime() ?? Infinity),
  );

  return (
    <div className="space-y-6">
      <Link href="/garden" className="text-sm text-leaf-700 hover:underline">
        ← My plants
      </Link>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-leaf-900">{entry.displayName}</h1>
        <p className="italic text-muted">
          {guide.botanical}
          {entry.nickname && ` · ${guide.name}`}
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="chip">
            Zones {guide.zones.min}–{guide.zones.max}
          </span>
          {entry.quantity > 1 && <span className="chip">×{entry.quantity} plants</span>}
          {entry.aiGenerated && <span className="chip !bg-sun/30 !text-warn">✨ AI-written guide: double-check before acting</span>}
        </div>
      </header>

      <p className="text-lg">{guide.overview}</p>

      <section className="grid gap-3 md:grid-cols-3">
        <Fact title="☀️ Sun" body={guide.sun} />
        <Fact title="💧 Water" body={guide.water} />
        <Fact
          title="🪱 Soil"
          body={
            <>
              <b>pH {guide.soil.ph}.</b> {guide.soil.texture} {guide.soil.amendments}
            </>
          }
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-leaf-700">Year-round care plan</h2>
        <p className="text-sm text-muted">Dates are calculated for {user.locationName}. Click a task to see how to do it.</p>
        {tasks.map((task) => {
          const next = nextByTask.get(task.id);
          return (
            <details key={task.id} className="card group">
              <summary className="flex flex-wrap items-center gap-2">
                <TaskTypeChip type={task.type} />
                <span className="font-semibold">{task.title}</span>
                {next ? (
                  <span className={`text-xs font-semibold ${next.done ? "text-leaf-500" : "text-muted"}`}>
                    {next.done ? "✓ done · " : "next: "}
                    {formatRange(next.start, next.end)}
                  </span>
                ) : (
                  <span className="text-xs text-muted">not needed in your climate</span>
                )}
                {task.repeat && <span className="text-xs text-muted">· {task.repeat.times}× a year</span>}
                <span className="ml-auto text-xs font-semibold text-leaf-500 group-open:hidden">How ▾</span>
              </summary>
              <div className="mt-3 border-t border-line pt-3">
                <TaskHowTo task={task} pref={user.treatmentPreference} />
              </div>
            </details>
          );
        })}
      </section>

      {guide.problems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-leaf-700">Common problems</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {guide.problems.map((p) => (
              <div key={p.name} className="card text-sm">
                <h3 className="font-sans text-base font-bold">{p.name}</h3>
                <p className="mt-1">
                  <span className="font-semibold">Signs:</span> {p.signs}
                </p>
                <p className="mt-1">
                  <span className="font-semibold">What to do:</span> {p.treatment}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card space-y-3">
        <h2 className="text-lg font-bold text-leaf-700">Your notes</h2>
        <form action={updatePlantAction} className="grid gap-3 sm:grid-cols-[1fr_120px]">
          <input type="hidden" name="id" value={entry.id} />
          <div>
            <label className="label" htmlFor="nickname">
              Nickname (e.g. &ldquo;Front porch roses&rdquo;)
            </label>
            <input id="nickname" name="nickname" defaultValue={entry.nickname ?? ""} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="quantity">
              How many
            </label>
            <input id="quantity" name="quantity" type="number" min={1} defaultValue={entry.quantity} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="notes">
              Notes (variety, where it&apos;s planted, history)
            </label>
            <textarea id="notes" name="notes" rows={3} defaultValue={entry.notes ?? ""} className="input" />
          </div>
          <div>
            <button className="btn">Save</button>
          </div>
        </form>
        <form action={removePlantAction} className="border-t border-line pt-3">
          <input type="hidden" name="id" value={entry.id} />
          <button className="text-sm font-semibold text-clay hover:underline">Remove this plant from my garden</button>
        </form>
      </section>
    </div>
  );
}

function Fact({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="card text-sm">
      <h3 className="mb-1 font-sans font-bold">{title}</h3>
      <p>{body}</p>
    </div>
  );
}
