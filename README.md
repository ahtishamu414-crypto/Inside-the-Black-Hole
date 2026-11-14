# Inside the Black Hole: Mission Control (BH-5000)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646cff.svg)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-3.2-yellow.svg)](https://vitest.dev/)
[![NASA Space Apps](https://img.shields.io/badge/NASA%20Space%20Apps-Challenge-informational.svg)](https://www.spaceappschallenge.org/)

An interactive, educational mission-design simulator built for the NASA Space Apps **"Space Mission Design Game"** challenge. As Mission Director, you configure, launch, and command a hypothetical micro-satellite swarm of **5,000 sensor nodes** navigating the extreme relativistic environment of a supermassive black hole ($M = 4.30\times 10^6 M_\odot$, resembling Sagittarius A*).

> **Scientific Notice:** This application is an educational simulation. Environmental values and simplified game systems are modeled assumptions intended for learning and systems engineering trade-offs, not real spacecraft flight software.

---

## Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation & Execution
```bash
# Clone the repository
git clone https://github.com/ahtishamu414-crypto/Inside-the-Black-Hole.git
cd Inside-the-Black-Hole

# Install dependencies
npm install

# Start the Vite development server on port 5173
npm run dev

# Run the automated unit & parity test suites
npm test

# Build for production (TypeScript check & Vite bundling)
npm run build

# Preview the production build
npm run preview
```

---

## Walkthrough Demo Video
An automated walkthrough video demonstrating the entire system, visual effects, and simulation runs is available:
- File: [`black_hole_mission_control_demo.mp4`](./black_hole_mission_control_demo.mp4)
- **Timeline:**
  - `0:00 – 0:02`: Mission Overview rotating black hole visual & photon ring.
  - `0:02 – 0:05`: Dashboard status header & difficulty/loadout setup drawer.
  - `0:05 – 0:10`: Time dilation analysis, $E01$ Radiation Spike decision modal, and NASA source reference popover.
  - `0:10 – 0:20`: Live mission simulation with 9 resource bars and per-step telemetry.
  - `0:20 – 0:30`: Mission Accomplished debrief card (Score: 919) and telemetry analytics graphs.

---

## Architecture & Codebase Structure

The application is structured into a clean separation of concerns: pure physics simulation, canvas visualizers, reactive Zustand store, and responsive React components.

```
Inside-the-Black-Hole/
├── src/
│   ├── sim/                 # Pure TypeScript simulation engine (zero DOM dependencies)
│   │   ├── constants.ts     # Physics constants, parts, vehicles, orbits, scenarios
│   │   ├── physics.ts       # Mass, setup cost, physical forces, wear rates, snap
│   │   ├── advance.ts       # Clock stepper, PRNG seeded radiation spikes, fuel burn
│   │   ├── judge.ts         # Failure checks & distance-based scenario win conditions
│   │   ├── scoring.ts       # Outcome scoring formula, ratings, post-mission analysis
│   │   ├── events.ts        # Decision trees, crew consensus modifiers, resource deltas
│   │   ├── fresh.ts         # Initial state factory for runs
│   │   └── sources.ts       # NASA educational references per screen
│   ├── audio/               # Native Web Audio game simulator soundtrack & SFX engine
│   │   └── soundManager.ts  # Procedural atmospheric synth, telemetry clock, alarm & fanfare
│   ├── viz/                 # High-performance 2D Canvas rendering engines
│   │   └── bhViz.ts         # Black hole accretion disk, 5k swarm map, GRRT ray optics
│   ├── store/               # Centralized Zustand reactive state store
│   │   └── useMissionStore.ts # Mission lifecycle, timers, toasts, exports, comparisons
│   ├── hooks/               # Custom React animation and utility hooks
│   │   └── useAnimationLoop.ts # RequestAnimationFrame loop for visual time (vt)
│   ├── components/          # Modular UI components
│   │   ├── common/          # CanvasView, NasaInfoButton, ToastContainer
│   │   ├── layout/          # TopBar, GameBar, Sidebar, Footer
│   │   └── modals/          # EventModal, VoteModal, GuideModal, SourcesModal
│   ├── screens/             # 8 Dedicated application screens
│   │   ├── OverviewScreen.tsx       # 01 Mission Overview & Setup Drawer
│   │   ├── SwarmScreen.tsx          # 02 5,000-Node Swarm Network Map
│   │   ├── TimeDilationScreen.tsx   # 03 Schwarzschild Gravitational Redshift
│   │   ├── EnvironmentalScreen.tsx  # 04 Hazards, Accretion Temp, Safe Orbit
│   │   ├── GrrtScreen.tsx           # 05 Relativistic Ray Tracing Laboratory
│   │   ├── SimulationScreen.tsx     # 06 Live Control with 9 Resource Bars
│   │   ├── AnalyticsScreen.tsx      # 07 Telemetry Trends & Leaderboard
│   │   └── OutcomeScreen.tsx        # 08 Post-Mission Debrief & Analysis
│   ├── types/               # TypeScript interface definitions
│   │   ├── simulation.ts    # SimState, Snapshot, Outcome, Events, Parameters
│   │   ├── ui.ts            # UI states, SavedRun, Toasts, Navigation
│   │   └── viz.ts           # Canvas renderer types, ChartSpec
│   ├── App.tsx              # Root application shell
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styling, IBM Plex fonts, custom scrollbars
├── tests/                   # Vitest unit & Golden Master parity tests
│   ├── parity.test.ts       # Golden Master parity tests (1e-9 tolerance)
│   ├── physics.test.ts      # Mass, wear, and power calculations
│   ├── advance.test.ts      # Advance stepper, operating cost, repositioning
│   ├── judge.test.ts        # Win/loss conditions & scenario goals
│   ├── events.test.ts       # Event triggers and decision deltas
│   └── node_and_launch.test.ts # Launch blocking & node generator checks
├── scripts/                 # Automation & comparative testing scripts
└── index.html               # Main HTML template with Google Fonts
```

---

## Scientific Formulas & Established Physics

### 1. General Relativity & Schwarzschild Spacetime
- **Schwarzschild Radius ($R_s$):**
  $$R_s = \frac{2GM}{c^2}$$
  For $M = 4.30\times 10^6 M_\odot$, $R_s \approx 1.27\times 10^7\text{ km}$.
- **Gravitational Time Dilation:**
  $$\frac{d\tau}{dt} = \sqrt{1 - \frac{R_s}{r}}$$
  *(Valid for stationary observers outside the event horizon at $r > R_s$).*
- **Tidal Acceleration per Metre:**
  $$a_{\text{tidal}} = \frac{2GM}{r^3}$$
- **Key Relativistic Boundaries:**
  - Event Horizon: $1.0\,R_s$
  - Photon Sphere: $1.5\,R_s$
  - Black Hole Shadow: $\approx 2.6\,R_s$
  - Innermost Stable Circular Orbit (ISCO): $3.0\,R_s$
- **Photon Geodesic Equation (Relativistic Bending):**
  $$\frac{d^2u}{d\phi^2} = -u + 1.5 R_s u^2 \quad \left(u = \frac{1}{r}\right)$$
  Integrated numerically via 4th-order Runge-Kutta (RK4).

---

## Simulated Game Physics & Trade-Off Systems

### 1. Modeled Environmental Hazards
- **Radiation Flux ($E$):**
  $$E = 2 \cdot I_{\text{rad}} \cdot \left(\frac{3}{r}\right)^{1.2}$$
  *Protection Limit:* $\text{lim} = \text{shieldLvl} + (\text{heavyShield} ? 20 : 0)$.
- **Tidal Stress Index ($S$):**
  $$S = k_{\text{tidal}} \cdot 35 \cdot \left(\frac{4}{r}\right)^3 \cdot \left(\frac{4.30\times 10^6 M_\odot}{M}\right)^{1/4}$$
  Structural strain begins when $S > 25$.

### 2. Vehicle Mass & Fuel Burn Dynamics
- **Mass Factor ($mf$):**
  $$mf = 1 + \frac{\text{Mass} - 420}{1000}$$
  Heavier probes burn exponentially more fuel during station-keeping.
- **Operating Cost Accumulation:**
  $$\text{Spent} \mathrel{+}= 0.35 + 0.6 \times \text{orbitCorrectionRate} \quad (\text{\$M per hour})$$
- **Repositioning Fuel Cost:**
  Moving the swarm costs $1.2\%$ fuel per $R_s$ traversed.

### 3. Launch Gates & Safeguards
- **Payload Gate:** Launch is blocked if $\text{Mass} > \text{Vehicle Limit}$ (unless Sandbox Mode is active).
- **Budget Gate:** Launch is blocked if remaining operational budget $< \$5\text{M}$.
- **Team Consensus Gate:** When Team Mode is enabled, the crew must confirm their priority votes before launch.

---

## Game Modes, Scenarios & Difficulty

### Difficulty Levels
| Difficulty | Wear Multiplier | Total Budget | Data Rate | Score Multiplier |
| :--- | :---: | :---: | :---: | :---: |
| **CADET** | $\times 0.70$ | $\$340\text{M}$ | $\times 1.15$ | $\times 0.80$ |
| **COMMANDER** | $\times 1.00$ | $\$260\text{M}$ | $\times 1.00$ | $\times 1.00$ |
| **ASTROPHYSICIST** | $\times 1.40$ | $\$200\text{M}$ | $\times 0.90$ | $\times 1.30$ |

### Scenarios & Distance Win Conditions
1. **Photon Sphere Mapping:**
   - Must achieve closest approach $r \le 5.0\,R_s$ and collect $100\%$ science data.
2. **Tidal Stress Test:**
   - Must achieve closest approach $r \le 4.0\,R_s$, maintain chassis health $\ge 25\%$, and collect $100\%$ science data.
3. **Gravitational Clock Sync:**
   - Must achieve closest approach $r \le 6.0\,R_s$, maintain comms signal $\ge 30\%$, and collect $100\%$ science data.

*If data reaches $100\%$ without fulfilling the scenario's geometric goal, the mission terminates as a failure, explicitly naming the unmet goal.*

---

## The 8 Mission Screens

1. **01 Mission Overview**: Real-time status cards, mass / $R_s$ target display, inside-horizon hypothetical markers stepper, and the collapsible **Mission Setup & Trade-offs Drawer** with 6 circular gauges (Fuel, Battery, Data, Comms, Mass, Budget).
2. **02 Swarm Network**: Interactive 5,000-satellite swarm visualizer with coordinate inspection, velocity readout, subsystem health, layer toggles (`disk`, `orbits`, `links`, `traj`, `grid`), and ID search (`BH-0001` to `BH-5000`).
3. **03 Time Dilation Monitoring**: Schwarzschild metric explorer comparing Earth-reference coordinate clocks against probe proper clocks, featuring gravitational redshift curves and interactive distance sliders.
4. **04 Environmental Analysis**: Hazard monitoring with 4 live dial gauges (`Radiation`, `Shield`, `Tidal Stress`, `Temperature`), safe-orbit calculator (`MOVE TO SAFE ORBIT`), and real-time historical graphs.
5. **05 GRRT Imaging Laboratory**: Relativistic Ray Tracing viewer with camera controls (inclination, camera distance, rays count), photon geodesic curves, and side-by-side lensed accretion disk rendering.
6. **06 Mission Simulation Control**: Active operations cockpit featuring **9 real-time resource bars with per-step rate metrics** (Fuel, Battery, Shield, Chassis, Operational Nodes, Data, Comms, Mass, Budget), warning alerts log, and manual station-keeping controls.
7. **07 Mission Analytics**: Post-flight analysis with 5 performance cards, 8 telemetry canvas trend charts, chronological event/decision log, local leaderboard (`localStorage`), and design comparison matrix with `#38D996` green best-value highlighting.
8. **08 Mission Outcome**: Mission debrief card (Accomplished or Failed), milestone checklist, comprehensive **Post-Mission Analysis** breakdown, and scientific rating (`A+`, `A`, `B`, `C`).

---

## Scientific Guardrails & Ethical Labels

- **No Horizon Link Beams:** Nodes placed inside the hypothetical event horizon ($r < 1\,R_s$) are marked as scenario markers and cannot establish telemetry links to exterior anchor nodes.
- **Stationary vs. Free-fall Distinction:** Time dilation formulas are labeled strictly for stationary observers at radius $r$, noting that infalling observers follow geodesic free-fall coordinates.
- **ILLUSTRATIVE vs. COMPUTED:** Ray-traced accretion images are explicitly badged as `ILLUSTRATIVE · NOT COMPUTED`; only the photon geodesic trajectories in the side panel are numerically solved via RK4.
- **SIMULATED ASSUMPTIONS:** All environmental hazards (magnetic field strength, disk temperature, radiation exposure) carry clear `SIMULATED ASSUMPTIONS` badges.

---

## Game Simulator Audio Engine (Soundtrack & SFX)

Built natively on the **Web Audio API** with zero external sound files for instant loading, crisp fidelity, and reactive state modulation:
- **Procedural Space Soundtrack (`soundManager.ts`)**:
  - `AMBIENT`: Deep 55 Hz / 65 Hz cosmic sub-bass drone with resonant low-pass filter LFO breathing ($12.5\text{ s}$ cycles) and floating modal space pads ($Cm9$, $Ebmaj7$, $Abmaj7$, $Gsus4$).
  - `RUNNING`: Synchronized high-tech telemetry pulse ($523\text{ Hz} - 1046\text{ Hz}$) advancing with the mission clock ($T+$ hours).
  - `ALERT`: Tritone tension chord progression and dual-tone tactical sirens ($880\text{ Hz} \rightarrow 660\text{ Hz}$) when an anomaly event requires an immediate decision.
  - `VICTORY`: Triumphant celestial fanfare and major harmonic pads celebrating a successful science return and high score.
  - `FAILURE`: Resonant descending low-frequency tone on structural or radiation loss.
- **Dynamic Sound Effects (SFX)**:
  - Turbine spool and sub-bass rocket thrust ignition on launch.
  - High-precision telemetry ticks on clock advance.
  - Tactical decision resolution chimes and mechanical terminal clicks.
- **Top Bar Controls**:
  - One-click `[ 🔊 AUDIO ]` / `[ 🔇 MUTED ]` toggle in the top control bar with `localStorage` state persistence.

---

## NASA Scientific References
Educational citations and data sources referenced within the mission control modules:
- **Schwarzschild Metric & General Relativity:** [NASA Science - Black Holes](https://science.nasa.gov/astrophysics/focus-areas/black-holes/)
- **Event Horizon Telescope (EHT) M87* & Sgr A* Observations:** [NASA EHT Collaboration](https://www.nasa.gov/mission_pages/chandra/news/black-hole-image-makes-history)
- **Supermassive Black Holes & Tidal Disruption Events (TDEs):** [NASA Goddard - Black Hole Tidal Disruption](https://www.nasa.gov/universe/black-holes/)
- **Relativistic Ray Tracing & Accretion Disk Physics:** [NASA Visualization Studio - Black Hole Simulation](https://svs.gsfc.nasa.gov/13326)
- **Deep Space Network (DSN) Telemetry & Relativistic Clock Drift:** [NASA Jet Propulsion Laboratory - DSN](https://www.jpl.nasa.gov/missions/deep-space-network-dsn)
- **Gravitational Waves & Laser Interferometry (LISA):** [NASA LISA Mission](https://lisa.nasa.gov/)

---

## Verification & Parity Tests

The pure simulation engine guarantees **$100\%$ numerical parity within $1\times 10^{-9}$** against the original NASA Space Apps prototype logic.

```
✓ tests/events.test.ts (6 tests)
✓ tests/node_and_launch.test.ts (4 tests)
✓ tests/physics.test.ts (6 tests)
✓ tests/judge.test.ts (9 tests)
✓ tests/advance.test.ts (3 tests)
✓ tests/fail_scenarios.test.ts (1 test)
✓ tests/parity.test.ts (3 Golden Master tests)
  ✓ Scenario 1: Commander Photon Sphere Run
  ✓ Scenario 2: Astrophysicist Close-Orbit Heavy Shield
  ✓ Scenario 3: Sandbox Mode with Team Voting

Test Files: 7 passed (7)
Tests:      32 passed (32)
```

---

## License
MIT License. Built for educational and challenge design purposes as part of the NASA Space Apps Challenge.
