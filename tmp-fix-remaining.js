const fs = require("fs");

// battle difficulty field
{
  const p = "js/battle.js";
  let t = fs.readFileSync(p, "utf8");
  if (!t.includes("this.difficulty =")) {
    const needle = "      this.autoBattle = !!options.autoBattle;\r\n      this.resolveDelay = options.resolveDelay || 900;";
    const needle2 = "      this.autoBattle = !!options.autoBattle;\n      this.resolveDelay = options.resolveDelay || 900;";
    const insert =
      "      this.autoBattle = !!options.autoBattle;\n" +
      "      this.difficulty =\n" +
      "        window.MathChallenge && window.MathChallenge.isDifficultyId(options.difficulty)\n" +
      "          ? options.difficulty\n" +
      "          : (window.MathChallenge && window.MathChallenge.DEFAULT_DIFFICULTY) || \"easy\";\n" +
      "      this.resolveDelay = options.resolveDelay || 900;";
    if (t.includes(needle)) t = t.replace(needle, insert);
    else if (t.includes(needle2)) t = t.replace(needle2, insert);
    else {
      // fallback loose
      t = t.replace(
        /this\.autoBattle = !!options\.autoBattle;\r?\n\s*this\.resolveDelay = options\.resolveDelay \|\| 900;/,
        insert
      );
    }
    fs.writeFileSync(p, t, "utf8");
  }
  console.log("battle difficulty", fs.readFileSync(p, "utf8").includes("this.difficulty ="));
}

// fx sfx with CRLF-aware replace
{
  const p = "js/fx.js";
  let t = fs.readFileSync(p, "utf8");
  if (!t.includes('case "urgency"')) {
    const re =
      /case "defeat":\r?\n\s*this\.playTone\(\{ freq: 300, dur: 0\.16, type: "sawtooth", gain: 0\.12 \* i, slide: -120 \}\);\r?\n\s*this\.playTone\(\{ freq: 180, dur: 0\.22, type: "square", gain: 0\.1 \* i, delay: 0\.1, slide: -80 \}\);\r?\n\s*break;\r?\n\s*default:/;
    const replacement = `case "defeat":
          this.playTone({ freq: 300, dur: 0.16, type: "sawtooth", gain: 0.12 * i, slide: -120 });
          this.playTone({ freq: 180, dur: 0.22, type: "square", gain: 0.1 * i, delay: 0.1, slide: -80 });
          break;
        case "urgency":
          this.playTone({ freq: 880, dur: 0.05, type: "square", gain: 0.08 * i, slide: 40 });
          this.playTone({ freq: 660, dur: 0.06, type: "triangle", gain: 0.07 * i, delay: 0.03, slide: -80 });
          this.playNoise({ dur: 0.03, gain: 0.04 * i, delay: 0.01 });
          break;
        case "math_ok":
          this.playTone({ freq: 523, dur: 0.07, type: "triangle", gain: 0.1 * i, slide: 120 });
          this.playTone({ freq: 784, dur: 0.09, type: "sine", gain: 0.09 * i, delay: 0.05, slide: 160 });
          this.playTone({ freq: 1046, dur: 0.1, type: "triangle", gain: 0.07 * i, delay: 0.1 });
          break;
        case "math_fail":
          this.playNoise({ dur: 0.06, gain: 0.1 * i });
          this.playTone({ freq: 240, dur: 0.1, type: "sawtooth", gain: 0.12 * i, slide: -120 });
          this.playTone({ freq: 140, dur: 0.14, type: "square", gain: 0.1 * i, delay: 0.05, slide: -60 });
          break;
        default:`;
    if (!re.test(t)) {
      console.error("fx pattern not found");
      process.exit(1);
    }
    t = t.replace(re, replacement);
    fs.writeFileSync(p, t, "utf8");
  }
  console.log("fx urgency", fs.readFileSync(p, "utf8").includes('case "urgency"'));
}
