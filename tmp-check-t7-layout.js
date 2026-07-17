const fs = require("fs");
const html = fs.readFileSync("index.html", "utf8");
const selectCss = fs.readFileSync("css/select-ui.css", "utf8");
const layoutCss = fs.readFileSync("css/layout-fit.css", "utf8");
const ui = fs.readFileSync("js/ui.js", "utf8");
const main = fs.readFileSync("js/main.js", "utf8");

const checks = {
  modalDom: html.includes('id="difficulty-modal"') && html.includes("btn-difficulty-confirm"),
  compactClass: html.includes("difficulty-picker--compact"),
  compactCss: selectCss.includes(".difficulty-picker--compact") && selectCss.includes("min-height: 32px"),
  modalCssFixed: selectCss.includes(".difficulty-modal") && selectCss.includes("position: fixed") && selectCss.includes("z-index: 90"),
  modalHidden: selectCss.includes(".difficulty-modal[hidden]"),
  grid4: layoutCss.includes("grid-template-rows: auto auto auto minmax(0, 1fr)"),
  openEveryEnter: main.includes("enterSelectScreen") && main.includes("UI.openDifficultyModal(difficultyId)"),
  restartOpens: /function restart\([\s\S]*enterSelectScreen\(\);/.test(main),
  compactSync: ui.includes("els.difficultyOptions.addEventListener") && ui.includes("function setDifficultyUi"),
  confirmSync: ui.includes("onDifficultyConfirm") && main.includes("onDifficultyConfirm: setDifficulty"),
  startBtn: html.includes('id="btn-start"'),
  selectedSlots: html.includes('id="selected-slots"'),
  heroGrid: html.includes('id="hero-grid"'),
};

console.log(JSON.stringify(checks, null, 2));
const ok = Object.values(checks).every(Boolean);
console.log(ok ? "T7_LAYOUT_STATIC_OK" : "T7_FAIL");
if (!ok) process.exitCode = 1;
