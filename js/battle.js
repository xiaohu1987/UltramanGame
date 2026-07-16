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
      this.resolveDelay = options.resolveDelay || 900;
      this.aiThinkDelay = options.aiThinkDelay || 650;
      this.autoPlayerDelay = options.autoPlayerDelay || 420;
      this._autoTimer = null;
    }

    allUnits() {
      return [...this.heroes, ...this.monsters];
    }

    living(side) {
      if (side === "hero") return this.heroes.filter((u) => u.alive);
      if (side === "monster") return this.monsters.filter((u) => u.alive);
      return this.allUnits().filter((u) => u.alive);
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
      this.queue = this.living()
        .slice()
        .sort((a, b) => b.spd - a.spd || a.name.localeCompare(b.name, "zh"));
      this.queueIndex = 0;
      this.onLog(`第 ${this.turn} 回合`);
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
          this.tickCooldowns(unit);
          this.onUpdate(this.snapshot());

          if (unit.side === "hero") {
            this.phase = PHASE.PLAYER_SELECT_SKILL;
            this.pendingSkill = null;
            if (this.autoBattle) {
              this.onLog(`${unit.name} 自动中…`);
              this.onUpdate(this.snapshot());
              this.scheduleAutoPlayer(unit);
            } else {
              this.onLog(`轮到 ${unit.name}`);
              this.onUpdate(this.snapshot());
            }
            return;
          }

          this.phase = PHASE.AI_THINKING;
          this.onLog(`${unit.name} 出手…`);
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
        b.turnsLeft -= 1;
        if (b.turnsLeft > 0) remain.push(b);
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
      unit.atk = Math.max(1, Math.round(unit.baseAtk * atkMul));
      unit.def = Math.max(0, Math.round(unit.baseDef * defMul));
    }

    getValidTargets(actor, skill) {
      if (!actor || !skill) return [];
      if (skill.target === TARGET_TYPES.SELF) return [actor].filter((u) => u.alive);
      if (skill.target === TARGET_TYPES.ALLY) {
        const allies = actor.side === "hero" ? this.heroes : this.monsters;
        return allies.filter((u) => u.alive);
      }
      const enemies = actor.side === "hero" ? this.monsters : this.heroes;
      return enemies.filter((u) => u.alive);
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

      if (skill.target === TARGET_TYPES.SELF || targets.length === 1) {
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

    resolveAction(actor, skill, target) {
      if (this.busy || this.phase === PHASE.ENDED) return;
      this.busy = true;
      this.phase = PHASE.RESOLVING;
      this.pendingSkill = null;

      if (skill.cooldown > 0) skill.currentCd = skill.cooldown;

      const result = this.applySkill(actor, skill, target);
      // 先刷新数值 DOM，再播特效，避免 re-render 冲掉动画节点
      this.onUpdate(this.snapshot());
      this.onFx(result);
      this.onLog(result.message, result.skillType);

      setTimeout(() => {
        this.busy = false;
        if (this.checkEnd()) return;
        this.nextActor();
      }, this.resolveDelay);
    }

    applySkill(actor, skill, target) {
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

      if (skill.type === SKILL_TYPES.DAMAGE) {
        const raw = actor.atk * skill.power;
        const mitigated = Math.max(8, Math.round(raw - target.def * 0.55));
        const variance = Math.round(mitigated * (0.92 + Math.random() * 0.16));
        // 高倍率技能更容易暴击，强化街机反馈
        const critChance = Math.min(0.42, 0.12 + Math.max(0, skill.power - 1) * 0.16);
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
        return fx;
      }

      if (skill.type === SKILL_TYPES.HEAL) {
        const heal = Math.round(target.maxHp * skill.power);
        const before = target.hp;
        target.hp = Math.min(target.maxHp, target.hp + heal);
        const actual = target.hp - before;
        fx.amount = actual;
        fx.message = `${actor.name} 治疗 ${target.name} +${actual}`;
        return fx;
      }

      if (skill.type === SKILL_TYPES.BUFF_ATK) {
        const duration = skill.duration || 2;
        target.buffs = target.buffs.filter((b) => b.kind !== "atk");
        target.buffs.push({
          kind: "atk",
          value: skill.power,
          turnsLeft: duration,
          label: "攻击提升",
        });
        this.recalcStats(target);
        fx.amount = Math.round(skill.power * 100);
        fx.message = `${actor.name} 让 ${target.name} 变强！`;
        return fx;
      }

      if (skill.type === SKILL_TYPES.DEBUFF_DEF) {
        const duration = skill.duration || 2;
        target.buffs = target.buffs.filter((b) => b.kind !== "def");
        target.buffs.push({
          kind: "def",
          value: -skill.power,
          turnsLeft: duration,
          label: "防御下降",
        });
        this.recalcStats(target);
        fx.amount = Math.round(skill.power * 100);
        fx.message = `${actor.name} 削弱 ${target.name}！`;
        return fx;
      }

      fx.message = `${actor.name} 用了 ${skill.name}`;
      return fx;
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
        return this.autoBattle;
      }
      // 若当前正等待玩家选技能，立即接管
      if (this.phase === PHASE.PLAYER_SELECT_SKILL && this.current && this.current.side === "hero") {
        this.scheduleAutoPlayer(this.current);
      }
      return this.autoBattle;
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

      const usable = actor.skills.filter((s) => this.canUseSkill(actor, s));
      if (!usable.length) {
        this.onLog(`${actor.name} 不能动`);
        this.nextActor();
        return;
      }

      const choice = this.chooseAiSkill(actor, usable);
      const targets = this.getValidTargets(actor, choice);
      const target = this.chooseAiTarget(actor, choice, targets);
      if (!target) {
        this.onLog(`${actor.name} 没目标`);
        this.nextActor();
        return;
      }

      this.onLog(`${actor.name} 自动用 ${choice.name}`);
      this.resolveAction(actor, choice, target);
    }

    runAiTurn(actor) {
      if (this.phase === PHASE.ENDED || !actor.alive) {
        this.nextActor();
        return;
      }

      const usable = actor.skills.filter((s) => this.canUseSkill(actor, s));
      if (!usable.length) {
        this.onLog(`${actor.name} 不能动`);
        this.nextActor();
        return;
      }

      const choice = this.chooseAiSkill(actor, usable);
      const targets = this.getValidTargets(actor, choice);
      const target = this.chooseAiTarget(actor, choice, targets);
      if (!target) {
        this.onLog(`${actor.name} 没目标`);
        this.nextActor();
        return;
      }

      this.resolveAction(actor, choice, target);
    }

    chooseAiSkill(actor, usable) {
      const selfHpRatio = actor.hp / actor.maxHp;
      const allies = this.living(actor.side);
      const weakestAlly = allies.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];

      const heals = usable.filter((s) => s.type === SKILL_TYPES.HEAL);
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

      const damages = usable
        .filter((s) => s.type === SKILL_TYPES.DAMAGE)
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

      if (skill.type === SKILL_TYPES.HEAL || skill.type === SKILL_TYPES.BUFF_ATK) {
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

    snapshot() {
      return {
        phase: this.phase,
        turn: this.turn,
        currentUid: this.current ? this.current.uid : null,
        pendingSkill: this.pendingSkill,
        heroes: this.heroes,
        monsters: this.monsters,
        winner: this.winner,
        autoBattle: this.autoBattle,
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
