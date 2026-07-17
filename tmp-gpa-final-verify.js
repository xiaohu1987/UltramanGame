const fs = require("fs");
const { execSync } = require("child_process");

function run(cmd) {
  return execSync(cmd, { encoding: "utf8" });
}

const out = {
  t3: run("node tmp-check-t3-modal.js"),
  t4: run("node tmp-check-t4-compact.js"),
  t5: run("node tmp-check-t5-modal-logic.js"),
  t7: run("node tmp-check-t7-layout.js"),
  difficulty: run("node tmp-verify-difficulty.js"),
};

const flags = {
  t3: out.t3.includes("T3_DOM_CSS_OK"),
  t4: out.t4.includes("T4_COMPACT_OK"),
  t5: out.t5.includes("T5_LOGIC_OK"),
  t7: out.t7.includes("T7_LAYOUT_STATIC_OK"),
  difficulty: out.difficulty.includes("VERIFY_OK"),
  modal: fs.readFileSync("index.html", "utf8").includes("difficulty-modal"),
  compact: fs.readFileSync("index.html", "utf8").includes("difficulty-picker--compact"),
  enter: fs.readFileSync("js/main.js", "utf8").includes("enterSelectScreen"),
  open: fs.readFileSync("js/ui.js", "utf8").includes("openDifficultyModal"),
  grid4: fs.readFileSync("css/layout-fit.css", "utf8").includes("auto auto auto minmax(0, 1fr)"),
};

console.log(JSON.stringify(flags, null, 2));
if (!Object.values(flags).every(Boolean)) {
  console.log("GPA_FINAL_FAIL");
  process.exit(1);
}
console.log("GPA_FINAL_OK");
fs.writeFileSync(
  "docs/difficulty-popup-verify-result.json",
  JSON.stringify({ ok: true, flags, at: "2026-07-17" }, null, 2)
);
