# 🎯 Facility Challenges & Mutator Sandbox

Complete reference for all 24 multi-tier Facility Challenges (`SC1–SC12`, `AC1–AC8`, `EC1–EC4`), run isolation rules, Readiness Benchmarks, and the post-`EC4` Custom Mutator Sandbox.

---

## 📋 Overview & Rules

- **Lossless Run Snapshotting:** Entering any challenge pauses and snapshots your active run (`PreChallengeSnapshot`: RP, generators, module levels, synthesizers, completed/active/queued/infinite research, `O6` bypass state, megaproject progress, anomaly timers, and run duration) before launching a clean restricted simulation. Completing or abandoning restores your main run automatically.
- **Persistent Carry-Over:** While prestige starting bonuses (`Chronal Anchor`, `Dimensional Blueprinting`, Tier II/III starter units, and retained research) are suppressed inside challenges, your permanent **module levels**, **AR/CF/OS upgrades** (unless disabled), **unlocked relics** (unless disabled), **achievements**, and **past challenge rewards** remain active.
- **Tier Scaling:** Multi-tier challenges scale their lifetime RP target by **`10x` per tier** (`Tier 1 Target × 10^(tier - 1)`).
- **Challenge Accelerant:** Purchasing the `Challenge Accelerant` AR upgrade reduces challenge RP targets by **`25%`** (automatically suspended in `AC2` and `EC1`, where prestige upgrades are disabled).
- **Readiness Benchmarks & Telemetry:** Each card evaluates your `peakLifetimePoints` against the next tier's target (applying difficulty weighting for heavy challenges like `AC4`, `AC6`, `EC1`, and `EC4`) to display a readiness badge (`TRIVIAL`, `READY`, `DOABLE`, `BRUTAL`, `IMPOSSIBLE`), carry-over summaries, and fastest active completion times.
- **Unique Extreme Bonus:** Beyond `EC1`'s per-tier bonus, each unique Extreme Challenge completed grants an additional **`+2%`** global RP multiplier.

---

## 🟦 Standard Challenges (`SC1–SC12`)

*Unlocked after completing your first **Tier I — Reality Recalibration** prestige.*

| ID | Name | Tiers | Tier 1 Target | Active Constraints | Permanent Reward |
| :---: | :--- | :---: | :--- | :--- | :--- |
| `SC1` | **Manual Labor** | `3` | `1.00 Million` (`10⁶`) | No generators above Tier 3. | `2x` base output to Tiers 1–3 (compounding) & `+5%` global RP per tier. |
| `SC2` | **Blind Research** | `3` | `5.00 Million` (`5×10⁶`) | Research disabled. | Tier-1 research nodes complete instantly (`0s`) & `+10%` global RP per tier. |
| `SC3` | **Silence Protocol** | `3` | `10.00 Million` (`10⁷`) | Arkalon Branch research locked. | `+15%` Arkalon Branch research speed per tier. |
| `SC4` | **Isolation Chamber** | `3` | `20.00 Million` (`2×10⁷`) | No generator modules allowed. | Module upgrade costs reduced by `10%` per tier. |
| `SC5` | **Stable Reality** | `3` | `50.00 Million` (`5×10⁷`) | No anomalies spawn. | `+25%` anomaly buff power & `+5s` anomaly duration per tier. |
| `SC6` | **Asset Cap** | `3` | `50.00 Million` (`5×10⁷`) | Maximum `30` units of any generator owned. | Cost growth factors reduced by `0.01` per tier; Tier 3 unlocks **Auto-Buy (Optimal)**. |
| `SC7` | **Branch Specialization** | `3` | `100.00 Million` (`10⁸`) | Only one research branch permitted for the run. | `-15%` research study time per tier (multiplicative). |
| `SC8` | **Unstable Constants** | `3` | `200.00 Million` (`2×10⁸`) | Milestone multipliers & Century Mutations disabled. | Milestones trigger `2` units earlier per tier (floor `10`). |
| `SC9` | **Energy Crisis** | `3` | `500.00 Million` (`5×10⁸`) | Energy Branch research locked. | Offline efficiency permanently `+10%` per tier. |
| `SC10` | **Dimensional Lock** | `3` | `1.00 Billion` (`10⁹`) | Only one research slot (`R3` / 3rd slot disabled). | Research queue expanded by `+1` slot per tier. |
| `SC11` | **Relic Vacuum** | `3` | `2.00 Billion` (`2×10⁹`) | Relics disabled (cannot equip and active relic effects are inactive). | `+1` active relic slot per tier (max `6` total). |
| `SC12` | **Total Isolation** | `3` | `1.00 Billion` (`10⁹`) | `SC1` + `SC2` + `SC5` combined. | `+3%` global RP production per tier; Tier 3 unlocks **Auto-Launch Probe (Safe)**. |

---

## 🟪 Advanced Challenges (`AC1–AC8`)

*Unlocked after completing your first **Tier II — Timeline Severance** prestige.*

| ID | Name | Tiers | Tier 1 Target | Active Constraints | Permanent Reward |
| :---: | :--- | :---: | :--- | :--- | :--- |
| `AC1` | **Telemetry Starvation** | `3` | `1.00 Quadrillion` (`10¹⁵`) | Generators only produce RP while active research is running *(includes emergency `0 RP / 30s` Calibration study)*. | `+0.005` to global production exponent per tier. |
| `AC2` | **Closed System** | `3` | `1.00 Trillion` (`10¹²`) | No prestige upgrades active. | AR upgrade effectiveness `+20%` per tier. |
| `AC3` | **Chronal Freeze** | `3` | `10.00 Billion` (`10¹⁰`) | Research timers only tick while an anomaly is active (at `5x` speed). | All research timers permanently `-20%` per tier. |
| `AC4` | **Depth Restriction** | `3` | `1.00 Quintillion` (`10¹⁸`) | Only generators 1–5 available. | Generators 1–5 base output tripled (`3x` compounding) per tier. |
| `AC5` | **Module Overload** | `3` | `100.00 Quintillion` (`10²⁰`) | Installed module levels doubled (cap `10` during run), but generator costs `10x`. | Permanent module cap increased by `+1` per tier (max Level `8`). |
| `AC6` | **Relic Dependency** | `3` | `10.00 Quadrillion` (`10¹⁶`) | Base generator output replaced by `2%` per equipped relic level (`0` output without relics). | `+1` free relic level to all unlocked relics per completion & unlocks **Auto-Equip Relic**. |
| `AC7` | **Anomaly Storm** | `3` | `100.00 Trillion` (`10¹⁴`) | Anomalies spawn every `60s` and last only `10s`. | Anomaly buff power `+50%` permanently per tier. |
| `AC8` | **Combined Entropy** | `1` | `10.00 Sextillion` (`10²²`) | `AC1` + `AC3` combined. | `+1` research queue slot & `+0.1` global production exponent. |

---

## 🟨 Extreme Challenges (`EC1–EC4`)

*Unlocked after completing your first **Tier III — Singular Synthesis** prestige.*

| ID | Name | Tiers | Tier 1 Target | Active Constraints | Permanent Reward |
| :---: | :--- | :---: | :--- | :--- | :--- |
| `EC1` | **Void Protocol** | `5` | `10.00 Duotrigintillion` (`10¹⁰⁰`) | Generators above Tier 10 disabled; no prestige upgrades; no modules. | `1.25x` compounding global RP & `+0.01` production exponent per `EC1` tier. |
| `EC2` | **Singularity Paradox** | `1` | `1.00 Quadragintillion` (`10¹²⁰`) | Only one generator type produces at a time (switches automatically when purchasing another tier). | `+0.05` to master production exponent permanently. |
| `EC3` | **Recursive Collapse** | `1` | `100.00 Quinquadragintillion` (`10¹⁴⁰`) | Run progress automatically collapses and resets every `5` minutes (`300s`). | `+25%` bonus AR awarded on prestiges. |
| `EC4` | **The Final Observation** | `1` | `10.00 Quinquagintillion` (`10¹⁵⁵`) | Only generators and Arkalon; Research, Modules, Relics, Anomalies, Excavation, and Synthesizers disabled. | Arkalon global multiplier permanently doubled (`2x`) & unlocks **Mutator Sandbox**. |

---

## ⚙ Custom Mutator Sandbox

*Unlocked permanently after conquering **Extreme Challenge 4 (`EC4` — The Final Observation)**.*

- **Composable Mutators:** Mix and match up to five constraints in custom simulation runs:
  - **Manual Labor** (`Max Gen Tier 3`)
  - **Blind Research** (`Tech Disabled`)
  - **Relic Vacuum** (`Relics Disabled`)
  - **Chronal Freeze** (`Timers Frozen` without anomalies)
  - **Stable Reality** (`No Anomalies`)
- **Deadlock Protection:** Prevents launching incompatible combinations (`Chronal Freeze` + `Stable Reality` without `Blind Research`).
- **Custom Goal & Records:** Configure target lifetime RP from `10²⁰` to `10¹⁵⁰` (in `10⁵` steps) using the lossless `PreChallengeSnapshot` engine while tracking total Sandbox completions and personal best RP.