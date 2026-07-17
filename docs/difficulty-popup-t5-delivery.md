# T5 交付：弹窗逻辑与难度持久化

## 实现摘要
- `js/ui.js`
  - els：`difficultyModal` / `difficultyModalOptions` / `difficultyModalHint` / `btnDifficultyConfirm`
  - `pendingDifficultyId`：弹窗内临时选中，确认前不写 storage
  - `openDifficultyModal` / `closeDifficultyModal` / `setDifficultyUi`
  - 紧凑条 `#difficulty-options` → `onDifficultyChange`
  - 确认按钮 → `onDifficultyConfirm` 后关闭弹窗
  - 进入战斗时 `closeDifficultyModal()`
- `js/main.js`
  - `enterSelectScreen()`：`showSelect` + `refreshSelect` + `setDifficultyUi` + **每次** `openDifficultyModal`
  - `init` / `restart` 均走 `enterSelectScreen`
  - `setDifficulty` 仍写 `MathChallenge.saveDifficultyId`（`ultraman.difficulty`）并刷新紧凑条
  - 开战 `difficulty: difficultyId` 不变

## 验收对照
| 标准 | 状态 |
|------|------|
| 每次进入选人页必弹 | ✅ enterSelectScreen |
| 确认后难度生效并记忆 | ✅ setDifficulty + saveDifficultyId |
| 刷新后默认上次难度 | ✅ loadDifficultyId → open 默认选中 |
| 紧凑条改难度立即生效 | ✅ onDifficultyChange → setDifficulty |

## 验证
- `node tmp-check-t5-modal-logic.js` → `T5_LOGIC_OK`
