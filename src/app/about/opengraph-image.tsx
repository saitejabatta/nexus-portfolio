import { ImageResponse } from "next/og";

export const alt = "Under the hood — how this AI portfolio actually works";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// A tailored share card for /about — echoes the page's pipeline theme so a
// shared link reads as "the technical deep-dive," distinct from the home card.
export default async function AboutOpengraphImage() {
  const stages = ["query", "embed", "search", "rerank", "generate"];

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
          background:
            "radial-gradient(ellipse at 30% 20%, #0d1f33 0%, #05070d 60%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* grid backdrop */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "#22d3ee",
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase",
          }}
        >
          {"// NEXUS · learn about me"}
        </div>

        <div
          style={{
            marginTop: 24,
            fontSize: 96,
            fontWeight: 700,
            color: "#e5f2ff",
            lineHeight: 1.03,
          }}
        >
          Under the hood
        </div>

        <div style={{ marginTop: 18, fontSize: 36, color: "#7e93ae", maxWidth: 900 }}>
          How a question really travels through a live RAG system.
        </div>

        {/* pipeline motif */}
        <div style={{ marginTop: 54, display: "flex", alignItems: "center" }}>
          {stages.map((s, i) => {
            const accent = s === "search" || s === "generate";
            return (
              <div key={s} style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: accent ? 20 : 14,
                      height: accent ? 20 : 14,
                      borderRadius: 999,
                      background: s === "generate" ? "#a855f7" : "#22d3ee",
                      opacity: accent ? 1 : 0.45,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 22,
                      color: accent ? (s === "generate" ? "#a855f7" : "#22d3ee") : "#46566e",
                      fontFamily: "monospace",
                    }}
                  >
                    {s}
                  </div>
                </div>
                {i < stages.length - 1 && (
                  <div
                    style={{
                      width: 46,
                      height: 2,
                      margin: "0 16px",
                      background: "rgba(229,242,255,0.18)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    ),
    { ...size },
  );
}
