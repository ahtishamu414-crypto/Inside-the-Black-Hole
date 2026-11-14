---
name: black-hole-mission-control
description: Build an interactive aerospace mission-control dashboard with a coherent scientific simulation and game layer (difficulty, sandbox, team roles, design trade-offs, events, outcomes, analytics, save and compare) as a single Design Component.
---

# Skill: Black Hole Mission Control simulator

Use when asked for a mission-control dashboard that is also a playable, physically grounded design game.

## 1. Process
1. Ask: audience, screens, gameplay scope, design system or codebase. Skip visual-style questions if a palette is given.
2. Define ONE shared state object first: status, step, parameters, resources, node counts, history array, events, log, outcome, plus a `cfg` object for game setup (difficulty, sandbox, team, crew, scenario, orbit, vehicle, parts, votes).
3. Write physics and game rules as pure functions of state (`phys(state)`) returning every derived value and per-step rate. UI, charts, toasts and `advance()` all read from it so numbers never disagree.
4. Put canvas renderers in a separate plain JS file driven by a `requestAnimationFrame` loop.
5. Build the DC: top bar, game bar, sidebar, one `<sc-if>` per screen, footer, fixed modals. Inline styles only; handlers and computed text come from `renderVals()`.
6. Verify by running to both outcomes and walking every screen and modal.

## 2. Architecture
- `Mission Control.dc.html`: `<sc-if value="{{ is.screen }}">` per screen; logic class holds state, `advance()`, event definitions, `renderVals()`.
- `bh-viz.js`: `window.BHViz` with drawBH, drawSwarm, drawGRRT, drawRays, chart, tdChart, gauge, and a deterministic `node(id)` hash generator so 5,000 nodes need no stored array.
- Canvases register via a `ref` Set and are drawn by `data-kind`; gauges by `data-g` key.
- Setup edits go through one `setCfg(key, value, part)` that locks after launch, recomputes history, and fires a toast.
- Beware duplicate `const` names inside `renderVals()`; check syntax with `new Function` after large edits.

## 3. Game layer
- Difficulty scales wear, budget, data rate, score.
- Sandbox removes budget, fuel and payload limits and excludes the run from ranking.
- Scenarios each add a data multiplier and a success condition (closest approach, body health, signal).
- Orbit, vehicle and parts all set cost and mass; payload over the rocket limit blocks launch with a plain-language warning.
- Parts: every upgrade must give a benefit and visibly raise mass, power drain and cost; extra mass raises fuel burn.
- Team mode: 4 roles, priority vote before launch, per-choice crew backing in events, score effects shown in the vote modal.
- Six resource gauges: fuel, battery, data, comms, mass, budget.

## 4. Simulation rules
- Every control changes a rate in `phys()` and appears in the "why values change" panel.
- Events fire from state tests with a cooldown, pause the run, and mutate state through the chosen option.
- Outcome computed from state only; failure reasons are specific (comms below 15%, budget, shield, chassis, attrition, window).
- Deterministic by default; optional seeded random surge, labeled.

## 5. Feedback and education
- Beginner wording everywhere; Rs explained as the black hole's edge size.
- "Why This Matters" toast on every slider, setup change and event choice, built from real before/after numbers; one toast per key, auto-dismiss.
- 3-step visual How to Play, auto-opened on first visit (localStorage flag).
- Post-Mission Analysis on both outcomes: cause, closest approach, biggest strain, parts and budget, what to try next, score breakdown.
- Save & Compare: store runs in localStorage, rank non-sandbox runs, compare up to 3 beside the current run with best values highlighted.

## 6. Attribution
- Subtle (i) icon per module showing only one NASA URL; footer "NASA Data Sources" modal with all links. Keep URLs in one object and have the user confirm them.

## 7. Scientific constraints (non-negotiable)
- dτ/dt = √(1 − Rs/r) only for stationary observers at r > Rs; show the validity warning.
- No stable circular orbits below 3 Rs; show station-keeping.
- Inside-horizon nodes are hollow hypothetical markers with no links.
- Label environmental values SIMULATED ASSUMPTIONS; tag formulas ESTABLISHED PHYSICS or SIMULATED ASSUMPTION.
- Label placeholder lensing ILLUSTRATIVE; only genuinely integrated output may say COMPUTED.
- Keep Rs, 1.5 Rs, 3 Rs overlays to scale.

## 8. Visual system
#080D17 background, #101A2A panel, #55DDE0 primary, #38D996 ok, #FFB547 warning, #FF5C64 critical, #E8F0FA text, #8FA3B8 secondary. IBM Plex Sans for UI, IBM Plex Mono for numerics and labels. 1px borders, 4px radius, compact cards. No decorative neon.

## 9. PDF export
Build `<name>-print.dc.html` fresh from the source: strip shell and modals, force all `is.*` flags true, wrap each screen in a `<section class="page">` inside `<doc-page size="letter" content-width="1240px" content-height="1800px">`, add the provenance meta and the color-adjust and animation-freeze rules, confirm each screen is under 1800px tall, then open the export dialog.

## 10. Checklist
- Every slider updates its readout, a chart or render, and a toast.
- Disabled controls are dimmed and ignore clicks; setup locks at launch.
- Filters change visible nodes; search selects by ID; click selects nearest node.
- Outcomes are reachable only through simulation.
- Console is clean and the logic class evaluates.
