const fs = require("fs");

// Fix fx.js sfx
{
  const p = "js/fx.js";
  let t = fs.readFileSync(p, "utf8");
  if (!t.includes('case "urgency"')) {
    t = t.replace(
      `        case "defeat":
          this.playTone({ freq: 300, dur: 0.16, type: "sawtooth", gain: 0.12 * i, slide: -120 });
          this.playTone({ freq: 180, dur: 0.22, type: "square", gain: 0.1 * i, delay: 0.1, slide: -80 });
          break;
        default:`,
      `        case "defeat":
          this.playTone({ freq: 300, dur: 0.16, type: "sawtooth", gain: 0.12 * i, slide: -120 });
          this.playTone({ freq: 180, dur: 0.22, type: "square", gain: 0.1 * i, delay: 0.1, slide: -80 });
          break;
        case "urgency":
          this.playTone({ freq: 880, dur: 0.05, type: "square", gain: 0.08 * i, slide: 40 });
          this.playTone({ freq: 660, dur: 0.06, type: "triangle", gain: 0.07 * i, delay: 0.03, slide: -80 });
          this.playNoise({ dur: 0.03, gain: 0.04 * i, delay: 0.01 });
          break;
        case "math_ok":
          this.playTone({ freq: 523, dur: 0.07, type: "triangle", gain: 0.1 * i, slide: 120 });
          this.playTone({ freq: 784, dur: 0.09, type: "sine", gain: 0.09 * i, delay: 0.05, slide: 160 });
          this.playTone({ freq: 1046, dur: 0.1, type: "triangle", gain: 0.07 * i, delay: 0.1 });
          break;
        case "math_fail":
          this.playNoise({ dur: 0.06, gain: 0.1 * i });
          this.playTone({ freq: 240, dur: 0.1, type: "sawtooth", gain: 0.12 * i, slide: -120 });
          this.playTone({ freq: 140, dur: 0.14, type: "square", gain: 0.1 * i, delay: 0.05, slide: -60 });
          break;
        default:`
    );
    fs.writeFileSync(p, t, "utf8");
  }
  console.log("fx", t.includes('case "urgency"'));
}

// Fix battle constructor difficulty + applySkill fully
{
  const p = "js/battle.js";
  let t = fs.readFileSync(p, "utf8");

  if (!t.includes("this.difficulty =")) {
    t = t.replace(
      "      this.autoBattle = !!options.autoBattle;\n      this.resolveDelay = options.resolveDelay || 900;",
      `      this.autoBattle = !!options.autoBattle;
      this.difficulty =
        window.MathChallenge && window.MathChallenge.isDifficultyId(options.difficulty)
          ? options.difficulty
          : (window.MathChallenge && window.MathChallenge.DEFAULT_DIFFICULTY) || "easy";
      this.resolveDelay = options.resolveDelay || 900;`
    );
  }

  // Replace entire applySkill method
  const start = t.indexOf("    applySkill(actor, skill, target)");
  const end = t.indexOf("    clearAutoTimer()", start);
  if (start < 0 || end < 0) {
    console.error("applySkill range missing", start, end);
    process.exit(1);
  }

  const method = `    applySkill(actor, skill, target, modifier = {}) {
      const powerMul = Number.isFinite(modifier.powerMul) ? modifier.powerMul : 1;
      const forceMiss = !!modifier.forceMiss;
      const forceFail = !!modifier.forceFail;
      const boostedPower = (base) => {
        const n = Number(base) || 0;
        return n * (powerMul > 0 ? powerMul : 1);
      };
      const effectivePower = boostedPower(skill.power);
      const markBoost = (fxObj) => {
        if (powerMul > 1.001 && fxObj && fxObj.message) {
          fxObj.message += "（心算强化）";
          fxObj.mathBoosted = true;
        }
        return fxObj;
      };

      // 答错/超时：攻击 Miss，治疗/Buff/复活失败
      if (forceMiss || forceFail) {
        const damageTypes = [SKILL_TYPES.DAMAGE, SKILL_TYPES.DAMAGE_ALL, SKILL_TYPES.MULTI_HIT, SKILL_TYPES.LIFESTEAL];
        const isDamage = damageTypes.includes(skill.type);
        const fxFail = {
          actorUid: actor.uid,
          targetUid: target ? target.uid : actor.uid,
          skillType: skill.type,
          amount: 0,
          crit: false,
          skillPower: skill.power || 1,
          skillName: skill.name || "",
          message: "",
          missed: isDamage,
          failed: !isDamage,
        };
        if (isDamage) {
          fxFail.message = \`\${actor.name} 使用 \${skill.name}…心算失败，攻击落空！\`;
        } else {
          fxFail.message = \`\${actor.name} 使用 \${skill.name}…心算失败，效果没有发动\`;
        }
        return fxFail;
      }

      const fx = {
        actorUid: actor.uid,
        targetUid: target.uid,
        skillType: skill.type,
        amount: 0,
        crit: false,
        skillPower: skill.power || 1,
        skillName: skill.name || "",
        message: "",
      };

      const damageTypes = [SKILL_TYPES.DAMAGE, SKILL_TYPES.DAMAGE_ALL, SKILL_TYPES.MULTI_HIT, SKILL_TYPES.LIFESTEAL];
      if (damageTypes.includes(skill.type)) {
        const targets = skill.target === TARGET_TYPES.ALL_ENEMIES ? this.getValidTargets(actor, skill) : [target];
        const hits = skill.type === SKILL_TYPES.MULTI_HIT ? skill.hits || 3 : 1;
        const outcomes = [];
        targets.forEach((victim) => {
          for (let hit = 0; hit < hits && victim.alive; hit += 1) {
            outcomes.push({ target: victim, ...this.dealDamage(actor, victim, effectivePower) });
          }
        });
        const total = outcomes.reduce((sum, outcome) => sum + outcome.amount, 0);
        const dodges = outcomes.filter((outcome) => outcome.dodged).length;
        const defeated = outcomes.filter((outcome) => outcome.defeated).map((outcome) => outcome.target.name);
        fx.targetUid = targets[0] ? targets[0].uid : target.uid;
        fx.amount = total;
        fx.crit = outcomes.some((outcome) => outcome.crit);
        fx.targets = targets.map((unit) => unit.uid);
        fx.targetAmounts = outcomes.reduce((amounts, outcome) => {
          amounts[outcome.target.uid] = (amounts[outcome.target.uid] || 0) + outcome.amount;
          return amounts;
        }, {});
        fx.hits = hits;
        fx.message = \`\${actor.name} 使用 \${skill.name}，造成 \${total} 点伤害\`;
        if (dodges) fx.message += \`，\${dodges} 次被闪避\`;
        if (defeated.length) fx.message += \`，\${defeated.join("、")} 倒下\`;
        if (skill.type === SKILL_TYPES.LIFESTEAL) {
          const heal = Math.min(actor.maxHp - actor.hp, Math.round(total * (skill.lifeSteal || 0.4)));
          actor.hp += heal;
          fx.healAmount = heal;
          fx.message += \`，吸血 +\${heal}\`;
        }
        return markBoost(fx);
      }

      if (skill.type === SKILL_TYPES.HEAL_ALL) {
        const targets = this.getValidTargets(actor, skill);
        const targetAmounts = {};
        const total = targets.reduce((sum, unit) => {
          const before = unit.hp;
          unit.hp = Math.min(unit.maxHp, unit.hp + Math.round(unit.maxHp * effectivePower));
          const healed = unit.hp - before;
          targetAmounts[unit.uid] = healed;
          return sum + healed;
        }, 0);
        fx.targetUid = targets[0] ? targets[0].uid : actor.uid;
        fx.targets = targets.map((unit) => unit.uid);
        fx.targetAmounts = targetAmounts;
        fx.amount = total;
        fx.message = \`\${actor.name} 使用 \${skill.name}，全体恢复 +\${total}\`;
        return markBoost(fx);
      }

      if (skill.type === SKILL_TYPES.REVIVE || skill.type === SKILL_TYPES.REVIVE_ALL) {
        const targets = skill.type === SKILL_TYPES.REVIVE_ALL ? this.getValidTargets(actor, skill) : [target];
        const revived = targets.map((unit) => ({ unit, hp: this.reviveUnit(unit, Math.min(1, effectivePower)) }));
        fx.targetUid = revived[0] ? revived[0].unit.uid : actor.uid;
        fx.targets = revived.map((entry) => entry.unit.uid);
        fx.targetAmounts = revived.reduce((amounts, entry) => {
          amounts[entry.unit.uid] = entry.hp;
          return amounts;
        }, {});
        fx.amount = revived.reduce((sum, entry) => sum + entry.hp, 0);
        fx.message = \`\${actor.name} 使用 \${skill.name}，复活 \${revived.map((entry) => entry.unit.name).join("、")}\`;
        return markBoost(fx);
      }

      if (skill.type === SKILL_TYPES.DODGE) {
        target.buffs = target.buffs.filter((effect) => effect.kind !== "dodge");
        target.buffs.push({ kind: "dodge", value: effectivePower, turnsLeft: skill.duration || 2, label: "闪避" });
        fx.amount = Math.round(effectivePower * 100);
        fx.message = \`\${actor.name} 使用 \${skill.name}，获得闪避\`;
        return markBoost(fx);
      }

      if (skill.type === SKILL_TYPES.POISON) {
        target.buffs = target.buffs.filter((effect) => effect.kind !== "poison");
        target.buffs.push({ kind: "poison", value: effectivePower, turnsLeft: skill.duration || 3, label: "中毒" });
        fx.amount = Math.round(target.maxHp * effectivePower);
        fx.message = \`\${actor.name} 使用 \${skill.name}，\${target.name} 陷入中毒\`;
        return markBoost(fx);
      }

      if (skill.type === SKILL_TYPES.DAMAGE) {
        const raw = actor.atk * effectivePower;
        const mitigated = Math.max(8, Math.round(raw - target.def * 0.55));
        const variance = Math.round(mitigated * (0.92 + Math.random() * 0.16));
        const critChance = Math.min(0.42, 0.12 + Math.max(0, effectivePower - 1) * 0.16);
        const isCrit = Math.random() < critChance;
        const dmg = Math.max(1, Math.round(variance * (isCrit ? 1.55 : 1)));
        target.hp = Math.max(0, target.hp - dmg);
        fx.amount = dmg;
        fx.crit = isCrit;
        fx.message = isCrit
          ? \`\${actor.name} 暴击 \${target.name} -\${dmg}！\`
          : \`\${actor.name} 打 \${target.name} -\${dmg}\`;
        if (target.hp <= 0) {
          target.alive = false;
          target.hp = 0;
          fx.message += \` \${target.name} 倒下！\`;
        }
        return markBoost(fx);
      }

      if (skill.type === SKILL_TYPES.HEAL) {
        const heal = Math.round(target.maxHp * effectivePower);
        const before = target.hp;
        target.hp = Math.min(target.maxHp, target.hp + heal);
        const actual = target.hp - before;
        fx.amount = actual;
        fx.message = \`\${actor.name} 治疗 \${target.name} +\${actual}\`;
        return markBoost(fx);
      }

      if (skill.type === SKILL_TYPES.BUFF_ATK) {
        const duration = skill.duration || 2;
        target.buffs = target.buffs.filter((b) => b.kind !== "atk");
        target.buffs.push({
          kind: "atk",
          value: effectivePower,
          turnsLeft: duration,
          label: "攻击提升",
        });
        this.recalcStats(target);
        fx.amount = Math.round(effectivePower * 100);
        fx.message = \`\${actor.name} 让 \${target.name} 变强！\`;
        return markBoost(fx);
      }

      if (skill.type === SKILL_TYPES.DEBUFF_DEF) {
        const duration = skill.duration || 2;
        target.buffs = target.buffs.filter((b) => b.kind !== "def");
        target.buffs.push({
          kind: "def",
          value: -effectivePower,
          turnsLeft: duration,
          label: "防御下降",
        });
        this.recalcStats(target);
        fx.amount = Math.round(effectivePower * 100);
        fx.message = \`\${actor.name} 削弱 \${target.name}！\`;
        return markBoost(fx);
      }

      fx.message = \`\${actor.name} 用了 \${skill.name}\`;
      return markBoost(fx);
    }

`;

  t = t.slice(0, start) + method + t.slice(end);

  // normalize snapshot indentation
  t = t.replace(
    "        autoBattle: this.autoBattle,\n      difficulty: this.difficulty,",
    "        autoBattle: this.autoBattle,\n        difficulty: this.difficulty,"
  );

  fs.writeFileSync(p, t, "utf8");
  console.log("battle fixed", {
    difficultyField: t.includes("this.difficulty ="),
    applyMod: t.includes("applySkill(actor, skill, target, modifier = {})"),
    forceMiss: t.includes("forceMiss || forceFail"),
    effectivePower: t.includes("const effectivePower = boostedPower(skill.power)"),
  });
}
