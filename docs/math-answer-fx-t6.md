# T6 替换旧反馈并联调验收

## 集成改动

### `js/math-challenge.js`
- 新增 `playAnswerExitFx`：取 `.math-modal-card` 矩形 → `ArcadeFX.playMathAnswerFx`
- `finish`：禁用输入、停表/急迫音 → 播特效 → **动画结束后** `closeModal` resolve
- 支持 `targetUid` / `actorUid`
- DOM 卡片加 `is-fx-out`，避免与 Canvas 双重显示

### `js/battle.js`
- `promptChallenge` 传入 `actorUid`、`targetUid`（攻击目标落点）

### `css/math-challenge.css`
- `.math-modal-card.is-fx-out` 隐藏卡片
- `.math-modal.is-fx-playing` 淡化 backdrop

### `js/fx.js`（T3–T5）
- 答对：gather → orb → fly → hit（`math_ok` / whoosh / `hit`）
- 答错：darken → crack → fade（`math_fail` / noise）

## 验收对照

| # | 标准 | 状态 | 证据 |
|---|------|------|------|
| 1 | 答对：弹出框汇聚成光球并击中攻击目标 | ✅ | `playMathCorrectFx` + `targetUid→centerOf` |
| 2 | 答错：弹出框变黑裂开消失 | ✅ | `playMathWrongFx` darken/crack/fade |
| 3 | 音效同步且不阻断继续答题 | ✅ | 阶段门闩音效；Promise 结束后 resolve，busy 解锁 |
| 4 | 无旧特效冲突、无残留层 | ✅ | finish 去重即时 sfx；结束清空 particles；`is-fx-out` |

## 静态验收命令
```bash
node tmp-check-math-answer-fx.js
# => T6_MATH_ANSWER_FX_OK
```

## 说明
- 浏览器实机视觉验收未强制执行（按策略：静态/语法/链路证据优先）
- 未执行视觉模型检查（model_not_multimodal）
