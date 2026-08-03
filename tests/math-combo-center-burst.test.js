/**
 * 轻量自测：心算连击右上红框 + 强化爆发（无浏览器 DOM）
 * 运行：node tests/math-combo-center-burst.test.js
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed += 1;
    console.log(`PASS  ${msg}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${msg}`);
  }
}

const arcadeCss = read("css/arcade-fx.css");
const overlayCss = read("css/battle-overlay-fix.css");
const fxJs = read("js/fx.js");
const indexHtml = read("index.html");

// 1) 右上红框定位
assert(
  /\.fx-math-combo-hud\s*\{[\s\S]*?left:\s*auto;[\s\S]*?right:\s*clamp\(220px,\s*26vw,\s*360px\);[\s\S]*?transform:\s*none;/.test(arcadeCss),
  "arcade-fx.css 心算 HUD 右上红框（left/right/transform）"
);
assert(
  /\.fx-math-combo-hud\s*\{[\s\S]*?left:\s*auto\s*!important;[\s\S]*?right:\s*clamp\(220px,\s*26vw,\s*360px\)\s*!important;[\s\S]*?transform:\s*none\s*!important;/.test(overlayCss),
  "battle-overlay-fix.css 强制右上红框覆盖"
);

// 2) 强化样式与动画
assert(arcadeCss.includes("@keyframes math-combo-boom"), "存在 math-combo-boom 动画");
assert(arcadeCss.includes("@keyframes math-combo-ring"), "存在 math-combo-ring 动画");
assert(arcadeCss.includes("@keyframes math-combo-blast"), "存在 math-combo-blast 动画");
assert(arcadeCss.includes(".fx-math-combo-hud.max"), "存在 max 极限连击样式");
assert(arcadeCss.includes(".fx-math-combo-ring"), "存在爆环节点样式");
assert(arcadeCss.includes(".fx-math-combo-blast"), "存在爆炸节点样式");

// 3) JS 爆发逻辑
assert(fxJs.includes("playMathComboBurst"), "fx.js 新增 playMathComboBurst");
assert(fxJs.includes('classList.add("pop", "boom")'), "showMathCombo 触发 boom 动画");
assert(fxJs.includes('this.playMathComboBurst(combo, pct / 100)'), "showMathCombo 调用爆发");
assert(fxJs.includes("this.flashScreen(flashA, flashColor, flashDecay)"), "爆发包含更久屏幕闪光");
assert(fxJs.includes("this.spawnParticles(cx, cy, countMain, palette, power)"), "爆发包含粒子爆炸");
assert(fxJs.includes("flashDecay"), "闪光支持更久衰减");
assert(fxJs.includes("shakePower"), "震动已强化");
assert(fxJs.includes("getBoundingClientRect"), "粒子锚点对齐 HUD 红框");
assert(fxJs.includes('classList.toggle("max", combo >= 8)'), "连击>=8 进入 max 档");
assert(fxJs.includes("fx-math-combo-ring"), "HUD 模板包含 ring");
assert(fxJs.includes("fx-math-combo-blast"), "HUD 模板包含 blast");

// 4) 缓存版本号
assert(indexHtml.includes("hide-damage-combo-1"), "index.html 版本号已刷新");
assert(indexHtml.includes("tip-breaks-combo-1"), "math-challenge 版本号已刷新");

// 6) 右侧伤害 COMBO 关闭
assert(/\.fx-combo-hud[\s\S]*?display:\s*none/.test(arcadeCss), "arcade-fx 关闭伤害 COMBO 显示");
assert(/display:\s*none\s*!important/.test(overlayCss), "overlay 强制隐藏伤害 COMBO");
assert(fxJs.includes("右侧伤害 COMBO HUD 已下线"), "showCombo 不再弹出右侧 COMBO");

// 7) 提醒：不中断心算连击（确认设计：提醒只让下一次伤害/治疗减半，不清零连击）
//    连击仅在 答错/超时/弹窗被替换 时清零，避免 UI 交互误杀居中爆发特效。
const mathJs = read("js/math-challenge.js");
const tipJs = read("js/tip-half-and-voice.js");
// 提醒按钮点击路径不调用 resetMathCombo（连击保护）
assert(!/\.onclick[\s\S]{0,400}resetMathCombo/.test(mathJs), "点提醒不会 resetMathCombo（连击保护）");
// 提醒激活「减半」逻辑确实存在
assert(tipJs.includes("TipHalf.activate()"), "点提醒会激活减半（TipHalf）");
// 开局提示说明提醒效果（减半，而非断连击）
assert(mathJs.includes("可点「提醒」拆分"), "开局提示说明可点提醒拆分");
assert(tipJs.includes("伤害/治疗减半") || mathJs.includes("伤害/治疗减半"), "提醒文案包含伤害/治疗减半");

// 5) 不误伤角色完整显示规则
assert(overlayCss.includes(".skill-owner-avatar"), "overlay 角色完整显示规则仍在");
assert(overlayCss.includes("object-fit: contain !important"), "overlay 仍保留 object-fit contain");

console.log("");
console.log(`Result: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
