# AGENTS.md

This file provides guidance to coding assistants working in this repository. It can also serve as a shared handoff note between assistants.

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
- The global summary now includes a numeric average score calculated from rated responsibilities only
- The Markdown export now includes a top summary, rating definitions in the scale table, per-pillar rating summaries, `####` responsibility headings, and `Pillar Reflection` labeling
- The React app now supports a local assessment library with multiple saved assessments instead of a single hard-coded record
- New assessments can be created from CSV uploads, either as a plain responsibility list or grouped by category/pillar
- CSV import can optionally restore `rating`, `note`, and `pillar_reflection` data when those columns are present
- The assessment editor header now uses a single Export dropdown for JSON backup, Markdown, and round-trip CSV export
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
hooks/useAssessment.js - assessment library storage, current assessment editing, localStorage migration, auto-save, and import validation/normalization
utils/assessmentModel.js - reusable assessment template/state/summary helpers for built-in and uploaded assessments
utils/csv.js           - CSV parsing plus creation of new assessments from plain or categorized responsibility lists, with optional rating/note/reflection restoration
utils/export.js        - JSON backup, Markdown export, and round-trip CSV export for the current assessment
components/
  Header.jsx           - sticky header with flexible actions and measured offset for sticky pillar sections
  AssessmentLibrary.jsx - landing page for viewing, opening, renaming, and creating assessments from CSV
  SummaryBar.jsx       - reusable chip counts + color-coded progress bar for the global and per-pillar summaries, plus a global average score
  ScaleLegend.jsx      - compact rating scale reference card with expandable definitions
  Pillar.jsx           - collapsible pillar section with a sticky pillar header + rating summary block
  PillarSummary.jsx    - textarea UI for the written reflection under each pillar
  Item.jsx             - individual competency row with rating buttons, notes, and global responsibility numbering
```

**Data model:** Each item in `PILLARS` has a stable `id` (format: `p1_01`), `text`, and `prev` (pre-populated rating from a prior 1-3 scale: Developing -> 2, Proficient -> 4, Strong -> 5).

**State:** The app now stores a local library of assessments under `doe-self-assessment-library`, with one active assessment open at a time. Each assessment contains a reusable `template`, a flat `state` object keyed by item `id` with values `{ rating: number|null, note: string }`, and `summary.pillars[pillarId]` for pillar reflections.

**Rating scale:** 1 = On radar for growth, 2 = Developing, 3 = Iterating, 4 = Proficient, 5 = Strong. Full definitions are stored with the shared rating metadata and exposed through the expandable legend.

**Persistence:** Auto-saves to localStorage key `doe-self-assessment-library` about 1.5s after any change. `saveNow` triggers an immediate save. Legacy single-assessment localStorage is migrated into the new library shape on load.

**Backup/import:** Structured assessment backups are exported as versioned JSON and can be imported back into the currently open assessment. Markdown export remains separate and includes the top summary, rating definitions, per-pillar rating summaries, and any `Pillar Reflection` content under the corresponding pillar sections. CSV export now produces a round-trip import format with `title`, `category`, `responsibility`, and optional `rating`, `note`, and `pillar_reflection` values.

**Numbering:** Responsibilities are displayed and exported with one continuous number across all pillars so progress can be read as `X of total` anywhere in the assessment.

**Summaries:** The top of the page shows the rating mix for the whole assessment and a numeric average score based on rated items only. Each pillar includes its own local `Pillar Rating Summary`. The written section beneath the responsibilities is labeled `Pillar Reflection`.
