const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const js = fs.readFileSync(path.join(__dirname, "js", "math-challenge.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

assert(js.includes("function speakMathTip"), "speakMathTip");
assert(js.includes("function stopMathTipSpeech"), "stopMathTipSpeech");
assert(js.includes("function buildMathTipSpeechText"), "buildMathTipSpeechText");
assert(js.includes("speakMathTip(tip, question)"), "showMathTip calls speak");
assert(js.includes("stopMathTipSpeech();"), "stop on clear/finish");
assert(js.includes('utter.lang = "zh-CN"'), "zh-CN");
assert(html.includes("math-challenge.js?v=math-tip-voice-1"), "cache bust");

// sandbox speech
const spoken = [];
const cancelled = [];
const voices = [
  { lang: "en-US", name: "English" },
  { lang: "zh-CN", name: "Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)" },
];
const speechSynthesis = {
  getVoices() {
    return voices;
  },
  cancel() {
    cancelled.push(1);
  },
  speak(u) {
    spoken.push(u);
  },
  addEventListener() {},
  onvoiceschanged: null,
};
function SpeechSynthesisUtterance(text) {
  this.text = text;
  this.lang = "";
  this.rate = 1;
  this.pitch = 1;
  this.volume = 1;
  this.voice = null;
}

const sandbox = {
  window: {
    speechSynthesis,
    SpeechSynthesisUtterance,
    ArcadeFX: {
      unlockAudio() {},
      sfx() {},
      flashScreen() {},
    },
    localStorage: {
      getItem() {
        return "normal";
      },
      setItem() {},
    },
  },
  document: {
    getElementById() {
      return null;
    },
    createElement() {
      return {
        classList: { add() {}, remove() {} },
        style: { setProperty() {} },
        setAttribute() {},
        appendChild() {},
        querySelector() {
          return null;
        },
        querySelectorAll() {
          return [];
        },
      };
    },
    body: { appendChild() {} },
    addEventListener() {},
    removeEventListener() {},
  },
  performance: { now: () => 0 },
  setTimeout(fn) {
    // run immediately for tests that don't need delay semantics
    if (typeof fn === "function") fn();
    return 1;
  },
  clearTimeout() {},
  setInterval() {
    return 1;
  },
  clearInterval() {},
  requestAnimationFrame(fn) {
    if (typeof fn === "function") fn();
    return 1;
  },
  cancelAnimationFrame() {},
  console,
};
sandbox.window.document = sandbox.document;
sandbox.window.performance = sandbox.performance;
sandbox.window.MathChallenge = undefined;

vm.createContext(sandbox);
vm.runInContext(js, sandbox);

const MC = sandbox.window.MathChallenge;
assert(MC, "MathChallenge export");
assert(typeof MC.speakMathTip === "function", "export speak");
assert(typeof MC.stopMathTipSpeech === "function", "export stop");
assert(typeof MC.buildMathTipSpeechText === "function", "export text");

const tip = MC.buildMathTip({ a: 7, b: 5, op: "+", max: 10, text: "7 + 5 = ?" });
const text = MC.buildMathTipSpeechText(tip, { text: "7 + 5 = ?" });
assert(text.includes("提醒"), "speech has 提醒");
assert(text.includes("拆成五") || text.includes(tip.title), "speech has title");
assert(text.includes("7 + 5") || text.includes("原题"), "speech has original");
assert(text.includes("第1步"), "speech has steps");
console.log("speech sample:", text);

const ok = MC.speakMathTip(tip, { text: "7 + 5 = ?" });
assert(ok === true, "speak returns true");
// allow delayed speak
assert(spoken.length >= 1, "utterance spoken");
assert(spoken[0].lang === "zh-CN", "lang zh-CN");
assert(spoken[0].voice && String(spoken[0].voice.lang).toLowerCase().includes("zh"), "picked chinese voice");
assert(spoken[0].text.includes("第1步"), "spoken text has steps");

MC.stopMathTipSpeech();
assert(cancelled.length >= 1, "cancel called");

// no speechSynthesis fallback
sandbox.window.speechSynthesis = null;
const ok2 = MC.speakMathTip(tip, { text: "7 + 5 = ?" });
assert(ok2 === false, "no synth returns false");

console.log("math-tip-voice checks OK");
