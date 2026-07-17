# T6 回归交付：战斗心算拦截与自动战斗

## 验证命令
- `node tmp-verify-difficulty.js` → VERIFY_OK
- `node tmp-check-math-challenge.js` → math-challenge checks OK

## 拦截点（未改语义）
- 文件：`js/battle.js` → `resolveAction`
- 条件：`actor.side === "hero"` 且 `MathChallenge.getDifficulty(this.difficulty).enabled`
- 初级：`enabled:false` → 直接 `runApply` skip
- 答对：`powerMul` 1.05
- 答错/超时：forceMiss / forceFail
- 自动战斗：与手动共用同一 `resolveAction`，无旁路

## 与 UI 改造关系
- 仅入口改为进页弹窗 + 紧凑条
- 开战仍传 `difficulty: difficultyId`
- 四档规则、时限、加成不变

## 验收
- [x] 四档规则与改前一致
- [x] 仅 UI 入口变化，无结算回归
- [x] 手动 / 自动共用拦截点
