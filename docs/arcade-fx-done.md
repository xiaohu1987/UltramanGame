# 街机特效任务完成清单

- [x] T1 基线盘点 → `docs/arcade-fx-baseline.md`
- [x] T2 规格设计 → `docs/arcade-fx-spec.md`
- [x] T3 特效核心 → `js/fx.js`
- [x] T4 战斗反馈 → `playBattleFx` + battle/ui 挂接
- [x] T5 UI/结算 → `playUi`/`playResult` + `css/arcade-fx.css`
- [x] T6 音效同步 → WebAudio 程序化 SFX
- [x] T7 性能可读性 → 粒子/闪白/震动上限 + 低帧降级
- [x] T8 端到端验证 → `docs/arcade-fx-verification.md`

验证：
- 静态：`tmp-fx-final-check.js` allOk=true
- 压测：`tmp-fx-verify.html` FX_VERIFY_OK
- 桌面/移动浏览器断言与截图通过
