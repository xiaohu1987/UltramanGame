const fs = require("fs");
const s = fs.readFileSync("js/math-challenge.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");

const showStart = s.indexOf("function showMathTip");
const showEnd = s.indexOf("function isDamageSkillType", showStart);
const showBody = s.slice(showStart, showEnd);
const speakAt = showBody.indexOf("speakMathTip(tip, question)");
const morphAt = showBody.indexOf("renderQuestionWithMorph(qEl, question, tip)");

const checks = {
  warm: s.includes("function warmMathTipSpeech"),
  immediate: s.includes("同步立刻开讲"),
  speakFirstInShow: speakAt >= 0 && morphAt >= 0 && speakAt < morphAt,
  warmCall: s.includes("warmMathTipSpeech();"),
  rate: s.includes("utter.rate = 1.02"),
  token0: /let tipSpeechToken = 0;/.test(s),
  tokenAssign: /const token = tipSpeechToken;/.test(s),
  noOldDelay: !s.includes("部分浏览器 cancel 后需短暂延迟再 speak"),
  noWaitVoices: !s.includes("即使没有 voiceschanged 也开讲"),
  exportWarm: s.includes("warmMathTipSpeech,"),
  cache: /math-challenge\.js\?v=math-tip-voice-2/.test(html),
  shorterLead: s.includes('parts.push("想成 " + rewrite + "。")'),
};

console.log(JSON.stringify(checks, null, 2));
for (const [k, v] of Object.entries(checks)) {
  if (!v) throw new Error("fail: " + k);
}

// smoke: build text is shorter / starts immediately
const vm = require("vm");
const code = s.replace(/^\(function \(\) \{/, "function __mc() {").replace(/\}\)\(\);\s*$/, "}; __mc();");
const sandbox = {
  window: {
    speechSynthesis: {
      getVoices: () => [{ lang: "zh-CN", name: "Microsoft Xiaoxiao" }],
      speak: () => {},
      cancel: () => {},
      addEventListener: () => {},
      paused: false,
      resume: () => {},
    },
    SpeechSynthesisUtterance: function (text) {
      this.text = text;
      this.lang = "";
      this.rate = 1;
      this.pitch = 1;
      this.volume = 1;
      this.voice = null;
    },
    ArcadeFX: null,
    MathChallenge: null,
  },
  document: {
    createElement: () => ({
      classList: { add() {}, remove() {}, toggle() {} },
      style: { setProperty() {} },
      appendChild() {},
      setAttribute() {},
      querySelector() { return null; },
      querySelectorAll() { return []; },
    }),
    body: { appendChild() {} },
    addEventListener() {},
    removeEventListener() {},
  },
  console,
};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const MC = sandbox.window.MathChallenge;
const tip = MC.buildMathTip({ text: "7 + 5 = ?", a: 7, b: 5, answer: 12, op: "+" });
const text = MC.buildMathTipSpeechText(tip, { text: "7 + 5 = ?" });
console.log("speech sample:", text);
if (!text.startsWith("提醒。")) throw new Error("lead");
if (text.includes("原题是")) throw new Error("old long lead still present");
const ok = MC.speakMathTip(tip, { text: "7 + 5 = ?" });
if (!ok) throw new Error("speak failed");
MC.stopMathTipSpeech();
console.log("voice latency checks OK");
