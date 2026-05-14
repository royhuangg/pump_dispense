import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

const MONO = '"SF Mono", Menlo, Monaco, Consolas, "Courier New", monospace';

const VIRIDIS = [
  { t: 0.0, c: "#440154" },
  { t: 0.2, c: "#3B528B" },
  { t: 0.45, c: "#21908C" },
  { t: 0.7, c: "#5DC863" },
  { t: 1.0, c: "#FDE725" },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hexToRgb = (h: string) => ({ r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) });
const rgbToHex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

const viridis = (t: number) => {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 1; i < VIRIDIS.length; i++) {
    if (clamped <= VIRIDIS[i].t) {
      const span = VIRIDIS[i].t - VIRIDIS[i - 1].t;
      const k = (clamped - VIRIDIS[i - 1].t) / span;
      const a = hexToRgb(VIRIDIS[i - 1].c);
      const b = hexToRgb(VIRIDIS[i].c);
      return rgbToHex(lerp(a.r, b.r, k), lerp(a.g, b.g, k), lerp(a.b, b.b, k));
    }
  }
  return VIRIDIS[VIRIDIS.length - 1].c;
};

const W = 1000;
const H = 620;
const CX = W / 2;
const CY = 430;

const project = (x: number, y: number, z: number) => {
  const SCALE_XY = 78;
  const SCALE_Z = 340;
  const ANG = Math.PI / 6;
  const screenX = CX + (x - y) * SCALE_XY * Math.cos(ANG);
  const screenY = CY + (x + y) * SCALE_XY * Math.sin(ANG) - z * SCALE_Z;
  return { x: screenX, y: screenY };
};

const surface = (x: number, y: number) =>
  0.31 + 0.06 * Math.sin(x * 0.9) * Math.cos(y * 0.85) + 0.04 * Math.cos(x * 0.5 - 0.4) + 0.025 * Math.sin(y * 1.2);

const seed = (i: number) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
const grid: { x: number; y: number; z: number; jitter: number }[] = [];
{
  let idx = 0;
  const raw: { x: number; y: number; z: number; jitter: number }[] = [];
  for (let i = -2; i <= 2; i += 0.5) {
    for (let j = -2; j <= 2; j += 0.5) {
      const z = surface(i, j);
      const jitter = (seed(idx++) - 0.5) * 0.018;
      raw.push({ x: i, y: j, z, jitter });
    }
  }
  raw
    .map((p, k) => ({ ...p, order: seed(k + 500) }))
    .sort((a, b) => a.order - b.order)
    .forEach((p) => grid.push({ x: p.x, y: p.y, z: p.z, jitter: p.jitter }));
}

type Phase = "monitoring" | "anomaly" | "compensating" | "normal";

const phaseFromFrame = (frame: number): Phase => {
  if (frame < 750) return "monitoring";
  if (frame < 840) return "anomaly";
  if (frame < 900) return "compensating";
  return "normal";
};

const ZOOM_AMOUNT = 0.45;
const ZOOM_TARGET_X = 500;
const ZOOM_TARGET_Y = 290;

export const ManifoldPlot: React.FC<{ zoomIn?: number }> = ({ zoomIn = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phase = phaseFromFrame(frame);

  const enter = spring({ frame, fps, config: { damping: 22, stiffness: 80 } });
  const opacity = enter;

  const pointsRevealed = grid.length;
  const surfaceOpacity = 0.85;

  const anomalyX = 1.5;
  const anomalyY = -1.5;
  const ANOMALY_Z_START = 0.65;
  const anomalyZ = phase === "compensating" || phase === "normal"
    ? interpolate(frame, [840, 900], [ANOMALY_Z_START, surface(anomalyX, anomalyY)], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      })
    : ANOMALY_Z_START;
  const anomalyPulse = (Math.sin(frame * 0.35) + 1) / 2;

  const zoomScale = 1 + zoomIn * ZOOM_AMOUNT;
  const anomalyAnchor = project(anomalyX, anomalyY, 0.4);
  const targetTx = ZOOM_TARGET_X - (1 + ZOOM_AMOUNT) * anomalyAnchor.x;
  const targetTy = ZOOM_TARGET_Y - (1 + ZOOM_AMOUNT) * anomalyAnchor.y;
  const zoomTx = zoomIn * targetTx;
  const zoomTy = zoomIn * targetTy;

  const surfaceCells: { d: string; color: string; depth: number }[] = [];
  const step = 0.5;
  for (let i = -2; i < 2; i += step) {
    for (let j = -2; j < 2; j += step) {
      const c00 = project(i, j, surface(i, j));
      const c10 = project(i + step, j, surface(i + step, j));
      const c11 = project(i + step, j + step, surface(i + step, j + step));
      const c01 = project(i, j + step, surface(i, j + step));
      const zAvg = (surface(i, j) + surface(i + step, j) + surface(i + step, j + step) + surface(i, j + step)) / 4;
      const tNorm = (zAvg - 0.21) / 0.21;
      surfaceCells.push({
        d: `M ${c00.x} ${c00.y} L ${c10.x} ${c10.y} L ${c11.x} ${c11.y} L ${c01.x} ${c01.y} Z`,
        color: viridis(tNorm),
        depth: (i + j) * 0.5,
      });
    }
  }
  surfaceCells.sort((a, b) => a.depth - b.depth);

  const axisOrigin = project(-2, -2, 0.2);
  const axisXEnd = project(2, -2, 0.2);
  const axisYEnd = project(-2, 2, 0.2);
  const axisZEnd = project(-2, -2, 0.45);

  const TARGET_APPEAR_FRAME = 15;

  const targetAnchor = (() => {
    if (frame < TARGET_APPEAR_FRAME) return null;
    const pr = project(anomalyX, anomalyY, surface(anomalyX, anomalyY));
    const since = frame - TARGET_APPEAR_FRAME;
    const enter = spring({ frame: since, fps, config: { damping: 14, stiffness: 100 } });
    const pulse = (Math.sin(since * 0.16) + 1) / 2;
    const fadeOut =
      phase === "normal"
        ? interpolate(frame - 900, [0, 30], [1, 0.25], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        : 1;
    return { pr, enter, pulse, fadeOut };
  })();

  const deviationLine = (() => {
    if (phase !== "anomaly" && phase !== "compensating") return null;
    const from = project(anomalyX, anomalyY, surface(anomalyX, anomalyY));
    const to = project(anomalyX, anomalyY, anomalyZ);
    const since = frame - 750;
    const enter = spring({ frame: since - 8, fps, config: { damping: 22 } });
    return { from, to, enter };
  })();

  const successBadge = (() => {
    if (phase !== "normal") return null;
    const since = frame - 900;
    const badgeEnter = spring({ frame: since, fps, config: { damping: 14, stiffness: 110 } });
    const pulse = (Math.sin(since * 0.22) + 1) / 2;
    const pr = project(anomalyX, anomalyY, surface(anomalyX, anomalyY));
    return { pr, badgeEnter, pulse, since };
  })();

  const anomalyBadge = (() => {
    if (phase !== "anomaly" && phase !== "compensating") return null;
    const since = frame - 750;
    const badgeEnter = spring({ frame: since, fps, config: { damping: 14, stiffness: 110 } });
    const pulse = (Math.sin(since * 0.24) + 1) / 2;
    const pr = project(anomalyX, anomalyY, anomalyZ);
    return { pr, badgeEnter, pulse };
  })();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        fontFamily: MONO,
        color: theme.text,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 24,
          right: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 18,
          letterSpacing: 2,
          zIndex: 4,
        }}
      >
        <div style={{ color: theme.textDim }}>LEARNED MANIFOLD · R-FACTOR</div>
        <PhaseBadge phase={phase} />
      </div>

      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ position: "absolute", inset: 0 }}
      >
        <g transform={`translate(${zoomTx}, ${zoomTy}) scale(${zoomScale})`}>
          <line x1={axisOrigin.x} y1={axisOrigin.y} x2={axisXEnd.x} y2={axisXEnd.y} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
          <line x1={axisOrigin.x} y1={axisOrigin.y} x2={axisYEnd.x} y2={axisYEnd.y} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
          <line x1={axisOrigin.x} y1={axisOrigin.y} x2={axisZEnd.x} y2={axisZEnd.y} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />

          <text x={axisXEnd.x + 8} y={axisXEnd.y + 6} fill="rgba(255,255,255,0.5)" fontSize={20} fontFamily={MONO}>
            P_f/P_p
          </text>
          <text x={axisYEnd.x - 90} y={axisYEnd.y + 24} fill="rgba(255,255,255,0.5)" fontSize={20} fontFamily={MONO}>
            P_p/T
          </text>
          <text x={axisZEnd.x + 14} y={axisZEnd.y + 6} fill="rgba(255,255,255,0.5)" fontSize={20} fontFamily={MONO}>
            R-Factor (mL/P_f)
          </text>

          <g opacity={surfaceOpacity}>
            {surfaceCells.map((cell, i) => (
              <path key={i} d={cell.d} fill={cell.color} fillOpacity={0.55} stroke={cell.color} strokeWidth={0.7} strokeOpacity={0.5} />
            ))}
          </g>

          {grid.map((p, i) => {
            const pr = project(p.x, p.y, p.z + p.jitter);
            const color = viridis((p.z - 0.21) / 0.21);
            return (
              <circle key={i} cx={pr.x} cy={pr.y} r={6.5} fill={color} stroke="white" strokeOpacity={0.4} strokeWidth={1} />
            );
          })}

          {targetAnchor && (
            <g opacity={targetAnchor.enter * targetAnchor.fadeOut}>
              <circle
                cx={targetAnchor.pr.x}
                cy={targetAnchor.pr.y}
                r={20 + targetAnchor.pulse * 4}
                fill="none"
                stroke="white"
                strokeWidth={2}
                strokeDasharray="6 5"
                opacity={0.55}
              />
              <circle
                cx={targetAnchor.pr.x}
                cy={targetAnchor.pr.y}
                r={4}
                fill="white"
                opacity={0.75}
              />
              <rect
                x={targetAnchor.pr.x - 52}
                y={targetAnchor.pr.y + 34}
                width={104}
                height={26}
                rx={5}
                fill="rgba(15,10,30,0.85)"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={1}
              />
              <text
                x={targetAnchor.pr.x}
                y={targetAnchor.pr.y + 52}
                fontSize={14}
                fontWeight={700}
                textAnchor="middle"
                fill="white"
                opacity={0.92}
                fontFamily={MONO}
                letterSpacing={2.5}
              >
                TARGET
              </text>
            </g>
          )}

          {deviationLine && (
            <line
              x1={deviationLine.from.x}
              y1={deviationLine.from.y}
              x2={deviationLine.to.x}
              y2={deviationLine.to.y}
              stroke={theme.error}
              strokeWidth={2}
              strokeDasharray="3 3"
              opacity={deviationLine.enter * 0.7}
            />
          )}

          {(phase === "anomaly" || phase === "compensating" || phase === "normal") && (() => {
            const pr = project(anomalyX, anomalyY, anomalyZ);
            const isResolved = phase === "normal";
            const fill = isResolved ? theme.success : theme.error;
            return (
              <>
                {isResolved && (
                  <>
                    <circle cx={pr.x} cy={pr.y} r={26 + ((frame - 900) % 30) * 1.6} fill="none" stroke={theme.success} strokeWidth={2} opacity={0.6 - (((frame - 900) % 30) / 30) * 0.55} />
                    <circle cx={pr.x} cy={pr.y} r={18 + ((frame - 915) % 30) * 1.4} fill="none" stroke={theme.success} strokeWidth={2} opacity={0.7 - (((frame - 915) % 30) / 30) * 0.6} />
                  </>
                )}
                <circle
                  cx={pr.x}
                  cy={pr.y}
                  r={isResolved ? 14 : 12 + anomalyPulse * 5}
                  fill={fill}
                  stroke="white"
                  strokeWidth={isResolved ? 3 : 2}
                  style={{ filter: `drop-shadow(0 0 ${isResolved ? 26 : 18}px ${isResolved ? "rgba(16,185,129,0.95)" : "rgba(239,68,68,0.85)"})` }}
                />
                {!isResolved && (
                  <circle cx={pr.x} cy={pr.y} r={20 + anomalyPulse * 14} fill="none" stroke={fill} strokeWidth={2} opacity={0.5 - anomalyPulse * 0.3} />
                )}
              </>
            );
          })()}

          {successBadge && (
            <g
              transform={`translate(${successBadge.pr.x + 28}, ${successBadge.pr.y - 38})`}
              opacity={successBadge.badgeEnter}
            >
              <rect
                x={0}
                y={-22}
                width={150}
                height={44}
                rx={8}
                fill={theme.success}
                opacity={0.95}
                style={{ filter: `drop-shadow(0 0 ${16 + successBadge.pulse * 14}px rgba(16,185,129,0.9))` }}
              />
              <text x={75} y={6} fontSize={22} fontWeight={800} textAnchor="middle" fill="white" fontFamily={MONO} letterSpacing={1.2}>
                ✓ ON SPEC
              </text>
            </g>
          )}

          {anomalyBadge && (
            <g
              transform={`translate(${anomalyBadge.pr.x + 28}, ${anomalyBadge.pr.y - 38})`}
              opacity={anomalyBadge.badgeEnter}
            >
              <rect
                x={0}
                y={-22}
                width={150}
                height={44}
                rx={8}
                fill={theme.error}
                opacity={0.95}
                style={{ filter: `drop-shadow(0 0 ${16 + anomalyBadge.pulse * 14}px rgba(239,68,68,0.9))` }}
              />
              <text x={75} y={6} fontSize={22} fontWeight={800} textAnchor="middle" fill="white" fontFamily={MONO} letterSpacing={1.2}>
                ✗ ANOMALY
              </text>
            </g>
          )}

        </g>
      </svg>

      <div
        style={{
          position: "absolute",
          left: 24,
          bottom: 14,
          display: "flex",
          gap: 24,
          alignItems: "center",
          fontSize: 22,
          zIndex: 4,
        }}
      >
        <div>
          <div style={{ fontSize: 16, color: theme.textDim, letterSpacing: 2 }}>SAMPLES</div>
          <div style={{ fontWeight: 800, color: theme.text, fontVariantNumeric: "tabular-nums" }}>
            {String(pointsRevealed).padStart(3, "0")} / {grid.length}
          </div>
        </div>
        <div style={{ width: 1, height: 40, background: "rgba(255,255,255,0.15)" }} />
        <div>
          <div style={{ fontSize: 16, color: theme.textDim, letterSpacing: 2 }}>R-FACTOR</div>
          <div style={{ fontWeight: 800, color: phase === "normal" ? theme.success : phase === "anomaly" || phase === "compensating" ? theme.error : theme.text, fontVariantNumeric: "tabular-nums" }}>
            {(phase === "monitoring" || phase === "normal" ? surface(anomalyX, anomalyY) : anomalyZ).toFixed(3)} mL/p
          </div>
        </div>
      </div>
    </div>
  );
};

const PhaseBadge: React.FC<{ phase: Phase }> = ({ phase }) => {
  const map: Record<Phase, { label: string; color: string }> = {
    monitoring: { label: "MONITORING", color: theme.textDim },
    anomaly: { label: "ANOMALY", color: theme.error },
    compensating: { label: "COMPENSATING", color: "#F59E0B" },
    normal: { label: "ON SPEC", color: theme.success },
  };
  const { label, color } = map[phase];
  return (
    <div
      style={{
        fontSize: 18,
        fontWeight: 800,
        letterSpacing: 1.5,
        color,
        border: `1px solid ${color}`,
        padding: "6px 14px",
        borderRadius: 999,
        boxShadow: `0 0 12px ${color}80`,
      }}
    >
      {label}
    </div>
  );
};
