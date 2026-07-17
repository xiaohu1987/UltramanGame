const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadScript(file, sandbox) {
  const code = fs.readFileSync(file, "utf8");
  vm.runInContext(code, sandbox, { filename: file });
}

// Minimal DOM for MathChallenge modal
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
    listeners: {},
    parent: null,
    textContent: "",
    innerHTML: "",
    setAttribute(k, v) {
      this.attrs[k] = v;
    },
    getAttribute(k) {
      return this.attrs[k];
    },
    classList: {
      _set: new Set(),
      add(c) {
        this._set.add(c);
        el.className = [...this._set].join(" ");
      },
      remove(c) {
        this._set.delete(c);
        el.className = [...this._set].join(" ");
      },
      toggle(c, on) {
        if (on) this.add(c);
        else this.remove(c);
      },
      contains(c) {
        return this._set.has(c);
      },
    },
    appendChild(child) {
      child.parent = this;
      this.children.push(child);
      return child;
    },
    querySelector(sel) {
      // very small subset
      if (sel.startsWith("#")) {
        const id = sel.slice(1);
        const walk = (node) => {
          if (node.attrs && node.attrs.id === id) return node;
          if (node.id === id) return node;
          for (const c of node.children || []) {
            const hit = walk(c);
            if (hit) return hit;
          }
          return null;
        };
        return walk(this);
      }
      if (sel.startsWith(".")) {
        const cls = sel.slice(1);
        const walk = (node) => {
          if (node.classList && node.classList.contains(cls)) return node;
          for (const c of node.children || []) {
            const hit = walk(c);
            if (hit) return hit;
          }
          return null;
        };
        return walk(this);
      }
      return null;
    },
    querySelectorAll() {
      return [];
    },
    focus() {},
    select() {},
    addEventListener(type, fn) {
      this.listeners[type] = fn;
    },
    removeEventListener() {},
  };
  return el;
}

const store = {};
const documentEl = createEl("document");
documentEl.body = createEl("body");
const byId = {};

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
  requestAnimationFrame: (cb) => setTimeout(() => cb(Date.now()), 16),
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
    body: documentEl.body,
    createElement: (tag) => {
      const el = createEl(tag);
      // parse innerHTML roughly not needed; MathChallenge sets innerHTML string then querySelector
      // override querySelector after innerHTML assignment by building simple id map via regex
      const origSet = Object.getOwnPropertyDescriptor(el, "innerHTML");
      Object.defineProperty(el, "innerHTML", {
        set(html) {
          this._innerHTML = html;
          // create fake nodes for ids used
          const ids = [...html.matchAll(/id=\"([^\"]+)\"/g)].map((m) => m[1]);
          this.children = ids.map((id) => {
            const child = createEl("div");
            child.id = id;
            child.attrs.id = id;
            byId[id] = child;
            // input special
            if (id.includes("input")) {
              child.value = "";
              child.focus = () => {};
              child.select = () => {};
            }
            if (id.includes("form")) {
              child.onsubmit = null;
            }
            return child;
          });
          // class nodes
          const progress = createEl("circle");
          progress.classList.add("math-timer-progress");
          this.children.push(progress);
        },
        get() {
          return this._innerHTML || "";
        },
      });
      return el;
    },
    getElementById: (id) => byId[id] || null,
    addEventListener() {},
    removeEventListener() {},
  },
  window: {},
};
sandbox.window = sandbox;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.ArcadeFX = {
  sfx() {},
};

vm.createContext(sandbox);
loadScript("js/math-challenge.js", sandbox);

// data stubs for battle
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

loadScript("js/battle.js", sandbox);

const MC = sandbox.window.MathChallenge;
const assert = (c, m) => {
  if (!c) throw new Error(m);
};

// pure rules
assert(MC.getDifficulty("easy").enabled === false, "easy off");
assert(MC.getDifficulty("normal").max === 10, "normal max");
assert(MC.getDifficulty("hard").max === 20, "hard max");
assert(MC.getDifficulty("hell").max === 100, "hell max");
assert(MC.buildResolveModifier("normal", true).powerMul === 1.05, "bonus");
assert(MC.buildResolveModifier("normal", false).forceMiss === true, "miss");
assert(MC.saveDifficultyId("hell") === "hell", "save");
assert(MC.loadDifficultyId() === "hell", "load");

// non-negative questions
for (let i = 0; i < 50; i += 1) {
  const q = MC.generateQuestion(100);
  assert(q.answer >= 0, "answer non-neg");
  if (q.op === "-") assert(q.a >= q.b, "a>=b");
}

// battle applySkill modifiers
function unit(side, name) {
  return {
    uid: side + "-" + name,
    name,
    side,
    alive: true,
    hp: 1000,
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
  monsters: [unit("monster", "怪兽")],
  difficulty: "normal",
  onUpdate() {},
  onLog() {},
  onFx() {},
  onEnd() {},
});

const actor = engine.heroes[0];
const target = engine.monsters[0];
const skill = { id: "s1", name: "光线", type: "damage", power: 1, cooldown: 0, currentCd: 0, target: "enemy" };

const miss = engine.applySkill(actor, skill, target, { forceMiss: true, forceFail: true, powerMul: 0 });
assert(miss.amount === 0, "miss amount 0");
assert(target.hp === 1000, "no dmg on miss");
assert(/落空|失败/.test(miss.message), "miss msg");

const before = target.hp;
const boosted = engine.applySkill(actor, skill, { ...target, hp: 1000, maxHp: 1000, alive: true, buffs: [] }, {
  powerMul: 1.05,
});
// use fresh target
const t2 = unit("monster", "怪兽2");
engine.monsters[0] = t2;
const boosted2 = engine.applySkill(actor, skill, t2, { powerMul: 1.05 });
assert(boosted2.amount > 0, "boost dmg");
assert(boosted2.mathBoosted === true, "boost flag");

const healSkill = { id: "h1", name: "治疗", type: "heal", power: 0.2, cooldown: 0, currentCd: 0, target: "ally" };
const ally = unit("hero", "队友");
ally.hp = 100;
const failHeal = engine.applySkill(actor, healSkill, ally, { forceFail: true, forceMiss: true, powerMul: 0 });
assert(ally.hp === 100, "heal fail");
assert(/没有发动|失败/.test(failHeal.message), "heal fail msg");

const ally2 = unit("hero", "队友2");
ally2.hp = 100;
const okHeal = engine.applySkill(actor, healSkill, ally2, { powerMul: 1.05 });
assert(ally2.hp > 100, "heal ok");
assert(okHeal.mathBoosted === true, "heal boost");

// easy difficulty skips challenge path
const easyEngine = new sandbox.window.BattleEngine({
  heroes: [unit("hero", "初代")],
  monsters: [unit("monster", "敌")],
  difficulty: "easy",
  onUpdate() {},
  onLog() {},
  onFx() {},
  onEnd() {},
});
assert(easyEngine.difficulty === "easy", "easy stored");
assert(MC.getDifficulty(easyEngine.difficulty).enabled === false, "easy no challenge");

console.log("VERIFY_OK");
