/**
 * Plant care data model.
 *
 * Every task's timing is expressed relative to the local *average last spring
 * frost* or *average first fall frost* rather than calendar months. That makes
 * one guide work in any climate and in either hemisphere: "prune 4 weeks
 * before last frost" is mid-February in Atlanta, early April in Chicago and
 * mid-August in Melbourne.
 */

export type TaskType = "prune" | "fertilize" | "spray" | "soil" | "protect" | "plant-care";

export type Anchor = "lastFrost" | "firstFrost";

export interface Timing {
  anchor: Anchor;
  /** Weeks relative to the anchor when the window opens (negative = before). */
  startWeeks: number;
  /** Weeks relative to the anchor when the window closes. */
  endWeeks: number;
}

export interface Product {
  name: string;
  /** OMRI-listed or otherwise acceptable in organic gardening. */
  organic: boolean;
  note?: string;
}

export interface CareTask {
  /** Stable id, unique within a plant guide. Used to record completions. */
  id: string;
  type: TaskType;
  title: string;
  timing: Timing;
  /** Repeat the window every N weeks, `times` times in total (including the first). */
  repeat?: { everyWeeks: number; times: number };
  /** Why this task matters, one or two sentences. */
  why: string;
  /** Step-by-step how-to. */
  steps: string[];
  products?: Product[];
  tools?: string[];
  caution?: string;
  /** Hide this task where winters don't freeze (e.g. frost protection). */
  skipIfFrostFree?: boolean;
  /** Only show in hardiness zones up to this number (cold-climate tasks). */
  maxZone?: number;
}

export type PlantCategory =
  | "rose"
  | "shrub"
  | "evergreen"
  | "tree"
  | "fruit"
  | "vine"
  | "perennial"
  | "herb"
  | "vegetable"
  | "tropical";

export interface Problem {
  name: string;
  signs: string;
  /** Prevention and treatment, organic options first. */
  treatment: string;
}

export interface PlantGuide {
  /** URL-safe slug. */
  key: string;
  name: string;
  aliases: string[];
  botanical: string;
  category: PlantCategory;
  /** USDA hardiness zone range. */
  zones: { min: number; max: number };
  overview: string;
  sun: string;
  water: string;
  soil: {
    /** Preferred pH, e.g. "6.0–7.0". */
    ph: string;
    texture: string;
    amendments: string;
  };
  problems: Problem[];
  tasks: CareTask[];
  /** Winter chill needed to flower and fruit (hours at 32–45°F / 0–7.2°C). */
  chill?: {
    /** What the lowest-chill varieties need. */
    low: number;
    /** What most common varieties need. */
    typical: number;
    /** Named low-chill varieties to suggest in mild-winter areas. */
    lowChillVarieties: string;
  };
}
