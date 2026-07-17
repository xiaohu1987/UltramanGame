const fs = require("fs");

function normalize(text) {
  return text.replace(/\r\n/g, "\n");
}

function replaceOnce(source, from, to, label) {
  const normalizedFrom = normalize(from);
  if (!source.includes(normalizedFrom)) {
    throw new Error(`Missing block: ${label}`);
  }
  return source.replace(normalizedFrom, normalize(to));
}

let duel = normalize(fs.readFileSync("css/duel-table.css", "utf8"));
duel = replaceOnce(
  duel,
  `grid-template-rows: minmax(0, 1fr) auto;
  grid-template-areas:
    "ally center enemy"
    "ally center log";`,
  `grid-template-rows: minmax(0, 1fr);
  grid-template-areas:
    "ally center enemy";`,
  "duel grid areas"
);
duel = replaceOnce(
  duel,
  `#screen-battle .battle-log-wrap {
  grid-area: log;
  min-height: 0;
  height: 100%;`,
  `#screen-battle .battle-log-wrap {
  grid-area: auto;
  min-height: 0;
  height: 100%;`,
  "duel log wrap"
);
duel = replaceOnce(
  duel,
  `  #screen-battle .battle-field,
  #screen-battle .battle-field.four-columns,
  #screen-battle .battle-field.vertical-stack {
    grid-template-rows: minmax(0, 1fr) clamp(120px, 16dvh, 180px);
  }`,
  `  #screen-battle .battle-field,
  #screen-battle .battle-field.four-columns,
  #screen-battle .battle-field.vertical-stack {
    grid-template-rows: minmax(0, 1fr);
  }`,
  "duel desktop rows"
);
duel = replaceOnce(
  duel,
  `    grid-template-rows: auto auto auto auto;
    grid-template-areas:
      "enemy"
      "log"
      "center"
      "ally";`,
  `    grid-template-rows: auto auto auto;
    grid-template-areas:
      "enemy"
      "center"
      "ally";`,
  "duel mobile areas"
);
fs.writeFileSync("css/duel-table.css", duel.replace(/\n/g, "\r\n"));

let full = normalize(fs.readFileSync("css/fullbody-fix.css", "utf8"));
full = replaceOnce(
  full,
  `  #screen-battle .team-column.ally {
    border-left: 2px solid rgba(99, 210, 255, 0.42);
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) minmax(180px, 0.72fr);
    gap: 6px;
  }`,
  `  #screen-battle .team-column.ally,
  #screen-battle .team-column.enemy {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) minmax(180px, 0.72fr);
    gap: 6px;
  }

  #screen-battle .team-column.ally {
    border-left: 2px solid rgba(99, 210, 255, 0.42);
  }`,
  "fullbody team rows"
);
full = replaceOnce(
  full,
  `  #screen-battle .team-column.ally .action-bar {
    min-height: 0;
    max-width: 100%;
    height: 100%;
    max-height: none;
    align-self: stretch;
  }

  #screen-battle .team-column.ally .skill-buttons {
    min-height: 0;
    height: 100%;
    overflow: auto;
    overscroll-behavior: contain;
  }

  #screen-battle .team-column.enemy {
    border-right: 2px solid rgba(255, 93, 108, 0.42);
  }

  #screen-battle .battle-log-wrap {
    min-height: 0;
    max-width: 100%;
  }

  #screen-battle .battle-log {
    min-height: 0;
    height: 100%;
    overflow: auto;
    overflow-wrap: anywhere;
  }
}`,
  `  #screen-battle .team-column.ally .action-bar,
  #screen-battle .team-column.enemy .battle-log-wrap {
    min-height: 0;
    max-width: 100%;
    height: 100%;
    max-height: none;
    align-self: stretch;
  }

  #screen-battle .team-column.ally .skill-buttons {
    min-height: 0;
    height: 100%;
    overflow: auto;
    overscroll-behavior: contain;
  }

  #screen-battle .team-column.enemy {
    border-right: 2px solid rgba(255, 93, 108, 0.42);
  }

  #screen-battle .team-column.enemy .battle-log {
    min-height: 0;
    height: 100%;
    overflow: auto;
    overflow-wrap: anywhere;
  }
}`,
  "fullbody equal bottom panels"
);
full = replaceOnce(
  full,
  `/* 最后加载的战斗布局覆盖：战斗信息独立置于三栏主战区下方。 */
@media (min-width: 1101px) {
  #screen-battle .battle-field,
  #screen-battle .battle-field.four-columns,
  #screen-battle .battle-field.vertical-stack {
    grid-template-columns: minmax(300px, 1fr) minmax(320px, 1.1fr) minmax(300px, 1fr) !important;
    grid-template-rows: minmax(0, 1fr) auto;
  }

  /* 阵营内固定一行三张竖卡，避免主战区退化为纵向名单。 */
  #screen-battle .team-column .team-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: minmax(0, 1fr);
    gap: 8px;
    overflow-x: auto;
    overflow-y: hidden;
  }

  #screen-battle .team-column .fighter-card {
    min-width: 0;
  }

  #screen-battle .battle-log-wrap {
    grid-column: 1 / -1;
    grid-row: 2;
    width: auto;
    height: auto;
    max-height: none;
  }
}`,
  `/* 最后加载的战斗布局覆盖：三栏主战区，左右底部等高。 */
@media (min-width: 1101px) {
  #screen-battle .battle-field,
  #screen-battle .battle-field.four-columns,
  #screen-battle .battle-field.vertical-stack {
    grid-template-columns: minmax(300px, 1fr) minmax(320px, 1.1fr) minmax(300px, 1fr) !important;
    grid-template-rows: minmax(0, 1fr);
  }

  /* 阵营内固定一行三张竖卡，避免主战区退化为纵向名单。 */
  #screen-battle .team-column .team-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: minmax(0, 1fr);
    gap: 8px;
    overflow-x: auto;
    overflow-y: hidden;
  }

  #screen-battle .team-column .fighter-card {
    min-width: 0;
  }

  #screen-battle .team-column.ally .action-bar,
  #screen-battle .team-column.enemy .battle-log-wrap {
    min-height: 180px;
    height: 100%;
  }
}`,
  "fullbody final override"
);
fs.writeFileSync("css/fullbody-fix.css", full.replace(/\n/g, "\r\n"));

let layout = normalize(fs.readFileSync("css/layout-fit.css", "utf8"));
layout = replaceOnce(
  layout,
  `/* 战斗主区固定为三栏：我方阵容、中央舞台、敌方阵容。 */
@media (min-width: 1101px) {
  #screen-battle .battle-field,
  #screen-battle .battle-field.four-columns,
  #screen-battle .battle-field.vertical-stack {
    grid-template-columns: minmax(300px, 1fr) minmax(320px, 1.1fr) minmax(300px, 1fr);
    gap: 12px;
  }

  #screen-battle .battle-log-wrap {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  #screen-battle .team-column,
  #screen-battle .battle-center {
    grid-row: 1;
  }
}`,
  `/* 战斗主区固定为三栏：我方阵容、中央舞台、敌方阵容。 */
@media (min-width: 1101px) {
  #screen-battle .battle-field,
  #screen-battle .battle-field.four-columns,
  #screen-battle .battle-field.vertical-stack {
    grid-template-columns: minmax(300px, 1fr) minmax(320px, 1.1fr) minmax(300px, 1fr);
    grid-template-rows: minmax(0, 1fr);
    gap: 12px;
  }

  #screen-battle .team-column,
  #screen-battle .battle-center {
    grid-row: 1;
  }

  #screen-battle .team-column.ally .action-bar,
  #screen-battle .team-column.enemy .battle-log-wrap {
    min-height: 180px;
    height: 100%;
  }
}`,
  "layout-fit equal height"
);
fs.writeFileSync("css/layout-fit.css", layout.replace(/\n/g, "\r\n"));

const html = fs.readFileSync("index.html", "utf8");
const enemySlice = html.slice(
  html.indexOf('class="team-column enemy battle-row"'),
  html.indexOf('id="result-modal"')
);
const checks = {
  logInsideEnemy:
    enemySlice.includes("battle-log-wrap") &&
    enemySlice.includes('id="battle-log"') &&
    enemySlice.includes('id="enemy-team"') &&
    enemySlice.indexOf('id="enemy-team"') < enemySlice.indexOf('id="battle-log"'),
  skillUnderAlly:
    html.indexOf('class="team-column ally battle-row"') < html.indexOf('id="skill-buttons"') &&
    html.indexOf('id="skill-buttons"') < html.indexOf('class="team-column enemy battle-row"'),
  duelSingleRow: duel.includes('"ally center enemy"') && !duel.includes('"ally center log"'),
  fullbodyEqualRows:
    full.includes("#screen-battle .team-column.ally,") &&
    full.includes("minmax(180px, 0.72fr)") &&
    full.includes(".team-column.enemy .battle-log-wrap"),
  layoutEqual:
    layout.includes(".team-column.enemy .battle-log-wrap") &&
    layout.includes("min-height: 180px"),
};

const failed = Object.entries(checks)
  .filter(([, ok]) => !ok)
  .map(([name]) => name);

console.log(JSON.stringify({ checks, failed, allPass: failed.length === 0 }, null, 2));
if (failed.length) process.exit(1);
