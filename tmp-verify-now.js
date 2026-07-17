const fs = require("fs");
const path = require("path");

const required = [
  "docs/difficulty-integration-map.md",
  "docs/difficulty-delivery-final.md",
  "docs/difficulty-verify-report.json",
  "js/math-challenge.js",
  "css/math-challenge.css",
  "js/battle.js",
  "js/main.js",
  "js/ui.js",
  "js/fx.js",
  "index.html",
  "css/select-ui.css",
];

const missing = required.filter((p) => !fs.existsSync(p));
if (missing.length) {
  console.error("MISSING", missing);
  process.exit(1);
}

const math = fs.readFileSync("js/math-challenge.js", "utf8");
const battle = fs.readFileSync("js/battle.js", "utf8");
const main = fs.readFileSync("js/main.js", "utf8");
const ui = fs.readFileSync("js/ui.js", "utf8");
const fx = fs.readFileSync("js/fx.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");
const cssModal = fs.readFileSync("css/math-challenge.css", "utf8");
const cssSelect = fs.readFileSync("css/select-ui.css", "utf8");

const checks = {
  difficultyModel: /DIFFICULTIES[\s\S]*easy[\s\S]*normal[\s\S]*hard[\s\S]*hell/.test(math),
  generateQuestion: math.includes("function generateQuestion"),
  judgeAnswer: math.includes("function judgeAnswer"),
  promptChallenge: math.includes("function promptChallenge"),
  storage: math.includes("ultraman.difficulty"),
  pickerHtml: html.includes("difficulty-picker") && html.includes('data-difficulty="hell"'),
  pickerCss: cssSelect.includes(".difficulty-picker"),
  modalCss: cssModal.includes(".math-modal") && cssModal.includes("is-urgent"),
  uiBind: ui.includes("setDifficultyUi") && ui.includes("onDifficultyChange"),
  mainPass: main.includes("difficulty: difficultyId") && main.includes("onDifficultyChange"),
  battleIntercept: battle.includes("promptChallenge") && battle.includes("actor.side === \"hero\""),
  battleModifier: battle.includes("applySkill(actor, skill, target, modifier = {})") && battle.includes("forceMiss || forceFail"),
  fxUrgency: fx.includes('case "urgency"') && fx.includes('case "math_ok"') && fx.includes('case "math_fail"'),
  scripts: html.includes("math-challenge.js") && html.includes("math-challenge.css"),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
if (failed.length) {
  console.error("FAILED_CHECKS", failed);
  process.exit(1);
}

// syntax
for (const f of ["js/math-challenge.js", "js/battle.js", "js/main.js", "js/ui.js", "js/fx.js"]) {
  try {
    new Function(fs.readFileSync(f, "utf8"));
  } catch (e) {
    console.error("SYNTAX_FAIL", f, e.message);
    process.exit(1);
  }
}

console.log("NOW_VERIFY_OK");
console.log(JSON.stringify(checks, null, 2));
