export interface RadarDatum {
  id: string;
  /** Short label drawn around the chart. */
  label: string;
  /** Percentage of recent entries, 0 to 100. */
  share: number;
}

interface FingerprintRadarProps {
  data: readonly RadarDatum[];
}

const SIZE = { width: 360, height: 320 };
const CENTER = { x: 180, y: 160 };
const RADIUS = 105;
const LABEL_RADIUS = RADIUS + 20;
const RINGS = [0.25, 0.5, 0.75, 1];

function pointAt(index: number, count: number, distance: number): { x: number; y: number } {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
  return { x: CENTER.x + Math.cos(angle) * distance, y: CENTER.y + Math.sin(angle) * distance };
}

function toPath(points: readonly { x: number; y: number }[]): string {
  return `${points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ")} Z`;
}

/**
 * The "Overthinking Fingerprint": one spoke per kind of thinking, longer where
 * more of the recent entries line up with it. Pure SVG, drawn on the server.
 * The picture is hidden from assistive tech and replaced by one sentence with the numbers.
 */
export function FingerprintRadar({ data }: FingerprintRadarProps) {
  const count = data.length;
  // The outer ring is at least 50% so a single small pattern does not fill the whole chart.
  const scaleMax = Math.max(50, ...data.map((item) => item.share));

  const shape = data.map((item, index) => pointAt(index, count, Math.max(3, (item.share / scaleMax) * RADIUS)));
  const spoken = data.map((item) => `${item.label}: ${item.share} percent of recent entries`).join(". ");

  return (
    <svg
      viewBox={`0 0 ${SIZE.width} ${SIZE.height}`}
      role="img"
      aria-label={`Overthinking fingerprint. ${spoken}.`}
      className="mx-auto h-auto w-full max-w-md"
    >
      {RINGS.map((ring) => (
        <path
          key={ring}
          d={toPath(data.map((_, index) => pointAt(index, count, RADIUS * ring)))}
          fill="none"
          className="stroke-border"
          strokeWidth={1}
        />
      ))}

      {data.map((item, index) => {
        const end = pointAt(index, count, RADIUS);
        return <line key={item.id} x1={CENTER.x} y1={CENTER.y} x2={end.x} y2={end.y} className="stroke-border" strokeWidth={1} />;
      })}

      <path d={toPath(shape)} className="animate-in fade-in-0 fill-primary/20 stroke-primary duration-700" strokeWidth={2} strokeLinejoin="round" />

      {shape.map((point, index) => (
        <circle key={data[index]?.id} cx={point.x} cy={point.y} r={3.5} className="fill-primary" />
      ))}

      {data.map((item, index) => {
        const point = pointAt(index, count, LABEL_RADIUS);
        const anchor = point.x < CENTER.x - 8 ? "end" : point.x > CENTER.x + 8 ? "start" : "middle";
        return (
          <text
            key={item.id}
            x={point.x}
            y={point.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="fill-muted-foreground text-[11px]"
          >
            {item.label}
          </text>
        );
      })}
    </svg>
  );
}
