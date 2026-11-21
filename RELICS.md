# 💎 Relics & Artifacts

Complete reference for all 20 Relics across five rarity tiers and four operational classes, including discovery sources, deterministic pity mechanics, Class Resonance, Loadout Presets, and Artifact Dust scaling.

---

## 📋 Overview & Core Mechanics

- **Unlock Gate:** Resolve your first Spatial Anomaly or complete Research Node **`O1` (Synaptic Resonance)** to bring the Relic Vault online and automatically receive **Relic 1 (Arkalon's Left Eye)** at Level 1.
- **Persistent Progression:** Unlocked relics, upgrade levels, Loadout Presets, and Artifact Dust **never reset** on Tier I, Tier II, or Tier III Prestige. *(Tier II and Tier III resets empty your active sockets—use Presets to re-socket instantly.)*
- **Active Sockets (`3 → 6`):** Starts with `3` active relic sockets, expanding by `+1` per **`SC11`** tier completed up to a maximum of `6` sockets.
- **Swap Cooldown:** Unequipping a relic triggers a `60s` socket recalibration cooldown before another relic can occupy that slot. Purchasing CF **Relic Preservation** removes this cooldown completely (`0s` instant swaps).
- **Loadout Presets:** Once `4` or more relics are unlocked, three memory banks (**P1: Speedrun**, **P2: Deep Idle**, **P3: Surge Hunter**) let you save and apply full socket configurations in one click.
- **Upgrade Formula & Bulk Controls:** Each relic upgrades using Artifact Dust with cost `ceil(baseDustCost * 1.08^currentLevel)` up to **Level 100** (**Level 20** for Relic 20). Supports `+1`, `+10`, and `MAX` bulk upgrades.
- **Deterministic Pity Protection:**
  - **Relic 4 (Infinite Ledger):** `1%` drop chance per completed research node, **guaranteed by your 25th completed research node**.
  - **Relic 9 (Void Compass):** `5%` (`Unstable Rifts`) or `15%` (`Void Depths`) drop chance per scan, **guaranteed by your 8th Unstable/Void expedition** (duplicate rolls convert into `+75` / `+200` bonus Dust).

---

## 🔮 Class Resonance & Multipliers

Every relic belongs to one of four classes (`Computation`, `Energy`, `Reality`, `Arkalon`). Equipping multiple relics of the same class activates **Class Resonance** for those equipped relics:

| Equipped Matching Class | Relic Effect Bonus | Matching Generator Class Bonus |
| :--- | :--- | :--- |
| **2 Matching Relics** | `+15%` (`1.15x`) effectiveness | — |
| **3+ Matching Relics** | `+35%` (`1.35x`) effectiveness | `+10%` (`1.10x`) base output |

- Equipped relic multipliers scale further with the **Relic Resonance** AR upgrade (`+5%` per level, amplified by `+20%` per `AC2` tier).
- **Challenge Interactions:** `SC11` (*Relic Vacuum*) and `EC4` (*The Final Observation*) suspend relic equipping and effects for the duration of the challenge run; `AC6` (*Relic Dependency*) replaces normal generator base output with `2%` per equipped relic level (`0` output if no relics are equipped).

---

## 📦 Relic Catalog (20 Relics)

### Common Relics (IDs 1–4)

| ID | Name | Class | Discovery Source | Base Dust | Max Lv | Effect per Level |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| `01` | **Arkalon's Left Eye** | Arkalon | Auto-awarded on Relic tab unlock | `10` | `100` | `+2%` Arkalon Branch research speed |
| `02` | **Fractured Chrono-Hourglass** | Reality | Complete `10` standard research nodes | `15` | `100` | `+1.5s` anomaly duration |
| `03` | **Zero-Point Dynamo** | Energy | Complete a Tier III Singular Synthesis reset | `25` | `100` | `+5%` Energy-class generator output |
| `04` | **Infinite Ledger** | Computation | Research completion (`1%` drop; guaranteed at `25th` node) | `30` | `100` | `-0.001` cost growth factor on Generators 1–5 |

### Rare Relics (IDs 5–8)

| ID | Name | Class | Discovery Source | Base Dust | Max Lv | Effect per Level |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| `05` | **Entropic Anchor** | Reality | Accumulate `50` total offline hours | `40` | `100` | `+1%` offline RP efficiency (total efficiency capped at `100%`) |
| `06` | **Quantum Die** | Computation | Resolve `10` spatial anomalies | `50` | `100` | `-3s` minimum anomaly spawn interval (floor `60s`) |
| `07` | **Sierpinski Gasket Node** | Computation | Spend `50` total Arkalon Resonance (AR) | `75` | `100` | `+10%` Computation-class generator output |
| `08` | **Tachyon Prism** | Reality | Complete your first Tier II Timeline Severance | `100` | `100` | `+0.02` global production exponent |

### Epic Relics (IDs 9–12)

| ID | Name | Class | Discovery Source | Base Dust | Max Lv | Effect per Level |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| `09` | **Void Compass** | Arkalon | Unstable Rifts (`5%`) / Void Depths (`15%`) scan (guaranteed by `8th` run) | `125` | `100` | `+3%` AR awarded on Reality Recalibration |
| `10` | **Singularity Lens** | Energy | Own `50` Singularity Reactors | `150` | `100` | `+15%` Singularity Reactor output |
| `11` | **Superrecursive Core** | Computation | Purchase the `500th` unit of any generator | `200` | `100` | Quantity milestones trigger `2` units earlier (floor `10`) |
| `12` | **Dyson Siphon** | Energy | Own `50` Stellar Harvesters | `250` | `100` | `+0.5%` Energy-class RP per Stellar Harvester owned |

### Legendary Relics (IDs 13–16)

| ID | Name | Class | Discovery Source | Base Dust | Max Lv | Effect per Level |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| `13` | **Matter-Data Bridge** | Computation | Acquire `3` Anomalous Operation artifacts | `300` | `100` | `+5%` cross-generator synergy coefficients |
| `14` | **Paradoxical Coil** | Reality | Complete any research node requiring `24h+` base study time | `400` | `100` | `-1.5%` base RP cost of all research nodes (max `-90%`) |
| `15` | **Planck Shell** | Reality | Own `250` Reality Engines | `500` | `100` | `+10%` Reality Engine RP output |
| `16` | **Arkalon's Monolith** | Arkalon | Complete Arkalon Branch Tier 8 (`O8`) | `600` | `100` | `+2%` Arkalon Interface RP per other owned generator tier |

### Mythical Relics (IDs 17–20)

| ID | Name | Class | Discovery Source | Base Dust | Max Lv | Effect per Level |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| `17` | **Dark Core Extract** | Energy | Own `100` Dark Matter Synthesizers | `800` | `100` | `-2%` cost of Vacuum Fluctuators & Dark Matter Synthesizers (max `-90%`) |
| `18` | **Galactic Hub** | Energy | Spend `10` total Omni-Spars (OS) | `1,000` | `100` | Galactic Engines boost Stellar Harvesters `+1%` per Engine |
| `19` | **Dimensional Map** | Reality | Reach `10⁶³` (`Vigintillion`) RP in a single run | `1,200` | `100` | `-3%` Reality Branch research RP costs (max `-90%`) |
| `20` | **Omega Catalyst** | Arkalon | Own `10` Absolute Void Compressors | `1,500` | `20` | `+50%` Absolute Void Compressor output (max `+1,000%` at Lv20) |