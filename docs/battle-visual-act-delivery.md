# Battle Visual ACT Delivery (T1-T8)

Date: 2026-07-16

## Goal
Tighten battle page visual density without changing combat rules.

## Delivered

### T1 Inventory
- File: `.codexh/t1-battle-visual-inventory.md`
- 8 visible issues + UI-only boundary

### T2 Column / Center Ratio
- Files: `css/battle-ui.css`, `css/layout-fit.css`, `css/style.css`
- Four columns: ~1.05 / 1.2 / 1.05 / 1.15
- Center rows: actor 1.55fr > log 0.7fr
- Stage bar compressed

### T3 Current Actor Focus
- Files: `css/battle-ui.css`, `css/layout-fit.css`, `css/kids-ui.css`
- Larger avatar, stronger border/glow, clearer name/HP hierarchy

### T4 Battle Log Secondary
- Files: `css/battle-ui.css`, `css/layout-fit.css`, `css/kids-ui.css`, `js/ui.js`
- Weaker log style
- Keep latest 8 lines only

### T5 Fighter Card Density
- Files: `css/battle-ui.css`, `css/layout-fit.css`, `css/kids-ui.css`
- Reduced gap/padding/name-chip/hp spacing

### T6 Skill Panel Density
- Files: `css/battle-ui.css`, `css/layout-fit.css`, `css/kids-ui.css`, `css/arcade-fx.css`
- Skill rows minmax(72px,1fr), max-height cap
- Compact skill-owner
- Smaller COMBO HUD, pointer-events none

### T7 Kids Visual Hierarchy
- Files: `css/battle-ui.css`, `css/kids-ui.css`
- Main focus: current actor + usable skills
- Secondary: HP states
- Auxiliary: battle log
- Stronger target-hint pill

### T8 Regression
- File: `docs/t8-battle-visual-regression.md`
- Deterministic static checks all pass
- Full browser visual pass not run (policy: fast completion)

## Boundary Kept
- No damage/AI/turn-order/win-logic changes
- No select-page rewrite
