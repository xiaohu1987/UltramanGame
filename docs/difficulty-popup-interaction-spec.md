# T2 进页难度弹窗交互与状态规格

## 目标
每次进入选人页先弹难度选择；确认后关闭；页面保留不挡角色的紧凑难度条。

## 时机
- `init` / `restart` → `enterSelectScreen` → **每次打开弹窗**
- 默认选中：`loadDifficultyId()` / 当前 `difficultyId`
- 遮罩点击 / Esc：**不关闭**（必须确认一次）

## 状态
- `pendingDifficultyId`：弹窗临时选中，确认前不写 storage
- `difficultyId`：确认后 `setDifficulty` → storage + 紧凑条
- 紧凑条点击：立即 `setDifficulty`，不重开弹窗

## 四档规则（不变）
| id | 标签 | 心算 |
|----|------|------|
| easy | 初级 | 跳过 |
| normal | 中级 | max10 / 30s / +5% |
| hard | 高级 | max20 / 30s / +5% |
| hell | 地狱级 | max100 / 30s / +5% |

## 验收
- [x] 每次进入都弹
- [x] 确认后关闭
- [x] 与紧凑条双向同步
- [x] 不改变四档规则语义
