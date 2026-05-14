import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

const MONO = '"SF Mono", Menlo, Monaco, Consolas, "Courier New", monospace';

type Props = {
  state: "anomaly" | "ok";
};

export const DetectionBox: React.FC<Props> = ({ state }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = (Math.sin(frame * 0.25) + 1) / 2;
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });

  const isAnomaly = state === "anomaly";
  const color = isAnomaly ? theme.error : theme.success;
  const glowRgb = isAnomaly ? "239, 68, 68" : "16, 185, 129";
  const label = isAnomaly ? "AI · ANOMALY" : "✓ ON SPEC";

  const cornerSize = 22;
  const cornerThickness = 4;
  const cornerStyle = {
    position: "absolute" as const,
    width: cornerSize,
    height: cornerSize,
  };

  return (
    <div
      style={{
        position: "absolute",
        left: "26%",
        top: "30%",
        width: "48%",
        height: "55%",
        border: `3px solid ${color}`,
        borderRadius: 14,
        boxShadow: `0 0 ${24 + pulse * 36}px rgba(${glowRgb}, ${0.4 + pulse * 0.5})`,
        opacity: enter,
        transform: `scale(${0.94 + enter * 0.06})`,
        pointerEvents: "none",
        zIndex: 4,
      }}
    >
      <div
        style={{
          ...cornerStyle,
          top: -3,
          left: -3,
          borderTop: `${cornerThickness}px solid ${color}`,
          borderLeft: `${cornerThickness}px solid ${color}`,
        }}
      />
      <div
        style={{
          ...cornerStyle,
          top: -3,
          right: -3,
          borderTop: `${cornerThickness}px solid ${color}`,
          borderRight: `${cornerThickness}px solid ${color}`,
        }}
      />
      <div
        style={{
          ...cornerStyle,
          bottom: -3,
          left: -3,
          borderBottom: `${cornerThickness}px solid ${color}`,
          borderLeft: `${cornerThickness}px solid ${color}`,
        }}
      />
      <div
        style={{
          ...cornerStyle,
          bottom: -3,
          right: -3,
          borderBottom: `${cornerThickness}px solid ${color}`,
          borderRight: `${cornerThickness}px solid ${color}`,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: -44,
          left: 0,
          background: color,
          color: "white",
          padding: "8px 16px",
          borderRadius: 8,
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: 1.5,
          fontFamily: MONO,
          boxShadow: `0 0 ${14 + pulse * 12}px rgba(${glowRgb}, 0.85)`,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  );
};
