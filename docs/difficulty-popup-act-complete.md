# ACT 完成：选人页难度弹窗 + 紧凑条

## 目标
难度选择改为「每次进入选人页弹窗」；关闭后保留不挡角色的紧凑难度条。

## 任务
- T1 根因：`docs/difficulty-ui-block-rootcause.md`
- T2 规格：`docs/difficulty-popup-interaction-spec.md`
- T3 弹窗 DOM/CSS：`index.html` + `css/select-ui.css`
- T4 紧凑条：`difficulty-picker--compact` + `layout-fit` 4 行 grid
- T5 逻辑：`js/ui.js` / `js/main.js` enterSelectScreen 每次弹窗
- T6 回归：`docs/difficulty-popup-t6-regression.md` + VERIFY_OK
- T7 验收：`docs/difficulty-popup-t7-acceptance.md` + T7_LAYOUT_STATIC_OK

## 验证摘要
- T3_DOM_CSS_OK
- T4_COMPACT_OK
- T5_LOGIC_OK
- VERIFY_OK / math-challenge checks OK
- T7_LAYOUT_STATIC_OK
- 未执行完整浏览器视觉模型检查（fast completion）

## 使用
刷新 → 选难度并确认 → 紧凑条可再改 → 选 3 人开战。

## 状态
- ACT T1–T7 已交付并通过静态/脚本验证
