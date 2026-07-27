(Ts is mostly made from chatgpt, so beware.)
# Umamusume Parent Planner

A current-Global, browser-based planner for building better Legacy families in
*Umamusume: Pretty Derby*. It replaces spreadsheet-heavy tracking with one
responsive app that works on desktop and mobile.

## What it does

- Calculates the complete seven-character family affinity score, including
  pair, trio, shared graded-race, and shared crown bonuses
- Tracks trained Veterans, their lineage, final stats, blue/pink/green/white
  sparks, race wins, tags, and notes
- Recommends useful next trainees with a visible score breakdown instead of a
  black-box ranking
- Plans G1/G2/G3 race calendars, highlights overlapping wins, tracks crown
  completion, and warns about aptitude mismatches or packed schedules
- Includes every trainee card released on the Global server through
  **July 26, 2026** (93 cards across 62 identities), with base stats, 4★/5★
  stats, growth bonuses, and all ten aptitudes
- Saves automatically in the browser and supports JSON backup/restore

No account or server is required. Saved information stays in the browser on the
device where it was entered.

## Affinity model

The calculator uses the current pre-second-anniversary Global family formula:

1. Target ↔ Parent 1
2. Target + Parent 1 + each of Parent 1's two parents
3. Target ↔ Parent 2
4. Target + Parent 2 + each of Parent 2's two parents
5. Parent 1 ↔ Parent 2
6. Shared graded-race and crown bonuses for the five lineage links that award
   them

Result tiers are △ at 0–50, ○ at 51–150, and ◎ at 151 or more.

The app also shows the known blue-spark thresholds used by Global:

- Below 600 final stat: 0% chance of a 3★ blue spark
- 600–1100: 5%
- Above 1100: 10%
- Starting stat value: +5 / +12 / +21 for 1★ / 2★ / 3★

Suggestions are planning heuristics and cannot guarantee sparks or race
outcomes.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Then open the local address printed by Vite.

Useful checks:

```bash
npm run lint
npm test
```

## Updating Global data

The generated snapshot lives at `app/data/uma-data.ts`. The generator expects
the relevant public GameTora JSON datasets in one directory:

```bash
node scripts/generate-uma-data.mjs /path/to/source-json
```

Review the output, update the snapshot date in the generator, and run the
checks before committing.

## Data references

- [GameTora trainee database](https://gametora.com/umamusume/characters)
- [GameTora compatibility calculator](https://gametora.com/umamusume/compatibility)
- [GameTora Legacy guide](https://gametora.com/umamusume/legacies)
- [Official Global site](https://umamusume.com/)

This is an independent fan-made planning tool and is not affiliated with
Cygames.
