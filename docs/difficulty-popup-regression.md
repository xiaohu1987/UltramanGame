# T6 回归：战斗心算拦截与自动战斗

## 范围
仅验证 UI 入口改为「进页弹窗 + 紧凑条」后，战斗规则未回归。

## 静态/脚本结果
| 检查 | 结果 |
|------|------|
| `node tmp-verify-difficulty.js` | VERIFY_OK |
| `node tmp-check-math-challenge.js` | math-challenge checks OK |
| `js/battle.js` `resolveAction` 拦截 | 仍在 `applySkill` 前；`actor.side === "hero"` 且 `enabled` 才弹题 |
| 初级 `enabled:false` | 直接 `runApply` skip |
| 答对 | `powerMul` 1.05 |
| 答错/超时 | forceMiss / forceFail |
| 开战传参 | `main.js` → `difficulty: difficultyId` |
| 自动战斗 | 与手动共用 `resolveAction`，无旁路 |

## 路径结论
1. **手动**：选人确认难度 → 开战 → 英雄技能 → 中/高/地狱弹心算。
2. **自动**：`autoBattle` 开启时玩家行动仍进 `resolveAction`，同样弹题。
3. **初级**：完全跳过心算，行为与改前一致。

## 验收
- [x] 四档规则与改前一致
- [x] 仅 UI 入口变化，无结算回归
