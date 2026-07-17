const fs = require("fs");
const ui = fs.readFileSync("js/ui.js", "utf8");
const main = fs.readFileSync("js/main.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");

const checks = {
  modalDom: html.includes('id="difficulty-modal"'),
  compactBar: html.includes("difficulty-picker--compact"),
  uiEls: ui.includes("difficultyModal:") && ui.includes("btnDifficultyConfirm:"),
  openFn: ui.includes("function openDifficultyModal"),
  closeFn: ui.includes("function closeDifficultyModal"),
  setUi: ui.includes("function setDifficultyUi"),
  pending: ui.includes("pendingDifficultyId"),
  confirmBind: ui.includes("onDifficultyConfirm"),
  compactBind: ui.includes("els.difficultyOptions.addEventListener"),
  exportOpen: ui.includes("openDifficultyModal,"),
  enterSelect: main.includes("function enterSelectScreen"),
  openOnEnter: main.includes("UI.openDifficultyModal(difficultyId)"),
  restartEnter: /function restart\([\s\S]*enterSelectScreen\(\);/.test(main),
  initEnter: main.includes("enterSelectScreen();"),
  setDifficulty: main.includes("function setDifficulty") && main.includes("saveDifficultyId"),
  passEngine: main.includes("difficulty: difficultyId"),
  storageKey: fs.readFileSync("js/math-challenge.js", "utf8").includes("ultraman.difficulty"),
};

console.log(JSON.stringify(checks, null, 2));
const ok = Object.values(checks).every(Boolean);
console.log(ok ? "T5_LOGIC_OK" : "T5_FAIL");
if (!ok) process.exitCode = 1;
