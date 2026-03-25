# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. It can also serve as a shared handoff note between assistants.

## Project

A self-assessment web app for a Director of Engineering role at Marcura/Navigator. Two versions exist:

- `self-assessment.html` - standalone single-file version (no build step, open directly in browser)
- `app/` - React + Vite version (the primary version going forward)

## Current Repo State

- Git is initialized in the repo root
- `origin` points to `https://github.com/peterscottbrownstein/self-assessment.git`
- The remote GitHub starter commit was merged into local history
- Root `README.md` came from that initial remote GitHub commit
- The React app was verified with `npm run build` and `npm run lint`
- `app/src/hooks/useAssessment.js` was lightly cleaned up so invalid or missing localStorage data falls back to defaults without failing lint
- Assessment data can now be exported/imported as a versioned JSON backup file, separate from the Markdown export
- Shared VS Code debugging is configured in `.vscode/launch.json` and `.vscode/tasks.json` so `F5` can start Vite and open the app in Chrome

## Running the React App

```bash
cd app
npm install   # first time only
npm run dev   # starts dev server at http://localhost:5173
npm run build # production build to app/dist/
npm run lint
```

## Handoff Rule

Update this file before committing when a change adds context another assistant would realistically need, such as architecture shifts, new workflows, new tooling, important decisions, or non-obvious constraints. Skip updates for small implementation details that are already clear from the code.

## Architecture (`app/src/`)

```text
data/pillars.js        - PILLARS array and RATINGS map (all assessment content lives here)
hooks/useAssessment.js - ratings, notes, localStorage, auto-save, and import validation/normalization
utils/export.js        - Markdown export plus versioned JSON backup export
components/
  Header.jsx           - sticky header with save/export/import/reset actions
  SummaryBar.jsx       - live chip counts + color-coded progress bar
  ScaleLegend.jsx      - rating scale reference card
  Pillar.jsx           - collapsible pillar section
  Item.jsx             - individual competency row with rating buttons and notes
```

**Data model:** Each item in `PILLARS` has a stable `id` (format: `p1_01`), `text`, and `prev` (pre-populated rating from a prior 1-3 scale: Developing -> 2, Proficient -> 4, Strong -> 5).

**State:** `useAssessment` holds a flat object keyed by item `id`, each value `{ rating: number|null, note: string }`. It initializes from `prev` values and merges in localStorage data on load.

**Rating scale:** 1 = On radar for growth, 2 = Developing, 3 = Iterating, 4 = Proficient, 5 = Strong.

**Persistence:** Auto-saves to localStorage key `doe-self-assessment` about 1.5s after any change. `saveNow` triggers an immediate save.

**Backup/import:** Structured assessment backups are exported as versioned JSON and can be imported back into the app. Import normalizes data against the current item ids and accepts partial payloads safely. Markdown export remains separate and is intended for human-readable sharing.
