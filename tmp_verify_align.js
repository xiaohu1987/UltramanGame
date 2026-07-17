const fs = require("fs");
const path = require("path");

const files = {
  select: fs.readFileSync(path.join("css", "select-ui.css"), "utf8"),
  layout: fs.readFileSync(path.join("css", "layout-fit.css"), "utf8"),
  duel: fs.readFileSync(path.join("css", "duel-table.css"), "utf8"),
  kids: fs.readFileSync(path.join("css", "kids-ui.css"), "utf8"),
  style: fs.readFileSync(path.join("css", "style.css"), "utf8"),
  html: fs.readFileSync("index.html", "utf8"),
};

const checks = {
  htmlHasPanelActions: files.html.includes('class="panel-actions select-actions"'),
  selectResetsPanelActions:
    files.select.includes(".select-merged-bar .select-actions.panel-actions") &&
    files.select.includes("margin: 0") &&
    files.select.includes("height: 40px"),
  layoutResetsPanelActions:
    files.layout.includes(".select-merged-bar .select-actions.panel-actions") &&
    files.layout.includes("margin: 0") &&
    files.layout.includes("height: 40px"),
  duelResetsPanelActions:
    files.duel.includes(".select-merged-bar .select-actions.panel-actions") &&
    files.duel.includes("margin: 0") &&
    files.duel.includes("height: 40px"),
  kidsResetsPanelActions:
    files.kids.includes(".select-merged-bar .select-actions.panel-actions") &&
    files.kids.includes("margin: 0") &&
    files.kids.includes("height: 40px"),
  styleStillHasPanelMargin: files.style.includes(".panel-actions") && files.style.includes("margin-top: 14px"),
};

console.log(JSON.stringify(checks, null, 2));
if (Object.entries(checks).some(([k, v]) => k !== "styleStillHasPanelMargin" && !v)) {
  process.exit(1);
}
