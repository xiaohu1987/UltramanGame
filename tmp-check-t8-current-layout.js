const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const ui = fs.readFileSync("js/ui.js", "utf8");
const layout = fs.readFileSync("css/layout-fit.css", "utf8");
const fullbody = fs.readFileSync("css/fullbody-fix.css", "utf8");

const checks = {
  threeColumnStructure:
    html.includes('class="team-column ally battle-row"') &&
    html.includes('class="battle-center battle-row"') &&
    html.includes('class="team-column enemy battle-row"'),
  sharedThreeCardRenderer:
    ui.includes("state.heroes.map((u) => renderFighterCard(u, state))") &&
    ui.includes("state.monsters.map((u) => renderFighterCard(u, state)") &&
    ui.includes('class="fighter-info-block"') &&
    ui.includes('class="hp-text"'),
  currentTurnStage:
    ui.includes("function renderCurrentActor(current)") &&
    ui.includes('class="current-actor-avatar"') &&
    ui.includes('class="current-actor-name"') &&
    ui.includes('class="current-actor-hp"') &&
    ui.includes("renderCurrentActor(current)") &&
    ui.includes("els.turnBanner.textContent"),
  actionAndTargetFlow:
    html.includes('id="skill-buttons"') &&
    html.includes('id="btn-auto-battle"') &&
    ui.includes("handlers.onSkill(skill.id)") &&
    ui.includes('class="fighter-card') &&
    ui.includes("targetable") &&
    ui.includes("dimmed"),
  battleLogFlow:
    html.includes('id="battle-log"') &&
    ui.includes("function appendLog") &&
    ui.includes("scrollTop = els.battleLog.scrollHeight") &&
    layout.includes(".battle-log") &&
    layout.includes("overflow: auto"),
  desktopThreeCardsPerSide:
    fullbody.includes("@media (min-width: 1101px)") &&
    fullbody.includes("grid-template-columns: minmax(300px, 1fr) minmax(320px, 1.1fr) minmax(300px, 1fr)") &&
    fullbody.includes("grid-template-columns: repeat(3, minmax(0, 1fr))"),
  narrowViewportFallback:
    layout.includes("@media (max-width: 1100px)") &&
    layout.includes("grid-template-columns: 1fr") &&
    layout.includes(".team-row") &&
    layout.includes("overflow: visible"),
};

const failed = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

console.log(JSON.stringify({ checks, failed, allPass: failed.length === 0 }, null, 2));
process.exitCode = failed.length ? 1 : 0;
