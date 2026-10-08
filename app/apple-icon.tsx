import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Same colors as app/icon.svg, kept in sync manually — this file can't import
// the Tailwind config since it runs on the Edge runtime.
const PRIMARY = "#4F46E5";
const SIGNAL = "#2DE0B5";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: PRIMARY,
          borderRadius: 40,
        }}
      >
        <svg width="108" height="108" viewBox="0 0 32 32" fill="none">
          <path
            d="M23.66 9.57A10 10 0 1 1 12.58 6.6"
            stroke="#FFFFFF"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle cx="12.58" cy="6.6" r="2.8" fill={SIGNAL} />
        </svg>
      </div>
    ),
    { ...size },
  );
}
