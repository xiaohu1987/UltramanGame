# T4 实现记录：连击伤害/治疗 +10% 叠加与失败重算

状态：已实现（T3 特效与 T4 结算均已落地，T6 验收测试 30/30 通过）。

## 实现方案（依据 T2）

### 心算连击计数器（新增于 math-challenge 模块作用域）
```js
let mathCombo = 0;
function getMathCombo() { return mathCombo; }
function bumpMathCombo() { mathCombo = Math.min(mathCombo + 1, 9999); return mathCombo; }
function resetMathCombo(reason) {
  if (mathCombo !== 0) {
    mathCombo = 0;
    if (window.ArcadeFX && typeof window.ArcadeFX.resetMathCombo === "function") {
      window.ArcadeFX.resetMathCombo(reason || "fail");
    }
  }
}
```

### 结算入口（buildResolveModifier 的 correct 分支）
```js
if (correct) {
  const n = getMathCombo();                 // 已在 finish(true) 前 bump
  const mult = 1 + 0.1 * Math.min(n, 10);   // 封顶 +100%
  return {
    success: true,
    powerMul: (cfg.bonusMul || SUCCESS_BONUS) * mult,
    forceMiss: false,
    forceFail: false,
    reason: "correct",
    mathCombo: n,
    comboMult: mult,
  };
}
```

### 计数器维护（promptChallenge.finish）
- correct=true：`bumpMathCombo()`
- correct=false / timedOut / tip / replaced：`resetMathCombo(reason)`

### 失败重算语义
- 答错/超时/提醒/替换 → mathCombo=0 → 下一次答对 n=1 → powerMul = base × 1.10（从基础值重算）。
- 已返回战斗引擎的历史 powerMul 不回改（基础值保留）。

## 验收映射（T6 验证）
- 连续 N(≤10) 次答对：powerMul = base×(1+0.1N)。
- 第 11+ 次：维持 base×2.0（封顶）。
- 单次失败：下一题从 base×1.10 重算。
- 难度未启用：不进入连击，powerMul=1。
- 提醒：数学上会断连击（mathCombo=0），但按原提醒逻辑结算。

## 依赖
- 需要 T3 提供 `ArcadeFX.resetMathCombo(reason)` 与 `ArcadeFX.showMathCombo(n)`，T4 在维护计数时调用特效。
