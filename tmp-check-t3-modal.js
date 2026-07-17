const fs = require("fs");
const h = fs.readFileSync("index.html", "utf8");
const c = fs.readFileSync("css/select-ui.css", "utf8");
const checks = {
  modalDom: h.includes('id="difficulty-modal"'),
  options: h.includes('id="difficulty-modal-options"'),
  confirm: h.includes('id="btn-difficulty-confirm"'),
  four: (h.match(/class="difficulty-modal-option/g) || []).length >= 4,
  easy: h.includes('data-difficulty="easy"'),
  hell: h.includes('data-difficulty="hell"'),
  cssModal: c.includes(".difficulty-modal"),
  cssHidden: c.includes(".difficulty-modal[hidden]"),
  cssCard: c.includes(".difficulty-modal-card"),
  cssOpt: c.includes(".difficulty-modal-option"),
  cssFixed: c.includes("position: fixed") && c.includes("z-index: 90"),
  noLayoutFlow: c.includes(".difficulty-modal[hidden]") && c.includes("display: none !important"),
};
console.log(JSON.stringify(checks, null, 2));
if (!Object.values(checks).every(Boolean)) {
  process.exitCode = 1;
  console.log("T3_FAIL");
} else {
  console.log("T3_DOM_CSS_OK");
}
