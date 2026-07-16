const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const ui = fs.readFileSync("js/ui.js", "utf8");
const main = fs.readFileSync("js/main.js", "utf8");
const battle = fs.readFileSync("js/battle.js", "utf8");
const data = fs.readFileSync("js/data.js", "utf8");
const selectCss = fs.readFileSync("css/select-ui.css", "utf8");
const battleCss = fs.readFileSync("css/battle-ui.css", "utf8");
const kidsCss = fs.readFileSync("css/kids-ui.css", "utf8");
const layoutCss = fs.readFileSync("css/layout-fit.css", "utf8");
const styleCss = fs.readFileSync("css/style.css", "utf8");

const checks = {
  // 选角链路
  selectSlots: html.includes('id="selected-slots"') && (html.match(/class="selected-slot/g) || []).length >= 3,
  selectToolbarBetween:
    html.indexOf("selected-slots") < html.indexOf("select-toolbar") &&
    html.indexOf("select-toolbar") < html.indexOf("hero-grid"),
  selectThumbs: html.includes("select-thumb-grid") && ui.includes("function renderSelectScreen"),
  selectToggle: main.includes("function toggleHero") && ui.includes("handlers.onToggle"),
  selectRandomClear:
    main.includes("function randomSelect") &&
    main.includes("function clearSelect") &&
    html.includes("btn-random") &&
    html.includes("btn-clear"),
  startGate:
    html.includes("btn-start") &&
    ui.includes("els.btnStart.disabled = selectedIds.length !== 3") &&
    main.includes("if (selectedIds.length !== 3) return"),

  // 开战链路
  startBattle: main.includes("function startBattle") && main.includes("new window.BattleEngine"),
  teamCreate: data.includes("createHeroTeam") && data.includes("pickRandomMonsters"),
  showBattle: ui.includes("function showBattle") && main.includes("UI.showBattle()"),

  // 战斗布局
  battleThreeCol:
    html.includes("team-column ally") &&
    html.includes("battle-center") &&
    html.includes("team-column enemy") &&
    html.includes('id="ally-team"') &&
    html.includes('id="enemy-team"'),
  currentActor:
    html.includes('id="current-actor"') &&
    ui.includes("function renderCurrentActor") &&
    ui.includes("renderCurrentActor(current)"),
  battleLog:
    html.includes('id="battle-log"') &&
    ui.includes("function appendLog") &&
    ui.includes("scrollTop = els.battleLog.scrollHeight") &&
    /\.battle-log\s*\{[\s\S]*?overflow:\s*auto/.test(battleCss),

  // 统一卡片
  fighterCard:
    ui.includes("function renderFighterCard") &&
    ui.includes("fighter-layout") &&
    ui.includes("fighter-left") &&
    ui.includes("fighter-right") &&
    ui.includes("fighter-hp-block") &&
    /renderSkillMiniList\(\s*unit\.skills\s*,\s*true\s*\)/.test(ui) &&
    battleCss.includes("minmax(72px, 1fr) minmax(0, 2fr)"),
  bothSidesSameTemplate:
    ui.includes("state.heroes.map((u) => renderFighterCard") &&
    ui.includes("state.monsters.map((u) => renderFighterCard"),

  // 手动/自动战斗
  skillTarget:
    ui.includes("handlers.onSkill") &&
    ui.includes("handlers.onTarget") &&
    battle.includes("selectSkill") &&
    battle.includes("selectTarget"),
  autoBattle:
    main.includes("toggleAutoBattle") &&
    battle.includes("setAutoBattle") &&
    ui.includes("setAutoBattleUi") &&
    html.includes("btn-auto-battle"),

  // 结算返回
  resultRestart:
    ui.includes("function showResult") &&
    main.includes("function restart") &&
    html.includes("btn-restart") &&
    ui.includes("function showSelect"),

  // 样式比例
  layoutRatio:
    layoutCss.includes("minmax(240px, 1fr) minmax(240px, 0.95fr) minmax(240px, 1fr)") &&
    battleCss.includes(".battle-center") &&
    kidsCss.includes(".fighter-layout"),

  // 文案 polish
  shortCopy:
    html.includes("开战！") &&
    html.includes("空位") &&
    ui.includes("点高亮目标") &&
    battle.includes('this.onLog("开战！")') &&
    !main.includes('UI.appendLog("开战！")') &&
    battleCss.includes(".btn.auto-toggle.active"),
};

const failed = Object.entries(checks)
  .filter(([, v]) => !v)
  .map(([k]) => k);

console.log(
  JSON.stringify(
    {
      checks,
      allPass: failed.length === 0,
      failed,
      successCriteria: {
        selectTop3MidBtnBottomThumbs: checks.selectSlots && checks.selectToolbarBetween && checks.selectThumbs,
        battleLeftCenterRight: checks.battleThreeCol && checks.currentActor && checks.battleLog,
        unifiedCardLayout: checks.fighterCard && checks.bothSidesSameTemplate,
        shortCopyAndStates: checks.shortCopy && checks.startGate && checks.skillTarget,
        fullFlowWired: checks.startBattle && checks.autoBattle && checks.resultRestart,
      },
    },
    null,
    2
  )
);
