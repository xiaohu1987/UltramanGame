# 指向性特效盘点（T1）

## 目标
在现有街机点爆发特效之上，补齐“从施法者指向目标”的轨迹感：
- 光波/光线：射线击中对面
- 治疗：一团治疗雾/光团飞向目标
- buff/debuff：带方向的轨迹粒子

## 现有特效能力（可复用）
| 模块 | 路径 | 能力 |
|------|------|------|
| 特效核心 | `js/fx.js` | `ArcadeFX`：粒子池、震动、闪光、飘字、连击、SFX、`playBattleFx` |
| 特效样式 | `css/arcade-fx.css` | 全局飘字、combo HUD、flash 层 |
| 战斗 CSS 爆发 | `css/style.css` + `css/arcade-fx.css` | 角色卡 `fx-burst`（slash/beam/impact/heal-ring 等） |
| 战斗结算 | `js/battle.js` | `resolveAction` → `onFx(result)`，result 含 actor/target/skillType/amount/crit |
| UI 挂接 | `js/ui.js` | `playFx(result)` 优先调用 `ArcadeFX.playBattleFx` |
| 流程 | `js/main.js` | 选角/开战/结算；初始化 ArcadeFX |
| 数据 | `js/data.js` | 英雄/怪兽技能：`damage/heal/buff_atk/debuff_def` |

## 关键触发链路
```
BattleEngine.resolveAction
  → onUpdate(snapshot)   // 先刷新数值 DOM
  → onFx(result)         // main.js 接到 UI.playFx
  → UI.playFx
  → ArcadeFX.playBattleFx(result)
```

`result` 字段：
- `actorUid`, `targetUid`
- `skillType`: damage | heal | buff_atk | debuff_def
- `amount`, `crit`, `skillPower`, `skillName`, `message`

锚点：
- 角色卡：`.fighter-card[data-uid]`
- 爆发层：`[data-fx=uid]`
- 中心点：`ArcadeFX.centerOf(uid)`（卡片中上部）

## 现有反馈形态（缺口）
| 技能类型 | 现状 | 缺口 |
|----------|------|------|
| damage | 出手 slash/beam 爆发 → 延迟命中 impact/shockwave + 粒子 | **无 actor→target 射线/光波轨迹** |
| heal | cast-heal + 目标 sparkle/heal-ring | **无治疗雾团飞行** |
| buff_atk | cast-buff + buff-up/buff-ring | **无增益轨迹** |
| debuff_def | cast + debuff-down/debuff-ring | **无减益轨迹** |

结论：现有特效是“点爆发”，不是“指向性轨迹”。

## 选角 / 对战 UI 接入点
| 功能 | 现状 | 计划挂点 |
|------|------|----------|
| 选角界面 | `renderSelectScreen` 卡片网格 + 已选列表 | T5 重设计信息架构 |
| 随机选角 | 无 | T6 新增按钮 |
| 对战页技能 | 玩家技能按钮完整；怪兽技能仅数据存在 | T7 在怪兽卡展示技能 |
| 自动打怪 | 无；玩家回合需手动选技能 | T8 一键自动（复用 AI 决策） |

## 怪兽技能数据来源
- `js/data.js` → `MONSTER_ROSTER[].skills`
- 战斗中 `createFighter` 复制到单位实例
- 渲染侧 `renderFighterCard` 当前**未展示**技能列表

## 建议改动文件（后续任务）
1. `js/fx.js` — 指向性射线/雾团/轨迹核心
2. `css/arcade-fx.css` — 轨迹 DOM/动画样式（如需要）
3. `js/ui.js` / `js/main.js` / `index.html` / `css/style.css` — 选角、随机、自动、怪兽技能展示
4. `js/battle.js` — 自动战斗节奏（可选：可配置 resolve 延迟）
5. `docs/*` — 规格与验收

## 验收状态
- ✅ T1：现有特效、战斗结算、选角/对战接入点、怪兽技能数据来源已盘点。
