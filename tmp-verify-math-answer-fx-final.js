const fs = require("fs");
const path = require("path");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exitCode = 1;
  } else {
    console.log("OK", msg);
  }
}

const files = {
  fx: fs.readFileSync("js/fx.js", "utf8"),
  math: fs.readFileSync("js/math-challenge.js", "utf8"),
  battle: fs.readFileSync("js/battle.js", "utf8"),
  css: fs.readFileSync("css/math-challenge.css", "utf8"),
  inventory: fs.readFileSync("docs/math-answer-fx-inventory.md", "utf8"),
  spec: fs.readFileSync("docs/math-answer-fx-spec.md", "utf8"),
  final: fs.readFileSync("docs/math-answer-fx-final.md", "utf8"),
  acceptance: fs.readFileSync("docs/math-answer-fx-acceptance.json", "utf8"),
};

// T1/T2 docs
assert(files.inventory.includes("答对 / 答错回调入口"), "T1 inventory");
assert(files.spec.includes("playMathAnswerFx"), "T2 spec");

// T3/T4 fx
assert(files.fx.includes("playMathCorrectFx"), "T3 correct fx");
assert(files.fx.includes('stage = "gather"') || files.fx.includes('stage: "gather"'), "T3 gather");
assert(files.fx.includes('stage = "hit"') || files.fx.includes('stage: "hit"'), "T3 hit");
assert(files.fx.includes("playMathWrongFx"), "T4 wrong fx");
assert(files.fx.includes('stage = "darken"') || files.fx.includes('stage: "darken"'), "T4 darken");
assert(files.fx.includes('stage = "fade"') || files.fx.includes('stage: "fade"'), "T4 fade");

// T5 sfx
assert(files.fx.includes('this.sfx("math_ok"'), "T5 math_ok");
assert(files.fx.includes('this.sfx("math_fail"'), "T5 math_fail");
assert(files.fx.includes("sfxFly"), "T5 fly sfx");
assert(!files.math.includes('playSfx("math_ok"'), "T5 no direct ok");
assert(!files.math.includes('playSfx("math_fail"'), "T5 no direct fail");

// T6 integrate
assert(files.math.includes("playAnswerExitFx"), "T6 exit fx");
assert(files.math.includes("playMathAnswerFx"), "T6 calls fx");
assert(files.battle.includes("targetUid: target && target.uid"), "T6 targetUid");
assert(files.css.includes("is-fx-out"), "T6 css");
assert(files.final.includes("T6"), "final doc");
assert(files.acceptance.includes("passed"), "acceptance json");

for (const f of ["js/fx.js", "js/math-challenge.js", "js/battle.js"]) {
  try {
    new Function(fs.readFileSync(f, "utf8"));
    console.log("OK syntax", f);
  } catch (e) {
    console.error("FAIL syntax", f, e.message);
    process.exitCode = 1;
  }
}

if (process.exitCode) {
  console.error("MATH_ANSWER_FX_FINAL_FAIL");
  process.exit(1);
}
console.log("MATH_ANSWER_FX_FINAL_OK");
console.log(path.resolve("docs/math-answer-fx-acceptance.json"));
