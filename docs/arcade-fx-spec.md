# 街机夸张特效规格（T2）

## 设计原则
1. **街机夸张**：命中要“炸”、暴击要“闪”、连击要“叠”、结算要“炸场”。
2. **音画同步**：视觉触发同帧/近同帧播 SFX。
3. **可读性优先**：分数、HP、操作提示不被遮死；全屏闪白短促且有上限。
4. **性能可控**：粒子/飘字/burst 有上限；低帧自动降密度。

## 事件规格表
| 事件 | 视觉层 | 音效 | 强度参数 | 可读性保护 |
|------|--------|------|----------|------------|
| `ui_click` | 轻粒子 8、微闪 0.08、按钮 pop | click 短音 | power 0.7 | 无震动 |
| `select` | 粒子 14、微闪 0.1 | select 双音上扬 | power 0.8 | 顶部轻反馈 |
| `battle_start` | 粒子 48、震 4、闪 0.35 | start 三连上扬 | power 1.15 | 闪白 <0.75 |
| `hit` | 粒子 22、震 5、闪 0.22、冲击波/飘字 | hit 噪声+低音 | power≈0.85~1.8（随伤害） | 飘字高对比 |
| `crit` | 粒子 46、震 10、闪 0.45、crit 环/flare、hit-stop 90ms | crit 多层 | power×1.35 | 短 hit-stop |
| `heal` | 粒子 20、震 1、绿闪、sparkle/heal-ring、`+HP` | heal 双音 | power 1.1 | 绿色区分 |
| `buff` | 粒子 18、蓝闪、buff-up/ring、`ATK+%` | buff 上扬 | power 1.05 | 不遮 HP |
| `debuff` | 粒子 18、黄闪、debuff-down/ring、`DEF-%` | debuff 下滑 | power 1.05 | 不遮 HP |
| `combo` | 粒子 28、震 6、闪 0.28、COMBO HUD、`N HIT!` | combo 音高随连击 | 连击越高越强 | HUD 固定右上 |
| `ko` | 粒子 56、震 12、闪 0.55、KO 动画、hit-stop 120ms | ko 重击 | power 1.3 | 短促冲击 |
| `victory` | 粒子 90 + 4 波烟花、震 8、青闪 0.5、结算弹窗 | victory 琶音 | power 1.4 | 弹窗可读 |
| `defeat` | 粒子 40、震 10、红闪 0.4、失败弹窗 | defeat 下滑 | power 1.2 | 弹窗可读 |

## 连击规则
- 伤害命中 `combo += 1`，窗口 3200ms
- 连击 ≥2 播 combo 音；≥3 额外 `N HIT!` 飘字 + combo 视觉
- 连击越高：伤害 power 提升（上限 +1.4）、音高上升、HUD 进入 hot

## 性能与降级
| 参数 | 值 |
|------|----|
| `MAX_PARTICLES` | 180 |
| `MAX_FLOATS` | 24 |
| `MAX_BURSTS` | 36 |
| 低帧阈值 | fps < 40 → 0.55；< 50 → 0.75 |
| 闪白上限 | 0.75 |
| 震动上限 | 16px |

## 挂接 API
```js
ArcadeFX.trigger(eventName, { x, y, power, palette, uid })
ArcadeFX.playBattleFx(result)
ArcadeFX.playResult(winner) // 'hero' | 'monster'
ArcadeFX.playUi(kind, el)   // 'click' | 'select' | 'start'
```

## 验收状态
- T2 完成：12 个关键事件均有视觉 + 音效规格，并含性能/可读性保护。
