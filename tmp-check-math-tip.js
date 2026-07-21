const fs = require("fs");
const vm = require("vm");

const js = fs.readFileSync("js/math-challenge.js", "utf8");
const css = fs.readFileSync("css/math-challenge.css", "utf8");
const html = fs.readFileSync("index.html", "utf8");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(js.includes("function buildMathTip"), "buildMathTip");
assert(js.includes("math-challenge-tip-btn"), "tip button");
assert(js.includes("renderQuestionWithMorph"), "morph render");
assert(js.includes("pair5-a"), "pair5 strategy");
assert(css.includes(".math-tip-panel"), "tip panel css");
assert(css.includes(".math-token-num.is-splitting"), "split css");
assert(html.includes("math-challenge.js?v=math-tip-voice-1"), "js cache");
assert(html.includes("math-challenge.css?v=math-tip-1"), "css cache");

const sandbox = {
  window: {},
  document: {
    createElement: () => ({
      style: {},
      classList: { add() {}, remove() {} },
      setAttribute() {},
      appendChild() {},
      querySelector() {
        return null;
      },
      textContent: "",
    }),
    body: { appendChild() {} },
    getElementById() {
      return null;
    },
    addEventListener() {},
    removeEventListener() {},
  },
  performance: { now: () => 0 },
  requestAnimationFrame: () => 0,
  cancelAnimationFrame() {},
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  console,
};
vm.createContext(sandbox);
vm.runInContext(js, sandbox);
const MC = sandbox.window.MathChallenge;

const tip1 = MC.buildMathTip({ a: 7, b: 5, op: "+", max: 10 });
assert(tip1.rewrittenText === "2 + 5 + 5 = ?", "7+5 rewrite");
assert(tip1.morph && tip1.morph.from === 7 && tip1.morph.parts.join("+") === "2+5", "7+5 morph");

const tip2 = MC.buildMathTip({ a: 7, b: 5, op: "-", max: 10 });
assert(tip2.rewrittenText === "2 + 5 - 5 = ?", "7-5 rewrite");
assert(tip2.morph && tip2.morph.parts.join("+") === "2+5", "7-5 morph");

const tip3 = MC.buildMathTip({ a: 8, b: 6, op: "+", max: 10 });
assert(tip3.reason === "make10-b", "8+6 make10");
assert(tip3.rewrittenText === "8 + 2 + 4 = ?", "8+6 rewrite");

console.log("math-tip checks OK");
