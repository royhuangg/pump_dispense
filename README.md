# Pump Dispense — DrinkBot AI Demo Video

A Remotion landscape composition (1920×1080, 35s) showing DrinkBot AI auto-calibration during beverage dispensing. Pairs real machine footage with a 3D R-Factor manifold and live telemetry to visualize how AI detects anomalies and compensates in real time.

---

## 1. Prerequisites

| Tool | Why | Install (macOS) |
|------|-----|-----------------|
| **Node.js ≥ 18** | Runs Remotion | `brew install node` or download from nodejs.org |
| **npm** (or pnpm/yarn) | Package manager (comes with Node) | bundled with Node |
| **ffmpeg** | Pre-processing source videos + stripping audio from output | `brew install ffmpeg` |
| **git** | Clone the repo | usually pre-installed; `brew install git` if missing |

Linux: use your distro's package manager (`apt`, `dnf`, etc.). Windows: install Node from nodejs.org and ffmpeg via Chocolatey or Scoop. Remotion supports macOS, Linux, and Windows.

## 2. NPM dependencies

Already declared in `package.json` — `npm install` will fetch them.

| Package | Version | Purpose |
|---------|---------|---------|
| `remotion` | `4.0.380` | Core rendering library — turns React into video |
| `@remotion/cli` | `4.0.380` | `remotion studio` and `remotion render` commands |
| `react` | `19.2.0` | The UI framework (Remotion uses React for every frame) |
| `react-dom` | `19.2.0` | React's DOM renderer (used by the studio preview) |
| `typescript` | `5.7.3` | Type checking — Remotion is written in TS |
| `@types/react` | `19.2.0` | React type definitions |

There are no other runtime dependencies. All animation math (springs, easings, interpolation) and the SVG manifold chart are written from scratch using Remotion's built-in hooks (`useCurrentFrame`, `interpolate`, `spring`).

## 3. Common commands

```bash
# One-time: install dependencies (~185 packages, mostly Remotion's own)
npm install

# Live preview with hot reload (opens http://localhost:3000)
npm start

# Render final MP4 (output: out/dispense-landscape.mp4)
npm run render

# Strip audio track from final output (optional, makes muted output)
ffmpeg -y -i out/dispense-landscape.mp4 -c:v copy -an out/dispense-landscape-noaudio.mp4 \
  && mv out/dispense-landscape-noaudio.mp4 out/dispense-landscape.mp4
```

The dev server is the fastest way to iterate. Save any source file and the preview refreshes instantly. Render time on an M-series Mac is around 30–60 seconds for the full 35-second composition.

---

## 4. Story / Timeline (35s @ 30fps = 1050 frames)

The composition is a single timeline with no scene transitions. State is driven entirely by the current frame number.

| Frame range | Time | Phase | What's happening |
|-------------|------|-------|------------------|
| 0–450 | 0–15s | **STANDBY** | Machine idle, manifold loaded, target anchored. No data flow. Metrics = 0. |
| 450–750 | 15–25s | **MONITORING** | Normal dispense. Yellow `TUBE 04 · MANGO` pulse stream from machine screen → metrics card. Metrics updating live. |
| 750–815 | 25–27s | **ANOMALY (drawing)** | Red dashed line animates from metrics card toward the anomaly point on the chart (the AI "noticing" the outlier). |
| 815–840 | 27–28s | **ANOMALY (revealed)** | Red anomaly dot pops onto the chart, `✗ ANOMALY` badge, red detection frame around the machine. |
| 840–900 | 28–30s | **COMPENSATING** | Amber pump stream resumes. Red dot eases down to the target on the surface. |
| 900–1050 | 30–35s | **ON SPEC** | Green dot + ✓ ON SPEC badge + green detection frame. No stream (drink complete). |

The phase boundaries are referenced from many components. If you shift one, search the codebase for the frame numbers and update them everywhere — see § 5 below.

---

## 5. Layout

```
1920 × 1080
┌────────────────────────────────────────────────────────────────────────────┐
│   ● DRINKBOT AI · LIVE                        [phase status]  12:34:18    │ ← chrome top
├──────────────────────────────────────┬─────────────────────────────────────┤
│                                      │                                     │
│                                      │   LEARNED MANIFOLD · R-FACTOR       │
│                                      │   ┌──── REALTIME METRICS ────┐     │
│   ┌───────────────────────────┐      │   │ P_p   5.17 pulse         │     │
│   │                           │      │   │ P_f   4.54 pulse         │     │
│   │   machine_cut.mov         │      │   │ T     4.0 °C             │     │
│   │   (portrait, scaled)      │      │   │ VOL CUM 47.8 mL          │     │
│   │   + REC · DISPENSE label  │      │   │ R-FACTOR 0.340 mL/p      │     │
│   │   + red/green detection   │      │   │ ● STREAMING ████ pkt     │     │
│   │     frame (anomaly/ok)    │      │   └──────────────────────────┘     │
│   │                           │      │                                     │
│   │   ┌──────────────────┐    │      │           ▲ R-Factor                │
│   │   │ screen_cut_2.mp4 │    │      │      ┌──── 3D manifold ────┐       │
│   │   │ (PIP bottom-left)│    │      │      │ viridis surface       │      │
│   │   └──────────────────┘    │      │      │ + TARGET anchor       │      │
│   │                           │      │      │ + ANOMALY red dot     │      │
│   └───────────────────────────┘      │      │ + ✓ ON SPEC badge     │      │
│                                      │      └──────────────────────┘       │
│       ╲ ─── pulse stream ──── ╲      │                                     │
│            ─── across to ─── ╲╲╲   ─── animated line to anomaly            │
│                                      │                                     │
├──────────────────────────────────────┴─────────────────────────────────────┤
│ > Manifold loaded · monitoring dispense in real time |                     │ ← chrome bottom
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Source layout

```
src/
├── index.ts                    # Remotion entry — registerRoot(Root)
├── Root.tsx                    # Composition definition (size, fps, duration)
├── Main.tsx                    # Top-level scene: lays out machine, PIP, metrics, manifold
├── theme.ts                    # Color tokens (accent, success, error, etc.)
└── components/
    ├── Background.tsx          # Static dark gradient bg
    ├── DashboardChrome.tsx     # Top status bar + bottom terminal text (phase-aware)
    ├── DataFlow.tsx            # Two-stage data flow animation (pulse → draw)
    ├── DetectionBox.tsx        # Red/green corner-bracket overlay for the machine video
    ├── ManifoldPlot.tsx        # SVG 3D R-Factor surface + target + anomaly + badges
    └── RealtimeMetrics.tsx     # Live telemetry card (P_p, P_f, T, VOL CUM, R-Factor)

public/
├── machine.mp4                 # Real machine footage (1280×720 portrait after rotation, 30fps)
└── screen.mp4                  # DrinkBot UI screen recording (960×540, 30fps)
```

Everything in `src/components/` is self-contained — no shared state across components. Each component reads `useCurrentFrame()` and decides what to render based on the frame.

---

## 7. Phase boundary constants

These four numbers appear in multiple files. If you change the phase timing, search for the **frame numbers** (not phase names) and update them everywhere.

| Phase | Starts at frame | Found in |
|-------|----------------|----------|
| MONITORING | **450** | `DashboardChrome.tsx`, `DataFlow.tsx` (fadeFrames), `RealtimeMetrics.tsx` (`DISPENSE_START`) |
| ANOMALY (arrow drawing) | **750** | `ManifoldPlot.tsx` (`phaseFromFrame`), `DashboardChrome.tsx`, `DataFlow.tsx` |
| ANOMALY (visible) | **815** | `ManifoldPlot.tsx` (`ANOMALY_ARRIVAL`), `Main.tsx` (`showAnomalyBox`) |
| COMPENSATING | **840** | `ManifoldPlot.tsx`, `DashboardChrome.tsx`, `DataFlow.tsx` |
| ON SPEC | **900** | `ManifoldPlot.tsx`, `DashboardChrome.tsx`, `Main.tsx` (`showOkBox`) |

Total duration is set in `Root.tsx` (`durationInFrames={1050}`).

---

## 8. Common edits

### Replace the source videos

```bash
# machine_cut.mov has rotation metadata, scale to portrait
ffmpeg -y -ss <start_seconds> -i <new-source>.mov -t 35 \
  -vf "scale=720:1280" -r 30 -c:v libx264 -preset fast -crf 20 -an public/machine.mp4

# screen recording is already landscape
ffmpeg -y -ss <start_seconds> -i <new-screen>.webm -t 35 \
  -vf "scale=960:540" -r 30 -c:v libx264 -preset fast -crf 20 -an public/screen.mp4
```

Then re-render. The composition expects 35 seconds of source content starting from frame 0.

### Change phase timing

Pick new frame numbers and update all locations in the table above. Then verify `Root.tsx` `durationInFrames` still covers the last phase.

### Move the data flow endpoints

Edit `STREAMS` in `src/components/DataFlow.tsx`:

```ts
const STREAMS: Stream[] = [
  {
    id: "dispense-to-metrics",
    sx: 760, sy: 290,   // machine screen anchor
    ex: 985, ey: 320,   // metrics card anchor
    mode: "pulse",
    // ...
  },
  {
    id: "metrics-to-anomaly",
    sx: 1275, sy: 305,  // metrics card right edge
    ex: 1605, ey: 430,  // anomaly point on manifold
    mode: "draw",
    drawRange: [755, 815],
    // ...
  },
];
```

Coordinates are in the 1920×1080 composition space.

### Tune the manifold

`src/components/ManifoldPlot.tsx` constants:

```ts
const W = 1000, H = 620;       // SVG viewBox
const CY = 430;                 // chart vertical center
const SCALE_XY = 78;            // xy axis spread
const SCALE_Z = 340;            // z axis spread
const ANOMALY_Z_START = 0.65;   // how far above the target the red dot starts
```

The surface function `surface(x, y)` and the seeded grid generate the manifold shape. Changing them changes the chart.

### Tweak metrics values

`src/components/RealtimeMetrics.tsx` — `pp`, `pf`, `t`, `volCum`, `rFactor` are all functions of frame. Edit the formulas to change the displayed numbers.

---

## 9. Working with AI

This codebase is small enough that an LLM (Claude, GPT) can read the whole `src/` directory and reason about it. Effective prompts share two traits:

1. **Reference frame numbers, not phase names.** Phase names are convenience labels; the frame number is the source of truth.
2. **Tell the model which file owns what.** See § 4 above.

Example prompts that work well:

> "In `src/components/DataFlow.tsx`, change the Stage 1 source position from the machine screen to the cup area below. The cup is roughly at composition (560, 720)."

> "I want to delay the moment the ANOMALY red dot pops in. Right now it appears at frame 815. Push it to 825 and update `Main.tsx` to keep the red detection frame in sync."

> "Add a new metric row to `RealtimeMetrics.tsx` called `PUMP RPM` showing 2400 ± noise during dispense, 0 during standby. Color it neutral."

> "Make the manifold surface slightly more transparent — change `fillOpacity` in `ManifoldPlot.tsx` from 0.7 to 0.5."

If you ask the model to change timing, also ask it to verify the `Root.tsx` `durationInFrames` and the phase boundary constants in § 5 are still consistent. The components don't auto-sync.

---

## 10. Rendering tips

- The Remotion dev server (`npm start`) does NOT produce an MP4 — it's a preview only.
- `npm run render` writes to `out/dispense-landscape.mp4`. Default codec is H.264 + AAC.
- Remotion always adds a silent AAC audio track. Strip it with `ffmpeg -c:v copy -an` if you want pure video.
- Render time on an M-series Mac is around 30–60 seconds for the full 35-second composition.

---

## 11. File-level cheat sheet

| If you want to change… | Edit… |
|------------------------|-------|
| Total length, fps, resolution | `Root.tsx` |
| Layout, what appears where | `Main.tsx` |
| Top status bar / bottom terminal text | `DashboardChrome.tsx` |
| Pump → metrics flow, metrics → anomaly arrow | `DataFlow.tsx` |
| Red/green frame around machine video | `DetectionBox.tsx`, `Main.tsx` (when to show) |
| 3D manifold, target, anomaly point, badges | `ManifoldPlot.tsx` |
| Live telemetry numbers + streaming indicator | `RealtimeMetrics.tsx` |
| Colors | `theme.ts` |

That's the whole project.
