const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const select = fs.readFileSync("css/select-ui.css", "utf8");
const layout = fs.readFileSync("css/layout-fit.css", "utf8");
const duel = fs.readFileSync("css/duel-table.css", "utf8");
const kids = fs.readFileSync("css/kids-ui.css", "utf8");

const result = {
  mergedBar: html.includes("select-merged-bar"),
  toolbarBeforeSlots:
    html.indexOf("select-toolbar") < html.indexOf("selected-slots") &&
    html.indexOf("selected-slots") < html.indexOf("hero-grid"),
  noFilterHint: !html.includes("select-filter-hint"),
  statusId: html.includes('id="select-status-text"'),
  progressId: html.includes('id="select-progress-fill"'),
  selectRows: select.includes("grid-template-rows: auto auto auto;"),
  layoutRows: layout.includes("grid-template-rows: auto auto minmax(0, 1fr);"),
  duelMerged: duel.includes("#screen-select .select-merged-bar"),
  kidsMerged: kids.includes("#screen-select .select-merged-bar"),
  buttons:
    html.includes('id="btn-random"') &&
    html.includes('id="btn-clear"') &&
    html.includes('id="btn-start"'),
};

console.log(JSON.stringify(result, null, 2));
console.log("allPass:", Object.values(result).every(Boolean));
