const fs = require("fs");
const vm = require("vm");

function load(file, sandbox) {
  vm.runInContext(fs.readFileSync(file, "utf8"), sandbox, { filename: file });
}

function createEl(tag = "div") {
  const el = {
    tag,
    style: {},
    className: "",
    hidden: false,
    value: "",
    disabled: false,
    children: [],
    attrs: {},
    id: "",
    textContent: "",
    _innerHTML: "",
    setAttribute(k, v) {
      this.attrs[k] = String(v);
      if (k === "id") this.id = String(v);
    },
    getAttribute(k) {
      return this.attrs[k];
    },
    classList: {
      _set: new Set(),
      add(c) {
        this._set.add(c);
      },
      remove(c) {
        this._set.delete(c);
      },
      toggle(c, on) {
        if (on === false) this.remove(c);
        else if (on === true) this.add(c);
        else if (this._set.has(c)) this.remove(c);
        else this.add(c);
      },
      contains(c) {
        return this._set.has(c);
      },
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    querySelector(sel) {
      if (sel.startsWith("#")) {
        const id = sel.slice(1);
        const walk = (n) => {
          if (n.id === id || n.attrs.id === id) return n;
          for (const c of n.children || []) {
            const hit = walk(c);
            if (hit) return hit;
          }
          return null;
        };
        return walk(this);
      }
      if (sel.startsWith(".")) {
        const cls = sel.slice(1);
        const walk = (n) => {
          if (n.classList && n.classList.contains(cls)) return n;
          for (const c of n.children || []) {
            const hit = walk(c);
            if (hit) return hit;
          }
          return null;
        };
        return walk(this);
      }
      return null;
    },
    focus() {},
    select() {},
  };
  Object.defineProperty(el, "innerHTML", {
    set(html) {
      this._innerHTML = String(html || "");
      this.children = [];
      const ids = [...this._innerHTML.matchAll(/id=\"([^\"]+)\"/g)].map((m) => m[1]);
      ids.forEach((id) => {
        const child = createEl(id.includes("input") ? "input" : id.includes("form") ? "form" : "div");
        child.id = id;
        child.attrs.id = id;
        if (id.includes("input")) child.value = "";
        this.children.push(child);
        byId[id] = child;
      });
      const progress = createEl("circle");
      progress.classList.add("math-timer-progress");
      this.children.push(progress);
      // also register root if it has id in attrs later
    },
    get() {
      return this._innerHTML;
    },
  });
  return el;
}

const store = {};
const byId = {};
const body = createEl("body");
const sandbox = {
  console,
  Math,
  Number,
  String,
  Boolean,
  Array,
  Object,
  Set,
  Map,
  JSON,
  performance: { now: () => Date.now() },
  requestAnimationFrame: (cb) => setTimeout(() => cb(Date.now()), 0),
  cancelAnimationFrame: (id) => clearTimeout(id),
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  localStorage: {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    },
  },
  document: {
    body,
    createElement: (tag) => createEl(tag),
    getElementById: (id) => byId[id] || null,
    addEventListener() {},
    removeEventListener() {},
  },
  window: {},
};
sandbox.window = sandbox;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.ArcadeFX = { sfx() {} };
sandbox.document.body.appendChild = (node) => {
  body.children.push(node);
  if (node.id) byId[node.id] = node;
  return node;
};

vm.createContext(sandbox);
load("js/math-challenge.js", sandbox);

sandbox.window.GameData = {
  SKILL_TYPES: {
    DAMAGE: "damage",
    DAMAGE_ALL: "damage_all",
    MULTI_HIT: "multi_hit",
    LIFESTEAL: "lifesteal",
    HEAL: "heal",
    HEAL_ALL: "heal_all",
    REVIVE: "revive",
    REVIVE_ALL: "revive_all",
    DODGE: "dodge",
    POISON: "poison",
    BUFF_ATK: "buff_atk",
    DEBUFF_DEF: "debuff_def",
  },
  TARGET_TYPES: {
    ENEMY: "enemy",
    ALLY: "ally",
    ALL_ENEMIES: "all_enemies",
    ALL_ALLIES: "all_allies",
    SELF: "self",
  },
};
load("js/battle.js", sandbox);

const MC = sandbox.window.MathChallenge;
const assert = (c, m) => {
  if (!c) throw new Error(m);
};

// T2 rules
assert(MC.listDifficulties().length === 4, "4 tiers");
assert(MC.getDifficulty("easy").enabled === false, "easy disabled");
assert(MC.getDifficulty("normal").max === 10, "normal 10");
assert(MC.getDifficulty("hard").max === 20, "hard 20");
assert(MC.getDifficulty("hell").max === 100, "hell 100");
assert(MC.getDifficulty("normal").timeLimit === 30, "30s");
assert(MC.buildResolveModifier("hard", true).powerMul === 1.05, "+5%");
assert(MC.buildResolveModifier("hard", false).forceMiss === true, "wrong miss");
assert(MC.judgeAnswer("", 1) === false, "empty wrong");
assert(MC.judgeAnswer("12x", 12) === false, "non-int wrong");
assert(MC.judgeAnswer("12", 12) === true, "int ok");

// persistence
MC.saveDifficultyId("hard");
assert(MC.loadDifficultyId() === "hard", "persist hard");
MC.saveDifficultyId("easy");
assert(MC.loadDifficultyId() === "easy", "persist easy");

// easy prompt skips
MC.promptChallenge({ difficultyId: "easy" }).then((r) => {
  assert(r.skipped === true, "easy skip");
  assert(r.powerMul === 1, "easy no bonus");
});

// battle modifiers
function unit(side, name, hp = 1000) {
  return {
    uid: `${side}-${name}`,
    name,
    side,
    alive: true,
    hp,
    maxHp: 1000,
    atk: 100,
    def: 10,
    baseAtk: 100,
    baseDef: 10,
    buffs: [],
    skills: [],
  };
}

const engine = new sandbox.window.BattleEngine({
  heroes: [unit("hero", "迪迦")],
  monsters: [unit("monster", "贝蒙斯坦")],
  difficulty: "normal",
  onUpdate() {},
  onLog() {},
  onFx() {},
  onEnd() {},
});
assert(engine.difficulty === "normal", "engine difficulty");

const actor = engine.heroes[0];
const target = engine.monsters[0];
const atk = { id: "a", name: "光线", type: "damage", power: 1, cooldown: 0, currentCd: 0, target: "enemy" };
const heal = { id: "h", name: "治疗", type: "heal", power: 0.2, cooldown: 0, currentCd: 0, target: "ally" };
const buff = { id: "b", name: "强化", type: "buff_atk", power: 0.3, duration: 2, cooldown: 0, currentCd: 0, target: "ally" };

const miss = engine.applySkill(actor, atk, target, { forceMiss: true, forceFail: true, powerMul: 0 });
assert(miss.amount === 0 && target.hp === 1000, "attack miss");
assert(/落空/.test(miss.message), "miss text");

const ally = unit("hero", "盖亚", 200);
const failHeal = engine.applySkill(actor, heal, ally, { forceMiss: true, forceFail: true, powerMul: 0 });
assert(ally.hp === 200, "heal fail");
assert(/没有发动|失败/.test(failHeal.message), "heal fail text");

const ally2 = unit("hero", "戴拿", 200);
const failBuff = engine.applySkill(actor, buff, ally2, { forceMiss: true, forceFail: true, powerMul: 0 });
assert((ally2.buffs || []).length === 0, "buff fail");
assert(/没有发动|失败/.test(failBuff.message), "buff fail text");

const t2 = unit("monster", "哥莫拉");
const ok = engine.applySkill(actor, atk, t2, { powerMul: 1.05 });
assert(ok.amount > 0 && ok.mathBoosted === true, "boost damage");

// monster side should not require challenge by design (enabled check uses hero side in resolveAction)
const monster = unit("monster", "雷德王");
const hero = unit("hero", "初代");
const mEngine = new sandbox.window.BattleEngine({
  heroes: [hero],
  monsters: [monster],
  difficulty: "hell",
  onUpdate() {},
  onLog() {},
  onFx() {},
  onEnd() {},
});
// direct apply still works for monster without challenge wrapper
const mSkill = { id: "m", name: "撞击", type: "damage", power: 1, cooldown: 0, currentCd: 0, target: "enemy" };
const mHit = mEngine.applySkill(monster, mSkill, hero, { powerMul: 1 });
assert(mHit.amount > 0, "monster can still hit");

// static file wiring
const html = fs.readFileSync("index.html", "utf8");
const main = fs.readFileSync("js/main.js", "utf8");
const battle = fs.readFileSync("js/battle.js", "utf8");
const ui = fs.readFileSync("js/ui.js", "utf8");
const fx = fs.readFileSync("js/fx.js", "utf8");
assert(html.includes("difficulty-picker"), "html picker");
assert(html.includes("math-challenge.js"), "html script");
assert(html.includes("math-challenge.css"), "html css");
assert(main.includes("difficulty: difficultyId"), "main pass difficulty");
assert(main.includes("onDifficultyChange"), "main bind difficulty");
assert(battle.includes("promptChallenge"), "battle intercept");
assert(battle.includes("forceMiss || forceFail"), "battle fail path");
assert(ui.includes("setDifficultyUi"), "ui difficulty");
assert(fx.includes('case "urgency"'), "fx urgency");
assert(fx.includes('case "math_ok"'), "fx ok");
assert(fx.includes('case "math_fail"'), "fx fail");

setTimeout(() => {
  console.log("BOUNDARY_VERIFY_OK");
}, 30);
