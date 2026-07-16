const fs = require("fs");

const ui = fs.readFileSync("js/ui.js", "utf8");
const main = fs.readFileSync("js/main.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("css/battle-ui.css", "utf8");
const battle = fs.readFileSync("js/battle.js", "utf8");
const styleCss = fs.readFileSync("css/style.css", "utf8");

const fighterBodyMatch = ui.match(/function renderFighterCard[\s\S]*?(?=\n  \/\*\*|\n  function )/);
const fighterBody = fighterBodyMatch ? fighterBodyMatch[0] : "";

// In template: fighter-hp-block appears before ${skillBlock}; skillBlock wraps fighter-skills
const hpIdx = fighterBody.indexOf("fighter-hp-block");
const skillBlockUseIdx = fighterBody.indexOf("${skillBlock}");
const skillBlockDefIdx = fighterBody.indexOf("const skillBlock");
const skillsInDef = fighterBody.includes("fighter-skills");

const t6 = {
  sameTemplateBothSides:
    ui.includes("state.heroes.map((u) => renderFighterCard") &&
    ui.includes("state.monsters.map((u) => renderFighterCard"),
  leftPortrait:
    fighterBody.includes("fighter-left") &&
    fighterBody.includes("avatar-frame") &&
    fighterBody.includes('class="avatar"'),
  rightHpThenSkills:
    hpIdx > -1 &&
    skillBlockUseIdx > -1 &&
    skillBlockDefIdx > -1 &&
    skillsInDef &&
    skillBlockDefIdx < hpIdx &&
    hpIdx < skillBlockUseIdx,
  skillsHorizontal:
    ui.includes("horizontal") &&
    /renderSkillMiniList\(\s*unit\.skills\s*,\s*true\s*\)/.test(ui),
  layoutRatio: css.includes("minmax(72px, 1fr) minmax(0, 2fr)"),
  currentState: fighterBody.includes("isCurrent") && fighterBody.includes(" current"),
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
  shortStartLog: main.includes("开战！") && main.includes("自动：开"),
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
      indices: { hpIdx, skillBlockUseIdx, skillBlockDefIdx },
    },
    null,
    2
  )
);
