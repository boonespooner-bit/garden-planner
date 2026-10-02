/**
 * Reusable care tasks and products shared by many plant guides.
 *
 * Reference points (for a typical zone 6–7 garden, last frost ≈ mid-April,
 * first frost ≈ late October):
 *   lastFrost −8..−2 wk  → late winter, plants dormant: structural pruning, dormant sprays
 *   lastFrost −2..+3 wk  → bud break: first feeding
 *   lastFrost +2..+6 wk  → soil warm: mulch, spring-bloomer pruning
 *   firstFrost −8 wk     → late summer: last feeding
 *   firstFrost 0..+6 wk  → autumn: cleanup, winter protection
 */
import type { CareTask, Product, Timing } from "./types";

export const before = (anchor: Timing["anchor"], startWeeks: number, endWeeks: number): Timing => ({
  anchor,
  startWeeks,
  endWeeks,
});

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

export const P = {
  // Fertilizers
  compost: { name: "Finished compost or composted manure", organic: true },
  balancedOrganic: {
    name: "Balanced organic granular fertilizer (e.g. Espoma Plant-tone 5-3-3)",
    organic: true,
  },
  balancedSlow: {
    name: "Slow-release balanced fertilizer (e.g. Osmocote Smart-Release 14-14-14)",
    organic: false,
  },
  acidOrganic: {
    name: "Organic acid-loving plant food (e.g. Espoma Holly-tone 4-3-4)",
    organic: true,
  },
  acidSynthetic: {
    name: "Acid-forming fertilizer (e.g. Miracid 30-10-10 or ammonium sulfate)",
    organic: false,
  },
  roseOrganic: { name: "Organic rose food (e.g. Espoma Rose-tone 4-3-2)", organic: true },
  roseSynthetic: {
    name: "Granular rose fertilizer (e.g. Scotts/Miracle-Gro Shake 'n Feed Rose & Bloom)",
    organic: false,
  },
  bloomSoluble: {
    name: "Water-soluble bloom booster (e.g. Miracle-Gro Bloom Booster 15-30-15)",
    organic: false,
  },
  fishEmulsion: { name: "Fish emulsion or fish/seaweed blend (e.g. Neptune's Harvest)", organic: true },
  citrusOrganic: { name: "Organic citrus food (e.g. Espoma Citrus-tone 5-2-6)", organic: true },
  citrusSynthetic: { name: "Citrus & avocado fertilizer with micronutrients (e.g. Jobe's or Vigoro)", organic: false },
  fruitTreeOrganic: { name: "Organic tree & shrub food (e.g. Espoma Tree-tone 6-3-2)", organic: true },
  fruitTreeSynthetic: { name: "Fruit tree spikes or 10-10-10 granular", organic: false },
  tomatoOrganic: { name: "Organic tomato food (e.g. Espoma Tomato-tone 3-4-6)", organic: true },
  tomatoSynthetic: { name: "Water-soluble tomato food (e.g. Miracle-Gro Tomato 18-18-21)", organic: false },
  lowNitrogen: { name: "Low-nitrogen, high-phosphorus feed (e.g. bone meal or 5-10-10)", organic: true },
  epsom: { name: "Epsom salt (magnesium sulfate), only if a soil test shows low magnesium", organic: true },
  garden_lime: { name: "Garden lime (dolomitic limestone), only if soil test says pH is low", organic: true },
  sulfur_soil: { name: "Elemental sulfur or aluminum-free soil acidifier, to lower pH", organic: true },
  chelatedIron: { name: "Chelated iron (e.g. Ironite or liquid chelated iron), for yellowing between veins", organic: false },

  // Fungicides
  copper: { name: "Copper fungicide (e.g. Bonide Captain Jack's Liquid Copper)", organic: true },
  limeSulfur: { name: "Lime sulfur (e.g. Lime-Sulfur Spray)", organic: true, note: "Dormant season only; stains walls and fences." },
  sulfurFungicide: { name: "Wettable sulfur (e.g. Bonide Sulfur Plant Fungicide)", organic: true, note: "Don't use within 2 weeks of an oil spray or above 85°F/29°C." },
  bicarbonate: { name: "Potassium bicarbonate (e.g. GreenCure or MilStop)", organic: true },
  biofungicide: { name: "Bacillus-based biofungicide (e.g. Serenade or Cease)", organic: true },
  neem: { name: "Neem oil (e.g. Garden Safe Neem Oil Extract)", organic: true, note: "Fungicide, insecticide and miticide. Spray in the evening to protect bees." },
  chlorothalonil: { name: "Chlorothalonil (e.g. Daconil Fungicide)", organic: false },
  myclobutanil: { name: "Myclobutanil (e.g. Spectracide Immunox)", organic: false },
  tebuconazole: { name: "Tebuconazole (e.g. BioAdvanced Disease Control for Roses, Flowers & Shrubs)", organic: false },
  captan: { name: "Captan (fruit tree fungicide)", organic: false },

  // Insecticides / oils
  dormantOil: { name: "Horticultural / dormant oil (e.g. Bonide All Seasons Oil)", organic: true },
  insecticidalSoap: { name: "Insecticidal soap (e.g. Safer Brand)", organic: true },
  spinosad: { name: "Spinosad (e.g. Captain Jack's Deadbug Brew)", organic: true, note: "Toxic to bees while wet. Spray at dusk." },
  bt: { name: "Bt, Bacillus thuringiensis var. kurstaki (e.g. Thuricide, Dipel)", organic: true, note: "Only affects caterpillars." },
  kaolin: { name: "Kaolin clay (e.g. Surround WP)", organic: true },
  acetamiprid: { name: "Acetamiprid (e.g. Ortho Flower, Fruit & Vegetable Insect Killer)", organic: false, note: "Never spray open flowers. It harms pollinators." },

  // Soil / mulch
  shreddedBark: { name: "Shredded hardwood or pine bark mulch", organic: true },
  pineStraw: { name: "Pine straw or pine bark fines (slightly acidifying)", organic: true },
  strawMulch: { name: "Clean straw (not hay, which carries seeds)", organic: true },
  gravelMulch: { name: "Pea gravel or crushed stone mulch (stays dry around crowns)", organic: true },
  pottingAcid: { name: "Acidic potting mix (e.g. azalea/camellia mix) when planting", organic: true },
  pottingCitrus: { name: "Fast-draining cactus & citrus mix for containers", organic: true },
} satisfies Record<string, Product>;

/* ------------------------------------------------------------------ */
/* Common tasks                                                        */
/* ------------------------------------------------------------------ */

export function soilTest(ph: string): CareTask {
  return {
    id: "soil-test",
    type: "soil",
    title: "Test the soil (every 3 years)",
    timing: before("lastFrost", -8, -3),
    why: `This plant prefers a pH of ${ph}. A soil test tells you whether you need lime, sulfur or extra nutrients, so you aren't guessing.`,
    steps: [
      "Take 6–8 small samples from the root zone, 4–6 in (10–15 cm) deep, using a clean trowel.",
      "Mix them in a clean bucket, let the soil air-dry, and send about 2 cups to your local extension office or a soil lab. A home kit works but is less accurate.",
      "Follow the lime or sulfur amounts in the report. Change pH slowly: no more than 1 unit a year.",
    ],
    tools: ["Clean trowel", "Plastic bucket", "Soil test kit or lab mailer"],
  };
}

export function compostTopDress(extra?: string): CareTask {
  return {
    id: "compost",
    type: "soil",
    title: "Top-dress with compost",
    timing: before("lastFrost", -3, 2),
    why: "Compost feeds soil life, improves drainage in clay and helps sandy soil hold water.",
    steps: [
      "Pull back old mulch.",
      "Spread 1 in (2–3 cm) of finished compost over the root zone, out to the drip line.",
      "Don't dig it in. Worms will work it into the soil without disturbing the roots.",
      ...(extra ? [extra] : []),
      "Put the mulch back.",
    ],
    products: [P.compost],
  };
}

export function mulch(opts: { acid?: boolean; dry?: boolean } = {}): CareTask {
  return {
    id: "mulch",
    type: "soil",
    title: "Refresh mulch",
    timing: before("lastFrost", 2, 6),
    why: "Mulch keeps roots cool and moist, suppresses weeds and slowly feeds the soil. Applying it after the soil warms lets roots wake up first.",
    steps: [
      opts.dry
        ? "Use a thin layer, 1 in (2–3 cm), of gravel or coarse mulch. This plant hates wet crowns."
        : "Spread 2–3 in (5–7 cm) of mulch over the root zone.",
      "Keep mulch 2–3 in (5–7 cm) away from stems and trunks. Mulch piled against bark invites rot and rodents.",
      "Don't go deeper than 3 in (7 cm) in total. Too much mulch suffocates roots.",
    ],
    products: opts.dry ? [P.gravelMulch] : opts.acid ? [P.pineStraw, P.shreddedBark] : [P.shreddedBark],
  };
}

export function fallCleanup(disease: string): CareTask {
  return {
    id: "fall-cleanup",
    type: "plant-care",
    title: "Autumn cleanup of fallen leaves",
    timing: before("firstFrost", 0, 4),
    why: `Spores of ${disease} overwinter on fallen leaves and splash back up in spring. Removing them is the single best way to prevent next year's outbreak.`,
    steps: [
      "Rake up and remove fallen leaves and dropped fruit from under the plant.",
      "Bag diseased material or put it in the trash. Don't compost it unless your pile gets hot (140°F/60°C+).",
      "Cut out any dead or obviously diseased twigs you can see.",
    ],
    tools: ["Rake", "Bypass pruners"],
  };
}

export function winterMulch(what: string, maxZone?: number): CareTask {
  return {
    id: "winter-protect",
    type: "protect",
    title: "Winter protection",
    timing: before("firstFrost", 3, 7),
    why: `Prevents freeze–thaw cycles from heaving roots and protects ${what} through the coldest weeks.`,
    steps: [
      "Wait until the ground has frozen or had several hard frosts. Covering too early invites rodents.",
      `Mound 6–10 in (15–25 cm) of shredded leaves, straw or compost over ${what}.`,
      "Pull the mound back gradually in spring once hard freezes are over.",
    ],
    products: [P.strawMulch],
    skipIfFrostFree: true,
    maxZone,
  };
}

export function deepWaterBeforeFreeze(): CareTask {
  return {
    id: "fall-water",
    type: "protect",
    title: "Deep-water before the ground freezes",
    timing: before("firstFrost", -1, 4),
    why: "Evergreens keep losing water through their leaves all winter. Going into winter well hydrated prevents winter burn (brown, scorched foliage).",
    steps: [
      "If autumn has been dry, give a slow, deep soak: about 10 gallons (40 L) per inch of trunk diameter, or 1 in (2.5 cm) of water across the root zone.",
      "Repeat every 2–3 weeks until the ground freezes.",
      "Optionally spray an anti-desiccant (e.g. Wilt-Pruf) on a mild day above 40°F/4°C.",
    ],
    skipIfFrostFree: true,
  };
}

export function dormantOil(pests: string): CareTask {
  return {
    id: "dormant-oil",
    type: "spray",
    title: "Dormant oil spray",
    timing: before("lastFrost", -6, -2),
    why: `Smothers overwintering ${pests} before they hatch. It's the lowest-toxicity insect control you can do all year.`,
    steps: [
      "Pick a calm, dry day between 40°F and 70°F (4–21°C) with no freeze forecast for 24 hours.",
      "Mix the oil at the label's dormant rate.",
      "Coat every branch, crotch and bark crevice until it drips.",
      "Spray before buds open. Oil on tender green tissue can burn it.",
    ],
    products: [P.dormantOil],
    caution: "Don't use within 2 weeks of a sulfur spray. Don't spray blue spruce or other blue conifers; oil strips their color.",
  };
}

export function dormantCopper(diseases: string): CareTask {
  return {
    id: "dormant-fungicide",
    type: "spray",
    title: "Dormant fungicide spray",
    timing: before("lastFrost", -6, -2),
    why: `Kills overwintering spores of ${diseases} on bark and bud scales before they can infect new growth.`,
    steps: [
      "Spray on a dry day above 40°F/4°C, just before buds swell.",
      "Cover all bark and buds thoroughly.",
      "Rinse your sprayer well afterward. Copper corrodes metal parts.",
    ],
    products: [P.copper, P.limeSulfur],
  };
}

export function preventiveFungicide(id: string, disease: string, timing: Timing, times: number, products: Product[]): CareTask {
  return {
    id,
    type: "spray",
    title: `Preventive spray for ${disease}`,
    timing,
    repeat: { everyWeeks: 2, times },
    why: `${disease} is far easier to prevent than cure. These sprays protect new leaves but won't fix leaves that are already spotted.`,
    steps: [
      "Spray early in the morning on a dry day with no rain forecast for 24 hours.",
      "Cover the tops and undersides of the leaves.",
      "Repeat every 10–14 days in wet weather. You can stretch the interval during dry spells.",
      "Alternate products with different active ingredients so the disease doesn't build resistance.",
    ],
    products,
    caution: "Don't spray when it's above 85°F/29°C, and never mix oils with sulfur.",
  };
}

export function stopFeeding(): CareTask {
  return {
    id: "stop-feeding",
    type: "fertilize",
    title: "Stop fertilizing for the season",
    timing: before("firstFrost", -8, -6),
    why: "Late feeding pushes soft new growth that won't harden off before frost and gets killed back.",
    steps: [
      "Don't apply any more fertilizer until spring. If you were planning one last feeding, do it now or skip it.",
      "Keep watering as normal. Well-watered plants handle winter better.",
    ],
  };
}
