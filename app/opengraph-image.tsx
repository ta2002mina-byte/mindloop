import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MindLoop Lab — See the loop. Understand the pattern. Take the next step.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Same hex values as app/icon.svg / components/brand/logo.tsx, kept in sync manually
// since this file runs on the Edge runtime and can't import the Tailwind config.
const BG = "#F5F6FA"; // hsl(228 33% 97%) — --background (light)
const FOREGROUND = "#14162B"; // hsl(232 35% 11%) — --foreground (light)
const PRIMARY = "#4F46E5"; // hsl(243 75% 58%) — --primary
const SIGNAL = "#2DE0B5"; // hsl(165 75% 38%) — --signal
const MUTED = "#6B6F8C"; // hsl(231 14% 38%) — --muted-foreground

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: BG,
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo mark: the same "open loop with a node" shape as the in-app logo */}
        <svg width="96" height="96" viewBox="0 0 32 32" fill="none" style={{ marginBottom: 40 }}>
          <path
            d="M23.66 9.57A10 10 0 1 1 12.58 6.6"
            stroke={PRIMARY}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle cx="12.58" cy="6.6" r="2.8" fill={SIGNAL} />
        </svg>

        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            color: FOREGROUND,
            letterSpacing: "-0.02em",
            marginBottom: 20,
          }}
        >
          MindLoop&nbsp;<span style={{ color: MUTED, fontWeight: 400 }}>Lab</span>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: MUTED,
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          See the loop. Understand the pattern. Take the next step.
        </div>
      </div>
    ),
    { ...size },
  );
}
