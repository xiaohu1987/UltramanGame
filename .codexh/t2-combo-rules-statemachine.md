# T2 连击叠加规则与状态机（含已确认约束）

> 依据 T1 结构结论与用户确认的三项约束设计。本文档是 T3（特效）、T4（数值结算）、T5（语音）的实现契约。

## 0. 关键概念澄清

- **心算连击（`mathCombo`）**：本次新增的独立计数器，仅由「心算挑战连续答对」驱动。与战斗全局 `ArcadeFX.combo`（伤害命中连击，`js/fx.js:136`）**完全解耦**，互不影响。
- **基础值（baseMul）**：难度已定义的答对加成 `SUCCESS_BONUS = 1.05`（`math-challenge.js:9`），即 `buildResolveModifier` 当前返回的 `powerMul`。心算连击在其上**再叠加**。
- **历史结算值保留**：已结算并返回给战斗引擎的 `powerMul` 不可回改；失败仅影响「下一次」计算。

## 1. 叠加公式

设 `n = mathCombo`（连续答对次数，从 1 开始计数，即第 1 次答对 n=1）。

```
叠加倍率 mult(n) = 1 + 0.1 × min(n, 10)        // 封顶 +100% → 第 10 连击 = ×2.0
最终 powerMul    = SUCCESS_BONUS × mult(n)     // 在 buildResolveModifier 的 correct 分支相乘
```

| 连击 n | min(n,10) | mult | 最终 powerMul (base 1.05) |
|--------|-----------|------|---------------------------|
| 1 | 1 | 1.10 | 1.155 |
| 2 | 2 | 1.20 | 1.260 |
| 3 | 3 | 1.30 | 1.365 |
| … | … | … | … |
| 9 | 9 | 1.90 | 1.995 |
| 10 | 10 | 2.00 | 2.100 |
| 11+ | 10（封顶）| 2.00 | 2.100（不再增长）|

> 注意：第 1 次答对即享受 +10%（n=1 → mult 1.10）。这符合「每次连接成功伤害/治疗叠加 10%」的语义。

## 2. 状态机（心算连击）

```
                ┌─────────────┐
   promptChallenge 打开新题  ─►│  IDLE (n=0) │
                └──────┬──────┘
                       │ 答对 → n = n+1（首题 n=1）
                       ▼
                ┌─────────────┐
                │  ACTIVE(n)  │◄──────── 连续答对循环（n 递增，封顶 10）
                └──────┬──────┘
          ┌────────────┼─────────────────┬──────────────┐
    答错/超时     点「提醒」        弹窗被替换        难度=初级/跳过
          │            │                  │               │
          ▼            ▼                  ▼               ▼
   ┌─────────────────────────── RESET ───────────────────────────┐
   │   mathCombo = 0；触发特效归零；历史结算值保留；下次从 n=1 重算 │
   └────────────────────────────┬───────────────────────────────┘
                                 ▼
                           回到 IDLE(n=0)
```

### 事件 → 转移
| 事件 | 条件 | 下一个状态 | 数值影响 |
|------|------|-----------|----------|
| 答对 | ACTIVE(n) → n=min(n+1, ∞) 但 mult 封顶 10 | ACTIVE(n+1) | 下一题 powerMul = base × mult(n+1) |
| 答错/超时 | 任意 | RESET→IDLE | 本次 forceMiss/forceFail（原逻辑）；mathCombo=0 |
| 点「提醒」 | 任意 | RESET→IDLE | 按原逻辑：提醒拆分、会断连击；mathCombo=0 |
| 弹窗被替换(replaced) | 任意 | RESET→IDLE | 视为失败路径，mathCombo=0 |
| 难度未启用/跳过 | 打开即 | IDLE（不进入 ACTIVE） | powerMul=1（原逻辑） |

## 3. 失败重算语义（用户确认）

- **连击清零**：`mathCombo = 0`。
- **从基础值重算**：下一次答对时 `n=1`，`powerMul = SUCCESS_BONUS × 1.10`（而非继承失败前的高倍率）。
- **已造成历史结果保留**：之前已返回战斗引擎的结算值**不回退、不修正**。

## 4. 与 T3/T4/T5 的接口契约

### T3（特效）
- 暴露 `ArcadeFX.showMathCombo(n)`：在右上红框 HUD 显示当前连击数 n，带 pop/boom 动画；n>=8 进入 max 档。
- 暴露 `ArcadeFX.resetMathCombo(reason)`：归零并播放清除动画（reason 用于日志/副标题，如 `"tip"` 表示提醒打断）。
- `js/math-challenge.js` 在 `finish(correct=true)` 时调用 `showMathCombo(mathCombo)`；在 `finish(correct=false/timeout)`、`resetMathCombo("tip")`、弹窗 replaced 时调用 `resetMathCombo(...)`。

### T4（数值结算）
- 在 `buildResolveModifier(difficultyId, correct)` 的 `correct` 分支：
  ```js
  const n = getMathCombo();            // 心算连击计数（答对前已 +1）
  const mult = 1 + 0.1 * Math.min(n, 10);
  powerMul: SUCCESS_BONUS * mult,
  ```
- 答错/超时分支保持 `powerMul: 0, forceMiss/forceFail: true`。
- 计数器维护：`promptChallenge` 在 `finish(correct)` 时：correct → `mathCombo += 1`（封顶不变量由 mult 公式保证）；!correct/timeout/tip/replaced → `mathCombo = 0`。

### T5（语音）
- 不改变本状态机；语音在读题时播报当前题目文本，与连击计数无耦合。
- 云端 TTS 在 `speakMathTip` 内新增分支，失败回退本地 `speechSynthesis`。

## 5. 边界与约束（验收判定依据）

1. 连续答对：powerMul 严格按上表递增，第 10 连击封顶 ×2.0，第 11+ 维持 ×2.0。
2. 单次失败：mathCombo 归零，特效归零；下一题从 n=1（×1.10）重算。
3. 难度未启用：不进入连击，powerMul=1。
4. 提醒：断连击（mathCombo=0），但结算按原提醒逻辑（不额外乘连击）。
5. 心算连击与战斗全局 `ArcadeFX.combo` 互不干扰。
6. 特效应在作答动画阶段播放，不阻塞输入与提交。
