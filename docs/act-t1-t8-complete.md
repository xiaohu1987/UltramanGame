# ACT Complete: Battle Visual Density (T1-T8)

Status: complete
Date: 2026-07-16

## Deliverables
1. T1 inventory docs
2. T2 column/center ratio CSS
3. T3 current actor emphasis CSS
4. T4 battle log secondary CSS+JS
5. T5 fighter card density CSS
6. T6 skill panel density CSS + combo HUD
7. T7 kids hierarchy CSS
8. T8 regression checklist

## Key code facts
- four columns: 1.05 / 1.2 / 1.05 / 1.15
- center rows: 1.55fr / 0.7fr
- actor avatar: min(220px, 86%)
- log maxLines: 8
- skill rows: minmax(72px, 1fr)
- combo HUD: right 18px

## Verification mode
Deterministic static checks only.
Full browser visual pass not run (fast completion policy).
