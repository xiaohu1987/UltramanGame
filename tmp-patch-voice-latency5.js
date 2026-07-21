const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "js", "math-challenge.js");
const htmlFile = path.join(__dirname, "index.html");
let s = fs.readFileSync(file, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";

// 1) Precompute tip when challenge opens, so click only speaks
// Find activeSession init and add tipPrebuilt
if (!s.includes("tipPrebuilt: null")) {
  const old = [
    "        tipUsed: false,",
    "        tip: null,",
  ].join(nl);
  const neu = [
    "        tipUsed: false,",
    "        tip: null,",
    "        tipPrebuilt: null,",
  ].join(nl);
  if (!s.includes(old)) throw new Error("activeSession tip fields not found");
  s = s.replace(old, neu);
}

// After warmMathTipSpeech in promptChallenge, prebuild tip
const warmLine = "    warmMathTipSpeech();";
const warmIdx = s.indexOf(warmLine);
if (warmIdx < 0) throw new Error("warmMathTipSpeech call not found");
// only first occurrence in promptChallenge area - check nearby
const afterWarm = s.slice(warmIdx, warmIdx + 200);
if (!afterWarm.includes("tipPrebuilt")) {
  // insert after warm + question render block start
  // We'll insert right after warmMathTipSpeech();
  const insert = [
    "    warmMathTipSpeech();",
    "    // 预先算好提醒文案，点击时只负责开讲，减少首句延迟",
    "    const prebuiltTip = buildMathTip(question);",
  ].join(nl);
  s = s.replace(warmLine, insert);

  // store into session after activeSession created
  const sessTip = "        tipPrebuilt: null,";
  if (!s.includes(sessTip)) throw new Error("tipPrebuilt field missing after insert");
  // After activeSession = { ... }; assign prebuilt
  const assignMarker = "        actorUid: options.actorUid || null," + nl + "      };";
  if (!s.includes(assignMarker)) {
    // try without exact
    const m = s.indexOf("actorUid: options.actorUid || null,");
    if (m < 0) throw new Error("actorUid field not found");
    const close = s.indexOf("};", m);
    // insert assignment after activeSession object
    const afterObj = s.indexOf("};", m) + 2;
    s = s.slice(0, afterObj) + nl + "      activeSession.tipPrebuilt = prebuiltTip;" + s.slice(afterObj);
  } else {
    s = s.replace(
      assignMarker,
      "        actorUid: options.actorUid || null," + nl + "      };" + nl + "      activeSession.tipPrebuilt = prebuiltTip;"
    );
  }
}

// 2) showMathTip uses prebuilt tip if available
const showOldStart = "  function showMathTip(root, question) {" + nl + "    const tip = buildMathTip(question);";
const showNewStart = [
  "  function showMathTip(root, question, prebuiltTip) {",
  "    const tip = prebuiltTip || (activeSession && activeSession.tipPrebuilt) || buildMathTip(question);",
].join(nl);
if (s.includes(showOldStart)) {
  s = s.replace(showOldStart, showNewStart);
} else if (!s.includes("function showMathTip(root, question, prebuiltTip)")) {
  // maybe already partially
  const i = s.indexOf("function showMathTip(root, question)");
  if (i < 0) throw new Error("showMathTip signature not found");
  s = s.replace(
    "function showMathTip(root, question) {" + nl + "    const tip = buildMathTip(question);",
    "function showMathTip(root, question, prebuiltTip) {" + nl + "    const tip = prebuiltTip || (activeSession && activeSession.tipPrebuilt) || buildMathTip(question);"
  );
}

// 3) tip click: speak FIRST with prebuilt, then UI
const tipClickOld = [
  "        tipBtn.onclick = (event) => {",
  "          if (event) event.preventDefault();",
  "          if (!activeSession || activeSession.closed || activeSession.finishing) return;",
  "          if (activeSession.tipUsed) return;",
  "          const tip = showMathTip(root, question);",
  "          activeSession.tipUsed = true;",
  "          activeSession.tip = tip;",
  "          if (input && !input.disabled) input.focus();",
  "        };",
].join(nl);

const tipClickNew = [
  "        tipBtn.onclick = (event) => {",
  "          if (event) event.preventDefault();",
  "          if (!activeSession || activeSession.closed || activeSession.finishing) return;",
  "          if (activeSession.tipUsed) return;",
  "          activeSession.tipUsed = true;",
  "          // 点击当下立刻开讲（用预构建 tip），再刷新 UI",
  "          const tip = activeSession.tipPrebuilt || buildMathTip(question);",
  "          primeMathTipSpeechOnGesture();",
  "          speakMathTip(tip, question);",
  "          activeSession.tip = showMathTip(root, question, tip);",
  "          if (input && !input.disabled) input.focus();",
  "        };",
].join(nl);

if (s.includes(tipClickOld)) {
  s = s.replace(tipClickOld, tipClickNew);
} else {
  // flexible
  const re = /tipBtn\.onclick = \(event\) => \{[\s\S]*?if \(input && !input\.disabled\) input\.focus\(\);\s*\};/;
  if (!re.test(s)) throw new Error("tipBtn.onclick not found for replace");
  s = s.replace(re, tipClickNew.trim().replace(/^        /gm, "").split(nl).map((l, i) => (i === 0 ? l : "        " + l)).join(nl).replace(/^tipBtn/, "tipBtn"));
  // This is messy - do index based instead if needed
}

// If showMathTip still speaks, double-speak would happen. Remove speak from showMathTip when already spoken.
// Better: showMathTip accepts option skipSpeak, or detect tip already speaking.
// Simplest: remove speak from showMathTip entirely; only click path speaks.
const showSpeakBlock = [
  "    // 语音优先：先出声，再画面板/动画（减少体感延迟）",
  "    primeMathTipSpeechOnGesture();",
  "    speakMathTip(tip, question);",
  "",
].join(nl);

if (s.includes(showSpeakBlock)) {
  s = s.replace(showSpeakBlock, "    // 语音由 tip 按钮点击路径触发；这里只负责 UI" + nl + nl);
} else {
  // try remove individual lines inside showMathTip
  const showStart = s.indexOf("function showMathTip");
  const showEnd = s.indexOf("function isDamageSkillType", showStart);
  let showBody = s.slice(showStart, showEnd);
  if (showBody.includes("speakMathTip(tip, question)")) {
    showBody = showBody
      .replace(/\s*primeMathTipSpeechOnGesture\(\);\s*/g, nl)
      .replace(/\s*speakMathTip\(tip, question\);\s*/g, nl)
      .replace(/\/\/ 语音优先[^\n]*\n/, "")
      .replace(/\/\/ 先开讲[^\n]*\n/, "");
    s = s.slice(0, showStart) + showBody + s.slice(showEnd);
  }
}

// Ensure tip click has speak - if previous flexible replace failed
if (!s.includes("speakMathTip(tip, question);")) {
  throw new Error("no speakMathTip call left - bad");
}
if (!s.includes("activeSession.tipPrebuilt") && !s.includes("tipPrebuilt:")) {
  throw new Error("prebuilt not wired");
}

// Fix tip click if double or broken
if (!s.includes("const tip = activeSession.tipPrebuilt || buildMathTip(question);")) {
  // inject into onclick
  const oc = s.indexOf("tipBtn.onclick = (event) => {");
  if (oc < 0) throw new Error("onclick missing");
  const showCall = s.indexOf("showMathTip(root, question)", oc);
  if (showCall < 0) throw new Error("showMathTip call in onclick missing");
  // replace the onclick body carefully
  const endOc = s.indexOf("};", showCall);
  const block = s.slice(oc, endOc + 2);
  const newBlock = [
    "tipBtn.onclick = (event) => {",
    "          if (event) event.preventDefault();",
    "          if (!activeSession || activeSession.closed || activeSession.finishing) return;",
    "          if (activeSession.tipUsed) return;",
    "          activeSession.tipUsed = true;",
    "          const tip = activeSession.tipPrebuilt || buildMathTip(question);",
    "          primeMathTipSpeechOnGesture();",
    "          speakMathTip(tip, question);",
    "          activeSession.tip = showMathTip(root, question, tip);",
    "          if (input && !input.disabled) input.focus();",
    "        };",
  ].join(nl);
  s = s.slice(0, oc) + newBlock + s.slice(endOc + 2);
}

// 4) speakMathTip: first chunk with NO voice for max speed, then continue
// Replace makeUtterance usage in speakNextTipChunk for first chunk
// Simpler: change speakMathTip to immediately speak first short chunk with default voice before queue

const speakFnStart = s.indexOf("  function speakMathTip(tip, question) {");
const speakFnEnd = s.indexOf("  function stopUrgencyLoop() {", speakFnStart);
if (speakFnStart < 0 || speakFnEnd < 0) throw new Error("speakMathTip bounds");

const speakFn = [
  "  function speakMathTip(tip, question) {",
  "    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== \"function\") {",
  "      return false;",
  "    }",
  "    const chunks = buildMathTipSpeechChunks(tip, question);",
  "    if (!chunks.length) return false;",
  "    const fullText = chunks.join(\"。\") + \"。\";",
  "",
  "    // 关键：不要无脑 cancel。若当前没在播，只作废旧 token。",
  "    const busy = !!(window.speechSynthesis.speaking || window.speechSynthesis.pending);",
  "    if (busy) {",
  "      stopMathTipSpeech();",
  "    } else {",
  "      softStopMathTipSpeech();",
  "    }",
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
  "    const localVoice = pickChineseVoice(true);",
  "",
  "    clearInterval(tipSpeechKeepAlive);",
  "    tipSpeechKeepAlive = setInterval(() => {",
  "      if (token !== tipSpeechToken) {",
  "        clearTipSpeechTimers();",
  "        return;",
  "      }",
  "      resumeTipSpeechEngine();",
  "    }, 5000);",
  "",
  "    // 首句：不绑 voice、极短，优先抢到出声时间",
  "    const first = chunks[0];",
  "    const rest = chunks.slice(1);",
  "    const firstUtter = makeUtterance(first, null, { rate: 1.2 });",
  "    tipSpeechUtterance = firstUtter;",
  "    tipSpeechQueue = rest.slice();",
  "",
  "    firstUtter.onend = () => {",
  "      if (token !== tipSpeechToken) return;",
  "      // 后续句再用本地音色",
  "      if (localVoice && localVoice.voiceURI) tipPreferredVoiceURI = localVoice.voiceURI;",
  "      speakNextTipChunk(token);",
  "    };",
  "    firstUtter.onerror = () => {",
  "      if (token !== tipSpeechToken) return;",
  "      speakNextTipChunk(token);",
  "    };",
  "    // 同步 speak：必须在用户点击调用栈内触发",
  "    try {",
  "      window.speechSynthesis.speak(firstUtter);",
  "    } catch (e) {",
  "      return false;",
  "    }",
  "    armTipSpeechWatchdog(token, fullText);",
  "    return true;",
  "  }",
  "",
].join(nl) + nl;

s = s.slice(0, speakFnStart) + speakFn + s.slice(speakFnEnd);

// speakNextTipChunk should use local voice for rest
// already does pickChineseVoice(true)

fs.writeFileSync(file, s);
console.log("patched v5 len", s.length);

let html = fs.readFileSync(htmlFile, "utf8");
html = html.replace(/math-challenge\.js\?v=[^\"]+/, "math-challenge.js?v=math-tip-voice-5");
fs.writeFileSync(htmlFile, html);
console.log("cache", (html.match(/math-challenge\.js\?v=[^\"]+/) || [])[0]);

// sanity
const checks = {
  prebuilt: s.includes("tipPrebuilt"),
  clickSpeak: s.includes("const tip = activeSession.tipPrebuilt || buildMathTip(question);"),
  showNoSpeak: !/function showMathTip[\s\S]{0,500}speakMathTip\(tip, question\)/.test(s),
  firstNoVoice: s.includes("const firstUtter = makeUtterance(first, null"),
  syncSpeak: s.includes("window.speechSynthesis.speak(firstUtter);"),
};
console.log(checks);
for (const [k, v] of Object.entries(checks)) {
  if (!v) throw new Error("check fail " + k);
}
console.log("OK");
