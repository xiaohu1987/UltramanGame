const fs = require("fs");
const h = fs.readFileSync("index.html", "utf8");
const s = fs.readFileSync("css/select-ui.css", "utf8");
const l = fs.readFileSync("css/layout-fit.css", "utf8");
const checks = {
  compactClass: h.includes("difficulty-picker--compact"),
  compactCss: s.includes(".difficulty-picker--compact"),
  compactFlex: s.includes(".difficulty-picker--compact") && s.includes("display: flex"),
  shortBtn: s.includes("min-height: 32px"),
  grid4: l.includes("grid-template-rows: auto auto auto minmax(0, 1fr)"),
  layoutCompact: l.includes("#screen-select .difficulty-picker--compact"),
  stillHasOptions: h.includes('id="difficulty-options"'),
  stillHasDesc: h.includes('id="difficulty-desc"'),
};
console.log(JSON.stringify(checks, null, 2));
console.log(Object.values(checks).every(Boolean) ? "T4_COMPACT_OK" : "T4_FAIL");
if (!Object.values(checks).every(Boolean)) process.exitCode = 1;
