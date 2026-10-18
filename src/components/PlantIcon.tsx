import { plantIcon } from "@/plants/icons";
import type { PlantGuide } from "@/plants/types";

/** Small picture of the plant on a soft tile, shown next to plant names. */
export function PlantIcon({ guide, size = 44 }: { guide: Pick<PlantGuide, "key" | "category">; size?: number }) {
  const icon = plantIcon(guide);
  const img = Math.round(size * 0.66);
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-xl"
      style={{ width: size, height: size, background: icon.tint }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny static icons; next/image adds no value here */}
      <img src={icon.src} alt="" width={img} height={img} loading="lazy" decoding="async" />
    </span>
  );
}
