import { interpolate, useCurrentFrame } from "remotion";

const MONO = '"SF Mono", Menlo, Monaco, Consolas, "Courier New", monospace';

type Stream = {
  id: string;
  label?: string;
  showLabel: boolean;
  color: string;
  colorRgb: string;
  sx: number;
  sy: number;
  ex: number;
  ey: number;
  fadeFrames: [number, number, number, number];
  mode: "pulse" | "draw";
  drawRange?: [number, number];
};

const STREAMS: Stream[] = [
  {
    id: "dispense-to-metrics",
    label: "TUBE 04 · MANGO",
    showLabel: true,
    color: "#FBBF24",
    colorRgb: "rgba(251, 191, 36,",
    sx: 760,
    sy: 290,
    ex: 985,
    ey: 320,
    fadeFrames: [450, 465, 732, 750],
    mode: "pulse",
  },
  {
    id: "metrics-to-anomaly",
    label: "→ ANOMALY",
    showLabel: false,
    color: "#EF4444",
    colorRgb: "rgba(239, 68, 68,",
    sx: 1275,
    sy: 305,
    ex: 1605,
    ey: 430,
    fadeFrames: [750, 765, 825, 840],
    mode: "draw",
    drawRange: [755, 815],
  },
];

const PULSE_INTERVAL = 14;
const PULSE_DURATION = 26;
const MAX_PULSES = 40;

const linear = (t: number, sx: number, sy: number, ex: number, ey: number) => ({
  x: sx + (ex - sx) * t,
  y: sy + (ey - sy) * t,
});

type StreamProps = {
  stream: Stream;
  frame: number;
  opacity: number;
};

const StreamRender: React.FC<StreamProps> = ({ stream, frame, opacity }) => {
  const { sx, sy, ex, ey, color, colorRgb, id, label, showLabel, mode, drawRange } = stream;

  const pathD = `M ${sx} ${sy} L ${ex} ${ey}`;
  const pathLength = Math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2);

  const sourcePulse = (Math.sin(frame * 0.4) + 1) / 2;
  const targetPulse = (Math.sin(frame * 0.4 - Math.PI / 2) + 1) / 2;
  const dashOffset = -(frame * 1.2) % 14;

  const gradId = `streamGradient-${id}`;
  const glowId = `endpointGlow-${id}`;

  const drawT =
    mode === "draw" && drawRange
      ? interpolate(frame, drawRange, [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : 1;
  const tipX = sx + (ex - sx) * drawT;
  const tipY = sy + (ey - sy) * drawT;
  const drawingActive = mode === "draw" && drawT > 0 && drawT < 1;

  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity={0.75} />
          <stop offset="50%" stopColor={color} stopOpacity={0.55} />
          <stop offset="100%" stopColor={color} stopOpacity={0.45} />
        </linearGradient>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity={1} />
          <stop offset="60%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>

      {mode === "draw" ? (
        <path
          d={pathD}
          stroke={color}
          strokeWidth={3}
          fill="none"
          strokeDasharray={`${pathLength} ${pathLength}`}
          strokeDashoffset={pathLength * (1 - drawT)}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      ) : (
        <>
          <path
            d={pathD}
            stroke={`${colorRgb} 0.18)`}
            strokeWidth={9}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={pathD}
            stroke={`url(#${gradId})`}
            strokeWidth={2.8}
            fill="none"
            strokeDasharray="7 5"
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </>
      )}

      <circle cx={sx} cy={sy} r={36} fill={`url(#${glowId})`} opacity={0.4 + sourcePulse * 0.3} />
      <circle
        cx={sx}
        cy={sy}
        r={11 + sourcePulse * 4}
        fill="none"
        stroke={color}
        strokeWidth={2}
        opacity={0.6 + sourcePulse * 0.4}
      />
      <circle
        cx={sx}
        cy={sy}
        r={7}
        fill={color}
        style={{ filter: `drop-shadow(0 0 14px ${color})` }}
      />

      {showLabel && label && (
        <g transform={`translate(${sx - 210}, ${sy - 16})`} fontFamily={MONO}>
          <rect
            x={0}
            y={0}
            width={196}
            height={32}
            rx={6}
            fill="rgba(15,10,30,0.92)"
            stroke={`${colorRgb} 0.55)`}
            strokeWidth={1}
          />
          <text x={98} y={21} fontSize={12} fontWeight={700} textAnchor="middle" letterSpacing={1.5}>
            <tspan fill={color}>{label.split("·")[0].trim()}</tspan>
            <tspan dx={8} fill="rgba(255,255,255,0.4)">·</tspan>
            <tspan dx={8} fill="white">{label.split("·")[1]?.trim() ?? ""}</tspan>
          </text>
        </g>
      )}

      {mode === "pulse" &&
        Array.from({ length: MAX_PULSES }).map((_, i) => {
          const startFrame = i * PULSE_INTERVAL;
          if (frame < startFrame || frame > startFrame + PULSE_DURATION) return null;
          const t = (frame - startFrame) / PULSE_DURATION;
          const pos = linear(t, sx, sy, ex, ey);
          const op = t < 0.1 ? t / 0.1 : t > 0.9 ? Math.max(0, 1 - (t - 0.9) / 0.1) : 1;
          const radius = 3.8 + (1 - t) * 1.5;
          return (
            <g key={i}>
              <circle cx={pos.x} cy={pos.y} r={radius * 2.4} fill="white" opacity={op * 0.18} />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius}
                fill="white"
                opacity={op}
                style={{ filter: `drop-shadow(0 0 ${10 * op}px white)` }}
              />
            </g>
          );
        })}

      {drawingActive && (
        <>
          <circle cx={tipX} cy={tipY} r={14} fill="white" opacity={0.18} />
          <circle
            cx={tipX}
            cy={tipY}
            r={6}
            fill="white"
            style={{ filter: `drop-shadow(0 0 14px ${color})` }}
          />
        </>
      )}

      {(mode !== "draw" || drawT >= 0.98) && (
        <>
          <circle cx={ex} cy={ey} r={28} fill={`url(#${glowId})`} opacity={0.4 + targetPulse * 0.25} />
          <circle
            cx={ex}
            cy={ey}
            r={10 + targetPulse * 3}
            fill="none"
            stroke={color}
            strokeWidth={2}
            opacity={0.55 + targetPulse * 0.3}
          />
          <circle
            cx={ex}
            cy={ey}
            r={6.5}
            fill={color}
            style={{ filter: `drop-shadow(0 0 12px ${color})` }}
          />
        </>
      )}
    </g>
  );
};

export const DataFlow: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 5,
      }}
      width="100%"
      height="100%"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="none"
    >
      {STREAMS.map((stream) => {
        const opacity = interpolate(
          frame,
          stream.fadeFrames,
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        if (opacity < 0.02) return null;
        return <StreamRender key={stream.id} stream={stream} frame={frame} opacity={opacity} />;
      })}
    </svg>
  );
};
