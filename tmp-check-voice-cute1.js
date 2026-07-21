const fs = require("fs");
const s = fs.readFileSync("js/math-challenge.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");
const checks = {
  cuteOpen: s.includes("嘿，小提醒来啦"),
  cuteEnd: s.includes("慢慢算，你超棒的"),
  softOh: s.includes(' + " 哦"'),
  softYa: s.includes(' + " 呀"'),
  softSpeak: s.includes("softSpeakMathLine(rewrite)") && s.includes("softSpeakMathLine(original)"),
  rate: /utter\.rate = \(opts && typeof opts\.rate === "number"\) \? opts\.rate : 0\.96/.test(s),
  pitch: /utter\.pitch = \(opts && typeof opts\.pitch === "number"\) \? opts\.pitch : 1\.28/.test(s),
  chunkRate: s.includes("rate: tipSpeechQueue.length ? 0.98 : 0.96"),
  chunkPitch: s.includes("pitch: 1.28"),
  preferCute: s.includes("可爱风偏好") && s.includes("xiaoyi") && s.includes("cute"),
  demoteMale: s.includes("yunyang") && s.includes("n -= 50"),
  cacheBust: html.includes("math-tip-voice-cute-1"),
};
const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
if (failed.length) {
  console.error("FAILED", failed);
  console.log(checks);
  process.exit(1);
}
console.log(checks);
console.log("voice cute-1 checks OK");
