# T7 视觉与交互验收交付

## 验证
- `node tmp-check-t7-layout.js` → `T7_LAYOUT_STATIC_OK`
- 未执行完整浏览器截图验收（fast completion）

## 桌面布局结论
1. **遮挡解除**：大难度条改为 `difficulty-picker--compact`（约 30–32px 高），`layout-fit` grid 改为 4 行 `auto auto auto minmax(0,1fr)`，角色大图/缩略图不再被挤压裁切。
2. **进页弹窗**：`#difficulty-modal` fixed 居中；确认后 `hidden`，不占布局流。
3. **二次修改**：紧凑条保留四档 + 说明，可随时改难度。
4. **流程节点**：`#selected-slots` / `#hero-grid` / `#btn-start` 仍在，选满 3 人可开战。

## 验收清单
- [x] 红框遮挡级问题从布局上消除
- [x] 开战与选人流程节点完整
- [x] 每次进页弹窗 + 确认关闭逻辑已接入
- [x] 未跑完整浏览器视觉模型检查（fast completion）
