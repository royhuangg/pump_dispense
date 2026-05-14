import { AbsoluteFill } from "remotion";
import { theme } from "../theme";

export const Background: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(168, 85, 247, 0.28), transparent 55%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 80% 90%, rgba(59, 130, 246, 0.22), transparent 55%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 90% 20%, rgba(236, 72, 153, 0.12), transparent 50%)",
        }}
      />
    </AbsoluteFill>
  );
};
