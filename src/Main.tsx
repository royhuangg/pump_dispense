import { AbsoluteFill, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "./components/Background";
import { DashboardChrome } from "./components/DashboardChrome";
import { DataFlow } from "./components/DataFlow";
import { DetectionBox } from "./components/DetectionBox";
import { ManifoldPlot } from "./components/ManifoldPlot";
import { RealtimeMetrics } from "./components/RealtimeMetrics";
import { theme } from "./theme";

const MONO = '"SF Mono", Menlo, Monaco, Consolas, "Courier New", monospace';

export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 22, stiffness: 90 } });

  const showAnomalyBox = frame >= 750 && frame < 900;
  const showOkBox = frame >= 900;

  return (
    <AbsoluteFill>
      <Background />

      <div
        style={{
          position: "absolute",
          top: 100,
          left: 30,
          width: 900,
          height: 880,
          borderRadius: 20,
          overflow: "hidden",
          border: `2px solid ${theme.cardBorder}`,
          boxShadow: theme.cardGlow,
          opacity: enter,
        }}
      >
        <OffthreadVideo
          src={staticFile("machine.mp4")}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(10,5,30,0.2) 0%, rgba(10,5,30,0.0) 40%, rgba(10,5,30,0.45) 100%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 18,
            left: 20,
            padding: "8px 16px",
            background: "rgba(15, 10, 30, 0.78)",
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: 8,
            fontFamily: MONO,
            fontSize: 18,
            color: theme.text,
            letterSpacing: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: theme.error,
              opacity: (Math.sin(frame * 0.4) + 1) / 2 > 0.5 ? 1 : 0.3,
              boxShadow: `0 0 12px ${theme.error}`,
            }}
          />
          REC · DISPENSE
        </div>

        {showAnomalyBox && (
          <div style={{ position: "absolute", inset: 0 }}>
            <DetectionBox state="anomaly" />
          </div>
        )}
        {showOkBox && (
          <div style={{ position: "absolute", inset: 0 }}>
            <DetectionBox state="ok" />
          </div>
        )}

        <div
          style={{
            position: "absolute",
            left: 12,
            bottom: 110,
            width: 432,
            height: 264,
            borderRadius: 14,
            overflow: "hidden",
            border: `2px solid ${theme.cardBorder}`,
            boxShadow: "0 12px 36px rgba(0,0,0,0.65), 0 0 24px rgba(168,85,247,0.35)",
          }}
        >
          <OffthreadVideo
            src={staticFile("screen.mp4")}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 12,
              padding: "5px 12px",
              background: "rgba(15, 10, 30, 0.85)",
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: 6,
              fontFamily: MONO,
              fontSize: 12,
              color: theme.textDim,
              letterSpacing: 1.5,
            }}
          >
            ◌ DRINKBOT UI
          </div>
        </div>

      </div>

      <div
        style={{
          position: "absolute",
          left: 985,
          top: 170,
          zIndex: 6,
        }}
      >
        <RealtimeMetrics />
      </div>

      <div
        style={{
          position: "absolute",
          top: 100,
          left: 960,
          width: 930,
          height: 880,
          borderRadius: 20,
          background: "rgba(10, 8, 22, 0.55)",
          border: `2px solid ${theme.cardBorder}`,
          boxShadow: theme.cardGlow,
          backdropFilter: "blur(20px)",
          overflow: "hidden",
          opacity: enter,
        }}
      >
        <ManifoldPlot />
      </div>

      <DataFlow />

      <DashboardChrome />
    </AbsoluteFill>
  );
};
