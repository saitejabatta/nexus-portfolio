import { ImageResponse } from "next/og";
import { getPortfolio } from "@/lib/data/repository";

export const alt = "NEXUS — an AI portfolio you can talk to";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const { profile } = getPortfolio();

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
{"// NEXUS"}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 92,
            fontWeight: 700,
            color: "#e5f2ff",
            lineHeight: 1.05,
          }}
        >
          {profile.name}
        </div>
        <div style={{ marginTop: 16, fontSize: 40, color: "#7e93ae" }}>
          {profile.headline}
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 28,
            color: "#22d3ee",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          An AI portfolio you can talk to — watch the RAG pipeline think.
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
