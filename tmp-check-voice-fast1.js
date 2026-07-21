const fs = require("fs");
const s = fs.readFileSync("js/math-challenge.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");

const checks = {
  origText: s.includes("原题是 "),
  origRate: /utter\.rate = \(opts && typeof opts\.rate === "number"\) \? opts\.rate : 0\.92/.test(s),
  origPitch: s.includes("pitch: 1.08") || s.includes(": 1.08"),
  fullSpeak: s.includes("window.speechSynthesis.speak(utter)"),
  preSpeech: s.includes("prebuiltSpeechText"),
  tipSpeech: s.includes("tipSpeechText"),
  noSoftLead: !s.includes("来，我轻轻提醒你"),
  noSoftEnd: !s.includes("慢慢算，你一定可以"),
  cache: html.includes("math-tip-voice-fast-1"),
  watch220: s.includes("}, 220)"),
  localPrefer: s.includes("localService === true) n += 300"),
  speakUsesPre: s.includes("tip.speechText"),
  clickSpeakFirst: /speakMathTip\(tip, question\);[\s\S]{0,80}showMathTip/.test(s),
};

console.log(JSON.stringify(checks, null, 2));
for (const [k, v] of Object.entries(checks)) {
  if (!v) throw new Error("fail: " + k);
}
console.log("voice fast-1 checks OK");
