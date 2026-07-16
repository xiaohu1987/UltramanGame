# T1 战斗页视觉问题与改动边界

对照截图与 index.html / css/battle-ui.css / css/layout-fit.css / css/kids-ui.css / js/ui.js。

## 可见问题（8）
1. 中栏上半留白过大
2. 战报过重（0.95fr/1.15fr）
3. 技能区纵向空心
4. 信息层级不清
5. 四列宽度失衡
6. 舞台装饰条占位
7. 角色卡密度不均
8. 多 CSS 源冲突

## 边界
- 允许：CSS、少量 DOM、ui.js 展示层
- 禁止：伤害/AI/回合/胜负逻辑

## 验收
- [x] >=5 问题
- [x] UI-only 边界
- [x] 锚点可供 T2
