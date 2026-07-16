# T8 收口摘要

- 静态验收：`tmp-fx-final-check.js` → `allOk: true`
- 特效压测：`tmp-fx-verify.html` → `FX_VERIFY_OK`，particles=180 / flash=0.75 / shake=16 / 12 specs
- 桌面断言：首页标题、选角文案、无严重控制台错误、无横向溢出
- 桌面截图：选角页角色卡与标题正常渲染
- 移动断言：390x844 通过，无横向溢出
- 移动截图：标题/选角阶段/角色卡正常
- 交付文档：
  - `docs/arcade-fx-baseline.md`（T1）
  - `docs/arcade-fx-spec.md`（T2）
  - `docs/arcade-fx-verification.md`（T8）
- 核心实现：
  - `js/fx.js`（T3/T4/T6/T7）
  - `css/arcade-fx.css`（T5/T7）
  - `js/ui.js` / `js/main.js` / `js/battle.js` 挂接
