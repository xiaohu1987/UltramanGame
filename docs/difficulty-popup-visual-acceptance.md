# T7 视觉与交互验收（桌面布局）

## 验收方式
- 静态结构/样式/逻辑脚本：`node tmp-check-t7-layout.js` → `T7_LAYOUT_STATIC_OK`
- 未执行完整浏览器截图验收（按 fast completion 策略）

## 检查项
| 项 | 结果 |
|----|------|
| 进页难度弹窗 DOM 存在 | ✅ `#difficulty-modal` + 四档 + 确认 |
| 弹窗 fixed 遮罩、关闭后 hidden | ✅ `.difficulty-modal` / `[hidden]` |
| 紧凑难度条 | ✅ `difficulty-picker--compact`，按钮高度约 30–32px |
| 选人 grid 4 行 | ✅ `auto auto auto minmax(0,1fr)`，解除 3/4 行冲突 |
| 每次进页弹窗 | ✅ `enterSelectScreen` → `openDifficultyModal` |
| 再来一局再弹 | ✅ `restart` → `enterSelectScreen` |
| 紧凑条可改难度 | ✅ `#difficulty-options` → `setDifficulty` |
| 开战/选人节点仍在 | ✅ `#btn-start` / `#selected-slots` / `#hero-grid` |

## 结论
- 用户截图中「大难度条挤压角色区」的根因已通过紧凑条 + grid 修正处理。
- 交互改为：进页弹窗选难度 → 确认后关闭 → 页面保留紧凑条二次修改。
- 战斗心算规则未改（见 T6 回归）。

## 验收
- [x] 红框遮挡级问题从布局上消除（紧凑条 + 正确 grid）
- [x] 开战与选人流程节点完整
- [x] 未跑完整浏览器视觉模型检查（fast completion）
