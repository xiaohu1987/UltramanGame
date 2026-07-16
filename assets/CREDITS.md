# 素材来源说明（CREDITS）

## 本项目使用的图像素材

本游戏当前运行时立绘来自用户提供的素材目录：

- `assets/ultraman_heroes/`：奥特曼角色图
- `assets/ultraman_kaiju/`：怪兽角色图

`js/data.js` 中的角色中文名按素材文件名翻译，例如：

| 素材文件 | 中文名 |
|---|---|
| `ULTRAMAN TIGA.png` | 迪迦奥特曼 |
| `ULTRAMAN ZERO.jpg` | 赛罗奥特曼 |
| `ULTRASEVEN.jpg` | 赛文奥特曼 |
| `GOMORA (1).jpg` | 哥莫拉 |
| `RED KING II.jpg` | 红王 |
| `ALIEN BALTAN (1).jpg` | 巴尔坦星人 |

旧版占位 SVG 仍保留于：

- `assets/heroes/*.svg`
- `assets/monsters/*.svg`

但**已不再作为运行时主素材**。

## 许可

- 旧版 SVG 占位图：可随本项目自由使用、修改。
- `ultraman_heroes` / `ultraman_kaiju`：由用户本地提供，仅用于本项目演示；如对外发布请自行确认版权与授权。
- 若后续替换为 GitHub 开源素材，请在本文件追加：仓库地址、作者、License、修改说明。

## 推荐可替换的 GitHub 免费素材来源（可选）

如需替换为明确开源素材，可参考：

1. [Kenney.nl 资产镜像/整理仓库](https://github.com/KenneyNL)（多数 CC0）
2. [OpenGameArt 相关整理仓库](https://github.com/topics/opengameart)
3. [game-icons/icons](https://github.com/game-icons/icons)（CC-BY，适合技能图标）

替换时同步修改 `js/data.js` 中的 `image` 路径与中文名即可。

## 音频

首版未内置音效，避免版权风险。如需添加，请优先使用 CC0 音效包并在此记录来源。

## 当前素材清单

- 运行时英雄（节选）：迪迦、赛罗、赛文、捷德、泽塔、高斯、戴拿、盖亚、梦比优斯、欧布、泰罗、雷欧
- 运行时怪兽（节选）：哥莫拉、红王、艾雷王、杰顿、巴尔坦星人、金古桥、贝利亚、泰兰特、贝姆斯塔、美菲拉斯星人、黑王、双尾怪
- 素材池总量：`ultraman_heroes` 约 53 张，`ultraman_kaiju` 约 204 张（未全部接入角色表）

> 说明：角色表接入了可支撑 3v3 的精选阵容；其余素材可继续按同样方式扩展到 `js/data.js`。

桌面验收截图示例：`.codexh/verify/desktop-select.png`
