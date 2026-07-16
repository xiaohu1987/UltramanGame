# T8 Desktop / Narrow Regression Checklist

Date: 2026-07-16
Mode: deterministic static verification (full browser visual pass not run by policy)

## Checks

| Item | Result | Evidence |
|------|--------|----------|
| DOM order 奥特曼→中栏→怪兽→技能 | PASS | index.html ally < center < enemy < skill-buttons |
| Desktop four columns ratio | PASS | battle-ui/layout-fit/style: 1.05 / 1.2 / 1.05 / 1.15 |
| Center actor > log | PASS | battle-center-main 1.55fr / 0.7fr |
| Current actor enlarged | PASS | avatar min(220px,86%) / min(210px,72%) |
| Battle log secondary | PASS | weaker style + maxLines=8 |
| Fighter cards denser | PASS | reduced gap/padding across CSS layers |
| Skill buttons denser | PASS | minmax(72px,1fr) + max-height 118px |
| COMBO less intrusive | PASS | arcade-fx right:18px, smaller value |
| Hierarchy kids focus | PASS | target-hint pill + skill/actor emphasis |
| Narrow stack fallback | PASS | layout-fit @media max-width 1100px keeps 1fr stack |
| No old heavy center ratio | PASS | 0.95/1.15 removed from battle-ui & layout-fit |

## Risks

- Full browser screenshot/assert not executed in this completion path
- Visual density still depends on actual viewport height; very short screens use reduced avatar caps
- COMBO HUD still absolute-positioned; may slightly overlap skill header on ultra-narrow widths

## Conclusion

Static delivery + verification evidence supports T1-T8 completion for the planned UI density pass.
