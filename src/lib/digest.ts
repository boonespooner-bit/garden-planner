/**
 * The Friday "plan your weekend" email: what's due, how to do it, and
 * what the weather means for it.
 */
import "server-only";
import type { User } from "@/db/schema";
import { formatDate, formatRange, parseIsoDate } from "./dates";
import { appUrl, escapeHtml, type OutgoingEmail } from "./email";
import { TASK_LABELS, loadCompletions, loadGarden, scheduleFor, visibleProducts } from "./garden";
import { bucketSchedule, type TaskOccurrence } from "./schedule";
import { unsubscribeToken } from "./auth";
import { buildWarnings, formatTemp, getForecastSafe, sprayDays, weatherIcon, type ForecastDay } from "./weather";

export interface Digest {
  email: OutgoingEmail;
  taskCount: number;
}

export async function buildDigest(user: User): Promise<Digest | null> {
  const garden = await loadGarden(user.id);
  if (garden.length === 0) return null;

  const { today, occurrences } = scheduleFor(user, garden, 8);
  const done = await loadCompletions(user.id);
  const buckets = bucketSchedule(occurrences, today, done, 4);
  const forecast = await getForecastSafe(user.latitude, user.longitude);
  const warnings = forecast ? buildWarnings(forecast, user.units) : [];
  const goodSprayDays = forecast ? sprayDays(forecast) : [];

  const due = [...buckets.overdue, ...buckets.thisWeek];
  if (due.length === 0 && buckets.upcoming.length === 0 && warnings.length === 0) return null;

  const subject =
    due.length > 0
      ? `🌿 This weekend in the garden: ${due.length} task${due.length === 1 ? "" : "s"}`
      : "🌿 A quiet weekend in the garden";

  const unsubscribe = appUrl(`/unsubscribe?u=${user.id}&t=${unsubscribeToken(user.id)}`);
  const html = renderHtml({ user, forecast, warnings, goodSprayDays, due, upcoming: buckets.upcoming, unsubscribe });
  const text = renderText({ user, warnings, due, upcoming: buckets.upcoming, unsubscribe, forecast });

  return {
    taskCount: due.length,
    email: {
      to: user.email,
      subject,
      html,
      text,
      headers: {
        "List-Unsubscribe": `<${appUrl(`/api/unsubscribe?u=${user.id}&t=${unsubscribeToken(user.id)}`)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    },
  };
}

interface RenderArgs {
  user: User;
  forecast: ForecastDay[] | null;
  warnings: ReturnType<typeof buildWarnings>;
  goodSprayDays?: ForecastDay[];
  due: TaskOccurrence[];
  upcoming: TaskOccurrence[];
  unsubscribe: string;
}

const C = { green: "#2f5d34", text: "#1f2a1f", muted: "#6b6b6b", border: "#e4e0d5", bg: "#faf8f2", warn: "#8a4b00" };

function renderHtml({ user, forecast, warnings, goodSprayDays = [], due, upcoming, unsubscribe }: RenderArgs): string {
  const e = escapeHtml;
  const weekend = forecast?.slice(0, 4) ?? [];
  const dayName = (iso: string) => formatDate(parseIsoDate(iso), { weekday: "short" });

  const weatherRow = weekend.length
    ? `<table role="presentation" width="100%" style="border-collapse:collapse;margin:8px 0 16px">
        <tr>${weekend
          .map(
            (d) => `<td align="center" style="padding:8px;border:1px solid ${C.border};background:#fff">
              <div style="font-size:12px;color:${C.muted}">${dayName(d.date)}</div>
              <div style="font-size:22px">${weatherIcon(d.code)}</div>
              <div style="font-size:13px"><b>${formatTemp(d.tMaxC, user.units)}</b> / ${formatTemp(d.tMinC, user.units)}</div>
              <div style="font-size:12px;color:${C.muted}">💧 ${d.precipChance}%</div>
            </td>`,
          )
          .join("")}</tr></table>`
    : "";

  const warningHtml = warnings
    .map(
      (w) => `<div style="border-left:4px solid ${C.warn};background:#fff6e8;padding:10px 12px;margin:8px 0;border-radius:4px">
        <b>⚠️ ${e(w.title)}</b><br><span style="font-size:14px">${e(w.advice)}</span></div>`,
    )
    .join("");

  const sprayHtml =
    goodSprayDays.length && due.some((o) => o.task.type === "spray")
      ? `<p style="font-size:14px">✅ <b>Good spraying days:</b> ${goodSprayDays.map((d) => dayName(d.date)).join(", ")} (dry, calm and mild).</p>`
      : "";

  const taskHtml = due
    .map((o) => {
      const products = visibleProducts(o.task, user.treatmentPreference);
      const label = TASK_LABELS[o.task.type];
      return `<div style="background:#fff;border:1px solid ${C.border};border-radius:8px;padding:14px 16px;margin:12px 0">
        <div style="font-size:12px;color:${C.muted};text-transform:uppercase;letter-spacing:.04em">${label.icon} ${label.label} · ${e(formatRange(o.start, o.end))}</div>
        <div style="font-size:17px;font-weight:700;margin:4px 0">${e(o.plantName)}: ${e(o.task.title)}${o.rounds > 1 ? ` <span style="font-weight:400;color:${C.muted}">(${o.round} of ${o.rounds})</span>` : ""}</div>
        <div style="font-size:14px;color:${C.muted};margin-bottom:8px">${e(o.task.why)}</div>
        <ol style="margin:0 0 8px 18px;padding:0;font-size:14px;line-height:1.5">${o.task.steps.map((s) => `<li>${e(s)}</li>`).join("")}</ol>
        ${products.length ? `<div style="font-size:13px"><b>Use:</b> ${products.map((p) => `${e(p.name)}${p.organic ? " 🌿" : ""}`).join(" · ")}</div>` : ""}
        ${o.task.tools?.length ? `<div style="font-size:13px"><b>Tools:</b> ${e(o.task.tools.join(", "))}</div>` : ""}
        ${o.task.caution ? `<div style="font-size:13px;color:${C.warn}"><b>Caution:</b> ${e(o.task.caution)}</div>` : ""}
      </div>`;
    })
    .join("");

  const upcomingHtml = upcoming.length
    ? `<h3 style="color:${C.green};margin-top:24px">Coming up in the next few weeks</h3>
       <ul style="font-size:14px;line-height:1.6;padding-left:18px">${upcoming
         .slice(0, 12)
         .map((o) => `<li><b>${e(formatRange(o.start, o.end))}</b>: ${e(o.plantName)}, ${e(o.task.title.toLowerCase())}</li>`)
         .join("")}</ul>`
    : "";

  return `<!doctype html><html><body style="margin:0;background:${C.bg};font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:${C.text}">
  <div style="max-width:620px;margin:auto;padding:24px 16px">
    <h1 style="color:${C.green};font-size:24px;margin:0 0 4px">🌿 Your weekend garden plan</h1>
    <div style="color:${C.muted};font-size:14px">${e(user.locationName ?? "")}${user.hardinessZone ? ` · Zone ${e(user.hardinessZone)}` : ""}</div>
    ${weatherRow}${warningHtml}
    <h2 style="color:${C.green};font-size:19px;margin:20px 0 4px">${due.length ? "To do this weekend" : "Nothing due this weekend. Enjoy the garden!"}</h2>
    ${sprayHtml}${taskHtml}${upcomingHtml}
    <p style="margin-top:24px"><a href="${appUrl("/dashboard")}" style="background:${C.green};color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Open my garden</a></p>
    <p style="font-size:12px;color:${C.muted};margin-top:28px">🌿 = organic option. Always read and follow product labels.<br>
      You're receiving this because weekly reminders are on. <a href="${e(unsubscribe)}" style="color:${C.muted}">Unsubscribe</a></p>
  </div></body></html>`;
}

function renderText({ user, warnings, due, upcoming, unsubscribe, forecast }: RenderArgs): string {
  const lines: string[] = [`YOUR WEEKEND GARDEN PLAN: ${user.locationName ?? ""}`, ""];
  if (forecast) {
    lines.push(
      "Weather: " +
        forecast
          .slice(0, 4)
          .map((d) => `${formatDate(parseIsoDate(d.date), { weekday: "short" })} ${formatTemp(d.tMaxC, user.units)}/${formatTemp(d.tMinC, user.units)} rain ${d.precipChance}%`)
          .join(" | "),
      "",
    );
  }
  for (const w of warnings) lines.push(`! ${w.title}: ${w.advice}`, "");
  lines.push(due.length ? "TO DO THIS WEEKEND" : "Nothing due this weekend.", "");
  for (const o of due) {
    lines.push(`* ${o.plantName}: ${o.task.title} (${formatRange(o.start, o.end)})`);
    o.task.steps.forEach((s, i) => lines.push(`   ${i + 1}. ${s}`));
    const products = visibleProducts(o.task, user.treatmentPreference);
    if (products.length) lines.push(`   Use: ${products.map((p) => p.name).join("; ")}`);
    lines.push("");
  }
  if (upcoming.length) {
    lines.push("COMING UP");
    for (const o of upcoming.slice(0, 12)) lines.push(`- ${formatRange(o.start, o.end)}: ${o.plantName}, ${o.task.title}`);
    lines.push("");
  }
  lines.push(`Open your garden: ${appUrl("/dashboard")}`, `Unsubscribe: ${unsubscribe}`);
  return lines.join("\n");
}
