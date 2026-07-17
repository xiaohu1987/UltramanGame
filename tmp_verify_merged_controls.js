const fs = require("fs");
const path = require("path");

const files = {
  select: fs.readFileSync(path.join("css", "select-ui.css"), "utf8"),
  layout: fs.readFileSync(path.join("css", "layout-fit.css"), "utf8"),
  duel: fs.readFileSync(path.join("css", "duel-table.css"), "utf8"),
  kids: fs.readFileSync(path.join("css", "kids-ui.css"), "utf8"),
  html: fs.readFileSync("index.html", "utf8"),
};

function hasUnifiedControls(css) {
  return (
    css.includes("#screen-select .select-merged-bar .select-progress") &&
    css.includes("#screen-select .select-merged-bar .select-actions .btn") &&
    css.includes("min-height: 40px") &&
    css.includes("height: 40px")
  );
}

const checks = {
  htmlMerged: files.html.includes("select-merged-bar") && files.html.includes("select-merged-right"),
  selectUnifiedHeight:
    files.select.includes(".select-merged-bar .select-progress") &&
    files.select.includes(".select-merged-bar .select-actions .btn") &&
    files.select.includes("min-height: 40px") &&
    files.select.includes("height: 40px"),
  layoutUnifiedHeight: hasUnifiedControls(files.layout),
  duelUnifiedHeight: hasUnifiedControls(files.duel),
  kidsPrimaryOverride:
    files.kids.includes("#screen-select .select-merged-bar .select-actions .btn.primary") &&
    files.kids.includes("min-height: 40px") &&
    files.kids.includes("height: 40px"),
  noTinyProgressPadding: !files.layout.includes("padding: 4px 7px") && !files.duel.includes("padding: 4px 7px"),
  noSelect34pxButtons:
    !/#screen-select[\s\S]{0,400}min-height:\s*34px/.test(files.layout) &&
    !/#screen-select[\s\S]{0,400}min-height:\s*34px/.test(files.duel),
};

console.log(JSON.stringify(checks, null, 2));
if (Object.values(checks).some((v) => !v)) process.exit(1);
