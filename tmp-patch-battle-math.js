const fs = require("fs");

function patchIndex() {
  const p = "index.html";
  let t = fs.readFileSync(p, "utf8");
  if (!t.includes("css/math-challenge.css")) {
    t = t.replace(
      '<link rel="stylesheet" href="css/turn-order.css?v=1" />',
      '<link rel="stylesheet" href="css/turn-order.css?v=1" />\n  <link rel="stylesheet" href="css/math-challenge.css?v=difficulty-1" />'
    );
  }
  // bump ui/main cache lightly via existing math script already present
  fs.writeFileSync(p, t, "utf8");
  console.log("index css", t.includes("math-challenge.css"));
}

function patchFx() {
  const p = "js/fx.js";
  let t = fs.readFileSync(p, "utf8");
  if (!t.includes('case "urgency"')) {
    t = t.replace(
      '        case "defeat":\n          this.playTone({ freq: 300, dur: 0.16, type: "sawtooth", gain: 0.12 * i, slide: -120 });\n          this.playTone({ freq: 180, dur: 0.22, type: "square", gain: 0.1 * i, delay: 0.1, slide: -80 });\n          break;\n        default:',
      '        case "defeat":\n          this.playTone({ freq: 300, dur: 0.16, type: "sawtooth", gain: 0.12 * i, slide: -120 });\n          this.playTone({ freq: 180, dur: 0.22, type: "square", gain: 0.1 * i, delay: 0.1, slide: -80 });\n          break;\n        case "urgency":\n          this.playTone({ freq: 880, dur: 0.05, type: "square", gain: 0.08 * i, slide: 40 });\n          this.playTone({ freq: 660, dur: 0.06, type: "triangle", gain: 0.07 * i, delay: 0.03, slide: -80 });\n          this.playNoise({ dur: 0.03, gain: 0.04 * i, delay: 0.01 });\n          break;\n        case "math_ok":\n          this.playTone({ freq: 523, dur: 0.07, type: "triangle", gain: 0.1 * i, slide: 120 });\n          this.playTone({ freq: 784, dur: 0.09, type: "sine", gain: 0.09 * i, delay: 0.05, slide: 160 });\n          this.playTone({ freq: 1046, dur: 0.1, type: "triangle", gain: 0.07 * i, delay: 0.1 });\n          break;\n        case "math_fail":\n          this.playNoise({ dur: 0.06, gain: 0.1 * i });\n          this.playTone({ freq: 240, dur: 0.1, type: "sawtooth", gain: 0.12 * i, slide: -120 });\n          this.playTone({ freq: 140, dur: 0.14, type: "square", gain: 0.1 * i, delay: 0.05, slide: -60 });\n          break;\n        default:'
    );
    fs.writeFileSync(p, t, "utf8");
  }
  console.log("fx sfx", t.includes('case "urgency"') && t.includes('case "math_ok"'));
}

function patchBattle() {
  const p = "js/battle.js";
  let t = fs.readFileSync(p, "utf8");

  if (!t.includes("this.difficulty")) {
    t = t.replace(
      "      this.autoBattle = !!options.autoBattle;\n      this.resolveDelay = options.resolveDelay || 900;",
      "      this.autoBattle = !!options.autoBattle;\n      this.difficulty =\n        (window.MathChallenge && window.MathChallenge.isDifficultyId(options.difficulty)\n          ? options.difficulty\n          : (window.MathChallenge && window.MathChallenge.DEFAULT_DIFFICULTY) || \"easy\");\n      this.resolveDelay = options.resolveDelay || 900;"
    );
  }

  // Replace resolveAction with async-capable version
  const resolveStart = "    resolveAction(actor, skill, target) {";
  const resolveEnd = "    applySkill(actor, skill, target) {";
  const startIdx = t.indexOf(resolveStart);
  const endIdx = t.indexOf(resolveEnd);
  if (startIdx < 0 || endIdx < 0) {
    console.error("resolveAction markers missing");
    process.exit(1);
  }

  const newResolve = `    resolveAction(actor, skill, target) {
      if (this.busy || this.phase === PHASE.ENDED) return;
      this.busy = true;
      this.phase = PHASE.RESOLVING;
      this.pendingSkill = null;
      this.clearAutoTimer();
      // 结算阶段保留出手快照：手动/自动奥特曼、怪兽 AI 都展示，避免技能区空白
      if (skill && actor) {
        this.autoChoice = {
          skill,
          target,
          skillId: skill.id,
          skillName: skill.name,
          targetUid: target ? target.uid : null,
          targetName: target ? target.name : "",
        };
      }

      if (skill.cooldown > 0) skill.currentCd = skill.cooldown;

      const finishResolve = (result) => {
        // 先刷新数值 DOM，再播特效，避免 re-render 冲掉动画节点
        this.onUpdate(this.snapshot());
        this.onFx(result);
        this.onLog(result.message, result.skillType);

        setTimeout(() => {
          this.busy = false;
          if (this.checkEnd()) return;
          this.nextActor();
        }, this.resolveDelay);
      };

      const runApply = (modifier) => {
        const result = this.applySkill(actor, skill, target, modifier || {});
        finishResolve(result);
      };

      const needsChallenge =
        actor &&
        actor.side === "hero" &&
        window.MathChallenge &&
        typeof window.MathChallenge.promptChallenge === "function" &&
        window.MathChallenge.getDifficulty(this.difficulty).enabled;

      if (!needsChallenge) {
        runApply({ powerMul: 1, forceMiss: false, forceFail: false, reason: "skip" });
        return;
      }

      this.onUpdate(this.snapshot());
      this.onLog(\`\${actor.name} 心算准备中…\`);

      window.MathChallenge.promptChallenge({
        difficultyId: this.difficulty,
        skillName: skill.name,
        actorName: actor.name,
      })
        .then((challenge) => {
          if (this.phase === PHASE.ENDED) return;
          if (challenge.skipped) {
            runApply({ powerMul: 1, forceMiss: false, forceFail: false, reason: "skip" });
            return;
          }
          if (challenge.correct) {
            this.onLog("心算成功！威力提升");
            runApply({
              powerMul: challenge.powerMul || 1.05,
              forceMiss: false,
              forceFail: false,
              reason: "correct",
            });
            return;
          }
          const timed = challenge.timedOut || challenge.reason === "timeout";
          this.onLog(timed ? "心算超时…技能失败" : "心算失败…技能落空");
          runApply({
            powerMul: 0,
            forceMiss: true,
            forceFail: true,
            reason: timed ? "timeout" : "wrong",
          });
        })
        .catch(() => {
          if (this.phase === PHASE.ENDED) return;
          this.onLog("心算中断…技能失败");
          runApply({ powerMul: 0, forceMiss: true, forceFail: true, reason: "error" });
        });
    }

`;

  t = t.slice(0, startIdx) + newResolve + t.slice(endIdx);

  // Patch applySkill signature and body for modifier
  if (!t.includes("applySkill(actor, skill, target, modifier")) {
    t = t.replace(
      "    applySkill(actor, skill, target) {\n      const fx = {",
      "    applySkill(actor, skill, target, modifier = {}) {\n      const powerMul = Number.isFinite(modifier.powerMul) ? modifier.powerMul : 1;\n      const forceMiss = !!modifier.forceMiss;\n      const forceFail = !!modifier.forceFail;\n      const boostedPower = (base) => {\n        const n = Number(base) || 0;\n        return n * (powerMul > 0 ? powerMul : 1);\n      };\n\n      // 答错/超时：攻击 Miss，治疗/Buff/复活失败\n      if (forceMiss || forceFail) {\n        const damageTypes = [SKILL_TYPES.DAMAGE, SKILL_TYPES.DAMAGE_ALL, SKILL_TYPES.MULTI_HIT, SKILL_TYPES.LIFESTEAL];\n        const isDamage = damageTypes.includes(skill.type);\n        const fxFail = {\n          actorUid: actor.uid,\n          targetUid: target ? target.uid : actor.uid,\n          skillType: skill.type,\n          amount: 0,\n          crit: false,\n          skillPower: skill.power || 1,\n          skillName: skill.name || \"\",\n          message: \"\",\n          missed: isDamage,\n          failed: !isDamage,\n        };\n        if (isDamage) {\n          fxFail.message = \`\${actor.name} 使用 \${skill.name}…心算失败，攻击落空！\`;\n        } else {\n          fxFail.message = \`\${actor.name} 使用 \${skill.name}…心算失败，效果没有发动\`;\n        }\n        return fxFail;\n      }\n\n      const fx = {"
    );
  }

  // Multiply skill.power usages carefully via local effectivePower after fx init
  if (!t.includes("const effectivePower = boostedPower(skill.power)")) {
    t = t.replace(
      "        skillName: skill.name || \"\",\n        message: \"\",\n      };\n\n      const damageTypes = [SKILL_TYPES.DAMAGE, SKILL_TYPES.DAMAGE_ALL, SKILL_TYPES.MULTI_HIT, SKILL_TYPES.LIFESTEAL];\n      if (damageTypes.includes(skill.type)) {\n        const targets = skill.target === TARGET_TYPES.ALL_ENEMIES ? this.getValidTargets(actor, skill) : [target];\n        const hits = skill.type === SKILL_TYPES.MULTI_HIT ? skill.hits || 3 : 1;\n        const outcomes = [];\n        targets.forEach((victim) => {\n          for (let hit = 0; hit < hits && victim.alive; hit += 1) {\n            outcomes.push({ target: victim, ...this.dealDamage(actor, victim, skill.power) });\n          }\n        });",
      "        skillName: skill.name || \"\",\n        message: \"\",\n      };\n\n      const effectivePower = boostedPower(skill.power);\n      const damageTypes = [SKILL_TYPES.DAMAGE, SKILL_TYPES.DAMAGE_ALL, SKILL_TYPES.MULTI_HIT, SKILL_TYPES.LIFESTEAL];\n      if (damageTypes.includes(skill.type)) {\n        const targets = skill.target === TARGET_TYPES.ALL_ENEMIES ? this.getValidTargets(actor, skill) : [target];\n        const hits = skill.type === SKILL_TYPES.MULTI_HIT ? skill.hits || 3 : 1;\n        const outcomes = [];\n        targets.forEach((victim) => {\n          for (let hit = 0; hit < hits && victim.alive; hit += 1) {\n            outcomes.push({ target: victim, ...this.dealDamage(actor, victim, effectivePower) });\n          }\n        });"
    );

    t = t.replace(
      "          unit.hp = Math.min(unit.maxHp, unit.hp + Math.round(unit.maxHp * skill.power));",
      "          unit.hp = Math.min(unit.maxHp, unit.hp + Math.round(unit.maxHp * effectivePower));"
    );
    t = t.replace(
      "        const revived = targets.map((unit) => ({ unit, hp: this.reviveUnit(unit, skill.power) }));",
      "        const revived = targets.map((unit) => ({ unit, hp: this.reviveUnit(unit, Math.min(1, effectivePower)) }));"
    );
    t = t.replace(
      "        target.buffs.push({ kind: \"dodge\", value: skill.power, turnsLeft: skill.duration || 2, label: \"闪避\" });\n        fx.amount = Math.round(skill.power * 100);",
      "        target.buffs.push({ kind: \"dodge\", value: effectivePower, turnsLeft: skill.duration || 2, label: \"闪避\" });\n        fx.amount = Math.round(effectivePower * 100);"
    );
    t = t.replace(
      "        target.buffs.push({ kind: \"poison\", value: skill.power, turnsLeft: skill.duration || 3, label: \"中毒\" });\n        fx.amount = Math.round(target.maxHp * skill.power);",
      "        target.buffs.push({ kind: \"poison\", value: effectivePower, turnsLeft: skill.duration || 3, label: \"中毒\" });\n        fx.amount = Math.round(target.maxHp * effectivePower);"
    );
    t = t.replace(
      "      if (skill.type === SKILL_TYPES.HEAL) {\n        const heal = Math.round(target.maxHp * skill.power);",
      "      if (skill.type === SKILL_TYPES.HEAL) {\n        const heal = Math.round(target.maxHp * effectivePower);"
    );
    t = t.replace(
      "        target.buffs.push({\n          kind: \"atk\",\n          value: skill.power,\n          turnsLeft: duration,\n          label: \"攻击提升\",\n        });\n        this.recalcStats(target);\n        fx.amount = Math.round(skill.power * 100);",
      "        target.buffs.push({\n          kind: \"atk\",\n          value: effectivePower,\n          turnsLeft: duration,\n          label: \"攻击提升\",\n        });\n        this.recalcStats(target);\n        fx.amount = Math.round(effectivePower * 100);"
    );
    t = t.replace(
      "        target.buffs.push({\n          kind: \"def\",\n          value: -skill.power,\n          turnsLeft: duration,\n          label: \"防御下降\",\n        });\n        this.recalcStats(target);\n        fx.amount = Math.round(skill.power * 100);",
      "        target.buffs.push({\n          kind: \"def\",\n          value: -effectivePower,\n          turnsLeft: duration,\n          label: \"防御下降\",\n        });\n        this.recalcStats(target);\n        fx.amount = Math.round(effectivePower * 100);"
    );
  }

  // Append bonus note on success messages when boosted
  if (!t.includes("mathBoosted")) {
    t = t.replace(
      "      fx.message = `${actor.name} 用了 ${skill.name}`;\n      return fx;\n    }",
      "      fx.message = `${actor.name} 用了 ${skill.name}`;\n      if (powerMul > 1.001 && fx.message) {\n        fx.message += \"（心算强化）\";\n        fx.mathBoosted = true;\n      }\n      return fx;\n    }"
    );

    // also tag earlier returns: inject helper before each return fx in applySkill is hard;
    // instead patch finish by wrapping message after apply in resolve already logs separately.
    // Add boost suffix for main damage/heal paths:
    t = t.replace(
      "        if (skill.type === SKILL_TYPES.LIFESTEAL) {\n          const heal = Math.min(actor.maxHp - actor.hp, Math.round(total * (skill.lifeSteal || 0.4)));\n          actor.hp += heal;\n          fx.healAmount = heal;\n          fx.message += `，吸血 +${heal}`;\n        }\n        return fx;\n      }",
      "        if (skill.type === SKILL_TYPES.LIFESTEAL) {\n          const heal = Math.min(actor.maxHp - actor.hp, Math.round(total * (skill.lifeSteal || 0.4)));\n          actor.hp += heal;\n          fx.healAmount = heal;\n          fx.message += `，吸血 +${heal}`;\n        }\n        if (powerMul > 1.001) {\n          fx.message += \"（心算强化）\";\n          fx.mathBoosted = true;\n        }\n        return fx;\n      }"
    );
    t = t.replace(
      "        fx.message = `${actor.name} 使用 ${skill.name}，全体恢复 +${total}`;\n        return fx;\n      }",
      "        fx.message = `${actor.name} 使用 ${skill.name}，全体恢复 +${total}`;\n        if (powerMul > 1.001) {\n          fx.message += \"（心算强化）\";\n          fx.mathBoosted = true;\n        }\n        return fx;\n      }"
    );
    t = t.replace(
      "        fx.message = `${actor.name} 治疗 ${target.name} +${actual}`;\n        return fx;\n      }",
      "        fx.message = `${actor.name} 治疗 ${target.name} +${actual}`;\n        if (powerMul > 1.001) {\n          fx.message += \"（心算强化）\";\n          fx.mathBoosted = true;\n        }\n        return fx;\n      }"
    );
  }

  // snapshot include difficulty
  if (!t.includes("difficulty: this.difficulty")) {
    t = t.replace(
      "      autoBattle: this.autoBattle,",
      "      autoBattle: this.autoBattle,\n      difficulty: this.difficulty,"
    );
  }

  fs.writeFileSync(p, t, "utf8");
  console.log("battle patched", {
    difficulty: t.includes("this.difficulty"),
    resolveAsync: t.includes("promptChallenge"),
    applyMod: t.includes("applySkill(actor, skill, target, modifier"),
    forceMiss: t.includes("forceMiss"),
  });
}

patchIndex();
patchFx();
patchBattle();
