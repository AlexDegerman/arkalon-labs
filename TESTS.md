# 🧪 Test Suite

Focused Vitest unit and integration suite covering the `BigInt` production engine, segmented bulk pricing, nested prestige resets, research and relic systems, stepped offline simulation, save persistence, store/challenge state machines, and server boundaries.

---

## ⚙️ Core Engine & Math Coverage

The simulation math and formatting layers are tested using Vitest to verify `BigInt` precision up to `10^1000`, softcap behavior, and cost/prestige formula invariants.

- **Production Engine (`tests/productionEngine.test.ts`)**: Validates `recalculatePPS`, `computeProductionShares`, and `researchEffects` across base `milliRP → RP` conversion, Research Desk (`10–50`) vs. standard (`25`-unit) milestone intervals, the 8-step doubling cap and `1.08x` / linear tapering, Century Mutations (`M100–M1000`), module efficiency, Overclocked Chassis (`2x` + `+25%` synergy) and cross-chassis conduits, `getARCap` / `getCountedAR` with `resonanceMemoryAR`, challenge locks (`AC1`, `AC6`, `SC1`, `EC2`), exponent stacking, the `>10^308` Endless softcap, and `MAX_RP_HARD_CAP` (`10^1000`) clamping.
- **Generator Costs & Synthesizers (`tests/generatorCosts.test.ts`)**: Verifies `getEffectiveGrowthFactor` floors (`1.01`) and reductions (`C1`, `M100`, `SC6`, `C9`, `E6`, `OS Dimensional Transcendence`, `Relic 4`), `R1` unit-#1-only discounts, 50% anomaly cost reductions, segmented `costToBuyN` accuracy across `qty = 0` and `qty = 100` boundaries, `maxAffordable` never exceeding `researchPoints` up to `10^200+`, and Synthesizer cost/Era Dust/Operation Point rate calculations.
- **Prestige Calculations (`tests/prestigeCalc.test.ts`)**: Tests Tier I–III unlock gates (`10^9`, `10^35` + Chronos Array, `10^85` + Omega Sphere, and active challenge blocks), `calculateARGain` 500k softcap and multiplier stacking (`Relic 9`, `CF resonance_amplification`, `EC3`, `R8`, `prestige_50`, `2B` cap), `calculateCFGain` / `calculateOSGain`, and lossless reset/retention rules across `buildTier1ResetState`, `buildTier2ResetState` (`resonanceMemoryAR` floor, cleared sockets), and `buildTier3ResetState` (retained QoL automation, reset economic upgrades).
- **Research & Relics (`tests/researchAndRelics.test.ts`)**: Validates prerequisite gating, `O6` single-bypass-per-run tracking, challenge branch locks (`SC3`, `SC7`, `SC9`, `techMatrixDisabled`), `getEffectiveStudyTime` reductions (`C2`, `R2`, `O2`, `AR Accelerant`, `CF Temporal Compression`, `R_INF` 95% cap, `SC2` instant T1), `getActiveSlotCount` (`1–3` slots and `SC10` lock), `getOverclockDetails`, Relic Dust bulk upgrade quotes (`+1` / `+10` / `max` and Relic 20 Lv20 cap), and 2-piece / 3-piece Class Resonance (`1.15x` / `1.35x` + `1.1x`) alongside `relicsDisabled`.
- **Formatting & Utilities (`tests/formatAndUtils.test.ts`)**: Tests `formatPoints` and `formatPointsCompact` in both `suffix` and `scientific` modes from `0n` through `Trequinquagintillion` (`10^162`) and `>= 10^168`, `bigIntLog10` hex-slice precision, `infNodeCostAtLevel` parity across small (`<= 1000`) and astronomical (`> 1000`) levels, `getNetSpendablePPS` / `formatTimeToAfford` / `formatCountdown`, `getCurrentEra` transitions, and `getWorkspaceActionSignals` / `getFeatureProgress` indicators.

---

## 💾 Persistence, Offline & Server Action Coverage

Persistence and server boundary tests run under `jsdom` with mocked `pg` pools, `next/headers` cookies, and Network Hub RPC responses to verify save integrity and database contracts.

- **Offline Simulation (`tests/offlineCalc.test.ts`)**: Tests `calculateOfflineProgress` and `applyOfflineProgress` across `8h` / `12h` (`Chronos Loom`) / `24h` (`R9`) window caps, efficiency stacking (`0.5` base + `E1` + `E2` + `SC9` + `Relic 5` + `Omega Phase 3`, capped at `1.0`), stepped mid-offline research completions and auto-queue advances (`AC3` anomaly-only tick freeze), anomaly expirations, megaproject RP absorption and repeatable `dyson_swarm` level-ups, probe scan/repair/auto-relaunch cycles, `EC3` 5-minute recursive collapses, and `MAX_RP_HARD_CAP` clamping.
- **Save Serialization & Migration (`tests/saveGame.test.ts`)**: Validates full `serialiseState → deserialiseState` round-trips for `BigInt` values, synthesizers, presets, and `PreChallengeSnapshot`, UTF-8/Base64 `exportSave → importSave` round-trips, rejection of corrupt strings or orphaned challenge saves missing snapshots, v1 → v2 migration (`savedAt` fallback), and deserialization sanitization (clamping negative quantities, invalid relic IDs/levels, malformed probes, unknown nodes, and `R_INF` cap `299`).
- **Server Actions & Health Route (`tests/serverActions.test.ts`)**: Verifies `saveState` authorization checks, negative/future-timestamp/`currentPoints > lifetimePoints + 1000n` sanity validation, 30-second rate limiting, and parameterized PostgreSQL upserts; `loadState` column reconstruction, `_serverCycleNumber` computation, empty-row handling, and offline fallback; `getOrCreateLabsPlayer` Hub `/api/identity/provision` provisioning, `.rpsleague.fi` cookie flags, and `players` upsert; and `GET /api/health` returning `200` (`db: 'ok'`) vs. `503` (`db: 'error'`).

---

## 🎮 Store, Challenge & Progression Coverage

Client state integration tests exercise Zustand store actions, `100ms` tick behavior, challenge snapshotting, and progression watchers.

- **Store Actions, Challenges & Unlocks (`tests/storeAndChallenges.test.ts`)**: Validates `buyGenerator`, `buyMaxAllGenerators`, `buySynthesizer`, and `buyModule` RP deductions and PPS updates; `enterChallenge` / `exitChallenge` snapshot capture and exact pre-challenge run restoration across wins, abandons, `EC2` type-switching, and custom `SANDBOX` runs; `tick()` `100ms` RP accumulation, megaproject siphoning, and `EC3` forced collapses; and `checkUnlocks` staggered feature unlocks alongside `checkAchievements` milestone evaluation.