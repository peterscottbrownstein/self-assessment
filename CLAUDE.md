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
- Reflection summaries now live under each pillar instead of in one bottom-level summary section
- Responsibilities are numbered globally across the full assessment instead of restarting within each pillar
- Each pillar now also shows its own rating summary bar in addition to the global summary at the top
- Rating definitions are stored centrally and shown through a compact expandable scale legend
- Each pillar's header plus `Pillar Rating Summary` now stick under the main header while scrolling; the textarea section is labeled `Pillar Reflection`
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
data/pillars.js        - PILLARS array plus rating labels/definitions (all assessment content lives here)
hooks/useAssessment.js - ratings, notes, per-pillar summaries, localStorage, auto-save, and import validation/normalization
utils/export.js        - Markdown export plus versioned JSON backup export
components/
  Header.jsx           - sticky header with save/export/import/reset actions and measured offset for sticky pillar sections
  SummaryBar.jsx       - reusable chip counts + color-coded progress bar for the global and per-pillar summaries
  ScaleLegend.jsx      - compact rating scale reference card with expandable definitions
  Pillar.jsx           - collapsible pillar section with a sticky pillar header + rating summary block
  PillarSummary.jsx    - textarea UI for the written reflection under each pillar
  Item.jsx             - individual competency row with rating buttons, notes, and global responsibility numbering
```

**Data model:** Each item in `PILLARS` has a stable `id` (format: `p1_01`), `text`, and `prev` (pre-populated rating from a prior 1-3 scale: Developing -> 2, Proficient -> 4, Strong -> 5).

**State:** `useAssessment` holds a flat object keyed by item `id`, each value `{ rating: number|null, note: string }`. It also stores `summary.pillars[pillarId]` for the written reflection under each pillar. The app initializes from `prev` values and merges in localStorage data on load.

**Rating scale:** 1 = On radar for growth, 2 = Developing, 3 = Iterating, 4 = Proficient, 5 = Strong. Full definitions are stored with the shared rating metadata and exposed through the expandable legend.

**Persistence:** Auto-saves to localStorage key `doe-self-assessment` about 1.5s after any change. `saveNow` triggers an immediate save.

**Backup/import:** Structured assessment backups are exported as versioned JSON and can be imported back into the app. Import normalizes data against the current item ids and accepts partial payloads safely. Markdown export remains separate and now includes any pillar summaries under the corresponding pillar sections.

**Numbering:** Responsibilities are displayed and exported with one continuous number across all pillars so progress can be read as `X of total` anywhere in the assessment.

**Summaries:** The top of the page shows the rating mix for the whole assessment, and each pillar includes its own local `Pillar Rating Summary`. The written section beneath the responsibilities is labeled `Pillar Reflection`.
