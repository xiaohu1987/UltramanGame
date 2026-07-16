# 指向性特效规格（T2）

## 设计目标
在现有点爆发特效之上，增加“施法者 → 目标”的可见轨迹，让技能读感更清晰：
- **光波/光线**：一条射线击中对面
- **治疗**：一团治疗雾/光团飞向目标
- **增益/减益**：带方向的轨迹粒子 + 目标环

不替换现有 hit/heal/buff 反馈，而是**先轨迹、再命中叠加**。

## 统一输入
来自 `BattleEngine.applySkill` 的 `result`：

| 字段 | 用途 |
|------|------|
| `actorUid` | 起点锚点 |
| `targetUid` | 终点锚点 |
| `skillType` | 选择轨迹形态 |
| `amount` / `crit` / `skillPower` | 强度缩放 |
| `skillName` | 可选：光线类名称强化 beam 形态 |

锚点计算：`ArcadeFX.centerOf(uid)`  
同目标（self）时：不播跨单位轨迹，仅保留目标点爆发。

## 时序（ms）
```
t0     出手姿态（actor pulse + cast burst）
t0     启动指向性轨迹（beam / mist / trail）
t0+110 轨迹抵达（或接近）目标
t0+110 命中反馈（impact / heal-ring / buff-ring + 粒子 + 飘字 + SFX）
t0+780 战斗引擎进入下一行动（现有 resolve 延迟，可按自动战斗再调）
```

跨单位：`delayHit = 110~160ms`（随距离可微调，默认 120）  
同单位：`delayHit = 0`

## 形态规格

### 1) 光波 / 光线（damage）
**视觉**
- 主射线：actor → target 的发光线段（渐变芯 + 外晕）
- 行进高光：沿射线快速扫过的亮点
- 尾迹粒子：沿路径稀疏喷出（蓝白/金白，crit 偏金红）
- 命中：保留现有 impact + shockwave + 粒子爆发

**参数**
| 参数 | 默认 | 说明 |
|------|------|------|
| duration | 140ms | 射线可见时长 |
| width | 6~12px | 随 skillPower / crit 放大 |
| coreColor | `#9ad7ff → #ffffff` | crit: `#fff7c2 → #ff6b7a` |
| glowColor | `rgba(99,210,255,.55)` | crit 更暖 |
| particles | 10~22 | 沿路径采样 |
| sfx | hit / crit | 抵达时触发 |

**触发条件**
- `skillType === "damage"` 且 actor ≠ target
- 名称含 光线/射线/光束/激光/斯派修姆/泽佩利昂/M87 等时，优先 beam 形态（否则仍可用 beam，近战也可短射线）

### 2) 治疗雾团（heal）
**视觉**
- 一团柔和绿色雾/光球从 actor 飞向 target
- 飞行中缓慢放大并拖尾绿色微粒
- 抵达后扩散为 heal-ring + sparkle（现有）

**参数**
| 参数 | 默认 | 说明 |
|------|------|------|
| duration | 180ms | 雾团飞行 |
| size | 28~42px | 随 amount 略放大 |
| color | `#3ddc97 / #86efac` | 半透明 |
| particles | 12~18 | 绿色上浮微粒 |
| sfx | heal | 抵达触发 |

**触发条件**
- `skillType === "heal"`
- self 治疗：雾团在目标处原地生成并扩散（无飞行）

### 3) 增益轨迹（buff_atk）
**视觉**
- 蓝色上升轨迹粒子从 actor 流向 target（或 self 上涌）
- 抵达后 buff-up + buff-ring

**参数**
| 参数 | 默认 |
|------|------|
| duration | 160ms |
| color | `#2f9bff / #63d2ff` |
| particles | 14 |
| sfx | buff |

### 4) 减益轨迹（debuff_def）
**视觉**
- 琥珀色下坠/螺旋轨迹粒子 actor → target
- 抵达后 debuff-down + debuff-ring

**参数**
| 参数 | 默认 |
|------|------|
| duration | 160ms |
| color | `#ffd166 / #f59e0b` |
| particles | 14 |
| sfx | debuff |

## API 设计（实现落点：`js/fx.js`）

```js
// 低层
spawnDirectionalBeam(from, to, opts)
spawnHealMist(from, to, opts)
spawnStatusTrail(from, to, kind, opts) // kind: buff | debuff

// 高层（由 playBattleFx 调用）
playDirectionalFx(result) // 根据 skillType 分发
```

`playBattleFx` 调整顺序：
1. actor 出手姿态
2. `playDirectionalFx(result)`
3. 延迟后现有 `applyTarget` 命中反馈

## 性能约束
- 同时活跃轨迹 ≤ 8
- 轨迹粒子计入现有 `MAX_PARTICLES` 池
- 低帧时 `perfScale < 1`：减少路径粒子、缩短 glow
- DOM 轨迹节点（如 beam 元素）用完即移除，超时 400ms 强制清理

## 与 UI/自动战斗的关系
- 手动与自动共用同一 `onFx → playBattleFx` 链路
- 自动战斗仅改变“谁选技能”，不另写特效分支
- 若自动节奏过快，可在 T9 将 resolve 延迟与轨迹 duration 对齐（建议 ≥ max(轨迹, 命中) + 80ms）

## 验收标准（T2）
- [x] 四种 skillType 均有明确视觉形态与参数
- [x] 时序、锚点、API、性能上限已定义
- [x] 不破坏现有点爆发/飘字/连击/SFX 叠加策略
