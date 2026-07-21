const fs = require("fs");
const path = "js/math-challenge.js";
let s = fs.readFileSync(path, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";

function norm(x) {
  return x.replace(/\r\n/g, "\n");
}

const start = s.indexOf("  // ---------- 提醒语音（Web Speech API） ----------");
const end = s.indexOf("  function stopUrgencyLoop()");
if (start < 0 || end < 0) {
  throw new Error("speech block markers not found: " + start + " " + end);
}

const newBlock = [
  "  // ---------- 提醒语音（Web Speech API） ----------",
  "  let tipSpeechToken = 0;",
  "  let tipSpeechUtterance = null;",
  "  let tipSpeechVoices = [];",
  "  let tipSpeechVoiceReady = false;",
  "  let tipSpeechPrimed = false;",
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
  "    const voices = tipSpeechVoices.length ? tipSpeechVoices : refreshTipSpeechVoices();",
  "    if (!voices.length) return null;",
  "    const score = (v) => {",
  "      const lang = String(v.lang || \"\").toLowerCase();",
  "      const name = String(v.name || \"\").toLowerCase();",
  "      let n = 0;",
  "      if (lang === \"zh-cn\" || lang === \"zh_cn\") n += 120;",
  "      else if (lang.startsWith(\"zh-cn\") || lang.startsWith(\"zh_cn\")) n += 110;",
  "      else if (lang.startsWith(\"zh\")) n += 90;",
  "      else if (lang.includes(\"cmn\")) n += 80;",
  "      if (name.includes(\"xiaoxiao\") || name.includes(\"yaoyao\") || name.includes(\"huihui\")) n += 40;",
  "      if (name.includes(\"female\") || name.includes(\"girl\") || name.includes(\"child\") || name.includes(\"kid\")) n += 20;",
  "      if (name.includes(\"chinese\") || name.includes(\"mandarin\") || name.includes(\"中文\") || name.includes(\"普通话\")) n += 25;",
  "      if (name.includes(\"natural\") || name.includes(\"neural\")) n += 10;",
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
  "  /** 弹窗打开时预热：拉语音列表 + resume，避免首次点击卡几秒 */",
  "  function warmMathTipSpeech() {",
  "    if (!window.speechSynthesis) return;",
  "    refreshTipSpeechVoices();",
  "    try {",
  "      if (window.speechSynthesis.paused) window.speechSynthesis.resume();",
  "    } catch (e) {",
  "      /* ignore */",
  "    }",
  "    // 仅预热一次：极短静音 utterance，立刻 cancel，唤醒引擎",
  "    if (tipSpeechPrimed || typeof window.SpeechSynthesisUtterance !== \"function\") return;",
  "    tipSpeechPrimed = true;",
  "    try {",
  "      const warm = new window.SpeechSynthesisUtterance(\" \");",
  "      warm.volume = 0.01;",
  "      warm.rate = 2;",
  "      warm.lang = \"zh-CN\";",
  "      const v = pickChineseVoice();",
  "      if (v) warm.voice = v;",
  "      window.speechSynthesis.speak(warm);",
  "      window.speechSynthesis.cancel();",
  "    } catch (e) {",
  "      /* ignore */",
  "    }",
  "  }",
  "",
  "  function buildMathTipSpeechText(tip, question) {",
  "    if (!tip) return \"\";",
  "    const title = String(tip.title || \"小提示\").trim();",
  "    const original = String((tip.originalText || (question && question.text) || \"\").replace(/\\s*=\\s*\\?\\s*$/, \"\")).trim();",
  "    const rewrite = String((tip.rewrittenText || \"\").replace(/\\s*=\\s*\\?\\s*$/, \"\").replace(/\\s*=\\s*\\d+\\s*$/, \"\")).trim();",
  "    const steps = Array.isArray(tip.steps) ? tip.steps.filter(Boolean) : [];",
  "    const parts = [];",
  "    // 更短开场，尽快进入步骤，避免占满答题时间",
  "    parts.push(\"提醒。\" + title + \"。\");",
  "    if (rewrite && rewrite !== original && rewrite !== tip.originalText) {",
  "      parts.push(\"想成 \" + rewrite + \"。\");",
  "    } else if (original) {",
  "      parts.push(original + \"。\");",
  "    }",
  "    steps.forEach((line, i) => {",
  "      parts.push(\"第\" + (i + 1) + \"步，\" + String(line).trim() + \"。\");",
  "    });",
  "    return parts.join(\"\");",
  "  }",
  "",
  "  function speakMathTip(tip, question) {",
  "    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== \"function\") {",
  "      return false;",
  "    }",
  "    const text = buildMathTipSpeechText(tip, question);",
  "    if (!text) return false;",
  "",
  "    // 先停旧语音并换 token，再立刻 speak（不再等 voices / 不再 setTimeout）",
  "    stopMathTipSpeech();",
  "    const token = tipSpeechToken;",
  "",
  "    if (window.ArcadeFX && typeof window.ArcadeFX.unlockAudio === \"function\") {",
  "      try {",
  "        window.ArcadeFX.unlockAudio();",
  "      } catch (e) {",
  "        /* ignore */",
  "      }",
  "    }",
  "",
  "    refreshTipSpeechVoices();",
  "    try {",
  "      if (window.speechSynthesis.paused) window.speechSynthesis.resume();",
  "    } catch (e) {",
  "      /* ignore */",
  "    }",
  "",
  "    const utter = new window.SpeechSynthesisUtterance(text);",
  "    utter.lang = \"zh-CN\";",
  "    utter.rate = 1.02;",
  "    utter.pitch = 1.05;",
  "    utter.volume = 1;",
  "    const voice = pickChineseVoice();",
  "    if (voice) utter.voice = voice;",
  "    tipSpeechUtterance = utter;",
  "",
  "    // 语音列表晚到时只补 voice，不重播，避免“等几秒才开始”",
  "    if (!voice && window.speechSynthesis) {",
  "      const onVoices = () => {",
  "        if (token !== tipSpeechToken || !tipSpeechUtterance) return;",
  "        refreshTipSpeechVoices();",
  "        const v = pickChineseVoice();",
  "        if (v) tipSpeechUtterance.voice = v;",
  "      };",
  "      try {",
  "        window.speechSynthesis.addEventListener(\"voiceschanged\", onVoices, { once: true });",
  "      } catch (e) {",
  "        window.speechSynthesis.onvoiceschanged = onVoices;",
  "      }",
  "    }",
  "",
  "    try {",
  "      // 同步立刻开讲：点击提醒后马上出声",
  "      window.speechSynthesis.speak(utter);",
  "    } catch (e) {",
  "      return false;",
  "    }",
  "    return true;",
  "  }",
  "",
  "",
].join(nl);

s = s.slice(0, start) + newBlock + s.slice(end);

// 先语音，再动画
const reShow = /if \(tip\.morph\) \{\s*renderQuestionWithMorph\(qEl, question, tip\);\s*playSfx\("buff", 0\.85\);\s*\} else \{\s*renderQuestionPlain\(qEl, tip\.originalText \|\| question\.text\);\s*playSfx\("select", 0\.8\);\s*\}\s*if \(window\.ArcadeFX && typeof window\.ArcadeFX\.flashScreen === "function"\) \{\s*window\.ArcadeFX\.flashScreen\(0\.12, "120,200,255"\);\s*\}\s*\/\/[^\n]*\s*speakMathTip\(tip, question\);/;
if (!reShow.test(s)) {
  // fallback exact CRLF block
  const oldShow = [
    "    if (tip.morph) {",
    "      renderQuestionWithMorph(qEl, question, tip);",
    "      playSfx(\"buff\", 0.85);",
    "    } else {",
    "      renderQuestionPlain(qEl, tip.originalText || question.text);",
    "      playSfx(\"select\", 0.8);",
    "    }",
    "",
    "    if (window.ArcadeFX && typeof window.ArcadeFX.flashScreen === \"function\") {",
    "      window.ArcadeFX.flashScreen(0.12, \"120,200,255\");",
    "    }",
    "",
    "    // 语音朗读提醒步骤（点击提醒后触发，兼容浏览器自动播放策略）",
    "    speakMathTip(tip, question);",
  ].join(nl);
  if (!s.includes(oldShow)) {
    const i = s.indexOf("if (tip.morph)");
    console.log("near show:", JSON.stringify(s.slice(i, i + 500)));
    throw new Error("showMathTip speech order block not found");
  }
  const newShow = [
    "    // 先开讲，再播动画/音效，避免语音被拖到后面",
    "    speakMathTip(tip, question);",
    "",
    "    if (tip.morph) {",
    "      renderQuestionWithMorph(qEl, question, tip);",
    "      playSfx(\"buff\", 0.85);",
    "    } else {",
    "      renderQuestionPlain(qEl, tip.originalText || question.text);",
    "      playSfx(\"select\", 0.8);",
    "    }",
    "",
    "    if (window.ArcadeFX && typeof window.ArcadeFX.flashScreen === \"function\") {",
    "      window.ArcadeFX.flashScreen(0.12, \"120,200,255\");",
    "    }",
  ].join(nl);
  s = s.replace(oldShow, newShow);
} else {
  s = s.replace(
    reShow,
    [
      "// 先开讲，再播动画/音效，避免语音被拖到后面",
      "    speakMathTip(tip, question);",
      "",
      "    if (tip.morph) {",
      "      renderQuestionWithMorph(qEl, question, tip);",
      "      playSfx(\"buff\", 0.85);",
      "    } else {",
      "      renderQuestionPlain(qEl, tip.originalText || question.text);",
      "      playSfx(\"select\", 0.8);",
      "    }",
      "",
      "    if (window.ArcadeFX && typeof window.ArcadeFX.flashScreen === \"function\") {",
      "      window.ArcadeFX.flashScreen(0.12, \"120,200,255\");",
      "    }",
    ].join(nl)
  );
}

const warmNeedle = ["    clearTipUi(root);", "    if (qEl) renderQuestionPlain(qEl, question.text);"].join(nl);
const warmRepl = [
  "    clearTipUi(root);",
  "    warmMathTipSpeech();",
  "    if (qEl) renderQuestionPlain(qEl, question.text);",
].join(nl);
if (!s.includes(warmNeedle)) throw new Error("promptChallenge warm insert point not found");
s = s.replace(warmNeedle, warmRepl);

const exportNeedle = [
  "    speakMathTip,",
  "    stopMathTipSpeech,",
  "    buildMathTipSpeechText,",
].join(nl);
const exportRepl = [
  "    speakMathTip,",
  "    stopMathTipSpeech,",
  "    warmMathTipSpeech,",
  "    buildMathTipSpeechText,",
].join(nl);
if (!s.includes("warmMathTipSpeech,")) {
  if (!s.includes(exportNeedle)) throw new Error("export block not found");
  s = s.replace(exportNeedle, exportRepl);
}

const bootNeedle = [
  "  if (window.speechSynthesis) {",
  "    try {",
  "      refreshTipSpeechVoices();",
  "      window.speechSynthesis.addEventListener(\"voiceschanged\", refreshTipSpeechVoices);",
  "    } catch (e) {",
  "      try {",
  "        window.speechSynthesis.onvoiceschanged = refreshTipSpeechVoices;",
  "      } catch (e2) {",
  "        /* ignore */",
  "      }",
  "    }",
  "  }",
].join(nl);
const bootRepl = [
  "  if (window.speechSynthesis) {",
  "    try {",
  "      refreshTipSpeechVoices();",
  "      window.speechSynthesis.addEventListener(\"voiceschanged\", refreshTipSpeechVoices);",
  "      // 页面加载后尽快拉语音，减少首次提醒延迟",
  "      setTimeout(warmMathTipSpeech, 0);",
  "    } catch (e) {",
  "      try {",
  "        window.speechSynthesis.onvoiceschanged = refreshTipSpeechVoices;",
  "      } catch (e2) {",
  "        /* ignore */",
  "      }",
  "    }",
  "  }",
].join(nl);
if (!s.includes(bootNeedle)) throw new Error("boot speech block not found");
s = s.replace(bootNeedle, bootRepl);

fs.writeFileSync(path, s);
console.log("patched speech latency, new len", s.length);

let html = fs.readFileSync("index.html", "utf8");
if (html.includes("math-challenge.js?v=math-tip-voice-1")) {
  html = html.replace("math-challenge.js?v=math-tip-voice-1", "math-challenge.js?v=math-tip-voice-2");
} else if (!html.includes("math-tip-voice-2")) {
  html = html.replace(/math-challenge\.js\?v=[^"]+/, "math-challenge.js?v=math-tip-voice-2");
}
fs.writeFileSync("index.html", html);
console.log("cache", (html.match(/math-challenge\.js\?v=[^"]+/) || [])[0]);
