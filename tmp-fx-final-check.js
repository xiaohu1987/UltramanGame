const fs = require('fs');

const battle = fs.readFileSync('js/battle.js', 'utf8');
const ui = fs.readFileSync('js/ui.js', 'utf8');
const fx = fs.readFileSync('js/fx.js', 'utf8');
const css = fs.readFileSync('css/arcade-fx.css', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const main = fs.readFileSync('js/main.js', 'utf8');

const report = {
  files: {
    fx: fs.existsSync('js/fx.js'),
    css: fs.existsSync('css/arcade-fx.css'),
    baseline: fs.existsSync('docs/arcade-fx-baseline.md'),
    spec: fs.existsSync('docs/arcade-fx-spec.md'),
    verification: fs.existsSync('docs/arcade-fx-verification.md'),
  },
  indexIncludes: {
    fxJs: index.includes('js/fx.js'),
    arcadeCss: index.includes('css/arcade-fx.css'),
  },
  battle: {
    onFx: battle.includes('this.onFx(result)'),
    critChance: battle.includes('critChance'),
  },
  ui: {
    playBattleFx: ui.includes('playBattleFx'),
    playResult: ui.includes('playResult'),
    playUi: ui.includes('playUi'),
  },
  main: {
    arcadeFxInit: main.includes('ArcadeFX'),
  },
  fx: {
    particleCap: /MAX_PARTICLES\s*=\s*180/.test(fx),
    lowFps: fx.includes('LOW_FPS_THRESHOLD'),
    flashCap: fx.includes('Math.min(0.75, amount)') || fx.includes('Math.min(0.75'),
    shakeCap: /Math\.min\(\s*16\s*,/.test(fx) || fx.includes('Math.min(16'),
    hasTrigger: fx.includes('trigger('),
    hasPlayBattleFx: fx.includes('playBattleFx'),
    hasPlayResult: fx.includes('playResult'),
    hasPlayUi: fx.includes('playUi'),
    hasSfx: fx.includes('sfx(name') || fx.includes('sfx(name,'),
    hasAudio: fx.includes('AudioContext'),
  },
  css: {
    comboHud: css.includes('fx-combo-hud'),
    actionBar: css.includes('.action-bar'),
  },
};

const requiredSpecs = [
  'ui_click',
  'select',
  'battle_start',
  'hit',
  'crit',
  'heal',
  'buff',
  'debuff',
  'ko',
  'combo',
  'victory',
  'defeat',
];
report.specs = Object.fromEntries(requiredSpecs.map((k) => [k, new RegExp(`\\b${k}\\s*:`).test(fx)]));
report.allOk =
  Object.values(report.files).every(Boolean) &&
  Object.values(report.indexIncludes).every(Boolean) &&
  Object.values(report.battle).every(Boolean) &&
  Object.values(report.ui).every(Boolean) &&
  Object.values(report.main).every(Boolean) &&
  Object.values(report.fx).every(Boolean) &&
  Object.values(report.css).every(Boolean) &&
  Object.values(report.specs).every(Boolean);

console.log(JSON.stringify(report, null, 2));
process.exit(report.allOk ? 0 : 1);
