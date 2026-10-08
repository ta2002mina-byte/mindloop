import { Logo } from "@/components/brand/logo";

const CX = 230;
const CY = 180;

/** The five stages of the MindLoop flow, placed around the ring. */
const STAGES = [
  { label: "Detect", x: 230, y: 70, lx: 230, ly: 50, anchor: "middle" },
  { label: "Visualize", x: 334.6, y: 146, lx: 350, ly: 150, anchor: "start" },
  { label: "Understand", x: 294.7, y: 269, lx: 308, ly: 288, anchor: "start" },
  { label: "Test", x: 165.3, y: 269, lx: 152, ly: 288, anchor: "end" },
  { label: "Act", x: 125.4, y: 146, lx: 110, ly: 150, anchor: "end" },
] as const;

function LoopDiagram() {
  return (
    <svg
      viewBox="0 0 460 340"
      role="img"
      aria-label="The MindLoop cycle: detect, visualize, understand, test, act, then back to detect."
      className="w-full max-w-md"
    >
      <circle cx={CX} cy={CY} r="110" fill="none" stroke="white" strokeOpacity="0.16" strokeWidth="1.5" strokeDasharray="2 7" />
      <circle cx={CX} cy={CY} r="64" fill="none" stroke="white" strokeOpacity="0.07" strokeWidth="1" />
      <circle cx={CX} cy={CY} r="5" className="animate-soft-pulse motion-reduce:animate-none" fill="hsl(165 70% 50%)" />

      {/* The orbiting node: one thought, going around, until it becomes an action. */}
      <g className="animate-orbit motion-reduce:animate-none" style={{ transformOrigin: `${CX}px ${CY}px` }}>
        <circle cx={CX} cy={CY - 110} r="12" fill="hsl(165 70% 50%)" fillOpacity="0.18" />
        <circle cx={CX} cy={CY - 110} r="4.5" fill="hsl(165 70% 50%)" />
      </g>

      {STAGES.map((stage) => (
        <g key={stage.label}>
          <circle cx={stage.x} cy={stage.y} r="6.5" fill="hsl(232 38% 8%)" stroke="white" strokeOpacity="0.55" strokeWidth="1.5" />
          <text
            x={stage.lx}
            y={stage.ly}
            textAnchor={stage.anchor}
            fill="white"
            fillOpacity="0.85"
            fontSize="14"
            fontWeight="500"
            style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}
          >
            {stage.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function BrandPanel() {
  return (
    <aside
      className="relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex xl:p-14"
      style={{
        backgroundColor: "hsl(232 38% 6%)",
        backgroundImage:
          "radial-gradient(60% 50% at 15% 0%, hsl(243 80% 45% / 0.5), transparent 70%), radial-gradient(50% 45% at 95% 100%, hsl(165 70% 40% / 0.28), transparent 70%)",
      }}
    >
      <Logo onDark />

      <div className="space-y-10">
        <div className="flex justify-center">
          <LoopDiagram />
        </div>
        <div className="max-w-md space-y-3">
          <p className="font-display text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
            See the loop. Understand the pattern. Take the next step.
          </p>
          <p className="text-sm leading-relaxed text-white/65">
            A private lab for the thoughts that keep circling. Separate what you know from what you assume, then decide what to do
            next.
          </p>
        </div>
      </div>

      <p className="text-xs text-white/45">Your entries are private to your account.</p>
    </aside>
  );
}
