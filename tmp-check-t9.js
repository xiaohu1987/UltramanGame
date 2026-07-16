const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const ui = fs.readFileSync("js/ui.js", "utf8");
const main = fs.readFileSync("js/main.js", "utf8");
const battle = fs.readFileSync("js/battle.js", "utf8");
const battleCss = fs.readFileSync("css/battle-ui.css", "utf8");
const selectCss = fs.readFileSync("css/select-ui.css", "utf8");
const styleCss = fs.readFileSync("css/style.css", "utf8");

const checks = {
  // 短文案
  shortSelectCopy:
    html.includes("点下面小图选奥特曼") &&
    html.includes("再选 3 个") &&
    html.includes("开战！") &&
    html.includes("空位"),
  shortBattleCopy:
    html.includes("准备出手") &&
    html.includes("自动：关") &&
    html.includes(">取消<") &&
    ui.includes("点高亮目标") &&
    ui.includes("点一个技能") &&
    ui.includes("自动中…"),
  shortLogs:
    battle.includes('this.onLog("开战！")') &&
    battle.includes("第 ${this.turn} 回合") &&
    main.includes("自动：开") &&
    !main.includes('UI.appendLog("开战！")'),

  // 按钮/状态
  startDisabledGate: html.includes("btn-start") && html.includes("disabled"),
  startReadyClass: ui.includes('classList.toggle("ready"') && selectCss.includes("#btn-start.ready"),
  selectSelectedState: ui.includes(" selected") && selectCss.includes(".select-card.selected"),
  selectLockedState: ui.includes(" locked") && selectCss.includes(".select-card.locked"),
  currentState: ui.includes(" current") && styleCss.includes(".fighter-card.current"),
  targetableState: ui.includes("targetable") && styleCss.includes(".fighter-card.targetable"),
  dimmedState: ui.includes("dimmed") && styleCss.includes(".fighter-card.dimmed"),
  autoToggleActive: ui.includes('classList.toggle("active"') && battleCss.includes(".btn.auto-toggle.active"),
  autoLocked: ui.includes("auto-locked") && battleCss.includes(".skill-buttons.auto-locked"),
  skillDisabled: styleCss.includes(".skill-btn:disabled"),

  // 无误导旧文案
  noOldLongLogs:
    !main.includes("站位锁定") &&
    !main.includes("奥特曼小队迎战") &&
    !ui.includes("请选择技能") &&
    !html.includes("取消目标") &&
    !html.includes("自动战斗：关"),
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
