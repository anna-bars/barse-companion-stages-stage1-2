# Companion Stages — Fox, Bear & Dragon (Stage 1 + Stage 2)

Live Rive demo + integration reference. Design follows the Elephant Mood
Tracker demo (violet stage, black docs panel, Space Grotesk / JetBrains Mono).

## What's new in this version

- **Stage selector** (Stage 1 / Stage 2, Stage 3 locked until Milestone 2)
- **Stage 2 files** for Fox, Bear and Dragon, same state machine schema as Stage 1
- Updated integration documentation (in the page and below)

## Files

| Stage | File | Artboard | State machine |
|---|---|---|---|
| 1 | `src/assets/stage1/ART_Fox.riv` | `ART_Fox` | `Fox Controller` |
| 1 | `src/assets/stage1/ART_Bear.riv` | `ART_Bear` | `Bear Controller` |
| 1 | `src/assets/stage1/ART_Dragon.riv` | `ART_Dragon` | `Dragon Controller` |
| 2 | `src/assets/stage2/ART_Fox_Stage2.riv` | `STAGE2_ART_Fox` | `Fox Controller` |
| 2 | `src/assets/stage2/ART_Bear_Stage2.riv` | `STAGE2_ART_Bear` | `Bear Controller` |
| 2 | `src/assets/stage2/ART_Dragon_Stage2.riv` | `STAGE2_ART_Dragon` | `Dragon Controller` |

## Inputs (identical in every stage)

| Input | Type | Notes |
|---|---|---|
| `isTalking` | boolean | true → Talking loop, false → Idle |
| `Celebrate` | trigger | one-shot Celebrating |
| `Blink` | trigger | one-shot Blink on its own layer |
| `CompassTapped` / `MirrorTapped` | Rive events | item interaction targets |

Events are scoped per character controller. Listen on the instance that is on screen.

## Run it

```bash
npm install
npm run dev
```

## Build / deploy

```bash
npm run build
```

Works on Vercel as a Vite project (build command `npm run build`, output `dist`).

## Adding Stage 3

Drop the three Stage 3 files into `src/assets/stage3/`, import them in
`src/App.jsx`, fill in the `characters` array of the Stage 3 entry and set
`ready: true`.
