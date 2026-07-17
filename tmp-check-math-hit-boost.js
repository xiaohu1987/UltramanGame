const fs = require("fs");
const { execSync } = require("child_process");

execSync("node --check js/fx.js", { stdio: "inherit" });

const s = fs.readFileSync("js/fx.js", "utf8");
const checks = [
  ["hitStopFor", s.includes("hitStopFor(70)")],
  ["crit particles", s.includes("spawnParticles(hx, hy, Math.round(36")],
  ["rings", s.includes("fx.rings = [")],
  ["stretch draw", s.includes("fx.orb.stretch")],
  ["HIT float", s.includes('showFloatGlobal("HIT!"')],
  ["crit sfx", s.includes('this.sfx("crit", 1.15)')],
  ["no old whoosh", !s.includes("// light whoosh when orb launches")],
  ["no old weak hit", !s.includes("this.spawnParticles(hx, hy, Math.round(22 * this.perfScale), \"hit\", 1.1)")],
  ["targetUid", s.includes("targetUid: options.targetUid || null")],
];

let ok = true;
for (const [name, pass] of checks) {
  console.log(pass ? "OK" : "FAIL", name);
  if (!pass) ok = false;
}
if (!ok) process.exit(1);
console.log("MATH_HIT_BOOST_OK");
