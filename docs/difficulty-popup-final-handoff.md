# 选人页难度弹窗 + 紧凑条 最终交付

## 用户问题
难度大条挡住角色；应在进页时弹窗选择。

## 已实现
1. **每次进入选人页**弹出难度选择（`enterSelectScreen`）
2. 确认后关闭；页面保留 **紧凑难度条**（不挡角色）
3. 难度仍写入 `localStorage: ultraman.difficulty`
4. 战斗心算规则不变（初级跳过；中/高/地狱 30s；答对 +5%；答错/超时 Miss/失败；自动战斗同样拦截）

## 主要文件
- `index.html`：紧凑条 class + `#difficulty-modal`
- `css/select-ui.css`：弹窗样式 + 紧凑条
- `css/layout-fit.css`：4 行 grid，解除裁切
- `js/ui.js`：弹窗开关 / pending / 同步
- `js/main.js`：进页必弹 + 持久化

## 验证
- T3：`node tmp-check-t3-modal.js` → T3_DOM_CSS_OK
- T4：`node tmp-check-t4-compact.js` → T4_COMPACT_OK
- T5：`node tmp-check-t5-modal-logic.js` → T5_LOGIC_OK
- T6：`node tmp-verify-difficulty.js` → VERIFY_OK
- T7：`node tmp-check-t7-layout.js` → T7_LAYOUT_STATIC_OK
- 未执行完整浏览器视觉模型检查（fast completion）

## 使用
刷新页面 → 选人页先选难度并确认 → 紧凑条可再改 → 选 3 人开战。
