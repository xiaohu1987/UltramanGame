# T1 完成：选人页难度 UI 遮挡根因

## 根因
- 节点：`index.html` `.difficulty-picker` 常驻大条
- 布局：`layout-fit` 原 3 行 grid vs 实际 4 子节点 → 角色区被 `overflow:hidden` 裁切
- 非 z-index 叠层，是文档流占位挤压

## 改动文件
index.html / css/select-ui.css / css/layout-fit.css / js/ui.js / js/main.js

## 验收
- [x] 指出挡角色节点
- [x] 列出改动文件清单
