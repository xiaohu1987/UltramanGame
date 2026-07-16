const fs = require("fs");

const ui = fs.readFileSync("js/ui.js", "utf8");
const main = fs.readFileSync("js/main.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("css/battle-ui.css", "utf8");
const layoutCss = fs.readFileSync("css/layout-fit.css", "utf8");
const fullbodyCss = fs.readFileSync("css/fullbody-fix.css", "utf8");
const battle = fs.readFileSync("js/battle.js", "utf8");
const styleCss = fs.readFileSync("css/style.css", "utf8");

const fighterBodyMatch = ui.match(/function renderFighterCard[\s\S]*?(?=\n  \/\*\*|\n  function )/);
const fighterBody = fighterBodyMatch ? fighterBodyMatch[0] : "";

// The unified card renders a portrait followed by its bottom information band.
const avatarIdx = fighterBody.indexOf("avatar-frame");
const infoIdx = fighterBody.indexOf("fighter-info-block");
const skillBlockUseIdx = fighterBody.indexOf("${skillBlock}");

const t6 = {
  sameTemplateBothSides:
    ui.includes("state.heroes.map((u) => renderFighterCard") &&
    ui.includes("state.monsters.map((u) => renderFighterCard"),
  leftPortrait:
    avatarIdx > -1 &&
    fighterBody.includes('class="avatar"'),
  bottomInfoAfterPortrait:
    infoIdx > avatarIdx &&
    fighterBody.includes("fighter-name-chip") &&
    fighterBody.includes("hp-bar") &&
    fighterBody.includes("hp-text") &&
    fighterBody.includes("buff-line"),
  skillsUseSharedRenderer:
    /renderSkillMiniList\(\s*unit\.skills\s*,\s*true\s*\)/.test(ui),
  desktopMinWidths:
    fullbodyCss.includes("minmax(190px, 0.95fr)") &&
    fullbodyCss.includes("minmax(320px, 1.6fr)") &&
    fullbodyCss.includes("minmax(154px, 0.7fr)"),
  overflowProtection:
    fullbodyCss.includes("overflow-wrap: anywhere") &&
    fullbodyCss.includes(".action-bar .skill-buttons") &&
    fullbodyCss.includes("overflow: auto"),
  narrowDesktopFallback:
    layoutCss.includes("@media (max-width: 1100px)") &&
    layoutCss.includes("grid-template-columns: 1fr") &&
    layoutCss.includes("overflow: visible"),
  currentState: fighterBody.includes("const current") && fighterBody.includes('" current"'),
  targetableState: fighterBody.includes("targetable") && fighterBody.includes("isValidTarget"),
  dimmedState: fighterBody.includes("dimmed"),
  cssCurrent: styleCss.includes(".fighter-card.current") || css.includes(".fighter-card.current"),
  cssTargetable:
    styleCss.includes(".fighter-card.targetable") || css.includes(".fighter-card.targetable"),
  noSideSpecificCardTemplate: !/function renderHeroCard|function renderMonsterCard|function renderEnemyCard/.test(
    ui
  ),
};

const t7 = {
  hasCurrentActorDom: html.includes('id="current-actor"'),
  hasBattleLogDom: html.includes('id="battle-log"'),
  hasLogWrap: html.includes("battle-log-wrap"),
  renderCurrent: ui.includes("function renderCurrentActor"),
  emptyState: ui.includes("current-actor-empty") && ui.includes("等待出手"),
  syncOnUpdate: ui.includes("renderCurrentActor(current)"),
  appendLog: ui.includes("function appendLog"),
  autoScroll: ui.includes("scrollTop = els.battleLog.scrollHeight"),
  logOverflow: /\.battle-log\s*\{[\s\S]*?overflow:\s*auto/.test(css),
  shortStartLog: battle.includes('this.onLog("开战！")') && main.includes("自动：开"),
  battleStartLog: battle.includes('this.onLog("开战！")'),
  centerLayout:
    css.includes(".battle-center") &&
    css.includes(".current-actor") &&
    css.includes(".battle-log-wrap"),
  emptyThenFilled:
    ui.includes('current-actor-empty">等待出手') &&
    ui.includes("current-actor-card") &&
    ui.includes("current-actor-avatar"),
};

console.log(
  JSON.stringify(
    {
      t6,
      t6Pass: Object.values(t6).every(Boolean),
      t7,
      t7Pass: Object.values(t7).every(Boolean),
      indices: { avatarIdx, infoIdx, skillBlockUseIdx },
    },
    null,
    2
  )
);
