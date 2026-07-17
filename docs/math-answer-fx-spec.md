# 答题反馈特效规格（T2）

## 目标
重做心算弹窗离场反馈：
- **答对**：弹出框区域粒子缓慢汇聚成光球 → 飞向攻击目标 → 击中
- **答错**：弹出框变黑 → 裂开成碎片 → 消失

## 统一接口

```js
/**
 * @param {object} options
 * @param {boolean} options.correct          // true=答对 / false=答错
 * @param {DOMRect|object} options.sourceRect // 弹出框矩形 {left,top,width,height}
 * @param {{x:number,y:number}|null} options.targetPoint // 攻击目标屏幕坐标；答错可 null
 * @param {string} [options.targetUid]       // 可选，内部可用 centerOf 回退
 * @param {() => void} [options.onComplete]  // 动画结束（或安全超时）后回调一次
 * @returns {Promise<void>}
 */
ArcadeFX.playMathAnswerFx(options)
```

### 调用约定
1. 入口：`MathChallenge` 的 `finish(correct, timedOut)`。
2. 在 `finish` 中：
   - 先禁用输入/提交，停止倒计时与急迫音；
   - 取 `.math-modal-card` 的 `getBoundingClientRect()` 为 `sourceRect`；
   - 答对时用 `targetUid` → `ArcadeFX.centerOf(targetUid)` 得 `targetPoint`；
   - **隐藏/淡出 DOM 卡片内容**（避免与 Canvas 双重显示），保留 backdrop 短暂存在；
   - `await ArcadeFX.playMathAnswerFx(...)`（或 Promise + onComplete）；
   - 动画结束后再 `closeModal(result)` resolve 给战斗引擎。
3. `promptChallenge` 扩展参数：`targetUid`、`actorUid`（可选）。
4. `battle.js` `resolveAction` 调用时传入 `targetUid: target?.uid`、`actorUid: actor?.uid`。

### 动画期间是否锁定继续答题
- **是**：`finish` 开始后输入已禁用；Promise 未 resolve 前 `busy` 仍为 true，战斗不会进入下一行动。
- 安全超时：`MAX_FX_MS = 2200`，超时强制 `onComplete`，防止卡死。
- 连续挑战：若新 `promptChallenge` 替换旧会话，旧动画应被取消（`cancelMathAnswerFx` 或 session token）。

## 时间轴

### 答对（correct）总时长约 1.35–1.6s

| 阶段 | 时长 | 视觉 | 音效 |
|------|------|------|------|
| **gather** 汇聚 | 0–520ms | 从 `sourceRect` 采样 28–40 粒子向中心收缩；卡片 DOM 同步 scale→0.15 + 提亮 | `math_ok`（阶段起点，仅一次） |
| **orb** 光球成形 | 520–680ms | 中心形成发光球（径向渐变 + 外晕），残留微粒吸入 | 轻 `select` 或短高音（可选，默认并入 math_ok） |
| **fly** 飞行 | 680–1180ms | 光球沿缓动曲线飞向 `targetPoint`（轻微弧线）；尾迹粒子 | 可选短 whoosh（`playNoise` 轻量） |
| **hit** 击中 | 1180–1450ms | 目标点爆发 hit 粒子 + 短震动/闪光；光球消失 | `hit`（或 `crit` 若后续有暴击，此处固定 `hit`） |
| **done** | ~1450ms | 清理粒子/状态 → `onComplete` | — |

**落点规则**：
- 优先 `targetPoint`；
- 否则 `targetUid` → `centerOf`；
- 再否则屏幕中心偏上 `(innerWidth/2, innerHeight*0.42)`。

### 答错（wrong）总时长约 0.9–1.1s

| 阶段 | 时长 | 视觉 | 音效 |
|------|------|------|------|
| **darken** 变黑 | 0–280ms | 卡片区域粒子/覆盖层从原色压暗至近黑；DOM card 同步 filter brightness↓ + 灰度 | `math_fail`（阶段起点，仅一次） |
| **crack** 裂开 | 280–720ms | 矩形裂成 16–28 碎片粒子，带旋转与外抛速度 | 可叠短 `playNoise`（已含在 math_fail） |
| **fade** 消失 | 720–980ms | 碎片 alpha→0、缩小；backdrop 淡出 | — |
| **done** | ~980ms | 清理 → `onComplete` | — |

## 实现要点（T3/T4）

### 粒子模型扩展（建议专用数组，避免污染通用 burst 语义）
```js
// 专用序列，不走普通重力散射
this.mathFx = {
  active: false,
  correct: true,
  t: 0,
  duration: 0,
  source: { x, y, w, h },
  target: { x, y },
  particles: [], // {x,y,vx,vy,size,color,life,phase,rot,spin}
  orb: null,     // {x,y,r,alpha}
  token: 0,
  onComplete: null,
};
```

- 在 `ArcadeFX.update/draw` 中驱动 `mathFx`；
- 粒子计入 `MAX_PARTICLES` 软上限（答对序列峰值 ≤ 50，答错 ≤ 40）；
- 低 FPS 时 `perfScale` 降低粒子数。

### DOM 协同
- 动画开始：`.math-modal-card` 加 class `is-fx-out`（`opacity:0; pointer-events:none`）或 `visibility:hidden`，由 Canvas 接管视觉；
- 答错 darken 阶段可先保留 DOM 做 CSS 压暗 0.25s，再切 Canvas 裂片（二选一，优先全 Canvas 一致性）；
- `closeModal` 时移除 class 并 `hidden` 根节点。

## 音效映射（T5）

| 事件 | sfx key | 触发时机 |
|------|---------|----------|
| 答对开始 | `math_ok` | gather 起点（从 `finish` 挪到特效内，避免双重播放） |
| 答对击中 | `hit` | hit 阶段 |
| 答错开始 | `math_fail` | darken 起点 |
| 急迫循环 | `urgency` | 保持现有逻辑，**finish 时必须 stopUrgencyLoop** |

**去重规则**：`finish` 不再直接 `playSfx(math_ok/fail)`，改由 `playMathAnswerFx` 统一触发，防止双响。

## 与答题流程衔接

```
用户提交/超时
  → finish(correct)
  → stop timer/urgency，禁用输入
  → playMathAnswerFx(...)  // 锁定
  → closeModal(result)     // resolve Promise
  → battle runApply / onFx // 技能结算与战斗特效
  → resolveDelay 后 nextActor
```

- 答对：光球击中 **先于** `playBattleFx` 技能命中特效；两者可轻微重叠（击中后 ~100ms 内 resolve 即可）。
- 答错：裂开结束后再 resolve，随后 `applySkill` 产生 Miss/失败日志与既有 miss 反馈。

## 验收对照（T2）

| 项 | 状态 |
|----|------|
| 规格覆盖答对 gather→orb→fly→hit 与答错 darken→crack→fade | ✅ |
| 明确动画期间锁定（Promise 未完成不 resolve / busy 保持） | ✅ |
| 音效与阶段一一对应且避免双重播放 | ✅ |
| 输入参数含 sourceRect / targetPoint / correct / onComplete | ✅ |

---
*T2 完成：可进入 T3/T4 实现。*

> 已实现：见 `js/fx.js` `playMathAnswerFx` 与 T3–T6 交付文档。
