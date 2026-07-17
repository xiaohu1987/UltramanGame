# 难度心算功能最终交付

## 完成任务
- T1 接入点梳理：`docs/difficulty-integration-map.md`
- T2 难度模型/出题判题：`js/math-challenge.js`
- T3 难度选择 UI + localStorage：`index.html` / `js/ui.js` / `js/main.js` / `css/select-ui.css`
- T4 战斗风弹窗 + 30s 倒计时 + 末段红闪：`css/math-challenge.css` + `promptChallenge`
- T5 急迫/答对/答错音效：`js/fx.js`（urgency / math_ok / math_fail）
- T6 结算拦截与修正：`js/battle.js` resolveAction + applySkill(modifier)
- T7 边界联调：空输入/非数字/超时=失败/初级跳过/攻击Miss/治疗Buff失败
- T8 验收收尾：本文件 + 既有验收文档

## 规则
| 难度 | 题型 | 时限 | 答对 | 答错/超时 |
|------|------|------|------|-----------|
| 初级 | 无 | - | 原样 | 原样 |
| 中级 | 10 内加减 | 30s | ×1.05 | 攻击Miss / 效果失败 |
| 高级 | 20 内加减 | 30s | ×1.05 | 同上 |
| 地狱 | 100 内加减 | 30s | ×1.05 | 同上 |

## 使用
1. 选人页选择难度（会记住）
2. 开战
3. 中级及以上：奥特曼技能出手前弹心算题
4. 30 秒作答；最后 8 秒红闪+急迫音
