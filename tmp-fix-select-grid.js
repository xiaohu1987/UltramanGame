const fs = require("fs");
const p = "css/select-ui.css";
let t = fs.readFileSync(p, "utf8");
if (t.includes("grid-template-rows: auto auto auto;")) {
  t = t.replace(
    ".select-main-panel {\n  position: relative;\n  overflow: hidden;\n  display: grid;\n  grid-template-rows: auto auto auto;\n  gap: 14px;",
    ".select-main-panel {\n  position: relative;\n  overflow: hidden;\n  display: grid;\n  grid-template-rows: auto auto auto auto;\n  gap: 12px;"
  );
  // CRLF fallback
  t = t.replace(
    ".select-main-panel {\r\n  position: relative;\r\n  overflow: hidden;\r\n  display: grid;\r\n  grid-template-rows: auto auto auto;\r\n  gap: 14px;",
    ".select-main-panel {\r\n  position: relative;\r\n  overflow: hidden;\r\n  display: grid;\r\n  grid-template-rows: auto auto auto auto;\r\n  gap: 12px;"
  );
  // generic
  t = t.replace(/grid-template-rows:\s*auto auto auto;/, "grid-template-rows: auto auto auto auto;");
  fs.writeFileSync(p, t, "utf8");
}
console.log("grid", /grid-template-rows:\s*auto auto auto auto;/.test(fs.readFileSync(p, "utf8")));

// ensure playNoise delay works already; fix urgency noise call if needed - ok

// bump cache busters lightly in index for ui/battle/main
const ip = "index.html";
let html = fs.readFileSync(ip, "utf8");
html = html
  .replace("js/battle.js?v=expanded-skills-3", "js/battle.js?v=difficulty-1")
  .replace("js/fx.js?v=skill-fx-17", "js/fx.js?v=difficulty-1")
  .replace("js/ui.js?v=random-arenas-15", "js/ui.js?v=difficulty-1")
  .replace('<script src="js/main.js"></script>', '<script src="js/main.js?v=difficulty-1"></script>');
fs.writeFileSync(ip, html, "utf8");
console.log("cache bump ok");
