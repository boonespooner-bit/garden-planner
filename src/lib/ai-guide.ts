/**
 * Generates a care guide, in the same shape as the curated library, for
 * plants we don't have a hand-written guide for. Results are cached in
 * custom_guides and shared by every user, so each plant is generated once.
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { and, eq, gt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { normalizePlantName } from "@/plants";
import type { PlantGuide } from "@/plants/types";

const MODEL = "claude-opus-5-5";
const MAX_NEW_GUIDES_PER_DAY = 10;

const ProductSchema = z.object({
  name: z.string().describe("Generic active ingredient or product type, optionally with one example brand in parentheses"),
  organic: z.boolean().describe("True if acceptable in organic gardening (OMRI-listed type)"),
  note: z.string().optional(),
});

const TaskSchema = z.object({
  id: z.string().describe("short kebab-case id unique within this guide, e.g. 'spring-prune'"),
  type: z.enum(["prune", "fertilize", "spray", "soil", "protect", "plant-care"]),
  title: z.string(),
  timing: z.object({
    anchor: z.enum(["lastFrost", "firstFrost"]),
    startWeeks: z.number().int(),
    endWeeks: z.number().int(),
  }),
  repeat: z.object({ everyWeeks: z.number().int(), times: z.number().int() }).optional(),
  why: z.string(),
  steps: z.array(z.string()),
  products: z.array(ProductSchema).optional(),
  tools: z.array(z.string()).optional(),
  caution: z.string().optional(),
  skipIfFrostFree: z.boolean().optional(),
  maxZone: z.number().int().optional().describe("Only for cold-climate tasks: highest USDA zone where this task applies"),
});

const GuideSchema = z.object({
  recognized: z.boolean().describe("False if the input is not a real garden plant you can confidently identify"),
  name: z.string().describe("Common name, title case"),
  botanical: z.string(),
  aliases: z.array(z.string()),
  category: z.enum(["rose", "shrub", "evergreen", "tree", "fruit", "vine", "perennial", "herb", "vegetable", "tropical"]),
  zoneMin: z.number().int(),
  zoneMax: z.number().int(),
  overview: z.string(),
  sun: z.string(),
  water: z.string(),
  soil: z.object({ ph: z.string(), texture: z.string(), amendments: z.string() }),
  problems: z.array(z.object({ name: z.string(), signs: z.string(), treatment: z.string() })),
  tasks: z.array(TaskSchema),
  chill: z
    .object({ low: z.number().int(), typical: z.number().int(), lowChillVarieties: z.string() })
    .optional()
    .describe("Only for fruit plants with a winter chill requirement: chill hours (32-45°F) needed by the lowest-chill varieties and by typical varieties, plus named low-chill varieties"),
});

const SYSTEM = `You are a horticulturist writing a practical, accurate year-round care plan for a home gardener.

Timing rules (critical):
- Express every task window in weeks relative to the local AVERAGE LAST SPRING FROST ("lastFrost") or AVERAGE FIRST FALL FROST ("firstFrost"). Negative = before. Never use calendar months; the app converts these to dates for each user's location and hemisphere.
- Reference points for a typical zone 6-7 garden (last frost mid-April, first frost late October):
  lastFrost -8..-2 = late winter dormancy (structural pruning of summer bloomers, dormant oil/copper sprays)
  lastFrost -2..+3 = bud break (first feeding)
  lastFrost +2..+8 = spring (pruning spring bloomers right after flowers fade, mulching)
  lastFrost +8..+16 = summer
  firstFrost -8 = last feeding of the year
  firstFrost 0..+6 = autumn cleanup and winter protection
- Use repeat {everyWeeks, times} for recurring work (feeding every 4-6 weeks, protective sprays every 2 weeks).
- Mark frost-protection tasks skipIfFrostFree: true. If a task only matters in colder zones (e.g. wrapping a fig in zone 6-7), set maxZone.

Content rules:
- Pruning timing must match whether the plant flowers on old wood or new wood. Say which in the overview.
- Include: pruning (with how-to steps a beginner can follow: where to cut, how much, which tools), fertilizing (type and rate guidance), soil needs and amendments, and preventive sprays only where they genuinely help this plant.
- For every fertilizer or spray task, list 2-4 products by active ingredient/type, organic options first, then conventional. Mark organic correctly.
- List the 2-4 most common problems with signs and treatment (organic options first).
- Be conservative and safe: no off-label uses, warn about pollinators and heat limits for oils/sulfur.
- Typically 4-9 tasks. Don't invent tasks the plant doesn't need.
- For fruit trees and bushes that need winter chill to flower (apples, stone fruit, blueberries, etc.), fill in chill with realistic chill-hour figures.
- If the input isn't a real plant you can confidently identify, set recognized=false and keep other fields minimal.`;

export class GuideLimitError extends Error {}

/** Find or create a custom guide for a free-text plant name. Returns null if the plant wasn't recognized. */
export async function getOrCreateCustomGuide(
  plantName: string,
  userId: string,
): Promise<{ id: string; guide: PlantGuide } | null> {
  const normalized = normalizePlantName(plantName);
  if (!normalized) return null;

  const [existing] = await db.select().from(schema.customGuides).where(eq(schema.customGuides.normalizedName, normalized));
  if (existing) return { id: existing.id, guide: existing.guide };

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.customGuides)
    .where(and(eq(schema.customGuides.createdBy, userId), gt(schema.customGuides.createdAt, new Date(Date.now() - 86_400_000))));
  if (count >= MAX_NEW_GUIDES_PER_DAY) {
    throw new GuideLimitError("You've added a lot of new plant types today. Please try again tomorrow.");
  }

  const guide = await generateGuide(plantName, normalized);
  if (!guide) return null;

  const [row] = await db
    .insert(schema.customGuides)
    .values({ normalizedName: normalized, guide, model: MODEL, createdBy: userId })
    .onConflictDoNothing()
    .returning();
  if (row) return { id: row.id, guide: row.guide };
  // Another request generated it concurrently; use theirs.
  const [again] = await db.select().from(schema.customGuides).where(eq(schema.customGuides.normalizedName, normalized));
  return again ? { id: again.id, guide: again.guide } : null;
}

async function generateGuide(plantName: string, normalized: string): Promise<PlantGuide | null> {
  const client = new Anthropic();
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: zodOutputFormat(GuideSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: `Write the care plan for: ${plantName.slice(0, 120)}` }],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) return null;
  const g = response.parsed_output;
  if (!g.recognized || g.tasks.length === 0) return null;

  return {
    key: `ai-${normalized.replace(/\s+/g, "-")}`,
    name: g.name,
    aliases: g.aliases,
    botanical: g.botanical,
    category: g.category,
    zones: { min: g.zoneMin, max: g.zoneMax },
    overview: g.overview,
    sun: g.sun,
    water: g.water,
    soil: g.soil,
    problems: g.problems,
    chill: g.chill,
    tasks: g.tasks.map((t) => ({
      ...t,
      repeat: t.repeat && t.repeat.times > 1 && t.repeat.everyWeeks > 0 ? t.repeat : undefined,
    })),
  };
}
