# 答题反馈特效改动点清单（T1）

## 1. 答对 / 答错回调入口

| 位置 | 函数 / 链路 | 说明 |
|------|-------------|------|
| `js/battle.js` | `BattleEngine.resolveAction` | 英雄侧且难度启用时调用 `MathChallenge.promptChallenge`；`challenge.correct` → `runApply({ powerMul, reason:"correct" })`；答错/超时 → `forceMiss/forceFail` |
| `js/math-challenge.js` | `promptChallenge` → 内部 `finish(correct, timedOut)` | 判题后立刻 `playSfx("math_ok"\|"math_fail")`，再 `closeModal(result)` 并 resolve Promise |
| `js/math-challenge.js` | `closeModal(result)` | 当前直接 `root.hidden = true` 隐藏弹窗，**无答对/答错视觉过渡** |

**结论**：真正的「答对/答错回调」在 `math-challenge.js` 的 `finish`；战斗侧在 Promise resolve 后立刻结算技能。新特效应在 `finish`/`closeModal` 之间插入，并 **await 动画完成后再 resolve**，避免弹窗瞬间消失。

## 2. 弹出框 DOM / 渲染层

| 节点 | 选择器 / ID | 用途 |
|------|-------------|------|
| 根遮罩 | `#math-challenge-modal.math-modal` | fixed 全屏，`z-index: 80` |
| 背景 | `.math-modal-backdrop` | 半透明模糊底 |
| **弹出框本体** | `.math-modal-card` | 可取 `getBoundingClientRect()` 作为粒子源矩形 |
| 样式 | `css/math-challenge.css` | 现有 `math-modal-pop` 入场动画；无答对/答错离场特效 |

**结论**：粒子源矩形 = `.math-modal-card.getBoundingClientRect()`；特效层复用 `ArcadeFX` 全屏 canvas（`#arcade-fx-root .fx-particle-layer`）。

## 3. 攻击目标落点

| 来源 | API | 说明 |
|------|-----|------|
| `js/fx.js` | `ArcadeFX.centerOf(uid)` | 优先中心角色卡头像，否则 `.fighter-card[data-uid]`，返回屏幕坐标 `{x,y}` |
| `js/fx.js` | `ArcadeFX.getAnchorRect(uid)` | 同上，返回 DOMRect |
| `js/battle.js` | `resolveAction(actor, skill, target)` | `target.uid` 即为攻击目标；全员技能时 `target` 可能为代表性目标 |

**接入缺口**：`promptChallenge` 当前只收 `difficultyId / skillName / actorName`，**未传 `targetUid`**。  
T2/T6 需扩展为传入 `targetUid`（及可选 `actorUid`），答对特效用 `ArcadeFX.centerOf(targetUid)` 作为光球落点。

## 4. 现有动画 / 音效资源（可复用）

| 资源 | 位置 | 可复用点 |
|------|------|----------|
| Canvas 粒子池 | `js/fx.js` `spawnParticles` / `update` / `draw` | 可扩展粒子类型（汇聚/裂片），或新增专用序列动画 |
| 程序化音效 | `ArcadeFX.sfx` | 已有 `math_ok`、`math_fail`、`urgency`、`hit`、`crit` |
| 命中反馈 | `playBattleFx` / `trigger("hit"\|"crit")` | 光球击中后可复用 hit 粒子 + 震动 |
| 指向性轨迹 | `castBeam` / `castMist` / `playDirectionalFx` | 参考飞行路径，但答题特效应独立（从弹窗→目标，非 actor→target） |

**当前旧反馈**：`finish` 内即时 `math_ok`/`math_fail` + 弹窗直接隐藏。无 Canvas 汇聚/裂开动画。

## 5. 建议改动文件

1. **`js/fx.js`** — 新增 `playMathAnswerFx({ correct, sourceRect, targetPoint, onComplete })`
2. **`js/math-challenge.js`** — `finish` 改为先播特效再 `closeModal`；扩展 `promptChallenge` 参数
3. **`js/battle.js`** — `promptChallenge` 传入 `targetUid` / `actorUid`
4. **`css/math-challenge.css`** — 可选：动画期间隐藏/淡出 card，避免与 Canvas 双重显示

## 6. T1 验收对照

| 验收项 | 状态 | 证据 |
|--------|------|------|
| 答对/答错回调 | ✅ | `math-challenge.js` `finish` + `battle.js` `resolveAction` then 分支 |
| 弹出框 DOM/渲染层 | ✅ | `#math-challenge-modal` / `.math-modal-card` + `css/math-challenge.css` |
| 攻击目标落点 | ✅ | `ArcadeFX.centerOf(targetUid)`；需在 prompt 时传入 `target.uid` |

---
*T1 完成：入口定位不依赖猜测，可进入 T2 规格设计。*

> 已实现：见 `docs/math-answer-fx-final.md` / `docs/math-answer-fx-acceptance.json`。
