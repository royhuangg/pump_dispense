import { useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

const MONO = '"SF Mono", Menlo, Monaco, Consolas, "Courier New", monospace';

type Milestone = { start: number; status: string; color: string; terminal: string };

const MILESTONES: Milestone[] = [
  { start: 0, status: "STANDBY", color: theme.textDim, terminal: "System ready · awaiting dispense" },
  { start: 450, status: "MONITORING", color: theme.textDim, terminal: "Manifold loaded · monitoring dispense in real time" },
  { start: 750, status: "ANOMALY DETECTED", color: theme.error, terminal: "R-Factor outlier · 1.5σ off manifold" },
  { start: 840, status: "COMPENSATING", color: "#F59E0B", terminal: "Auto-compensating ingredient flow" },
  { start: 900, status: "ON SPEC", color: theme.success, terminal: "Ratio normalized · drink on spec" },
];

const currentMilestone = (frame: number): Milestone => {
  let m = MILESTONES[0];
  for (const x of MILESTONES) {
    if (frame >= x.start) m = x;
  }
  return m;
};

const formatTime = (frame: number, fps: number) => {
  const totalSec = Math.floor(frame / fps) + 12 * 3600 + 34 * 60 + 12;
  const h = Math.floor(totalSec / 3600) % 24;
  const m = Math.floor(totalSec / 60) % 60;
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export const DashboardChrome: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ms = currentMilestone(frame);
  const blink = Math.floor(frame / 15) % 2 === 0;

  const charCount = Math.min(ms.terminal.length, Math.max(0, Math.floor((frame - ms.start) * 1.4)));
  const typedText = ms.terminal.slice(0, charCount);

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 30,
          right: 30,
          height: 56,
          background: "rgba(15, 10, 30, 0.72)",
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: 14,
          backdropFilter: "blur(20px)",
          boxShadow: "0 0 28px rgba(168, 85, 247, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          fontFamily: MONO,
          color: theme.text,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: ms.color,
              opacity: blink ? 1 : 0.3,
              boxShadow: `0 0 12px ${ms.color}`,
            }}
          />
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2.5 }}>
            DRINKBOT AI · LIVE
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 2,
              color: ms.color,
              textShadow: `0 0 12px ${ms.color}80`,
            }}
          >
            {ms.status}
          </div>
          <div style={{ fontSize: 18, color: theme.textDim, fontVariantNumeric: "tabular-nums" }}>
            {formatTime(frame, fps)}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 26,
          left: 30,
          right: 30,
          height: 56,
          background: "rgba(15, 10, 30, 0.72)",
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: 14,
          backdropFilter: "blur(20px)",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontFamily: MONO,
          fontSize: 24,
          fontWeight: 600,
          color: theme.text,
        }}
      >
        <span style={{ color: theme.accentStart }}>{">"}</span>
        <span style={{ letterSpacing: 0.3 }}>{typedText}</span>
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: 26,
            background: theme.accentStart,
            opacity: blink ? 1 : 0,
            marginLeft: 2,
          }}
        />
      </div>
    </>
  );
};
