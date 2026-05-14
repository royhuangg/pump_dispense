import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";

const MONO = '"SF Mono", Menlo, Monaco, Consolas, "Courier New", monospace';

const DISPENSE_START = 450;
const ANOMALY_START = 750;
const COMP_START = 840;
const ON_SPEC_START = 900;

const seeded = (i: number) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;

type RowProps = {
  label: string;
  value: string;
  unit: string;
  highlight?: "neutral" | "red" | "amber" | "green";
};

const Row: React.FC<RowProps> = ({ label, value, unit, highlight = "neutral" }) => {
  const valColor =
    highlight === "red"
      ? theme.error
      : highlight === "amber"
        ? "#F59E0B"
        : highlight === "green"
          ? theme.success
          : theme.text;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        padding: "6px 0",
        borderBottom: "1px solid rgba(168, 85, 247, 0.12)",
      }}
    >
      <div style={{ fontSize: 12, color: theme.textDim, letterSpacing: 2, fontFamily: MONO }}>
        {label}
      </div>
      <div style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: valColor }}>{value}</span>
        <span style={{ fontSize: 11, color: theme.textDim, marginLeft: 6 }}>{unit}</span>
      </div>
    </div>
  );
};

export const RealtimeMetrics: React.FC = () => {
  const frame = useCurrentFrame();

  const phase: "standby" | "monitoring" | "anomaly" | "compensating" | "normal" =
    frame < DISPENSE_START
      ? "standby"
      : frame < ANOMALY_START
        ? "monitoring"
        : frame < COMP_START
          ? "anomaly"
          : frame < ON_SPEC_START
            ? "compensating"
            : "normal";

  const tick = Math.floor(frame / 3);

  const ppNoise = (seeded(tick) - 0.5) * 0.12;
  const pfNoise = (seeded(tick + 333) - 0.5) * 0.1;
  const tNoise = (seeded(tick + 555) - 0.5) * 0.04;

  const isActive = phase !== "standby";
  const pp = isActive ? 5.18 + ppNoise : 0;
  const pfBase =
    phase === "anomaly"
      ? interpolate(frame, [ANOMALY_START, ANOMALY_START + 30], [4.52, 5.05], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : phase === "compensating"
        ? interpolate(frame, [COMP_START, ON_SPEC_START], [5.05, 4.52], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        : phase === "monitoring" || phase === "normal"
          ? 4.52
          : 0;
  const pf = isActive ? pfBase + pfNoise : 0;

  const t = 4.0 + tNoise;

  const volCum = Math.min(472, Math.max(0, frame - DISPENSE_START) * 1.2);

  const rFactor =
    phase === "standby"
      ? 0
      : phase === "monitoring"
        ? 0.340 + ppNoise * 0.02
        : phase === "anomaly"
          ? interpolate(frame, [ANOMALY_START, ANOMALY_START + 25], [0.345, 0.650], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) + ppNoise * 0.04
          : phase === "compensating"
            ? interpolate(frame, [COMP_START, ON_SPEC_START], [0.650, 0.340], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) + ppNoise * 0.03
            : 0.340 + ppNoise * 0.015;

  const rHighlight: "red" | "amber" | "green" | "neutral" =
    phase === "anomaly" ? "red" : phase === "compensating" ? "amber" : phase === "normal" ? "green" : "neutral";

  const indicatorBlink = Math.floor(frame / 8) % 2 === 0;
  const streamingPulse = (Math.sin(frame * 0.3) + 1) / 2;
  const streamProgress = (frame % 30) / 30;

  return (
    <div
      style={{
        width: 290,
        background: "rgba(10, 8, 22, 0.92)",
        border: `1px solid rgba(168, 85, 247, 0.4)`,
        borderRadius: 12,
        padding: "14px 18px",
        boxShadow: "0 12px 36px rgba(0,0,0,0.55), 0 0 32px rgba(168, 85, 247, 0.18)",
        backdropFilter: "blur(16px)",
        fontFamily: MONO,
        color: theme.text,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 2 }}>
        <div
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: theme.success,
            opacity: indicatorBlink ? 1 : 0.35,
            boxShadow: `0 0 10px ${theme.success}`,
          }}
        />
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3 }}>
          REALTIME METRICS
        </div>
      </div>
      <div style={{ fontSize: 10, color: theme.textDim, letterSpacing: 1.5, marginBottom: 8 }}>
        Live samples · 240 Hz feed
      </div>

      <div style={{ borderTop: "1px solid rgba(168, 85, 247, 0.25)" }}>
        <Row label="P_p" value={pp.toFixed(2)} unit="pulse" />
        <Row label="P_f" value={pf.toFixed(2)} unit="pulse" />
        <Row label="T" value={t.toFixed(1)} unit="°C" />
        <Row label="VOL CUM" value={volCum.toFixed(1)} unit="mL" />
        <Row label="R-FACTOR" value={rFactor.toFixed(3)} unit="mL/p" highlight={rHighlight} />
      </div>

      <div
        style={{
          marginTop: 10,
          padding: "7px 10px",
          background: "rgba(15, 10, 30, 0.85)",
          border: "1px solid rgba(168, 85, 247, 0.25)",
          borderRadius: 7,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: theme.accentStart,
                opacity: streamingPulse,
                boxShadow: `0 0 8px ${theme.accentStart}`,
              }}
            />
            <div style={{ fontSize: 11, letterSpacing: 2, color: theme.textDim }}>STREAMING</div>
          </div>
          <div style={{ fontSize: 10, color: theme.textDim, fontVariantNumeric: "tabular-nums" }}>
            {tick.toString().padStart(4, "0")} pkt
          </div>
        </div>
        <div
          style={{
            height: 2,
            background: "rgba(168, 85, 247, 0.18)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${streamProgress * 100}%`,
              height: "100%",
              background: theme.accent,
              boxShadow: "0 0 8px rgba(168, 85, 247, 0.7)",
            }}
          />
        </div>
      </div>
    </div>
  );
};
