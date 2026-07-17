const fs = require("fs");

function ok(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exitCode = 1;
  } else {
    console.log("OK", msg);
  }
}

const fx = fs.readFileSync("js/fx.js", "utf8");
const math = fs.readFileSync("js/math-challenge.js", "utf8");
const battle = fs.readFileSync("js/battle.js", "utf8");
const css = fs.readFileSync("css/math-challenge.css", "utf8");
const inv = fs.readFileSync("docs/math-answer-fx-inventory.md", "utf8");
const spec = fs.readFileSync("docs/math-answer-fx-spec.md", "utf8");
const acc = JSON.parse(fs.readFileSync("docs/math-answer-fx-acceptance.json", "utf8"));

ok(inv.includes("攻击目标落点"), "T1");
ok(spec.includes("动画期间是否锁定"), "T2");
ok(fx.includes("playMathCorrectFx") && fx.includes('stage = "gather"'), "T3");
ok(fx.includes("playMathWrongFx") && fx.includes('stage = "darken"'), "T4");
ok(fx.includes('this.sfx("math_ok"') && fx.includes('this.sfx("math_fail"') && !math.includes('playSfx("math_ok"'), "T5");
ok(math.includes("playAnswerExitFx") && battle.includes("targetUid: target && target.uid") && css.includes("is-fx-out"), "T6");
ok(acc.status === "passed", "acceptance status");

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
console.log("CLOSEOUT_MATH_ANSWER_FX_OK");
