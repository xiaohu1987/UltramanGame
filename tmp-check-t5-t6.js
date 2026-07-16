const fs = require("fs");
const ui = fs.readFileSync("js/ui.js", "utf8");
const main = fs.readFileSync("js/main.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("css/select-ui.css", "utf8");

const checks = {
  btnRandomDom: html.includes("btn-random"),
  selectCssLink: html.includes("css/select-ui.css"),
  progressDom: html.includes("select-progress-fill"),
  btnRandomEls: ui.includes("btnRandom"),
  onRandomBind: ui.includes("handlers.onRandom"),
  selectProgress: ui.includes("selectProgressFill"),
  randomSelect: main.includes("function randomSelect"),
  onRandomMain: main.includes("onRandom: randomSelect"),
  accentCss: css.includes(".btn.ghost.accent"),
  selectCardGlow: css.includes(".select-card-glow"),
};

console.log(JSON.stringify(checks, null, 2));
console.log("PASS", Object.values(checks).every(Boolean));
