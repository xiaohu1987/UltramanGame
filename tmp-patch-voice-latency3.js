const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "js", "math-challenge.js");
const htmlFile = path.join(__dirname, "index.html");
let s = fs.readFileSync(file, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";

const startMark = "  // ---------- 提醒语音（Web Speech API） ----------";
const endMark = "  function stopUrgencyLoop() {";
const start = s.indexOf(startMark);
const end = s.indexOf(endMark);
if (start < 0 || end < 0 || end <= start) {
  throw new Error("speech block markers not found");
}

const speechBlock = [
  "  // ---------- 提醒语音（Web Speech API） ----------",
  "  let tipSpeechToken = 0;",
  "  let tipSpeechUtterance = null;",
  "  let tipSpeechVoices = [];",
  "  let tipSpeechVoiceReady = false;",
  "  let tipSpeechPrimed = false;",
  "  let tipSpeechKeepAlive = 0;",
  "  let tipSpeechWatchdog = 0;",
  "  let tipSpeechQueue = [];",
  "  let tipPreferredVoiceURI = \"\";",
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
  "  function scoreChineseVoice(v) {",
  "    if (!v) return -999;",
  "    const lang = String(v.lang || \"\").toLowerCase();",
  "    const name = String(v.name || \"\").toLowerCase();",
  "    const uri = String(v.voiceURI || \"\").toLowerCase();",
  "    let n = 0;",
  "    // 本地音色优先：在线神经音色常要等几秒才出声",
  "    if (v.localService) n += 260;",
  "    else n -= 80;",
  "    if (lang === \"zh-cn\" || lang === \"zh_cn\") n += 120;",
  "    else if (lang.startsWith(\"zh-cn\") || lang.startsWith(\"zh_cn\")) n += 110;",
  "    else if (lang.startsWith(\"zh\")) n += 90;",
  "    else if (lang.includes(\"cmn\")) n += 80;",
  "    else return -1;",
  "    if (name.includes(\"desktop\") || uri.includes(\"desktop\")) n += 50;",
  "    if (name.includes(\"huihui\") || name.includes(\"yaoyao\") || name.includes(\"kangkang\")) n += 35;",
  "    if (name.includes(\"google\") && name.includes(\"中文\")) n += 30;",
  "    if (name.includes(\"普通话\") || name.includes(\"mandarin\") || name.includes(\"chinese\") || name.includes(\"中文\")) n += 25;",
  "    // 在线 neural 往往更慢，本地优先后才考虑",
  "    if (!v.localService && (name.includes(\"online\") || name.includes(\"neural\") || name.includes(\"natural\"))) n -= 40;",
  "    if (name.includes(\"xiaoxiao\") || name.includes(\"yunxi\") || name.includes(\"yunyang\")) n += 8;",
  "    if (name.includes(\"female\") || name.includes(\"girl\") || name.includes(\"child\") || name.includes(\"kid\")) n += 12;",
  "    return n;",
  "  }",
  "",
  "  function pickChineseVoice() {",
  "    const voices = tipSpeechVoices.length ? tipSpeechVoices : refreshTipSpeechVoices();",
  "    if (!voices.length) return null;",
  "    if (tipPreferredVoiceURI) {",
  "      const remembered = voices.find((v) => v && v.voiceURI === tipPreferredVoiceURI);",
  "      if (remembered && scoreChineseVoice(remembered) > 0) return remembered;",
  "    }",
  "    let best = null;",
  "    let bestScore = 0;",
  "    for (let i = 0; i < voices.length; i++) {",
  "      const sc = scoreChineseVoice(voices[i]);",
  "      if (sc > bestScore) {",
  "        bestScore = sc;",
  "        best = voices[i];",
  "      }",
  "    }",
  "    if (best && best.voiceURI) tipPreferredVoiceURI = best.voiceURI;",
  "    return bestScore > 0 ? best : null;",
  "  }",
  "",
  "  function clearTipSpeechTimers() {",
  "    if (tipSpeechKeepAlive) {",
  "      clearInterval(tipSpeechKeepAlive);",
  "      tipSpeechKeepAlive = 0;",
  "    }",
  "    if (tipSpeechWatchdog) {",
  "      clearTimeout(tipSpeechWatchdog);",
  "      tipSpeechWatchdog = 0;",
  "    }",
  "  }",
  "",
  "  function stopMathTipSpeech() {",
  "    tipSpeechToken += 1;",
  "    tipSpeechUtterance = null;",
  "    tipSpeechQueue = [];",
  "    clearTipSpeechTimers();",
  "    if (!window.speechSynthesis) return;",
  "    try {",
  "      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {",
  "        window.speechSynthesis.cancel();",
  "      }",
  "    } catch (e) {",
  "      /* ignore */",
  "    }",
  "  }",
  "",
  "  function resumeTipSpeechEngine() {",
  "    if (!window.speechSynthesis) return;",
  "    try {",
  "      if (window.speechSynthesis.paused) window.speechSynthesis.resume();",
  "    } catch (e) {",
  "      /* ignore */",
  "    }",
  "  }",
  "",
  "  /** 弹窗打开时预热：拉本地语音 + 静音唤醒，避免首次点击卡几秒 */",
  "  function warmMathTipSpeech() {",
  "    if (!window.speechSynthesis) return;",
  "    refreshTipSpeechVoices();",
  "    resumeTipSpeechEngine();",
  "    pickChineseVoice();",
  "    if (tipSpeechPrimed || typeof window.SpeechSynthesisUtterance !== \"function\") return;",
  "    // 仅在用户手势链路里真正 speak 预热更稳；这里只做轻量准备",
  "    // 若已有本地音色，标记可直接用",
  "    const v = pickChineseVoice();",
  "    if (v && v.localService) {",
  "      tipSpeechPrimed = true;",
  "      return;",
  "    }",
  "    // 无本地音色时也标记，避免反复空转；真正 speak 时再兜底",
  "    tipSpeechPrimed = true;",
  "  }",
  "",
  "  /** 用户点击提醒时的强预热：在同一用户手势里唤醒引擎 */",
  "  function primeMathTipSpeechOnGesture() {",
  "    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== \"function\") return;",
  "    refreshTipSpeechVoices();",
  "    resumeTipSpeechEngine();",
  "    try {",
  "      // 空 utterance 在用户手势中 speak，比页面加载时预热更有效",
  "      const warm = new window.SpeechSynthesisUtterance(\"\");",
  "      warm.volume = 0;",
  "      warm.rate = 2;",
  "      warm.lang = \"zh-CN\";",
  "      const v = pickChineseVoice();",
  "      if (v && v.localService) warm.voice = v;",
  "      // 不 cancel：让空句自然结束，避免 Chrome cancel 后卡顿",
  "      window.speechSynthesis.speak(warm);",
  "    } catch (e) {",
  "      /* ignore */",
  "    }",
  "  }",
  "",
  "  function buildMathTipSpeechChunks(tip, question) {",
  "    if (!tip) return [];",
  "    const title = String(tip.title || \"小提示\").trim();",
  "    const original = String((tip.originalText || (question && question.text) || \"\").replace(/\\s*=\\s*\\?\\s*$/, \"\")).trim();",
  "    const rewrite = String((tip.rewrittenText || \"\").replace(/\\s*=\\s*\\?\\s*$/, \"\").replace(/\\s*=\\s*\\d+\\s*$/, \"\")).trim();",
  "    const steps = Array.isArray(tip.steps) ? tip.steps.filter(Boolean) : [];",
  "    const chunks = [];",
  "    // 第一句极短：先出声，再播后续步骤",
  "    chunks.push(\"提醒\");",
  "    if (title) chunks.push(title);",
  "    if (rewrite && rewrite !== original && rewrite !== tip.originalText) {",
  "      chunks.push(\"想成 \" + rewrite);",
  "    } else if (original) {",
  "      chunks.push(original);",
  "    }",
  "    steps.forEach((line, i) => {",
  "      chunks.push(\"第\" + (i + 1) + \"步，\" + String(line).trim());",
  "    });",
  "    return chunks.map((c) => String(c || \"\").trim()).filter(Boolean);",
  "  }",
  "",
  "  function buildMathTipSpeechText(tip, question) {",
  "    return buildMathTipSpeechChunks(tip, question).join(\"。\") + (tip ? \"。\" : \"\");",
  "  }",
  "",
  "  function makeUtterance(text, voice, opts) {",
  "    const utter = new window.SpeechSynthesisUtterance(text);",
  "    utter.lang = \"zh-CN\";",
  "    utter.rate = (opts && opts.rate) || 1.12;",
  "    utter.pitch = (opts && opts.pitch) || 1.04;",
  "    utter.volume = (opts && typeof opts.volume === \"number\") ? opts.volume : 1;",
  "    // 只绑本地音色；在线音色宁可不用，避免等云端",
  "    if (voice && voice.localService) utter.voice = voice;",
  "    return utter;",
  "  }",
  "",
  "  function speakNextTipChunk(token) {",
  "    if (token !== tipSpeechToken) return;",
  "    if (!window.speechSynthesis) return;",
  "    if (!tipSpeechQueue.length) {",
  "      tipSpeechUtterance = null;",
  "      clearTipSpeechTimers();",
  "      return;",
  "    }",
  "    const text = tipSpeechQueue.shift();",
  "    const voice = pickChineseVoice();",
  "    const utter = makeUtterance(text, voice, { rate: tipSpeechQueue.length ? 1.14 : 1.1 });",
  "    tipSpeechUtterance = utter;",
  "    utter.onend = () => {",
  "      if (token !== tipSpeechToken) return;",
  "      speakNextTipChunk(token);",
  "    };",
  "    utter.onerror = () => {",
  "      if (token !== tipSpeechToken) return;",
  "      // 出错时跳过本句继续，避免整段卡死",
  "      speakNextTipChunk(token);",
  "    };",
  "    resumeTipSpeechEngine();",
  "    try {",
  "      window.speechSynthesis.speak(utter);",
  "    } catch (e) {",
  "      speakNextTipChunk(token);",
  "    }",
  "  }",
  "",
  "  function armTipSpeechWatchdog(token, fullText) {",
  "    clearTimeout(tipSpeechWatchdog);",
  "    // 若 350ms 内还没开始出声，立刻用默认音色整段重试（绕过坏 voice / 卡死队列）",
  "    tipSpeechWatchdog = setTimeout(() => {",
  "      tipSpeechWatchdog = 0;",
  "      if (token !== tipSpeechToken) return;",
  "      if (!window.speechSynthesis) return;",
  "      resumeTipSpeechEngine();",
  "      if (window.speechSynthesis.speaking) return;",
  "      // pending 但未 speaking：清队列后用最短路径重试",
  "      try {",
  "        window.speechSynthesis.cancel();",
  "      } catch (e) {",
  "        /* ignore */",
  "      }",
  "      tipSpeechQueue = [];",
  "      const retry = makeUtterance(fullText || \"提醒\", null, { rate: 1.15 });",
  "      // 强制不指定 voice，走系统默认，通常本地更快",
  "      tipSpeechUtterance = retry;",
  "      try {",
  "        window.speechSynthesis.speak(retry);",
  "      } catch (e) {",
  "        /* ignore */",
  "      }",
  "    }, 350);",
  "  }",
  "",
  "  function speakMathTip(tip, question) {",
  "    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== \"function\") {",
  "      return false;",
  "    }",
  "    const chunks = buildMathTipSpeechChunks(tip, question);",
  "    if (!chunks.length) return false;",
  "    const fullText = chunks.join(\"。\") + \"。\";",
  "",
  "    // 换 token，停旧语音；但尽量在同一点击手势里立刻 speak",
  "    stopMathTipSpeech();",
  "    const token = ++tipSpeechToken;",
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
  "    resumeTipSpeechEngine();",
  "    pickChineseVoice();",
  "",
  "    // Chrome 偶发 speaking 卡住：播报期间周期性 resume",
  "    clearInterval(tipSpeechKeepAlive);",
  "    tipSpeechKeepAlive = setInterval(() => {",
  "      if (token !== tipSpeechToken) {",
  "        clearTipSpeechTimers();",
  "        return;",
  "      }",
  "      resumeTipSpeechEngine();",
  "    }, 4000);",
  "",
  "    // 分句播放：第一句极短，点击后尽快出声",
  "    tipSpeechQueue = chunks.slice();",
  "    speakNextTipChunk(token);",
  "    armTipSpeechWatchdog(token, fullText);",
  "    return true;",
  "  }",
  "",
].join(nl) + nl;

s = s.slice(0, start) + speechBlock + s.slice(end);

// showMathTip: keep speak first (already), ensure no extra work before it
// Also prime on tip button click path if we can find tip button handler
const tipClickPatterns = [
  /tipBtn\.onclick\s*=\s*\([^)]*\)\s*=>\s*\{/,
  /tipBtn\.addEventListener\(\s*[\"']click[\"']/,
  /#math-challenge-tip-btn/,
];

// Inject prime + speak order already ok. Add primeMathTipSpeechOnGesture before speak in showMathTip
const showSpeakOld = [
  "    // 先开讲，再播动画/音效，避免语音被拖到后面",
  "    speakMathTip(tip, question);",
].join(nl);
const showSpeakNew = [
  "    // 先开讲，再播动画/音效；同一点击手势内唤醒语音引擎",
  "    primeMathTipSpeechOnGesture();",
  "    speakMathTip(tip, question);",
].join(nl);
if (!s.includes(showSpeakOld)) {
  // maybe already partially changed
  if (!s.includes("primeMathTipSpeechOnGesture()")) {
    const alt = "    speakMathTip(tip, question);";
    const idx = s.indexOf("function showMathTip");
    const speakIdx = s.indexOf(alt, idx);
    if (speakIdx < 0) throw new Error("showMathTip speak call not found");
    s = s.slice(0, speakIdx) + showSpeakNew + s.slice(speakIdx + alt.length);
  }
} else {
  s = s.replace(showSpeakOld, showSpeakNew);
}

// Export new helpers if needed
if (!s.includes("primeMathTipSpeechOnGesture,")) {
  s = s.replace(
    "    warmMathTipSpeech,",
    "    warmMathTipSpeech," + nl + "    primeMathTipSpeechOnGesture,"
  );
}
if (!s.includes("buildMathTipSpeechChunks,")) {
  s = s.replace(
    "    buildMathTipSpeechText,",
    "    buildMathTipSpeechText," + nl + "    buildMathTipSpeechChunks,"
  );
}

// Also warm on first user interaction with tip button via event capture if handler exists
// Find tip button click wiring
const tipHandlerRe = /(const tipBtn = root\.querySelector\("#math-challenge-tip-btn"\);\s*if \(tipBtn\) \{[\s\S]{0,400}?tipBtn\.(?:onclick|addEventListener))/;
// Look for where tip is triggered
if (!s.includes("showMathTip(root, question)")) {
  throw new Error("showMathTip call site missing");
}

// Ensure init still warms voices
if (!s.includes("setTimeout(warmMathTipSpeech, 0)")) {
  // ok if missing
}

fs.writeFileSync(file, s);
console.log("patched speech engine, new len", s.length);

// bump cache
let html = fs.readFileSync(htmlFile, "utf8");
const html2 = html.replace(/math-challenge\.js\?v=[^\"]+/, "math-challenge.js?v=math-tip-voice-3");
if (html2 === html) {
  // try already voice-2
  console.log("html cache replace check", /math-challenge\.js\?v=[^\"]+/.exec(html));
}
fs.writeFileSync(htmlFile, html2);
console.log("cache", (html2.match(/math-challenge\.js\?v=[^\"]+/) || [])[0]);
