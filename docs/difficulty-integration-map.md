# 难度系统接入点清单（T1）

## 技能结算链路

```
手动：
  UI skill click
  → main onSkill
  → BattleEngine.selectSkill(skillId)
  → (可选) PLAYER_SELECT_TARGET + selectTarget(uid)
  → resolveAction(actor, skill, target)
  → applySkill(...)
  → onUpdate / onFx / onLog
  → setTimeout → nextActor

自动战斗（玩家回合）：
  prepareAutoPlayer → scheduleAutoPlayer → runAutoPlayerTurn
  → resolveAction(...)

怪兽 AI：
  runAiTurn → resolveAction(...)
```

## 统一拦截点

| 位置 | 文件 | 说明 |
|------|------|------|
| **主拦截** | `js/battle.js` → `resolveAction` | 手动/自动玩家最终都会进入这里；在 `applySkill` 前插入数学挑战 |
| 条件 | `actor.side === "hero"` 且难度 `enabled` | 怪兽 AI 不弹题 |
| 初级 | 难度 `enabled: false` | 直接走现有逻辑，零行为变化 |
| 答对 | `powerMul = 1.05` | 伤害/治疗/数值类效果 ×1.05 |
| 答错/超时 | `forceMiss/forceFail` | 攻击 Miss；治疗/Buff/复活失败 + 日志 |

## 最小改动方案

1. `js/math-challenge.js`：难度配置、出题、判题、弹窗 Promise API
2. `battle.js`：`resolveAction` 英雄侧拦截；`applySkill` 支持 modifier
3. `main.js` + 选人 UI：难度选择与持久化
4. `fx.js`：urgency / math_ok / math_fail
5. CSS：战斗风数学弹窗 + 倒计时红闪

## 验收（T1）

- [x] 出题时机：玩家技能最终提交后、`applySkill` 前
- [x] 答对加成 / 答错失败挂在 resolveAction + applySkill
- [x] 初级 enabled:false 完全跳过
- [x] 自动战斗与手动共用同一拦截点
