# Self Assessment

A self-assessment app for evaluating Director of Engineering responsibilities across four pillars:

- Technical Vision & Architecture
- Delivery
- Platform Stability, Risk & Operational Readiness
- People, Leadership & Culture

The repository contains two versions of the assessment:

- `app/` - the primary React + Vite app
- `self-assessment.html` - a standalone single-file version

## What The App Does

The React app lets you:

- rate each responsibility on a 1-5 scale
- add notes to individual responsibilities
- review a global rating summary and per-pillar rating summaries
- write a pillar reflection for each pillar
- save progress automatically in localStorage
- export/import structured assessment data as JSON
- export a Markdown version for sharing or drafting

## Rating Scale

The app uses a 1-5 scale:

- `1` On radar for growth
- `2` Developing
- `3` Iterating
- `4` Proficient
- `5` Strong

The full definitions are available in the app through the expandable rating scale legend.

## Current UX Highlights

- The page-level summary shows the rating mix across the full assessment and a numeric average score based on rated items only.
- Each pillar includes its own `Pillar Rating Summary`.
- Responsibilities are numbered continuously across the full assessment rather than restarting per pillar.
- Each pillar has a `Pillar Reflection` textarea for written synthesis.
- The pillar header plus `Pillar Rating Summary` stay sticky under the main header while scrolling.

## Getting Started

### Prerequisites

- Node.js 18+ recommended
- npm

### Install

```bash
cd app
npm install
```

### Run Locally

```bash
cd app
npm run dev
```

The Vite dev server runs at:

```text
http://localhost:5173
```

### Build

```bash
cd app
npm run build
```

### Lint

```bash
cd app
npm run lint
```

### Preview Production Build

```bash
cd app
npm run preview
```

## Repository Structure

```text
.
├─ app/
│  ├─ src/
│  │  ├─ components/
│  │  ├─ data/
│  │  ├─ hooks/
│  │  └─ utils/
│  ├─ package.json
│  └─ vite.config.js
├─ self-assessment.html
├─ CLAUDE.md
└─ README.md
```

## Key Source Files

- `app/src/data/pillars.js` - assessment content, rating labels, and rating definitions
- `app/src/hooks/useAssessment.js` - state, localStorage persistence, import normalization, and auto-save logic
- `app/src/utils/export.js` - JSON backup export and Markdown export
- `app/src/components/Header.jsx` - top header actions and sticky-header height measurement
- `app/src/components/SummaryBar.jsx` - reusable summary UI for global and per-pillar summaries
- `app/src/components/Pillar.jsx` - sticky pillar block and responsibility rendering
- `app/src/components/PillarSummary.jsx` - pillar reflection textarea
- `app/src/components/Item.jsx` - individual responsibility row with rating controls and notes

## Data Model

Each responsibility item has:

- `id` - stable identifier such as `p1_01`
- `text` - the responsibility statement
- `prev` - imported prior score mapped into the current 1-5 scale

App state is split into:

- `state[itemId] = { rating, note }`
- `summary.pillars[pillarId] = string`

## Persistence And Export

The React app auto-saves to localStorage using the key:

```text
doe-self-assessment
```

The app supports:

- JSON backup export/import for structured round-tripping
- Markdown export for human-readable sharing

JSON imports are normalized against the current item ids so partial or older payloads can still be handled safely.

## Debugging In VS Code

This repo includes shared VS Code config for launching the app with `F5`.

Relevant files:

- `.vscode/launch.json`
- `.vscode/tasks.json`

## Notes For Future Edits

- `app/` is the primary version going forward.
- `self-assessment.html` is useful as a fallback/static artifact, but new work should generally target the React app first.
- `AGENTS.md` is the primary assistant handoff document for repo-specific workflow, architecture, and conventions.
- `CLAUDE.md` exists as a thin compatibility file that points assistants to `README.md` and `AGENTS.md`.
