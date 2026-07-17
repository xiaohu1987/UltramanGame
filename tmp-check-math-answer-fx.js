const fs = require("fs");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("OK:", msg);
  }
}

const fx = fs.readFileSync("js/fx.js", "utf8");
const math = fs.readFileSync("js/math-challenge.js", "utf8");
const battle = fs.readFileSync("js/battle.js", "utf8");
const css = fs.readFileSync("css/math-challenge.css", "utf8");

// API
assert(fx.includes("playMathAnswerFx"), "fx playMathAnswerFx");
assert(fx.includes("playMathCorrectFx"), "fx playMathCorrectFx");
assert(fx.includes("playMathWrongFx"), "fx playMathWrongFx");
assert(fx.includes('stage = "gather"') || fx.includes('stage: "gather"'), "correct gather");
assert(fx.includes('stage = "fly"') || fx.includes('stage: "fly"'), "correct fly");
assert(fx.includes('stage = "hit"') || fx.includes('stage: "hit"'), "correct hit");
assert(fx.includes('stage = "darken"') || fx.includes('stage: "darken"'), "wrong darken");
assert(fx.includes('stage = "crack"') || fx.includes('stage: "crack"'), "wrong crack");
assert(fx.includes('stage = "fade"') || fx.includes('stage: "fade"'), "wrong fade");

// sfx sync
assert(fx.includes('this.sfx("math_ok"'), "sfx math_ok in fx");
assert(fx.includes('this.sfx("math_fail"'), "sfx math_fail in fx");
assert(fx.includes('this.sfx("hit"'), "sfx hit in fx");
assert(fx.includes("sfxFly"), "sfx fly whoosh");
assert(!math.includes('playSfx("math_ok"'), "math no direct math_ok");
assert(!math.includes('playSfx("math_fail"'), "math no direct math_fail");

// integration
assert(math.includes("playAnswerExitFx"), "math playAnswerExitFx");
assert(math.includes("playMathAnswerFx"), "math calls playMathAnswerFx");
assert(math.includes("targetUid"), "math stores targetUid");
assert(math.includes("finishing"), "math finishing lock");
assert(battle.includes("targetUid: target && target.uid"), "battle passes targetUid");
assert(battle.includes("actorUid: actor && actor.uid"), "battle passes actorUid");
assert(css.includes("is-fx-out"), "css is-fx-out");
assert(css.includes("is-fx-playing"), "css is-fx-playing");

// syntax
for (const f of ["js/fx.js", "js/math-challenge.js", "js/battle.js"]) {
  try {
    new Function(fs.readFileSync(f, "utf8"));
    console.log("OK: syntax", f);
  } catch (e) {
    console.error("FAIL: syntax", f, e.message);
    process.exitCode = 1;
  }
}

if (process.exitCode) {
  console.error("T6 checks FAILED");
  process.exit(1);
}
console.log("T6_MATH_ANSWER_FX_OK");
