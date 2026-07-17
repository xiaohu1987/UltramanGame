# T5 音效与动画阶段同步

## 音效映射

| 路径 | 阶段 | 音效 | 触发位置 |
|------|------|------|----------|
| 答对 | gather 起点 | `math_ok` | `playMathCorrectFx` 一次 |
| 答对 | fly 起点 | whoosh（noise + 上滑 sine） | `updateMathAnswerFx` `sfxFly` 门闩 |
| 答对 | hit 起点 | `hit` | `updateMathAnswerFx` `sfxHit` 门闩 |
| 答错 | darken 起点 | `math_fail` | `playMathWrongFx` 一次 |
| 答错 | crack 起点 | `playNoise` 短噪声 | `cracked` 门闩 |

## 去重
- `js/math-challenge.js` `finish` **不再**直接 `playSfx(math_ok/math_fail)`
- 统一由 `ArcadeFX.playMathAnswerFx` 按阶段播放，避免双响

## 验收
| 项 | 状态 |
|----|------|
| 答对/答错分别有对应音效 | ✅ |
| 触发时机与关键阶段同步 | ✅ |
| 无异常重复播放 | ✅ finish 去重 + 阶段门闩 |
