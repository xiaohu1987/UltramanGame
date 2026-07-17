const fs = require("fs");
const checks = {
  htmlDiff: fs.readFileSync("index.html", "utf8").includes("difficulty-picker"),
  htmlCss: fs.readFileSync("index.html", "utf8").includes("math-challenge.css"),
  htmlJs: fs.readFileSync("index.html", "utf8").includes("math-challenge.js"),
  mainDiff: fs.readFileSync("js/main.js", "utf8").includes("difficulty: difficultyId"),
  battleResolve: fs.readFileSync("js/battle.js", "utf8").includes("promptChallenge"),
  battleApply: fs.readFileSync("js/battle.js", "utf8").includes("forceMiss || forceFail"),
  fx: fs.readFileSync("js/fx.js", "utf8").includes('case "urgency"'),
  ui: fs.readFileSync("js/ui.js", "utf8").includes("setDifficultyUi"),
  cssPick: fs.readFileSync("css/select-ui.css", "utf8").includes("difficulty-picker"),
  cssModal: fs.readFileSync("css/math-challenge.css", "utf8").includes("is-urgent"),
  storage: fs.readFileSync("js/math-challenge.js", "utf8").includes("ultraman.difficulty"),
};
console.log(JSON.stringify(checks, null, 2));
if (!Object.values(checks).every(Boolean)) process.exit(1);
console.log("ALL_OK");
