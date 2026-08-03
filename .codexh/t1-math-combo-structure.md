# T1 心算强化现有玩法与数值结构梳理

> 目标：定位心算强化的出题 / 作答 / 伤害·治疗结算 / 连击状态，并标记题目朗读触发点，为 T2–T5 提供依据。

## 1. 心算挑战主流程（出题·作答·结算）

**文件：`js/math-challenge.js`**

| 环节 | 位置 | 说明 |
|------|------|------|
| 难度配置 | `DIFFICULTIES`（math-challenge.js:14-51） | easy(不弹) / normal(10内) / hard(20内) / hell(100内)；`bonusMul` 当前恒为 `SUCCESS_BONUS = 1.05` |
| 出题 | `generateQuestion(cfg.max)`（:91-112） | 生成非负加减法 |
| 出题/提醒拆分 | `buildMathTip` `buildAddTip` `buildSubTip`（:131-487） | 「提醒」把算式拆成两步提示，**会断连击** |
| 弹窗入口 | `promptChallenge(options)`（:1260-1391） | 返回 Promise，含 `correct / powerMul / forceMiss / forceFail` |
| 结算修饰 | `buildResolveModifier(difficultyId, correct)`（:660-687） | **伤害/治疗结算核心入口**：答对 → `powerMul = cfg.bonusMul(1.05)`；答错/超时 → `powerMul=0, forceMiss/forceFail=true` |
| 回答特效 | `playAnswerExitFx(correct, targetUid)`（:1203-1222）→ `finish` | 动画结束后再 resolve 给战斗引擎 |

**结论（验收锚点 1·2）**：
- **连击状态变量**：`ArcadeFX.combo`（`js/fx.js:136`，含 `comboTimer`、`hitStreak`），由 `registerCombo(isHit)`（:682）累加、`resetCombo()`（:696）清零。注意：这是**战斗全局连击**（伤害命中计数），不是心算连击。心算连击是本次新增概念。
- **伤害/治疗结算入口**：`buildResolveModifier()`（math-challenge.js:660）产出 `powerMul`，再经 `promptChallenge` 回传战斗引擎。T4 需在此按心算连击数叠加 ×(1+0.1·min(combo,10))。

## 2. 题目朗读触发点（语音读题）

**文件：`js/math-challenge.js`**

- 预热：`warmMathTipSpeech()`（:935）→ `refreshTipSpeechVoices / resumeTipSpeechEngine / pickChineseVoice`
- 朗读主体：`speakMathTip(tip, question)`（:1061）→ 使用 **浏览器内置 `window.speechSynthesis`**（本地 TTS），非云端。
- 底层：`safeSpeak`（:913）、`makeUtterance`（:996）、`pickChineseVoice`（:847）、`scoreChineseVoice`（:788）。
- 触发调用方：弹窗打开时 `warmMathTipSpeech()`（:1313）；点击「提醒」时 `speakMathTip`。

**结论（验收锚点 3）**：当前语音走**本地 `speechSynthesis`**。T5 需求为「接入云端语音」，需新增云端 TTS 调用（在 `speakMathTip` 内或新函数），并保留本地降级。

## 3. 连击特效现状（前序产物状态）

- 测试文件 `tests/math-combo-center-burst.test.js` 期望：`resetMathCombo("tip")`、`showMathCombo`、`playMathComboBurst`、HUD 样式 `.fx-math-combo-hud`、动画 `math-combo-boom/ring/blast`。
- **源码核实结果（重要）**：上述符号在 `js/fx.js`、`js/math-challenge.js`、`css/arcade-fx.css` 中均**不存在**（仅测试文件引用）。即前序 session 留下的是**未实现的测试期望**，并非已落地的 T3 实现。
- 现有真实连击特效：`js/fx.js` 的 `showCombo / hideCombo`（:496-521）、`registerCombo / resetCombo`（:682-701）、右侧伤害 COMBO HUD（已被该测试要求 `display:none` 下线）。

## 4. 给 T2–T5 的衔接结论

- **心算连击状态**：需新增独立状态（建议挂在 `ArcadeFX` 或 `math-challenge` 模块的 `mathCombo` 计数 + `mathComboTimer`），与战斗全局 `combo` 解耦；T2 状态机据此设计。
- **叠加入口**：在 `buildResolveModifier` 注入心算连击倍率（受 T2 上限 +100% 约束）。
- **失败重算**：答错/超时/点提醒 → 心算连击清零；已造成的历史 `powerMul` 结果保留，后续从基础值重算。
- **语音**：T5 在 `speakMathTip` 增加云端 TTS 分支，失败则回退本地 `speechSynthesis`。
