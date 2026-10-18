/**
 * A small picture for each plant, drawn from the Noto emoji set (bundled in
 * public/plant-icons so it looks the same on every device). Plants without a
 * close emoji, and AI-written guides, fall back to their category's picture.
 */
import type { PlantCategory, PlantGuide } from "./types";

const BY_KEY: Record<string, string> = {
  // Fruit
  apple: "🍎",
  "asian-pear": "🍐",
  pear: "🍐",
  quince: "🍐",
  peach: "🍑",
  apricot: "🍑",
  plum: "🍑",
  cherry: "🍒",
  citrus: "🍋",
  mandarin: "🍊",
  blueberry: "🫐",
  blackberry: "🫐",
  mulberry: "🫐",
  serviceberry: "🫐",
  raspberry: "🍓",
  strawberry: "🍓",
  grape: "🍇",
  kiwi: "🥝",
  persimmon: "🍅",
  pomegranate: "🍎",
  tomato: "🍅",
  pepper: "🫑",
  // Nuts
  chestnut: "🌰",
  hazelnut: "🌰",
  walnut: "🌰",
  pecan: "🌰",
  almond: "🌰",
  pistachio: "🥜",
  macadamia: "🥜",
  // Roses & flowering shrubs
  "hybrid-tea-rose": "🌹",
  "shrub-rose": "🌹",
  "climbing-rose": "🌹",
  "bigleaf-hydrangea": "🪻",
  "panicle-hydrangea": "💮",
  "smooth-hydrangea": "💮",
  "oakleaf-hydrangea": "💮",
  "climbing-hydrangea": "💮",
  lilac: "🪻",
  azalea: "🌺",
  rhododendron: "🌺",
  camellia: "🌺",
  "rose-of-sharon": "🌺",
  weigela: "🌸",
  spirea: "🌸",
  abelia: "🌸",
  "crape-myrtle": "🌸",
  viburnum: "💮",
  gardenia: "💮",
  forsythia: "🌼",
  "butterfly-bush": "🦋",
  // Trees & evergreens
  "japanese-maple": "🍁",
  dogwood: "🌸",
  redbud: "🌸",
  magnolia: "🪷",
  "strawberry-tree": "🌳",
  fig: "🌳",
  medlar: "🌳",
  arborvitae: "🌲",
  juniper: "🌲",
  yew: "🌲",
  holly: "🌲",
  boxwood: "🌿",
  // Perennials & vines
  lavender: "🪻",
  salvia: "🪻",
  "russian-sage": "🪻",
  catmint: "🪻",
  "bearded-iris": "🪻",
  wisteria: "🪻",
  clematis: "🌺",
  peony: "🌸",
  hosta: "🌿",
  daylily: "🌼",
  coneflower: "🌼",
  mum: "🌼",
  "black-eyed-susan": "🌻",
  "ornamental-grass": "🌾",
  sedum: "🪴",
  // Herbs & tropicals
  basil: "🌿",
  mint: "🌿",
  thyme: "🌿",
  rosemary: "🌿",
  bougainvillea: "🌺",
  "tropical-hibiscus": "🌺",
  lantana: "🌼",
};

const BY_CATEGORY: Record<PlantCategory, { emoji: string; tint: string }> = {
  rose: { emoji: "🌹", tint: "#fbe9ec" },
  shrub: { emoji: "🌸", tint: "#f8eef6" },
  evergreen: { emoji: "🌲", tint: "#e6f1e6" },
  tree: { emoji: "🌳", tint: "#e8f1e4" },
  fruit: { emoji: "🍎", tint: "#fdeee6" },
  nut: { emoji: "🌰", tint: "#f4ece0" },
  vine: { emoji: "🍇", tint: "#efeaf6" },
  perennial: { emoji: "🌼", tint: "#fbf4dc" },
  herb: { emoji: "🌿", tint: "#e9f3e7" },
  vegetable: { emoji: "🥕", tint: "#fdf0e3" },
  tropical: { emoji: "🌺", tint: "#fdebeb" },
};

/** Image file name for an emoji, matching the bundled Noto images (e.g. "1f34e"). */
export function emojiFile(emoji: string): string {
  return [...emoji]
    .map((c) => c.codePointAt(0)!.toString(16))
    .filter((cp) => cp !== "fe0f")
    .join("-");
}

export function plantIcon(guide: Pick<PlantGuide, "key" | "category">) {
  const cat = BY_CATEGORY[guide.category] ?? BY_CATEGORY.shrub;
  const emoji = BY_KEY[guide.key] ?? cat.emoji;
  return { emoji, src: `/plant-icons/${emojiFile(emoji)}.png`, tint: cat.tint };
}

/** Every emoji the app can show, for copying the image files. */
export function allIconEmoji(): string[] {
  return [...new Set([...Object.values(BY_KEY), ...Object.values(BY_CATEGORY).map((c) => c.emoji)])];
}
