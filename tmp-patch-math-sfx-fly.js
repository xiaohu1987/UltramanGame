const fs = require("fs");
const p = "js/fx.js";
let s = fs.readFileSync(p, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";

// Add sfxFly flag and whoosh at fly stage start
if (s.includes("sfxFly")) {
  console.log("fly sfx already present");
} else {
  const flagNeedle = [
    "        hitFired: false,",
    "        sfxGather: false,",
    "        sfxHit: false,",
  ].join(nl);
  const flagInsert = [
    "        hitFired: false,",
    "        sfxGather: false,",
    "        sfxFly: false,",
    "        sfxHit: false,",
  ].join(nl);
  if (!s.includes(flagNeedle)) {
    console.error("flag needle missing");
    process.exit(1);
  }
  s = s.replace(flagNeedle, flagInsert);

  const flyNeedle = [
    "        } else if (t <= fEnd) {",
    "          fx.stage = \"fly\";",
    "          const p = this.easeInOutCubic((t - oEnd) / fx.flyDur);",
  ].join(nl);
  const flyInsert = [
    "        } else if (t <= fEnd) {",
    "          fx.stage = \"fly\";",
    "          if (!fx.sfxFly) {",
    "            // light whoosh when orb launches",
    "            this.playNoise({ dur: 0.06, gain: 0.05 });",
    "            this.playTone({ freq: 520, dur: 0.08, type: \"sine\", gain: 0.05, slide: 180 });",
    "            fx.sfxFly = true;",
    "          }",
    "          const p = this.easeInOutCubic((t - oEnd) / fx.flyDur);",
  ].join(nl);
  if (!s.includes(flyNeedle)) {
    console.error("fly needle missing");
    process.exit(1);
  }
  s = s.replace(flyNeedle, flyInsert);
}

// Ensure crack noise only once via flag (already gated by cracked)
// Document sfx map comment near playMathAnswerFx
const docNeedle = "     * 答错：变黑 → 裂开 → 消失";
const docInsert = [
  "     * 答错：变黑 → 裂开 → 消失",
  "     * 音效阶段：",
  "     *  - 答对 gather: math_ok；fly: whoosh；hit: hit",
  "     *  - 答错 darken: math_fail；crack: noise",
].join(nl);
if (s.includes(docNeedle) && !s.includes("音效阶段：")) {
  s = s.replace(docNeedle, docInsert);
}

fs.writeFileSync(p, s);
try {
  new Function(s);
  console.log("sfx stage sync patched, syntax OK");
} catch (e) {
  console.error("syntax FAIL", e.message);
  process.exit(1);
}
