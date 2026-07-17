const fs = require("fs");
const battle = fs.readFileSync("js/battle.js", "utf8");
const fx = fs.readFileSync("js/fx.js", "utf8");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("OK", msg);
  }
}

assert(battle.includes("result.skipSkillFx = true"), "battle sets skipSkillFx");
assert(battle.includes('modifier.reason !== "skip"'), "only after math challenge");
assert(fx.includes("if (result.skipSkillFx)"), "fx respects skipSkillFx");
assert(fx.includes('showFloatGlobal(result.missed ? "MISS" : "FAIL"'), "fail aftermath float");
assert(fx.includes('this.showFloatGlobal("FAIL!", "debuff"'), "wrong fx FAIL float");
assert(fx.includes('this.showFloatGlobal("MISS", "debuff"'), "wrong fx MISS float");
assert(fx.includes("this.shakeScreen(10, 360)"), "stronger fail shake");
assert(fx.includes('this.flashScreen(0.38, "90,20,30")'), "red fail flash");
assert(fx.includes("this.hitStopFor(70)"), "fail hitstop");
assert(fx.includes("fx.cracks = []"), "crack lines state");
assert(fx.includes("fail crack lines") || fx.includes("fx.cracks && fx.cracks.length"), "draw cracks");
assert(fx.includes("const DARKEN = 0.34"), "longer darken");
assert(fx.includes("const CRACK = 0.56"), "longer crack");
assert(fx.includes("const FADE = 0.34"), "longer fade");
assert(fx.includes("Math.max(28, Math.round(42 * this.perfScale))"), "more fail shards");
assert(!fx.includes("playMathFailAftermath"), "no missing helper call");
assert(!fx.includes("__noopMathWrongBoost"), "no placeholder method");

if (!process.exitCode) console.log("SKIP_SKILL_FX_OK");
