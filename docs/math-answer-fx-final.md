# 答题反馈特效最终交付（T1–T6）

## 目标完成情况
- 答对：弹出框粒子汇聚成光球 → 飞向攻击目标 → 击中
- 答错：弹出框变黑 → 裂开 → 消失
- 音效与阶段同步，旧即时反馈已替换

## 关键文件
| 文件 | 作用 |
|------|------|
| `js/fx.js` | `playMathAnswerFx` / 答对与答错 Canvas 序列 + 阶段音效 |
| `js/math-challenge.js` | `finish` 等待离场特效后再 resolve |
| `js/battle.js` | 传入 `targetUid` / `actorUid` |
| `css/math-challenge.css` | `is-fx-out` / `is-fx-playing` |
| `docs/math-answer-fx-*.md` | T1–T6 规格与验收记录 |

## 验收
```text
node tmp-check-math-answer-fx.js  → T6_MATH_ANSWER_FX_OK
node tmp-check-math-sfx.js        → T5 sfx checks OK
```

未执行视觉模型检查（model_not_multimodal）。

## 关闭校验
- `node tmp-verify-math-fx-managed.js` → `MANAGED_DELIVERY_VERIFY_OK`
- 关键实现：`js/fx.js` / `js/math-challenge.js` / `js/battle.js` / `css/math-challenge.css`

## 任务完成清单
- [x] T1 定位入口 → `docs/math-answer-fx-inventory.md`
- [x] T2 时序与接口 → `docs/math-answer-fx-spec.md`
- [x] T3 答对特效 → `js/fx.js` `playMathCorrectFx`
- [x] T4 答错特效 → `js/fx.js` `playMathWrongFx`
- [x] T5 音效同步 → 阶段门闩 + finish 去重
- [x] T6 联调接入 → `math-challenge.js` / `battle.js` / CSS
