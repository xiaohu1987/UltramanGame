const fs = require("fs");
const code = fs.readFileSync("js/math-challenge.js", "utf8");
const localStorage = {
  store: {},
  getItem(k) {
    return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null;
  },
  setItem(k, v) {
    this.store[k] = String(v);
  },
};
const document = {
  createElement() {
    return {
      setAttribute() {},
      querySelector() {
        return null;
      },
      classList: { add() {}, remove() {}, toggle() {} },
      appendChild() {},
    };
  },
  body: { appendChild() {} },
  getElementById() {
    return null;
  },
  addEventListener() {},
  removeEventListener() {},
};
const windowObj = { localStorage, ArcadeFX: null };
const performance = { now: () => 0 };
const fn = new Function(
  "window",
  "document",
  "performance",
  code + "\nreturn window.MathChallenge;"
);
const MC = fn(windowObj, document, performance);

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const qAdd = MC.generateQuestion(10, (() => {
  let i = 0;
  const seq = [0.1, 0.4, 0.2]; // op +, a, b
  return () => seq[i++ % seq.length];
})());
assert(qAdd.op === "+", "expect +");
assert(qAdd.answer === qAdd.a + qAdd.b, "add answer");

const qSub = MC.generateQuestion(10, (() => {
  let i = 0;
  const seq = [0.9, 0.8, 0.2]; // op -, a, b-ratio
  return () => seq[i++ % seq.length];
})());
assert(qSub.op === "-", "expect -");
assert(qSub.a >= qSub.b, "non-negative sub");
assert(qSub.answer === qSub.a - qSub.b, "sub answer");
assert(qSub.answer >= 0, "answer >=0");

assert(MC.judgeAnswer(String(qAdd.answer), qAdd.answer) === true, "judge ok");
assert(MC.judgeAnswer("  ", qAdd.answer) === false, "empty fail");
assert(MC.judgeAnswer("x", qAdd.answer) === false, "non-number fail");
assert(MC.getDifficulty("easy").enabled === false, "easy off");
assert(MC.getDifficulty("hell").max === 100, "hell max");
assert(MC.buildResolveModifier("normal", true).powerMul === 1.05, "bonus");
assert(MC.buildResolveModifier("normal", false).forceMiss === true, "miss");
assert(MC.saveDifficultyId("hard") === "hard", "save");
assert(MC.loadDifficultyId() === "hard", "load");
assert(MC.listDifficulties().length === 4, "four tiers");
console.log("math-challenge checks OK");
