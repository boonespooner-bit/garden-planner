import Link from "next/link";
import { redirect } from "next/navigation";
import { TaskCard } from "@/components/TaskCard";
import { WeatherPanel } from "@/components/WeatherPanel";
import { requireOnboardedUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { loadCompletions, loadGarden, scheduleFor } from "@/lib/garden";
import { bucketSchedule } from "@/lib/schedule";
import { getForecastSafe } from "@/lib/weather";

export const metadata = { title: "This week" };

export default async function Dashboard() {
  const user = await requireOnboardedUser();
  const garden = await loadGarden(user.id);
  if (garden.length === 0) redirect("/garden?welcome=1");

  const [{ today, occurrences }, done, forecast] = await Promise.all([
    Promise.resolve(scheduleFor(user, garden, 8)),
    loadCompletions(user.id),
    getForecastSafe(user.latitude, user.longitude),
  ]);
  const buckets = bucketSchedule(occurrences, today, done);
  // Also show what was ticked off this week, so checking a box doesn't make it vanish confusingly.
  const doneThisWeek = bucketSchedule(occurrences, today, new Set()).thisWeek.filter((o) => done.has(o.key));
  const pref = user.treatmentPreference;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold text-muted">{formatDate(today, { weekday: "long", month: "long", day: "numeric" })}</p>
        <h1 className="text-3xl font-bold text-leaf-900">Your garden this week</h1>
        <p className="mt-1 text-muted">
          {user.locationName} · Zone {user.hardinessZone ?? "?"} · {garden.length} plant{garden.length === 1 ? "" : "s"}
          {!user.weeklyEmail && (
            <>
              {" "}
              · Friday emails are off (
              <Link href="/settings" className="underline">
                turn on
              </Link>
              )
            </>
          )}
        </p>
      </header>

      <WeatherPanel forecast={forecast} units={user.units} />

      {buckets.overdue.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-clay">Still open from the last few weeks</h2>
          {buckets.overdue.map((o) => (
            <TaskCard key={o.key} occurrence={o} pref={pref} overdue />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-leaf-700">To do this weekend &amp; this week</h2>
        {buckets.thisWeek.length === 0 && doneThisWeek.length === 0 && (
          <div className="card text-muted">Nothing due right now. Enjoy your garden! 🌼</div>
        )}
        {buckets.thisWeek.map((o) => (
          <TaskCard key={o.key} occurrence={o} pref={pref} />
        ))}
        {doneThisWeek.map((o) => (
          <TaskCard key={o.key} occurrence={o} pref={pref} done />
        ))}
      </section>

      {buckets.upcoming.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold text-leaf-700">Coming up in the next 6 weeks</h2>
            <Link href="/calendar" className="text-sm font-semibold text-leaf-700 hover:underline">
              Full year →
            </Link>
          </div>
          {buckets.upcoming.map((o) => (
            <TaskCard key={o.key} occurrence={o} pref={pref} />
          ))}
        </section>
      )}
    </div>
  );
}
