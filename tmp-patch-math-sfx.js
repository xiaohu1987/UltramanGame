const fs = require("fs");
const p = "js/math-challenge.js";
let s = fs.readFileSync(p, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";

const needle = [
  "        const mod = buildResolveModifier(cfg.id, correct);",
  "        if (correct) playSfx(\"math_ok\", 1);",
  "        else playSfx(\"math_fail\", 1);",
  "        closeModal({",
].join(nl);

const insert = [
  "        const mod = buildResolveModifier(cfg.id, correct);",
  "        // 音效改由 ArcadeFX.playMathAnswerFx 按阶段触发，避免双重播放",
  "        closeModal({",
].join(nl);

if (!s.includes(needle)) {
  console.error("needle missing");
  process.exit(1);
}
if (s.includes("音效改由 ArcadeFX.playMathAnswerFx")) {
  console.log("already patched");
  process.exit(0);
}
s = s.replace(needle, insert);
fs.writeFileSync(p, s);
console.log("math-challenge sfx dedupe patched");
