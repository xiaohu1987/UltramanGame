const fs = require("fs");
const s = fs.readFileSync("js/fx.js", "utf8");
const checks = [
  ["boom particles crit", s.includes('spawnParticles(hx, hy, Math.round(58 * this.perfScale), "crit", 1.85)')],
  ["boom particles hit", s.includes('spawnParticles(hx, hy, Math.round(34 * this.perfScale), "hit", 1.55)')],
  ["boom particles ko", s.includes('spawnParticles(hx, hy, Math.round(22 * this.perfScale), "ko", 1.35)')],
  ["max shake", s.includes("this.shakeScreen(16, 460)")],
  ["hard flash", s.includes('this.flashScreen(0.72, "255,248,210")')],
  ["hitstop 120", s.includes("this.hitStopFor(120)")],
  ["blast core", s.includes("fx.blast = {")],
  ["sparks", s.includes("fx.sparks = []")],
  ["BOOM float", s.includes('showFloatGlobal("BOOM!"')],
  ["layered boom sfx", s.includes("this.playNoise({ dur: 0.16, gain: 0.22 })")],
  ["draw blast", s.includes("explosion core / fireball")],
  ["draw sparks", s.includes("// radial sparks")],
  ["4 rings", s.includes("maxR: 240")],
  ["hard ease-in", s.includes("raw * raw * raw * (1.35 - 0.35 * raw)")],
  ["no old weak hit", !s.includes('spawnParticles(hx, hy, Math.round(36 * this.perfScale), "crit", 1.45)')],
];
let ok = true;
for (const [name, pass] of checks) {
  console.log((pass ? "OK " : "FAIL ") + name);
  if (!pass) ok = false;
}
if (!ok) {
  process.exit(1);
}
console.log("MATH_BOOM_OK");
