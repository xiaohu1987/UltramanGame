const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const ui = fs.readFileSync("js/ui.js", "utf8");
const main = fs.readFileSync("js/main.js", "utf8");
const selectCss = fs.readFileSync("css/select-ui.css", "utf8");
const battleCss = fs.readFileSync("css/battle-ui.css", "utf8");
const kids = fs.readFileSync("css/kids-ui.css", "utf8");
const layout = fs.readFileSync("css/layout-fit.css", "utf8");

const checks = {
  selectedSlots: html.includes('id="selected-slots"'),
  threeSlots: (html.match(/class="selected-slot/g) || []).length >= 3,
  toolbarBetween:
    html.indexOf("selected-slots") < html.indexOf("select-toolbar") &&
    html.indexOf("select-toolbar") < html.indexOf("hero-grid"),
  thumbGrid: html.includes("select-thumb-grid"),
  currentActor: html.includes('id="current-actor"'),
  battleLog: html.includes('id="battle-log"'),
  allyEnemy: html.includes('id="ally-team"') && html.includes('id="enemy-team"'),
  renderSlots: ui.includes("function renderSelectedSlots"),
  renderCurrent: ui.includes("function renderCurrentActor"),
  fighterLayout:
    ui.includes("fighter-layout") &&
    ui.includes("fighter-left") &&
    ui.includes("fighter-right"),
  skillHorizontal: ui.includes("horizontal"),
  startDisabled: html.includes("btn-start") && html.includes("disabled"),
  shortLog: main.includes("开战！") && main.includes("自动：开"),
  selectCssSlots:
    selectCss.includes(".selected-slots") &&
    selectCss.includes(".selected-slot-avatar"),
  battleCssLayout:
    battleCss.includes(".fighter-layout") &&
    battleCss.includes("minmax(72px, 1fr) minmax(0, 2fr)"),
  battleCssSkills:
    battleCss.includes(".skill-mini.horizontal") ||
    battleCss.includes("flex-wrap: wrap"),
  kidsOverride: kids.includes(".fighter-layout") && kids.includes(".current-actor"),
  layoutCenter: layout.includes("current-actor") && layout.includes("battle-log-wrap") === false
    ? layout.includes(".battle-center")
    : layout.includes(".battle-center"),
};

console.log(JSON.stringify({ checks, allPass: Object.values(checks).every(Boolean) }, null, 2));
