/** Neutral wording for how a worry's intensity moved between sealing and opening. */
export function describeIntensityChange(then: number, now: number): string {
  const diff = now - then;
  if (diff === 0) return `About the same as when you sealed it (${then} / 10).`;
  const size = Math.abs(diff);
  const points = size === 1 ? "1 point" : `${size} points`;
  return diff < 0
    ? `${points} lower than when you sealed it (${then} → ${now}).`
    : `${points} higher than when you sealed it (${then} → ${now}).`;
}
