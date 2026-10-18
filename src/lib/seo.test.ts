import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { LIBRARY } from "@/plants";
import { MONTHS, REFERENCE_CLIMATES, tasksForMonth, timingPhrase } from "./seo";

describe("SEO pages", () => {
  it("lists every plant guide and month in the sitemap", () => {
    const urls = sitemap().map((e) => e.url);
    for (const g of LIBRARY) expect(urls.some((u) => u.endsWith(`/plants/${g.key}`))).toBe(true);
    for (const m of MONTHS) expect(urls.some((u) => u.endsWith(`/gardening-tips/${m}`))).toBe(true);
  });

  it("blocks private pages without blocking the public guides", () => {
    const rules = robots().rules;
    const disallow = (Array.isArray(rules) ? rules[0] : rules).disallow as string[];
    const blocked = (path: string) =>
      disallow.some((d) => (d.endsWith("$") ? path === d.slice(0, -1) : path.startsWith(d)));
    expect(blocked("/garden")).toBe(true);
    expect(blocked("/garden/123")).toBe(true);
    expect(blocked("/dashboard")).toBe(true);
    expect(blocked("/gardening-tips/october")).toBe(false);
    expect(blocked("/plants/apple")).toBe(false);
  });

  it("only lists plants suited to each climate in monthly tips", () => {
    const cold = REFERENCE_CLIMATES.find((c) => c.id === "cold")!;
    const items = [...tasksForMonth("october", cold).values()].flat();
    expect(items.length).toBeGreaterThan(0);
    expect(items.some((i) => i.guide.key === "mandarin" || i.guide.key === "citrus")).toBe(false);
  });

  it("describes frost-relative timing in plain English", () => {
    expect(timingPhrase({ anchor: "lastFrost", startWeeks: -4, endWeeks: -1 })).toBe("1–4 weeks before the last spring frost");
    expect(timingPhrase({ anchor: "firstFrost", startWeeks: 2, endWeeks: 6 })).toBe("2–6 weeks after the first fall frost");
  });
});
