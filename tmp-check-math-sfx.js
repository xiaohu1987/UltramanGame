const fs = require("fs");
const m = fs.readFileSync("js/math-challenge.js", "utf8");
const f = fs.readFileSync("js/fx.js", "utf8");

const checks = {
  finishNoDirectOk: !m.includes('playSfx("math_ok"'),
  finishNoDirectFail: !m.includes('playSfx("math_fail"'),
  dedupeComment: m.includes("playMathAnswerFx"),
  mathOkInCorrect: f.includes('this.sfx("math_ok"'),
  mathFailInWrong: f.includes('this.sfx("math_fail"'),
  hitSfx: f.includes('this.sfx("hit"'),
  sfxFly: f.includes("sfxFly"),
  crackNoise: f.includes("playNoise({ dur: 0.05"),
};

let ok = true;
for (const [k, v] of Object.entries(checks)) {
  console.log(k, v ? "OK" : "FAIL");
  if (!v) ok = false;
}
if (!ok) process.exit(1);
console.log("T5 sfx checks OK");
