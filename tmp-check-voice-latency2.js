const fs = require("fs");
const s = fs.readFileSync("js/math-challenge.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");

const showStart = s.indexOf("function showMathTip");
const showEnd = s.indexOf("function isDamageSkillType", showStart);
const showBody = s.slice(showStart, showEnd);
const speakAt = showBody.indexOf("speakMathTip(tip, question)");
const morphAt = showBody.indexOf("renderQuestionWithMorph(qEl, question, tip)");
const speakFnStart = s.indexOf("function speakMathTip");
const speakFnEnd = s.indexOf("function stopUrgencyLoop", speakFnStart);
const speakBody = s.slice(speakFnStart, speakFnEnd);

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
  noSpeakTimeout: !/setTimeout\(\(\) => \{[\s\S]{0,120}speechSynthesis\.speak/.test(speakBody),
  exportWarm: s.includes("warmMathTipSpeech,"),
  cache: /math-challenge\.js\?v=math-tip-voice-2/.test(html),
  shorterLead: s.includes('parts.push("想成 " + rewrite + "。")'),
  noLongLead: !s.includes('parts.push("原题是 " + original + "。")'),
  directSpeak: speakBody.includes("window.speechSynthesis.speak(utter)"),
};

console.log(JSON.stringify(checks, null, 2));
for (const [k, v] of Object.entries(checks)) {
  if (!v) throw new Error("fail: " + k);
}
console.log("voice latency static checks OK");
