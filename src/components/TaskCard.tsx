import Link from "next/link";
import { toggleTaskAction } from "@/app/actions";
import { formatRange } from "@/lib/dates";
import { TASK_LABELS, visibleProducts } from "@/lib/garden";
import type { TaskOccurrence } from "@/lib/schedule";
import type { CareTask } from "@/plants/types";

export function TaskTypeChip({ type }: { type: CareTask["type"] }) {
  const t = TASK_LABELS[type];
  return (
    <span className="chip">
      <span aria-hidden>{t.icon}</span> {t.label}
    </span>
  );
}

/** How-to details for a task: steps, products, tools and cautions. */
export function TaskHowTo({ task, pref }: { task: CareTask; pref: "organic" | "both" }) {
  const products = visibleProducts(task, pref);
  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted">{task.why}</p>
      <div>
        <h4 className="mb-1 font-sans text-xs font-bold uppercase tracking-wide text-leaf-700">How to do it</h4>
        <ol className="list-decimal space-y-1 pl-5 leading-relaxed">
          {task.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </div>
      {products.length > 0 && (
        <div>
          <h4 className="mb-1 font-sans text-xs font-bold uppercase tracking-wide text-leaf-700">What to use</h4>
          <ul className="space-y-1">
            {products.map((p) => (
              <li key={p.name} className="flex gap-2">
                <span aria-label={p.organic ? "organic" : "conventional"} title={p.organic ? "Organic option" : "Conventional"}>
                  {p.organic ? "🌿" : "⚗️"}
                </span>
                <span>
                  {p.name}
                  {p.note && <span className="text-muted"> ({p.note})</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {task.tools && task.tools.length > 0 && (
        <p>
          <span className="font-semibold">Tools:</span> {task.tools.join(", ")}
        </p>
      )}
      {task.caution && (
        <p className="rounded-md bg-warn-bg px-3 py-2 text-warn">
          <span className="font-semibold">Caution:</span> {task.caution}
        </p>
      )}
    </div>
  );
}

export function TaskCard({
  occurrence: o,
  pref,
  done = false,
  overdue = false,
  showPlant = true,
}: {
  occurrence: TaskOccurrence;
  pref: "organic" | "both";
  done?: boolean;
  overdue?: boolean;
  showPlant?: boolean;
}) {
  return (
    <div className={`card !p-0 ${done ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3 p-4">
        <form action={toggleTaskAction}>
          <input type="hidden" name="key" value={o.key} />
          <input type="hidden" name="done" value={done ? "0" : "1"} />
          <button
            type="submit"
            aria-label={done ? "Mark as not done" : "Mark as done"}
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-sm ${
              done ? "border-leaf-700 bg-leaf-700 text-white" : "border-line hover:border-leaf-500"
            }`}
          >
            {done ? "✓" : ""}
          </button>
        </form>
        <details className="group min-w-0 flex-1">
          <summary className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <TaskTypeChip type={o.task.type} />
              <span className={`text-xs font-semibold ${overdue ? "text-clay" : "text-muted"}`}>
                {overdue ? "Overdue · " : ""}
                {formatRange(o.start, o.end)}
              </span>
              {o.rounds > 1 && (
                <span className="text-xs text-muted">
                  ({o.round} of {o.rounds})
                </span>
              )}
            </div>
            <div className={`font-semibold ${done ? "line-through" : ""}`}>
              {showPlant && (
                <Link href={`/garden/${o.gardenPlantId}`} className="text-leaf-700 hover:underline">
                  {o.plantName}
                </Link>
              )}
              {showPlant && ": "}
              {o.task.title}
            </div>
            <span className="text-xs font-semibold text-leaf-500 group-open:hidden">Show how ▾</span>
          </summary>
          <div className="mt-3 border-t border-line pt-3">
            <TaskHowTo task={o.task} pref={pref} />
          </div>
        </details>
      </div>
    </div>
  );
}
