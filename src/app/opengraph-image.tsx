import { ImageResponse } from "next/og";

export const alt = "Tend Weekly: gardening tips, pruning schedules and plant care for your climate";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share image used by social networks and messaging apps. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#faf8f2",
          color: "#1f2a1f",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="96" height="96" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="14" fill="#2f5d34" />
            <path d="M17 47 C17 27 30 15 50 14 C50 34 38 47 17 47 Z" fill="#faf8f2" />
            <path d="M12 52 L20 44 C27 37 34 30 42 22" fill="none" stroke="#2f5d34" strokeWidth="3.2" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 56, fontWeight: 700, color: "#2f5d34" }}>Tend Weekly</div>
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, marginTop: 48, lineHeight: 1.15 }}>
          Know exactly what your garden needs this weekend.
        </div>
        <div style={{ fontSize: 32, marginTop: 28, color: "#66705f" }}>
          Pruning, fertilizing &amp; spraying schedules for your plants and your climate.
        </div>
      </div>
    ),
    size,
  );
}
