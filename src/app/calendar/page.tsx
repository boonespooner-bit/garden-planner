import Link from "next/link";
import { TaskTypeChip } from "@/components/TaskCard";
import { requireOnboardedUser } from "@/lib/auth";
import { formatDate, formatRange, parseIsoDate } from "@/lib/dates";
import { TASK_LABELS, loadCompletions, loadGarden, scheduleFor } from "@/lib/garden";
import { groupByMonth } from "@/lib/schedule";
import type { TaskType } from "@/plants/types";

export const metadata = { title: "Calendar" };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const user = await requireOnboardedUser();
  const { type } = await searchParams;
  const garden = await loadGarden(user.id);
  const { today, occurrences } = scheduleFor(user, garden, 52);
  const done = await loadCompletions(user.id);

  const filtered = occurrences.filter((o) => o.end >= today && (!type || o.task.type === type));
  const months = groupByMonth(filtered);
  const types = Object.keys(TASK_LABELS) as TaskType[];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-leaf-900">Your garden year</h1>
        <p className="mt-1 text-muted">Every pruning, feeding, spraying and soil task for the next 12 months, timed for {user.locationName}.</p>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="Filter by task type">
        <FilterLink href="/calendar" active={!type}>
          All
        </FilterLink>
        {types.map((t) => (
          <FilterLink key={t} href={`/calendar?type=${t}`} active={type === t}>
            {TASK_LABELS[t].icon} {TASK_LABELS[t].label}
          </FilterLink>
        ))}
      </nav>

      {garden.length === 0 && (
        <div className="card">
          <Link href="/garden" className="text-leaf-700 underline">
            Add some plants
          </Link>{" "}
          to see your calendar.
        </div>
      )}

      <div className="space-y-6">
        {[...months.entries()].map(([month, items]) => (
          <section key={month} className="card">
            <h2 className="mb-3 text-xl font-bold text-leaf-700">
              {formatDate(parseIsoDate(`${month}-01`), { month: "long", year: "numeric" })}
            </h2>
            <ul className="divide-y divide-line">
              {items.map((o) => (
                <li key={o.key} className={`flex flex-wrap items-center gap-2 py-2 text-sm ${done.has(o.key) ? "opacity-50" : ""}`}>
                  <span className="w-28 shrink-0 font-semibold text-muted">{formatRange(o.start, o.end)}</span>
                  <TaskTypeChip type={o.task.type} />
                  <Link href={`/garden/${o.gardenPlantId}`} className="font-semibold text-leaf-700 hover:underline">
                    {o.plantName}
                  </Link>
                  <span className={done.has(o.key) ? "line-through" : ""}>{o.task.title}</span>
                  {done.has(o.key) && <span className="text-leaf-500">✓</span>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-sm font-semibold ${active ? "bg-leaf-700 text-white" : "border border-line bg-paper hover:border-leaf-500"}`}
    >
      {children}
    </Link>
  );
}
