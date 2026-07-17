/**
 * 回合制战斗状态机 + AI
 * 日志文案：短句，方便小朋友看
 */

(function () {
  const { SKILL_TYPES, TARGET_TYPES } = window.GameData;

  const PHASE = {
    IDLE: "idle",
    PLAYER_SELECT_SKILL: "player_select_skill",
    PLAYER_SELECT_TARGET: "player_select_target",
    RESOLVING: "resolving",
    AI_THINKING: "ai_thinking",
    ENDED: "ended",
  };

  class BattleEngine {
    /**
     * @param {Object} options
     * @param {Array} options.heroes
     * @param {Array} options.monsters
     * @param {Function} options.onUpdate
     * @param {Function} options.onLog
     * @param {Function} options.onEnd
     * @param {Function} options.onFx
     */
    constructor(options) {
      this.heroes = options.heroes;
      this.monsters = options.monsters;
      this.onUpdate = options.onUpdate || (() => {});
      this.onLog = options.onLog || (() => {});
      this.onEnd = options.onEnd || (() => {});
      this.onFx = options.onFx || (() => {});

      this.phase = PHASE.IDLE;
      this.turn = 0;
      this.queue = [];
      this.queueIndex = 0;
      this.current = null;
      this.pendingSkill = null;
      this.winner = null;
      this.busy = false;
      this.autoBattle = !!options.autoBattle;
      this.difficulty =
        window.MathChallenge && window.MathChallenge.isDifficultyId(options.difficulty)
          ? options.difficulty
          : (window.MathChallenge && window.MathChallenge.DEFAULT_DIFFICULTY) || "easy";
      this.resolveDelay = options.resolveDelay || 900;
      this.aiThinkDelay = options.aiThinkDelay || 650;
      this.autoPlayerDelay = options.autoPlayerDelay || 420;
      this.attackRampStartTurn = options.attackRampStartTurn ?? 20;
      this.attackRampPerTurn = options.attackRampPerTurn ?? 0.1;
      this._autoTimer = null;
      /** 自动战斗预选：{ skill, target, skillName, targetName } */
      this.autoChoice = null;
    }

    allUnits() {
      return [...this.heroes, ...this.monsters];
    }

    living(side) {
      if (side === "hero") return this.heroes.filter((u) => u.alive);
      if (side === "monster") return this.monsters.filter((u) => u.alive);
      return this.allUnits().filter((u) => u.alive);
    }

    getAttackRamp() {
      return Math.max(0, this.turn - this.attackRampStartTurn + 1) * this.attackRampPerTurn;
    }

    start() {
      this.turn = 0;
      this.winner = null;
      this.phase = PHASE.IDLE;
      this.onLog("开战！");
      this.beginRound();
    }

    beginRound() {
      if (this.checkEnd()) return;

      this.turn += 1;
      this.allUnits().forEach((unit) => this.recalcStats(unit));
      this.queue = this.living()
        .slice()
        .sort((a, b) => b.spd - a.spd || a.name.localeCompare(b.name, "zh"));
      this.queueIndex = 0;
      this.onLog(`第 ${this.turn} 回合`);
      const attackRampPercent = Math.round(this.getAttackRamp() * 100);
      if (attackRampPercent > 0) {
        this.onLog(`战意升温：全员攻击 +${attackRampPercent}%`);
      }
      this.nextActor();
    }

    nextActor() {
      if (this.checkEnd()) return;

      while (this.queueIndex < this.queue.length) {
        const unit = this.queue[this.queueIndex];
        this.queueIndex += 1;
        if (unit.alive) {
          this.current = unit;
          this.tickBuffs(unit);
          if (!unit.alive) {
            if (this.checkEnd()) return;
            continue;
          }
          this.tickCooldowns(unit);
          this.onUpdate(this.snapshot());

          if (unit.side === "hero") {
            this.phase = PHASE.PLAYER_SELECT_SKILL;
            this.pendingSkill = null;
            this.autoChoice = null;
            if (this.autoBattle) {
              this.onLog(`${unit.name} 自动中…`);
              this.onUpdate(this.snapshot());
              this.prepareAutoPlayer(unit);
            } else {
              this.onLog(`轮到 ${unit.name}`);
              this.onUpdate(this.snapshot());
            }
            return;
          }

          this.phase = PHASE.AI_THINKING;
          this.pendingSkill = null;
          this.autoChoice = null;
          // 怪兽回合：先预选技能，让左下技能区只读展示
          const decision = this.decideAutoPlayerAction(unit);
          if (decision && !decision.error) {
            this.autoChoice = decision;
            this.onLog(`${unit.name} 准备用 ${decision.skillName}`);
          } else {
            this.onLog(`${unit.name} 出手…`);
          }
          this.onUpdate(this.snapshot());
          setTimeout(() => this.runAiTurn(unit), this.aiThinkDelay);
          return;
        }
      }

      this.beginRound();
    }

    tickCooldowns(unit) {
      unit.skills.forEach((s) => {
        if (s.currentCd > 0) s.currentCd -= 1;
      });
    }

    tickBuffs(unit) {
      const remain = [];
      unit.buffs.forEach((b) => {
        if (b.kind === "poison" && unit.alive) {
          const damage = Math.max(1, Math.round(unit.maxHp * b.value));
          unit.hp = Math.max(0, unit.hp - damage);
          this.onLog(`${unit.name} 受到中毒伤害 -${damage}`);
          if (unit.hp <= 0) {
            unit.alive = false;
            this.onLog(`${unit.name} 被中毒击倒`);
          }
        }
        b.turnsLeft -= 1;
        if (b.turnsLeft > 0 && unit.alive) remain.push(b);
        else this.onLog(`${unit.name} 状态结束`);
      });
      unit.buffs = remain;
      this.recalcStats(unit);
    }

    recalcStats(unit) {
      let atkMul = 1;
      let defMul = 1;
      unit.buffs.forEach((b) => {
        if (b.kind === "atk") atkMul += b.value;
        if (b.kind === "def") defMul += b.value;
      });
      unit.atk = Math.max(1, Math.round(unit.baseAtk * atkMul * (1 + this.getAttackRamp())));
      unit.def = Math.max(0, Math.round(unit.baseDef * defMul));
    }

    getValidTargets(actor, skill) {
      if (!actor || !skill) return [];
      if (skill.target === TARGET_TYPES.SELF) return [actor].filter((u) => u.alive);
      if (skill.target === TARGET_TYPES.ALL_ENEMIES) {
        return (actor.side === "hero" ? this.monsters : this.heroes).filter((u) => u.alive);
      }
      if (skill.target === TARGET_TYPES.ALL_ALLIES) {
        return (actor.side === "hero" ? this.heroes : this.monsters).filter((u) => u.alive);
      }
      if (skill.target === TARGET_TYPES.DEAD_ALLY || skill.target === TARGET_TYPES.ALL_DEAD_ALLIES) {
        return (actor.side === "hero" ? this.heroes : this.monsters).filter((u) => !u.alive);
      }
      if (skill.target === TARGET_TYPES.ALLY) {
        const allies = actor.side === "hero" ? this.heroes : this.monsters;
        return allies.filter((u) => u.alive);
      }
      const enemies = actor.side === "hero" ? this.monsters : this.heroes;
      return enemies.filter((u) => u.alive);
    }

    requiresTargetSelection(skill) {
      return skill && (skill.target === TARGET_TYPES.ENEMY || skill.target === TARGET_TYPES.ALLY);
    }

    canUseSkill(actor, skill) {
      if (!actor || !skill || !actor.alive) return false;
      if (skill.currentCd > 0) return false;
      return this.getValidTargets(actor, skill).length > 0;
    }

    selectSkill(skillId) {
      if (this.phase !== PHASE.PLAYER_SELECT_SKILL || !this.current) return false;
      const skill = this.current.skills.find((s) => s.id === skillId);
      if (!skill || !this.canUseSkill(this.current, skill)) return false;

      this.pendingSkill = skill;
      const targets = this.getValidTargets(this.current, skill);

      if (!this.requiresTargetSelection(skill) || targets.length === 1) {
        this.resolveAction(this.current, skill, targets[0]);
        return true;
      }

      this.phase = PHASE.PLAYER_SELECT_TARGET;
      this.onLog(`点目标：${skill.name}`);
      this.onUpdate(this.snapshot());
      return true;
    }

    selectTarget(uid) {
      if (this.phase !== PHASE.PLAYER_SELECT_TARGET || !this.current || !this.pendingSkill) {
        return false;
      }
      const targets = this.getValidTargets(this.current, this.pendingSkill);
      const target = targets.find((t) => t.uid === uid);
      if (!target) return false;
      this.resolveAction(this.current, this.pendingSkill, target);
      return true;
    }

    cancelTarget() {
      if (this.phase !== PHASE.PLAYER_SELECT_TARGET) return;
      this.pendingSkill = null;
      this.phase = PHASE.PLAYER_SELECT_SKILL;
      this.onLog("取消了，再选技能");
      this.onUpdate(this.snapshot());
    }

    dealDamage(actor, target, power) {
      const dodge = (target.buffs || []).find((effect) => effect.kind === "dodge" && effect.turnsLeft > 0);
      if (dodge && Math.random() < dodge.value) {
        target.buffs = target.buffs.filter((effect) => effect !== dodge);
        return { amount: 0, crit: false, dodged: true, defeated: false };
      }

      const raw = actor.atk * power;
      const mitigated = Math.max(8, Math.round(raw - target.def * 0.55));
      const variance = Math.round(mitigated * (0.92 + Math.random() * 0.16));
      const critChance = Math.min(0.42, 0.12 + Math.max(0, power - 1) * 0.16);
      const crit = Math.random() < critChance;
      const amount = Math.max(1, Math.round(variance * (crit ? 1.55 : 1)));
      target.hp = Math.max(0, target.hp - amount);
      const defeated = target.hp <= 0;
      if (defeated) {
        target.alive = false;
        target.hp = 0;
      }
      return { amount, crit, dodged: false, defeated };
    }

    reviveUnit(target, ratio) {
      target.alive = true;
      target.hp = Math.max(1, Math.round(target.maxHp * ratio));
      target.buffs = [];
      this.recalcStats(target);
      return target.hp;
    }

    resolveAction(actor, skill, target) {
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
      this.onLog(`${actor.name} 心算准备中…`);

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

    applySkill(actor, skill, target, modifier = {}) {
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
          fxFail.message = `${actor.name} 使用 ${skill.name}…心算失败，攻击落空！`;
        } else {
          fxFail.message = `${actor.name} 使用 ${skill.name}…心算失败，效果没有发动`;
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
        fx.message = `${actor.name} 使用 ${skill.name}，造成 ${total} 点伤害`;
        if (dodges) fx.message += `，${dodges} 次被闪避`;
        if (defeated.length) fx.message += `，${defeated.join("、")} 倒下`;
        if (skill.type === SKILL_TYPES.LIFESTEAL) {
          const heal = Math.min(actor.maxHp - actor.hp, Math.round(total * (skill.lifeSteal || 0.4)));
          actor.hp += heal;
          fx.healAmount = heal;
          fx.message += `，吸血 +${heal}`;
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
        fx.message = `${actor.name} 使用 ${skill.name}，全体恢复 +${total}`;
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
        fx.message = `${actor.name} 使用 ${skill.name}，复活 ${revived.map((entry) => entry.unit.name).join("、")}`;
        return markBoost(fx);
      }

      if (skill.type === SKILL_TYPES.DODGE) {
        target.buffs = target.buffs.filter((effect) => effect.kind !== "dodge");
        target.buffs.push({ kind: "dodge", value: effectivePower, turnsLeft: skill.duration || 2, label: "闪避" });
        fx.amount = Math.round(effectivePower * 100);
        fx.message = `${actor.name} 使用 ${skill.name}，获得闪避`;
        return markBoost(fx);
      }

      if (skill.type === SKILL_TYPES.POISON) {
        target.buffs = target.buffs.filter((effect) => effect.kind !== "poison");
        target.buffs.push({ kind: "poison", value: effectivePower, turnsLeft: skill.duration || 3, label: "中毒" });
        fx.amount = Math.round(target.maxHp * effectivePower);
        fx.message = `${actor.name} 使用 ${skill.name}，${target.name} 陷入中毒`;
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
          ? `${actor.name} 暴击 ${target.name} -${dmg}！`
          : `${actor.name} 打 ${target.name} -${dmg}`;
        if (target.hp <= 0) {
          target.alive = false;
          target.hp = 0;
          fx.message += ` ${target.name} 倒下！`;
        }
        return markBoost(fx);
      }

      if (skill.type === SKILL_TYPES.HEAL) {
        const heal = Math.round(target.maxHp * effectivePower);
        const before = target.hp;
        target.hp = Math.min(target.maxHp, target.hp + heal);
        const actual = target.hp - before;
        fx.amount = actual;
        fx.message = `${actor.name} 治疗 ${target.name} +${actual}`;
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
        fx.message = `${actor.name} 让 ${target.name} 变强！`;
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
        fx.message = `${actor.name} 削弱 ${target.name}！`;
        return markBoost(fx);
      }

      fx.message = `${actor.name} 用了 ${skill.name}`;
      return markBoost(fx);
    }

    clearAutoTimer() {
      if (this._autoTimer) {
        clearTimeout(this._autoTimer);
        this._autoTimer = null;
      }
    }

    setAutoBattle(enabled) {
      this.autoBattle = !!enabled;
      if (!this.autoBattle) {
        this.clearAutoTimer();
        this.autoChoice = null;
        this.onUpdate(this.snapshot());
        return this.autoBattle;
      }
      // 若当前正等待玩家选技能，立即接管
      if (this.phase === PHASE.PLAYER_SELECT_SKILL && this.current && this.current.side === "hero") {
        this.prepareAutoPlayer(this.current);
      }
      return this.autoBattle;
    }

    /** 自动出手前先选定技能并刷新 UI，让玩家看到“用了什么” */
    decideAutoPlayerAction(actor) {
      if (!actor || !actor.alive) return null;
      const usable = actor.skills.filter((s) => this.canUseSkill(actor, s));
      if (!usable.length) return { error: "no_skill" };

      const choice = this.chooseAiSkill(actor, usable);
      const targets = this.getValidTargets(actor, choice);
      const target = this.chooseAiTarget(actor, choice, targets);
      if (!target) return { error: "no_target" };

      return {
        skill: choice,
        target,
        skillId: choice.id,
        skillName: choice.name,
        targetUid: target.uid,
        targetName: target.name,
      };
    }

    prepareAutoPlayer(unit) {
      this.clearAutoTimer();
      if (!this.autoBattle || this.phase === PHASE.ENDED || this.busy) return;
      if (this.phase !== PHASE.PLAYER_SELECT_SKILL || !unit || this.current !== unit) return;

      const decision = this.decideAutoPlayerAction(unit);
      if (!decision || decision.error === "no_skill") {
        this.autoChoice = null;
        this.onLog(`${unit.name} 不能动`);
        this.onUpdate(this.snapshot());
        this.nextActor();
        return;
      }
      if (decision.error === "no_target") {
        this.autoChoice = null;
        this.onLog(`${unit.name} 没目标`);
        this.onUpdate(this.snapshot());
        this.nextActor();
        return;
      }

      this.autoChoice = decision;
      this.onLog(`${unit.name} 准备用 ${decision.skillName}`);
      this.onUpdate(this.snapshot());
      this.scheduleAutoPlayer(unit);
    }

    scheduleAutoPlayer(unit) {
      this.clearAutoTimer();
      if (!this.autoBattle || this.phase === PHASE.ENDED || this.busy) return;
      this._autoTimer = setTimeout(() => {
        this._autoTimer = null;
        if (!this.autoBattle || this.phase !== PHASE.PLAYER_SELECT_SKILL) return;
        if (!this.current || this.current !== unit || !unit.alive) return;
        this.runAutoPlayerTurn(unit);
      }, this.autoPlayerDelay);
    }

    runAutoPlayerTurn(actor) {
      if (!this.autoBattle || this.phase === PHASE.ENDED || !actor || !actor.alive) {
        return;
      }
      if (this.phase !== PHASE.PLAYER_SELECT_SKILL || this.current !== actor) return;

      let decision = this.autoChoice;
      const stillValid =
        decision &&
        decision.skill &&
        decision.target &&
        decision.skillId &&
        actor.skills.some((s) => s.id === decision.skillId) &&
        this.canUseSkill(actor, decision.skill) &&
        this.getValidTargets(actor, decision.skill).some((t) => t.uid === decision.targetUid);

      if (!stillValid) {
        decision = this.decideAutoPlayerAction(actor);
        if (!decision || decision.error) {
          this.autoChoice = null;
          this.onLog(`${actor.name} ${decision && decision.error === "no_target" ? "没目标" : "不能动"}`);
          this.nextActor();
          return;
        }
        this.autoChoice = decision;
        this.onUpdate(this.snapshot());
      }

      this.onLog(`${actor.name} 自动用 ${decision.skillName}`);
      this.resolveAction(actor, decision.skill, decision.target);
    }

    runAiTurn(actor) {
      if (this.phase === PHASE.ENDED || !actor || !actor.alive) {
        this.nextActor();
        return;
      }
      if (this.phase !== PHASE.AI_THINKING || this.current !== actor) return;

      let decision = this.autoChoice;
      const stillValid =
        decision &&
        decision.skill &&
        decision.target &&
        decision.skillId &&
        actor.skills.some((s) => s.id === decision.skillId) &&
        this.canUseSkill(actor, decision.skill) &&
        this.getValidTargets(actor, decision.skill).some((t) => t.uid === decision.targetUid);

      if (!stillValid) {
        decision = this.decideAutoPlayerAction(actor);
        if (!decision || decision.error) {
          this.autoChoice = null;
          this.onLog(
            `${actor.name} ${decision && decision.error === "no_target" ? "没目标" : "不能动"}`
          );
          this.onUpdate(this.snapshot());
          this.nextActor();
          return;
        }
        this.autoChoice = decision;
        this.onUpdate(this.snapshot());
      }

      this.onLog(`${actor.name} 使用 ${decision.skillName}`);
      this.resolveAction(actor, decision.skill, decision.target);
    }

    chooseAiSkill(actor, usable) {
      const selfHpRatio = actor.hp / actor.maxHp;
      const allies = this.living(actor.side);
      const weakestAlly = allies.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      const deadAllies = (actor.side === "hero" ? this.heroes : this.monsters).filter((unit) => !unit.alive);

      const revives = usable.filter((skill) => skill.type === SKILL_TYPES.REVIVE || skill.type === SKILL_TYPES.REVIVE_ALL);
      if (revives.length && deadAllies.length) return revives[0];

      const heals = usable.filter((s) => s.type === SKILL_TYPES.HEAL || s.type === SKILL_TYPES.HEAL_ALL);
      if (heals.length && weakestAlly && weakestAlly.hp / weakestAlly.maxHp < 0.45) {
        return heals[0];
      }

      if (selfHpRatio < 0.35) {
        const selfHeal = heals.find((s) => s.target === TARGET_TYPES.SELF || s.target === TARGET_TYPES.ALLY);
        if (selfHeal) return selfHeal;
      }

      const debuffs = usable.filter((s) => s.type === SKILL_TYPES.DEBUFF_DEF && s.currentCd === 0);
      if (debuffs.length && Math.random() < 0.35) return debuffs[0];

      const buffs = usable.filter((s) => s.type === SKILL_TYPES.BUFF_ATK);
      if (buffs.length && Math.random() < 0.3) return buffs[0];

      const dodges = usable.filter((s) => s.type === SKILL_TYPES.DODGE);
      if (dodges.length && selfHpRatio < 0.55 && Math.random() < 0.45) return dodges[0];

      const damages = usable
        .filter((s) => [SKILL_TYPES.DAMAGE, SKILL_TYPES.DAMAGE_ALL, SKILL_TYPES.MULTI_HIT, SKILL_TYPES.LIFESTEAL, SKILL_TYPES.POISON].includes(s.type))
        .sort((a, b) => b.power - a.power);
      if (damages.length) {
        // 优先用高伤技能，偶尔用普攻
        if (damages[0].cooldown > 0 && Math.random() < 0.75) return damages[0];
        return damages[damages.length - 1] || damages[0];
      }

      return usable[0];
    }

    chooseAiTarget(actor, skill, targets) {
      if (!targets.length) return null;
      if (skill.target === TARGET_TYPES.SELF) return actor;

      if ([SKILL_TYPES.HEAL, SKILL_TYPES.HEAL_ALL, SKILL_TYPES.BUFF_ATK, SKILL_TYPES.DODGE, SKILL_TYPES.REVIVE, SKILL_TYPES.REVIVE_ALL].includes(skill.type)) {
        return targets.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      }

      // 伤害/减益：优先残血
      return targets.slice().sort((a, b) => a.hp - b.hp)[0];
    }

    checkEnd() {
      const heroesAlive = this.living("hero").length > 0;
      const monstersAlive = this.living("monster").length > 0;

      if (heroesAlive && monstersAlive) return false;

      this.phase = PHASE.ENDED;
      if (heroesAlive && !monstersAlive) {
        this.winner = "hero";
        this.onLog("胜利！奥特曼赢啦！");
      } else if (!heroesAlive && monstersAlive) {
        this.winner = "monster";
        this.onLog("失败…怪兽赢了。");
      } else {
        this.winner = "draw";
        this.onLog("平局。");
      }

      this.onUpdate(this.snapshot());
      this.onEnd(this.winner);
      return true;
    }

    getUpcomingTurns(limit = 4) {
      if (!this.current || limit <= 0) return [];

      const upcoming = [];
      let projectedTurn = this.turn;
      const appendLiving = (units) => {
        units.forEach((unit) => {
          if (unit.alive && upcoming.length < limit) {
            upcoming.push({
              uid: unit.uid,
              name: unit.name,
              side: unit.side,
              image: unit.image,
              color: unit.color,
              turn: projectedTurn,
            });
          }
        });
      };

      appendLiving(this.queue.slice(this.queueIndex));
      const roundOrder = () =>
        this.living()
          .slice()
          .sort((a, b) => b.spd - a.spd || a.name.localeCompare(b.name, "zh"));

      while (upcoming.length < limit && this.living().length) {
        projectedTurn += 1;
        appendLiving(roundOrder());
      }

      return upcoming;
    }

    snapshot() {
      return {
        phase: this.phase,
        turn: this.turn,
        currentUid: this.current ? this.current.uid : null,
        pendingSkill: this.pendingSkill,
        autoChoice: this.autoChoice
          ? {
              skillId: this.autoChoice.skillId,
              skillName: this.autoChoice.skillName,
              targetUid: this.autoChoice.targetUid,
              targetName: this.autoChoice.targetName,
              skill: this.autoChoice.skill,
            }
          : null,
        heroes: this.heroes,
        monsters: this.monsters,
        winner: this.winner,
        autoBattle: this.autoBattle,
        difficulty: this.difficulty,
        attackRampPercent: Math.round(this.getAttackRamp() * 100),
        upcomingTurns: this.getUpcomingTurns(),
        validTargetUids:
          this.phase === PHASE.PLAYER_SELECT_TARGET && this.current && this.pendingSkill
            ? this.getValidTargets(this.current, this.pendingSkill).map((u) => u.uid)
            : [],
      };
    }
  }

  window.BattleEngine = BattleEngine;
  window.BATTLE_PHASE = PHASE;
})();
