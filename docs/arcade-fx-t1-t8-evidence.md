# T1–T8 交付与验证证据

## 任务交付映射
| 任务 | 交付物 | 状态 |
|------|--------|------|
| T1 | `docs/arcade-fx-baseline.md` | 完成 |
| T2 | `docs/arcade-fx-spec.md` | 完成 |
| T3 | `js/fx.js`（ArcadeFX / FX_SPECS / 主循环） | 完成 |
| T4 | `playBattleFx` + `battle.onFx` → `UI.playFx` | 完成 |
| T5 | `playUi` / `playResult` + `css/arcade-fx.css` | 完成 |
| T6 | Web Audio 程序化 SFX（`sfx` / `playTone` / `playNoise`） | 完成 |
| T7 | 粒子/飘字/burst/震动上限 + 低帧降级 + 闪白上限 | 完成 |
| T8 | 静态验收 + 桌面/移动端浏览器断言与截图 | 完成 |

## 关键实现点
- 入口挂载：`index.html` → `css/arcade-fx.css` + `js/fx.js`
- 初始化：`main.js` `ArcadeFX.init` / `unlockAudio` / `resetCombo`
- 战斗链路：`battle.js` `onFx` → `ui.js` `playFx` → `ArcadeFX.playBattleFx`
- UI/结算：`playUi`（click/select/start）+ `playResult`（victory/defeat）
- 性能保护：`MAX_PARTICLES=180`、`MAX_FLOATS=24`、`MAX_BURSTS=36`、`MAX_SHAKE=16`、flash≤0.75、fps 降级

## 验收命令
```bash
node .codexh/verify_acceptance.js
```

## 浏览器验证范围
- Desktop 1440×900：选角页可渲染、无严重控制台错误、无横向溢出
- Mobile 390×844：同上
- 页面标题：`奥特曼打怪兽 · 回合制对战`
