# T1 选人页难度 UI 遮挡根因

## 现象
选人页「难度」四档大条占用工具栏与已选大图之间的纵向空间，角色大图/缩略图被挤压、裁切，看起来像「把角色挡住了」。

## 遮挡节点
| 项 | 位置 |
|----|------|
| DOM | `index.html` → `#screen-select .difficulty-picker` |
| 选项容器 | `#difficulty-options` + `.difficulty-option` ×4 |
| 说明文案 | `#difficulty-desc` |

## 布局根因
1. **常驻大条占位**：`.difficulty-picker` 为整行 4 列按钮，插在 `select-merged-bar` 与 `#selected-slots` 之间。
2. **网格行定义冲突**：
   - `css/select-ui.css`：4 行 `auto auto auto auto`
   - `css/layout-fit.css`：原 3 行 `auto auto minmax(0,1fr)`
   - 实际子节点 4 个 → 已选槽被压进 `fr` 行并受 `overflow: hidden` 裁切。
3. **高度锁死**：选人屏 `max-height` + panel `overflow: hidden`，难度条多占高度直接从角色区扣除。
4. **非 z-index 叠层主因**：主要是文档流占位挤压。

## 可复用 API
- `MathChallenge.load/saveDifficultyId`（`ultraman.difficulty`）
- `main.setDifficulty` / `UI.setDifficultyUi`
- 进页钩子：`init` / `restart` / `showSelect`

## 改动文件清单
`index.html`、`css/select-ui.css`、`css/layout-fit.css`、`js/ui.js`、`js/main.js`（`battle.js` 不改规则）

## 验收
- [x] 指出挡角色节点与样式根因
- [x] 列出弹窗与紧凑条改动文件
