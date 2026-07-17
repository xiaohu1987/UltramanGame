const fs = require("fs");
function ok(c, m) {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("OK", m);
}
const fx = fs.readFileSync("js/fx.js", "utf8");
const math = fs.readFileSync("js/math-challenge.js", "utf8");
const battle = fs.readFileSync("js/battle.js", "utf8");
const css = fs.readFileSync("css/math-challenge.css", "utf8");
const inv = fs.readFileSync("docs/math-answer-fx-inventory.md", "utf8");
const spec = fs.readFileSync("docs/math-answer-fx-spec.md", "utf8");
const finalDoc = fs.readFileSync("docs/math-answer-fx-final.md", "utf8");
ok(inv.includes("攻击目标落点"), "T1");
ok(spec.includes("playMathAnswerFx"), "T2");
ok(fx.includes("playMathCorrectFx") && fx.includes('stage = "gather"'), "T3");
ok(fx.includes("playMathWrongFx") && fx.includes('stage = "darken"'), "T4");
ok(fx.includes('this.sfx("math_ok"') && !math.includes('playSfx("math_ok"'), "T5");
ok(math.includes("playAnswerExitFx") && battle.includes("targetUid: target ? target.uid : null") && css.includes("is-fx-out"), "T6");
ok(finalDoc.includes("MANAGED_DELIVERY_VERIFY_OK"), "final doc");
for (const f of ["js/fx.js", "js/math-challenge.js", "js/battle.js"]) {
  try {
    new Function(fs.readFileSync(f, "utf8"));
    console.log("OK syntax", f);
  } catch (e) {
    console.error("FAIL syntax", f, e.message);
    process.exitCode = 1;
  }
}
if (process.exitCode) process.exit(1);
console.log("FINAL_CLOSE_VERIFY_OK");
