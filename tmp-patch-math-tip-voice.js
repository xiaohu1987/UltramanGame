const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "js", "math-challenge.js");
let s = fs.readFileSync(file, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";

if (s.includes("function speakMathTip")) {
  console.log("already patched");
  process.exit(0);
}

function block(lines) {
  return lines.join(nl) + nl;
}

const speechBlock = block([
  "  // ---------- 提醒语音（Web Speech API） ----------",
  "  let tipSpeechToken = 0;",
  "  let tipSpeechUtterance = null;",
  "  let tipSpeechVoices = [];",
  "  let tipSpeechVoiceReady = false;",
  "",
  "  function refreshTipSpeechVoices() {",
  "    if (!window.speechSynthesis) return [];",
  "    try {",
  "      tipSpeechVoices = window.speechSynthesis.getVoices() || [];",
  "    } catch (e) {",
  "      tipSpeechVoices = [];",
  "    }",
  "    tipSpeechVoiceReady = tipSpeechVoices.length > 0;",
  "    return tipSpeechVoices;",
  "  }",
  "",
  "  function pickChineseVoice() {",
  "    const voices = refreshTipSpeechVoices();",
  "    if (!voices.length) return null;",
  "    const score = (v) => {",
  '      const lang = String(v.lang || "").toLowerCase();',
  '      const name = String(v.name || "").toLowerCase();',
  "      let n = 0;",
  '      if (lang === "zh-cn" || lang === "zh_cn") n += 120;',
  '      else if (lang.startsWith("zh-cn") || lang.startsWith("zh_cn")) n += 110;',
  '      else if (lang.startsWith("zh")) n += 90;',
  '      else if (lang.includes("cmn")) n += 80;',
  '      if (name.includes("xiaoxiao") || name.includes("yaoyao") || name.includes("huihui")) n += 40;',
  '      if (name.includes("female") || name.includes("girl") || name.includes("child") || name.includes("kid")) n += 20;',
  '      if (name.includes("chinese") || name.includes("mandarin") || name.includes("中文") || name.includes("普通话")) n += 25;',
  '      if (name.includes("natural") || name.includes("neural")) n += 10;',
  "      return n;",
  "    };",
  "    let best = null;",
  "    let bestScore = 0;",
  "    for (let i = 0; i < voices.length; i++) {",
  "      const sc = score(voices[i]);",
  "      if (sc > bestScore) {",
  "        bestScore = sc;",
  "        best = voices[i];",
  "      }",
  "    }",
  "    return bestScore > 0 ? best : null;",
  "  }",
  "",
  "  function stopMathTipSpeech() {",
  "    tipSpeechToken += 1;",
  "    tipSpeechUtterance = null;",
  "    if (!window.speechSynthesis) return;",
  "    try {",
  "      window.speechSynthesis.cancel();",
  "    } catch (e) {",
  "      /* ignore */",
  "    }",
  "  }",
  "",
  "  function buildMathTipSpeechText(tip, question) {",
  '    if (!tip) return "";',
  '    const title = String(tip.title || "小提示").trim();',
  '    const original = String((tip.originalText || (question && question.text) || "").replace(/\\s*=\\s*\\?\\s*$/, "")).trim();',
  '    const rewrite = String((tip.rewrittenText || "").replace(/\\s*=\\s*\\?\\s*$/, "").replace(/\\s*=\\s*\\d+\\s*$/, "")).trim();',
  "    const steps = Array.isArray(tip.steps) ? tip.steps.filter(Boolean) : [];",
  "    const parts = [];",
  '    parts.push("提醒。" + title + "。");',
  '    if (original) parts.push("原题是 " + original + "。");',
  "    if (rewrite && rewrite !== original && rewrite !== tip.originalText) {",
  '      parts.push("可以想成 " + rewrite + "。");',
  "    }",
  "    steps.forEach((line, i) => {",
  '      parts.push("第" + (i + 1) + "步，" + String(line).trim() + "。");',
  "    });",
  "    return parts.join(\"\");",
  "  }",
  "",
  "  function speakMathTip(tip, question) {",
  "    stopMathTipSpeech();",
  "    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== \"function\") {",
  "      return false;",
  "    }",
  "    const text = buildMathTipSpeechText(tip, question);",
  "    if (!text) return false;",
  "",
  "    // 用户点击「提醒」时解锁音频；顺带预热语音列表",
  '    if (window.ArcadeFX && typeof window.ArcadeFX.unlockAudio === "function") {',
  "      try {",
  "        window.ArcadeFX.unlockAudio();",
  "      } catch (e) {",
  "        /* ignore */",
  "      }",
  "    }",
  "    refreshTipSpeechVoices();",
  "",
  "    const token = tipSpeechToken;",
  "    const utter = new window.SpeechSynthesisUtterance(text);",
  '    utter.lang = "zh-CN";',
  "    utter.rate = 0.92;",
  "    utter.pitch = 1.08;",
  "    utter.volume = 1;",
  "    const voice = pickChineseVoice();",
  "    if (voice) utter.voice = voice;",
  "    tipSpeechUtterance = utter;",
  "",
  "    const startSpeak = () => {",
  "      if (token !== tipSpeechToken) return;",
  "      try {",
  "        // 部分浏览器 cancel 后需短暂延迟再 speak",
  "        window.speechSynthesis.cancel();",
  "      } catch (e) {",
  "        /* ignore */",
  "      }",
  "      setTimeout(() => {",
  "        if (token !== tipSpeechToken) return;",
  "        try {",
  "          window.speechSynthesis.speak(utter);",
  "        } catch (e) {",
  "          /* ignore */",
  "        }",
  "      }, 40);",
  "    };",
  "",
  "    // Chrome 首次 getVoices 可能为空，等 voiceschanged",
  "    if (!tipSpeechVoiceReady && window.speechSynthesis) {",
  "      const onVoices = () => {",
  "        refreshTipSpeechVoices();",
  "        if (token !== tipSpeechToken) return;",
  "        const v = pickChineseVoice();",
  "        if (v) utter.voice = v;",
  "        startSpeak();",
  "      };",
  "      try {",
  '        window.speechSynthesis.addEventListener("voiceschanged", onVoices, { once: true });',
  "      } catch (e) {",
  "        // 旧浏览器",
  "        window.speechSynthesis.onvoiceschanged = onVoices;",
  "      }",
  "      // 兜底：即使没有 voiceschanged 也开讲",
  "      setTimeout(() => {",
  "        if (token !== tipSpeechToken) return;",
  "        if (!tipSpeechUtterance) return;",
  "        startSpeak();",
  "      }, 180);",
  "      return true;",
  "    }",
  "",
  "    startSpeak();",
  "    return true;",
  "  }",
  "",
]);

const playSfxRe = /function playSfx\(name, intensity\) \{\r?\n    if \(window\.ArcadeFX && typeof window\.ArcadeFX\.sfx === "function"\) \{\r?\n      window\.ArcadeFX\.sfx\(name, intensity\);\r?\n    \}\r?\n  \}\r?\n\r?\n  function stopUrgencyLoop\(\) \{/;
if (!playSfxRe.test(s)) {
  console.error("playSfx block not found");
  process.exit(1);
}
s = s.replace(
  playSfxRe,
  `function playSfx(name, intensity) {${nl}    if (window.ArcadeFX && typeof window.ArcadeFX.sfx === "function") {${nl}      window.ArcadeFX.sfx(name, intensity);${nl}    }${nl}  }${nl}${nl}${speechBlock}  function stopUrgencyLoop() {`
);

const clearRe = /function clearTipUi\(root\) \{\r?\n    if \(!root\) return;/;
if (!clearRe.test(s)) {
  console.error("clearTipUi not found");
  process.exit(1);
}
s = s.replace(
  clearRe,
  `function clearTipUi(root) {${nl}    stopMathTipSpeech();${nl}    if (!root) return;`
);

const showRe =
  /if \(window\.ArcadeFX && typeof window\.ArcadeFX\.flashScreen === "function"\) \{\r?\n      window\.ArcadeFX\.flashScreen\(0\.12, "120,200,255"\);\r?\n    \}\r?\n\r?\n    setTimeout\(\(\) => \{\r?\n      panel\.classList\.remove\("is-animating"\);\r?\n    \}, 900\);\r?\n\r?\n    return tip;\r?\n  \}/;
if (!showRe.test(s)) {
  console.error("showMathTip end not found");
  process.exit(1);
}
s = s.replace(
  showRe,
  `if (window.ArcadeFX && typeof window.ArcadeFX.flashScreen === "function") {${nl}      window.ArcadeFX.flashScreen(0.12, "120,200,255");${nl}    }${nl}${nl}    // 语音朗读提醒步骤（点击提醒后触发，兼容浏览器自动播放策略）${nl}    speakMathTip(tip, question);${nl}${nl}    setTimeout(() => {${nl}      panel.classList.remove("is-animating");${nl}    }, 900);${nl}${nl}    return tip;${nl}  }`
);

const finishRe =
  /if \(input\) input\.disabled = true;\r?\n        if \(submitBtn\) submitBtn\.disabled = true;\r?\n        if \(tipBtn\) tipBtn\.disabled = true;\r?\n        if \(form\) form\.onsubmit = null;/;
if (!finishRe.test(s)) {
  console.error("finish lock not found");
  process.exit(1);
}
s = s.replace(
  finishRe,
  `stopMathTipSpeech();${nl}        if (input) input.disabled = true;${nl}        if (submitBtn) submitBtn.disabled = true;${nl}        if (tipBtn) tipBtn.disabled = true;${nl}        if (form) form.onsubmit = null;`
);

const exportRe = /buildMathTip,\r?\n    isDamageSkillType,/;
if (!exportRe.test(s)) {
  console.error("exports not found");
  process.exit(1);
}
s = s.replace(
  exportRe,
  `buildMathTip,${nl}    speakMathTip,${nl}    stopMathTipSpeech,${nl}    buildMathTipSpeechText,${nl}    isDamageSkillType,`
);

const beforeExportRe = /window\.MathChallenge = \{/;
if (!beforeExportRe.test(s)) {
  console.error("beforeExport not found");
  process.exit(1);
}
s = s.replace(
  beforeExportRe,
  `if (window.speechSynthesis) {${nl}    try {${nl}      refreshTipSpeechVoices();${nl}      window.speechSynthesis.addEventListener("voiceschanged", refreshTipSpeechVoices);${nl}    } catch (e) {${nl}      try {${nl}        window.speechSynthesis.onvoiceschanged = refreshTipSpeechVoices;${nl}      } catch (e2) {${nl}        /* ignore */${nl}      }${nl}    }${nl}  }${nl}${nl}  window.MathChallenge = {`
);

fs.writeFileSync(file, s, "utf8");
console.log("math-challenge voice patched", s.length);

const indexPath = path.join(__dirname, "index.html");
let html = fs.readFileSync(indexPath, "utf8");
html = html.replace(
  /js\/math-challenge\.js\?v=[^"]+/,
  "js/math-challenge.js?v=math-tip-voice-1"
);
fs.writeFileSync(indexPath, html, "utf8");
console.log("index cache bust updated");
