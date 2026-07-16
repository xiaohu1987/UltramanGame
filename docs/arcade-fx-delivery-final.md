# 街机夸张特效系统 · 最终交付

日期：2026-07-16

## PLAN 任务对照

| ID | 任务 | 交付 |
|----|------|------|
| T1 | 盘点现有游戏结构与特效基线 | `docs/arcade-fx-baseline.md` |
| T2 | 设计街机夸张特效规格 | `docs/arcade-fx-spec.md` |
| T3 | 搭建可复用特效核心系统 | `js/fx.js`（ArcadeFX / FX_SPECS / 主循环） |
| T4 | 接入战斗/玩法关键反馈特效 | `playBattleFx` + `js/ui.js` / `js/battle.js` |
| T5 | 强化 UI / 结算 / 交互动效 | `playUi` / `playResult` + `css/arcade-fx.css` |
| T6 | 接入并同步音效系统 | WebAudio 程序化 SFX，与视觉同帧 |
| T7 | 性能与可读性调优 | 粒子/飘字/burst/震动上限 + 低帧降级 |
| T8 | 端到端验证与收口 | 静态验收 + 特效压测 + 桌面/移动浏览器断言 |

## 核心实现

- `js/fx.js`：统一特效 API、规格表、粒子/震动/闪光/飘字、连击、音效
- `css/arcade-fx.css`：结算/连击/交互动效与可读性样式
- `index.html`：挂载 `fx.js` 与 `arcade-fx.css`
- 战斗链路：`battle.onFx` → `ui.playBattleFx` → `ArcadeFX`

## 验收

1. 静态：`node tmp-fx-final-check.js` → `allOk: true`
2. 压测：`tmp-fx-verify.html` → `FX_VERIFY_OK`（粒子上限 180、震动上限 16、12 规格齐全）
3. 浏览器：
   - Desktop 1440x900：选角页渲染正常，无严重控制台错误，无横向溢出
   - Mobile 390x844：选角页渲染正常，无严重控制台错误，无横向溢出

## 结论

T1–T8 全部完成，街机夸张特效系统可收口。