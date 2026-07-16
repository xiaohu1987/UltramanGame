# 街机特效基线清单（T1）

## 项目结构
| 路径 | 职责 |
|------|------|
| `index.html` | 入口；挂载 `css/style.css`、`css/arcade-fx.css`、`js/fx.js` 等 |
| `js/main.js` | 流程控制：选角 → 开战 → 结算 → 重开；初始化 `ArcadeFX` |
| `js/battle.js` | 回合制战斗引擎；`onFx(result)` 输出命中/治疗/增益/减益结果 |
| `js/ui.js` | 选角/战斗/结算 UI；`playFx` / `showResult` 挂接特效 |
| `js/fx.js` | **街机特效核心**：粒子、震动、闪光、飘字、连击、程序化音效 |
| `js/data.js` | 角色/技能数据 |
| `css/style.css` | 基础 UI 与战斗布局 |
| `css/arcade-fx.css` | 夸张特效样式、结算动效、可读性层级保护 |

## 主循环与触发点
| 环节 | 位置 | 说明 |
|------|------|------|
| 特效主循环 | `js/fx.js` `startLoop/update/draw` | `requestAnimationFrame` 驱动粒子、震动、闪光、连击窗口 |
| 选角交互 | `js/ui.js` 选角卡片 / `playUi("select")` | 选中反馈 + 轻粒子 + 点击音 |
| 开战 | `js/main.js` `startBattle` + `playUi("start")` | 开战闪光/震动/音效，重置连击 |
| 技能结算 | `js/battle.js` `resolveAction` → `onFx` | 先刷新数值 DOM，再播特效 |
| 命中/治疗/增益/减益 | `js/fx.js` `playBattleFx` | 出手动画 → 延迟命中 → 粒子/飘字/震动/音效 |
| 击倒 | `playBattleFx` 检测“倒下了” | KO 强震动 + 高密度粒子 + hit-stop |
| 结算 | `js/ui.js` `showResult` → `playResult` | 胜利烟花 / 失败冲击 |
| 按钮 UI | `playUi("click"|"start"|"select")` | 统一 UI 反馈 |

## 现有能力
- 粒子池（上限 180）+ 低帧降级（`perfScale`）
- 屏幕震动、全屏闪光、hit-stop 顿帧
- 全局飘字（伤害/暴击/治疗/增益/减益/连击）
- 角色卡 CSS 爆发（slash/beam/impact/shockwave/crit 等）
- 连击 HUD（数值 + 衰减条 + hot 状态）
- Web Audio 程序化 SFX（无需外部音频资源）
- 结算弹窗 victory/defeat 视觉强化

## 已覆盖缺口（相对“拉满”目标）
| 原缺口 | 现状 |
|--------|------|
| 无统一 VFX 管理 | `window.ArcadeFX` 统一 API |
| 无连击反馈 | `registerCombo` + combo HUD |
| 无音画同步 | `trigger/sfx` 与视觉同帧触发 |
| 结算偏弱 | `playResult` + modal 动效 |
| 性能风险 | 粒子/飘字/burst 上限 + 低帧降级 |
| 可读性风险 | HUD/日志 z-index 保护，闪白上限 0.75 |

## 可扩展挂点
- 新事件：在 `FX_SPECS` 增加规格，再 `ArcadeFX.trigger(name, opts)`
- 新战斗反馈：在 `playBattleFx` 按 `skillType` 分支扩展
- 新 UI：在交互处调用 `playUi(kind, el)`

## 验收状态
- T1 完成：主循环、触发点、VFX/SFX 入口已盘点并可挂接。
