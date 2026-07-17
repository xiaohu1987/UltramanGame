# 难度心算功能状态

## Tasks
- T1 接入点梳理 ✅
- T2 难度模型与题库 ✅ (`js/math-challenge.js`)
- T3 难度选择 UI 与持久化 ✅ (选人页 + localStorage)
- T4 数学弹窗与倒计时 ✅ (`css/math-challenge.css` + promptChallenge)
- T5 急迫音效 ✅ (`fx.js` urgency/math_ok/math_fail)
- T6 结算拦截与结果修正 ✅ (`battle.js` resolveAction/applySkill)
- T7 边界联调 ✅ (空输入/超时/Miss/失败/初级跳过)
- T8 验收收尾 ✅

## Rules
| 难度 | 范围 | 时限 | 答对 | 答错/超时 |
|------|------|------|------|-----------|
| 初级 | 无题 | - | 原样 | 原样 |
| 中级 | 10 内加减 | 30s | ×1.05 | Miss/失败 |
| 高级 | 20 内加减 | 30s | ×1.05 | Miss/失败 |
| 地狱 | 100 内加减 | 30s | ×1.05 | Miss/失败 |

## Play
1. 选人页选难度（会记住）
2. 开战
3. 中级+：奥特曼出手前弹心算题
4. 30 秒作答；最后 8 秒红闪+急迫音
