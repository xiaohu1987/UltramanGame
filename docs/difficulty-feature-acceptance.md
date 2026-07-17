# 难度心算功能验收（T1–T8）

## 功能摘要
- 选人页可选：初级 / 中级 / 高级 / 地狱级
- 初级：不弹题，行为与原版一致
- 中级：10 以内加减法；高级：20 以内；地狱级：100 以内
- 限时 30 秒；超时=答错
- 答对：技能生效且数值 ×1.05
- 答错/超时：攻击 Miss；治疗/Buff/复活失败
- 自动战斗玩家回合同样弹题
- 弹窗末 8 秒红闪 + 急迫音效

## 交付文件
| 文件 | 作用 |
|------|------|
| `docs/difficulty-integration-map.md` | T1 接入点 |
| `js/math-challenge.js` | 难度模型 / 出题判题 / 弹窗 |
| `css/math-challenge.css` | 弹窗与倒计时红闪 |
| `css/select-ui.css` | 难度选择 UI |
| `index.html` | 难度控件 + 资源引用 |
| `js/ui.js` | 难度 UI 绑定 |
| `js/main.js` | 持久化与开战传参 |
| `js/battle.js` | 结算拦截与结果修正 |
| `js/fx.js` | urgency / math_ok / math_fail |

## 验收核对
1. 开战前可选四档，默认初级，localStorage `ultraman.difficulty` 记忆 ✅
2. 中/高/地狱在玩家技能 `resolveAction` 前弹题；初级跳过 ✅
3. 答对 +5%；答错/超时攻击 Miss、治疗/Buff 失败 ✅
4. 弹窗战斗风 + 30s 倒计时 + 末段红闪 ✅
5. 急迫音效与答对/答错反馈音 ✅
6. 自动战斗共用拦截点，答题期间 busy 暂停推进 ✅

## 验证命令结果
- `node tmp-check-math-challenge.js` → math-challenge checks OK
- `node tmp-verify-difficulty.js` → VERIFY_OK
- `node tmp-verify-boundaries.js` → BOUNDARY_VERIFY_OK
- `node tmp-final-check.js` → ALL_OK
- JS 语法检查：battle/main/ui/math-challenge/fx 全部 OK

## 游玩说明
1. 选人页点「初级 / 中级 / 高级 / 地狱级」
2. 选满 3 人开战
3. 中级及以上：奥特曼出手后弹出心算题，30 秒内作答
4. 回车或点「确定」提交；遮罩/Esc 不能跳过（Esc 视为放弃=答错）
