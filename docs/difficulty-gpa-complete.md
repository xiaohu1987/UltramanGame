# GPA ACT Complete — 难度心算

## completed_task_ids
T1, T2, T3, T4, T5, T6, T7, T8

## 交付
- docs/difficulty-integration-map.md
- js/math-challenge.js
- css/math-challenge.css
- css/select-ui.css (difficulty-picker)
- index.html (难度控件 + 脚本样式引用)
- js/ui.js (setDifficultyUi)
- js/main.js (difficulty 持久化与开战传参)
- js/battle.js (resolveAction 拦截 + applySkill modifier)
- js/fx.js (urgency / math_ok / math_fail)

## 验收
- 四档难度可选，初级不弹题
- 中/高/地狱 30 秒加减法
- 答对 ×1.05；答错/超时攻击 Miss、治疗/Buff 失败
- 末 8 秒红闪 + 急迫音
- 自动战斗同样答题
