# T4 答错 Canvas 粒子特效交付

## 交付物
- `js/fx.js`
  - `ArcadeFX.playMathWrongFx(options)`
  - `updateMathAnswerFx` 答错分支：`darken → crack → fade`
  - `drawMathAnswerFx` 绘制压暗覆盖层 + 碎片粒子

## 答错阶段
1. **darken** (~280ms)：弹出框区域压暗至近黑
2. **crack** (~440ms)：裂成 16–24 碎片外抛并旋转
3. **fade** (~260ms)：碎片透明消失，清理无残留

## 验收
| 项 | 状态 |
|----|------|
| 可见变黑→裂开→消失 | ✅ |
| 不残留碎片层 | ✅ 结束清空 particles 并 finish |
| 结束后可继续后续流程 | ✅ Promise + onComplete + 1.8s 安全超时 |
| 语法检查 | ✅ |

## 说明
- 音效 `math_fail` 在 darken 起点触发（T5 再与流程去重联调）
- 流程接入在 T6
