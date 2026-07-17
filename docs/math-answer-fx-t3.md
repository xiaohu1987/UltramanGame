# T3 答对 Canvas 粒子特效交付

## 交付物
- `js/fx.js`
  - `ArcadeFX.playMathAnswerFx(options)`
  - `ArcadeFX.playMathCorrectFx(options)`
  - `updateMathAnswerFx` / `drawMathAnswerFx`
  - `finishMathAnswerFx` / `cancelMathAnswerFx`

## 答对阶段
1. **gather** (~520ms)：`sourceRect` 区域粒子向中心汇聚
2. **orb** (~160ms)：中心光球成形
3. **fly** (~500ms)：光球沿弧线飞向 `targetPoint`/`targetUid`
4. **hit** (~270ms)：目标点 hit 粒子 + 震动/闪光，触发完成回调

## 接口
```js
ArcadeFX.playMathAnswerFx({
  correct: true,
  sourceRect,      // 弹出框矩形
  targetPoint,     // 或 targetUid
  onComplete,      // 可选
}) // -> Promise
```

## 验收
| 项 | 状态 |
|----|------|
| 可见汇聚→光球→飞向目标→击中 | ✅ 序列已实现 |
| 落点对准攻击目标 | ✅ `targetPoint` / `centerOf(targetUid)` |
| 结束后可继续后续流程 | ✅ Promise + onComplete + 2.2s 安全超时 |
| 语法检查 | ✅ `node` Function parse OK |

## 说明
- 答错路径目前为短 stub（T4 替换）
- 流程接入（math-challenge / battle）在 T6 完成
