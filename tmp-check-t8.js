const fs = require("fs");

const battle = fs.readFileSync("css/battle-ui.css", "utf8");
const kids = fs.readFileSync("css/kids-ui.css", "utf8");
const layout = fs.readFileSync("css/layout-fit.css", "utf8");
const style = fs.readFileSync("css/style.css", "utf8");
const html = fs.readFileSync("index.html", "utf8");
const ui = fs.readFileSync("js/ui.js", "utf8");

const checks = {
  // 三栏结构
  threeColHtml:
    html.includes("team-column ally") &&
    html.includes("battle-center") &&
    html.includes("team-column enemy"),
  threeColCss:
    /grid-template-columns:\s*minmax\(240px,\s*1fr\)\s*minmax\(240px,\s*0\.95fr\)\s*minmax\(240px,\s*1fr\)/.test(
      layout
    ) ||
    /grid-template-columns:\s*minmax\(240px,\s*1fr\)\s*minmax\(240px,\s*0\.95fr\)\s*minmax\(240px,\s*1fr\)/.test(
      battle
    ),

  // 卡片 1/3 - 2/3
  cardRatio:
    battle.includes("minmax(72px, 1fr) minmax(0, 2fr)") ||
    kids.includes("minmax(72px, 1fr) minmax(0, 2fr)"),
  cardLeftRight: battle.includes(".fighter-left") && battle.includes(".fighter-right"),
  hpAboveSkills:
    battle.includes(".fighter-hp-block") &&
    battle.includes(".fighter-skills") &&
    battle.indexOf(".fighter-hp-block") < battle.indexOf(".fighter-skills"),

  // 技能横排
  skillHorizontal:
    battle.includes(".skill-mini.horizontal") &&
    /display:\s*flex/.test(battle) &&
    battle.includes("flex-wrap: wrap"),

  // 中间大图 + 日志
  centerRows:
    battle.includes(".battle-center") &&
    /grid-template-rows:/.test(battle) &&
    battle.includes(".current-actor") &&
    battle.includes(".battle-log-wrap"),
  logScroll:
    /\.battle-log\s*\{[\s\S]*?overflow:\s*auto/.test(battle) ||
    /\.battle-log\s*\{[\s\S]*?overflow:\s*auto/.test(layout),
  currentActorSize:
    battle.includes("min-height: 160px") || kids.includes("min-height: 170px"),

  // 当前行动高亮（卡片态）
  currentHighlight:
    style.includes(".fighter-card.current") || battle.includes(".fighter-card.current"),
  targetable:
    style.includes(".fighter-card.targetable") || battle.includes(".fighter-card.targetable"),

  // 操作栏不被遮挡
  actionBarExists: html.includes("action-bar") && html.includes("skill-buttons"),
  battleScreenRows: layout.includes("grid-template-rows: minmax(0, 1fr) auto"),

  // 渲染与样式对齐
  renderUsesLayout: ui.includes("fighter-layout") && ui.includes("fighter-left") && ui.includes("fighter-right"),
  renderHorizontalSkills: /renderSkillMiniList\(\s*unit\.skills\s*,\s*true\s*\)/.test(ui),
};

console.log(
  JSON.stringify(
    {
      checks,
      allPass: Object.values(checks).every(Boolean),
      failed: Object.entries(checks)
        .filter(([, v]) => !v)
        .map(([k]) => k),
    },
    null,
    2
  )
);
