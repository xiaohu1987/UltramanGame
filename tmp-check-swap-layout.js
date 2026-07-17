const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const duel = fs.readFileSync("css/duel-table.css", "utf8");
const full = fs.readFileSync("css/fullbody-fix.css", "utf8");
const layout = fs.readFileSync("css/layout-fit.css", "utf8");

const allyIdx = html.indexOf('class="team-column ally battle-row"');
const enemyIdx = html.indexOf('class="team-column enemy battle-row"');
const actionIdx = html.indexOf('class="action-bar battle-row"');
const logIdx = html.indexOf('class="battle-log-wrap battle-row"');
const skillIdx = html.indexOf('id="skill-buttons"');
const battleLogIdx = html.indexOf('id="battle-log"');

const allySlice = html.slice(allyIdx, enemyIdx);
const afterEnemy = html.slice(enemyIdx);

const checks = {
  skillUnderAlly:
    allyIdx > -1 &&
    actionIdx > allyIdx &&
    actionIdx < enemyIdx &&
    skillIdx > actionIdx &&
    skillIdx < enemyIdx &&
    allySlice.includes("action-bar") &&
    allySlice.includes("skill-buttons") &&
    !allySlice.includes("battle-log"),
  logAtBottom:
    logIdx > enemyIdx &&
    battleLogIdx > logIdx &&
    afterEnemy.includes("battle-log-wrap") &&
    afterEnemy.includes('id="battle-log"') &&
    !afterEnemy.includes("action-bar"),
  duelGrid:
    duel.includes('"ally center enemy"') &&
    duel.includes('"ally center log"') &&
    duel.includes("grid-area: log") &&
    !duel.includes("grid-area: actions"),
  fullbodySwap:
    full.includes(".team-column.ally .action-bar") &&
    full.includes(".team-column.ally .skill-buttons") &&
    full.includes("grid-column: 1 / -1") &&
    full.includes(".battle-log-wrap"),
  layoutSwap:
    layout.includes(".battle-log-wrap") &&
    /#screen-battle \.battle-log-wrap\s*\{[\s\S]*?grid-column:\s*1\s*\/\s*-1/.test(layout),
  idsPreserved:
    html.includes('id="skill-buttons"') &&
    html.includes('id="battle-log"') &&
    html.includes('id="btn-auto-battle"') &&
    html.includes('id="actor-info"') &&
    html.includes('id="target-hint"') &&
    html.includes('id="btn-cancel-target"'),
};

const failed = Object.entries(checks)
  .filter(([, ok]) => !ok)
  .map(([name]) => name);

console.log(JSON.stringify({ checks, failed, allPass: failed.length === 0 }, null, 2));
process.exitCode = failed.length ? 1 : 0;
