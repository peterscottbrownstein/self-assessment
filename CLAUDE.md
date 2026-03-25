# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A self-assessment web app for a Director of Engineering role at Marcura/Navigator. Two versions exist:

- `self-assessment.html` — standalone single-file version (no build step, open directly in browser)
- `app/` — React + Vite version (the primary version going forward)

## Running the React app

```bash
cd app
npm install   # first time only
npm run dev   # starts dev server at http://localhost:5173
npm run build # production build to app/dist/
```

## Architecture (`app/src/`)

```text
data/pillars.js       — PILLARS array and RATINGS map (all assessment content lives here)
hooks/useAssessment.js — all state logic: ratings, notes, localStorage, auto-save
utils/export.js        — markdown export via Blob download
components/
  Header.jsx           — sticky header with save/export/reset actions
  SummaryBar.jsx       — live chip counts + color-coded progress bar
  ScaleLegend.jsx      — rating scale reference card
  Pillar.jsx           — collapsible pillar section
  Item.jsx             — individual competency row with rating buttons and notes
```

**Data model:** Each item in `PILLARS` has a stable `id` (format: `p1_01`), `text`, and `prev` (pre-populated rating from a prior 1–3 scale: Developing→2, Proficient→4, Strong→5).

**State:** `useAssessment` holds a flat object keyed by item `id`, each value `{ rating: number|null, note: string }`. Initialized from `prev` values, merged with localStorage on load.

**Rating scale:** 1=On radar for growth, 2=Developing, 3=Iterating, 4=Proficient, 5=Strong.

**Persistence:** Auto-saves to `localStorage` key `doe-self-assessment` ~1.5s after any change. `saveNow` triggers an immediate save. Export writes a dated `.md` file via a Blob download.
