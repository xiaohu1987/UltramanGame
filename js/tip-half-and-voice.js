/**
 * 提醒减半 + 更自然语音（同引擎 Web Speech）
 * 在 math-challenge.js / battle.js 之后加载，做最小侵入补丁。
 *
 * 规则：
 * - 语音：仍用 speechSynthesis，优先 neural/natural 中文女声，rate/pitch 更自然
 * - 提醒：点击「提醒」后，全场下一次伤害或治疗 ×0.5，触发后自动解除
 * - 边界：仅 damage/damage_all/multi_hit/lifesteal/heal/heal_all 消耗；
 *         同一 applySkill 调用消耗一次（多段/群体算一次技能事件）
 * - 边界补充（T6）：
 *   1) forceMiss/forceFail（心算失败/超时）不消耗减半标记
 *   2) buff/debuff/poison/dodge/revive 不消耗、不减半
 *   3) 多段/群体/吸血：一次 applySkill 只消耗一次；吸血治疗随伤害 power 一并减半
 *   4) 取消/中止挑战（abort）或再来一局会 clear；正常答完后保留到下一次伤害/治疗结算
 */
(function () {
  // ---------- 自然音色评分（同引擎） ----------
  function scoreNaturalChineseVoice(v) {
    if (!v) return -999;
    const lang = String(v.lang || "").toLowerCase();
    const name = String(v.name || "").toLowerCase();
    const uri = String(v.voiceURI || "").toLowerCase();
    let n = 0;
    if (v.localService === true) n += 80;
    else if (v.localService === false) n += 20;
    if (lang === "zh-cn" || lang === "zh_cn") n += 120;
    else if (lang.startsWith("zh-cn") || lang.startsWith("zh_cn")) n += 110;
    else if (lang.startsWith("zh")) n += 90;
    else if (lang.includes("cmn")) n += 80;
    else return -1;
    if (name.includes("desktop") || uri.includes("desktop")) n -= 40;
    if (name.includes("microsoft huihui") || name.includes("microsoft kangkang")) n -= 30;
    if (
      name.includes("xiaoxiao") ||
      name.includes("xiao xiao") ||
      name.includes("xiaoyi") ||
      name.includes("xiao yi") ||
      name.includes("xiaohan") ||
      name.includes("xiao han") ||
      name.includes("xiaomeng") ||
      name.includes("xiao meng") ||
      name.includes("xiaomo") ||
      name.includes("xiao mo") ||
      name.includes("xiaoxuan") ||
      name.includes("xiao xuan") ||
      name.includes("xiaorou") ||
      name.includes("xiao rou") ||
      name.includes("yunxia") ||
      name.includes("yun xia")
    ) {
      n += 140;
    }
    if (name.includes("yaoyao") || name.includes("yao yao") || name.includes("xiaochen") || name.includes("xiao chen")) {
      n += 50;
    }
    if (name.includes("female") || name.includes("girl") || name.includes("woman") || name.includes("女")) n += 35;
    if (
      name.includes("male") ||
      name.includes("yunyang") ||
      name.includes("yunxi") ||
      name.includes("yunjian") ||
      name.includes("kangkang") ||
      name.includes("男")
    ) {
      n -= 50;
    }
    if (name.includes("child") || name.includes("kid") || name.includes("童")) n -= 25;
    if (name.includes("chinese") || name.includes("mandarin") || name.includes("中文") || name.includes("普通话")) n += 25;
    if (name.includes("neural") || uri.includes("neural")) n += 90;
    if (name.includes("natural") || uri.includes("natural")) n += 70;
    if (name.includes("online") || uri.includes("online")) n += 40;
    return n;
  }

  function pickNaturalVoice(voices, preferredURI) {
    const list = voices || [];
    if (!list.length) return null;
    if (preferredURI) {
      const remembered = list.find((v) => v && v.voiceURI === preferredURI);
      if (remembered && scoreNaturalChineseVoice(remembered) > 0) return remembered;
    }
    let best = null;
    let bestScore = 0;
    for (let i = 0; i < list.length; i++) {
      const sc = scoreNaturalChineseVoice(list[i]);
      if (sc > bestScore) {
        bestScore = sc;
        best = list[i];
      }
    }
    return bestScore > 0 ? best : null;
  }

  window.__UltramanNaturalVoice = {
    score: scoreNaturalChineseVoice,
    pick: pickNaturalVoice,
  };

  // ---------- 提醒减半状态 ----------
  const DAMAGE_OR_HEAL = new Set(["damage", "damage_all", "multi_hit", "lifesteal", "heal", "heal_all"]);

  const TipHalf = {
    pending: false,
    activate() {
      this.pending = true;
      this.syncUi();
      return true;
    },
    clear() {
      if (!this.pending) {
        this.syncUi();
        return false;
      }
      this.pending = false;
      this.syncUi();
      return true;
    },
    isPending() {
      return !!this.pending;
    },
    /** 是否为会消耗「提醒减半」的伤害/治疗技能类型 */
    isDamageOrHealType(skillType) {
      return DAMAGE_OR_HEAL.has(String(skillType || ""));
    },
    /** 伤害/治疗技能结算时消耗一次，返回 power 倍率 */
    takeMulForSkillType(skillType) {
      if (!this.pending) return 1;
      if (!this.isDamageOrHealType(skillType)) return 1;
      this.pending = false;
      this.syncUi();
      return 0.5;
    },
    /**
     * 状态机同步到 DOM，便于 UI/调试观察：
     * - body[data-math-tip-half="1"] 表示全场下一次伤害/治疗将减半
     */
    syncUi() {
      try {
        if (!document || !document.body) return;
        if (this.pending) document.body.setAttribute("data-math-tip-half", "1");
        else document.body.removeAttribute("data-math-tip-half");
        // 同步提醒按钮可访问状态（选中态由 math-challenge 的 is-used 负责）
        const btn = document.getElementById("math-challenge-tip-btn");
        if (btn) {
          if (this.pending) {
            btn.setAttribute("data-tip-half-pending", "1");
            btn.title = "已使用提醒：下一次伤害/治疗减半";
          } else {
            btn.removeAttribute("data-tip-half-pending");
            if (!btn.classList.contains("is-used")) btn.removeAttribute("title");
          }
        }
      } catch (e) {
        /* ignore */
      }
    },
  };

  window.MathTipHalf = TipHalf;

  // ---------- 拦截 speak：换自然音色 + 自然语速/音高 ----------
  function patchSpeak() {
    if (!window.speechSynthesis || window.speechSynthesis.__naturalPatched) return;
    const synth = window.speechSynthesis;
    const origSpeak = synth.speak.bind(synth);
    synth.speak = function naturalSpeak(utter) {
      try {
        if (utter && typeof utter === "object") {
          const voices = synth.getVoices() || [];
          // 不沿用旧的可爱/桌面音色 preferredURI，始终按自然度重选；
          // 仅当当前 voice 已是高分自然音色时才保留，避免来回跳。
          const current = utter.voice || null;
          const currentScore = scoreNaturalChineseVoice(current);
          const preferredURI = current && currentScore >= 250 ? current.voiceURI : "";
          const preferred = pickNaturalVoice(voices, preferredURI);
          if (preferred) {
            utter.voice = preferred;
            utter.lang = preferred.lang || "zh-CN";
          } else if (!utter.lang) {
            utter.lang = "zh-CN";
          }
          // 覆盖原可爱风偏尖参数
          utter.rate = 1.02;
          utter.pitch = 1.06;
          if (!Number.isFinite(utter.volume)) utter.volume = 1;
        }
      } catch (e) {
        /* ignore */
      }
      return origSpeak(utter);
    };
    synth.__naturalPatched = true;
  }

  // ---------- 点击「提醒」激活减半 ----------
  function watchTipButton() {
    if (document.__tipHalfWatch) return;
    document.__tipHalfWatch = true;
    document.addEventListener(
      "click",
      (ev) => {
        const t = ev.target;
        if (!t) return;
        const btn =
          t.id === "math-challenge-tip-btn"
            ? t
            : typeof t.closest === "function"
              ? t.closest("#math-challenge-tip-btn")
              : null;
        // 仅首次有效点击激活；已用过（is-used）或禁用时不重复挂标记
        if (!btn || btn.disabled || btn.classList.contains("is-used")) return;
        TipHalf.activate();
      },
      true
    );
  }

  /**
   * 取消/中止路径清理：
   * - 挑战 abort / 重开时若尚未结算技能，清除残留减半标记
   * - 不在 closeModal 时清除：答完后 closeModal 早于 applySkill，否则会误清
   */
  function patchChallengeCancelClear() {
    const MC = window.MathChallenge;
    if (!MC || MC.__tipHalfCancelPatched) return !!MC;

    if (typeof MC.abortChallenge === "function") {
      const origAbort = MC.abortChallenge.bind(MC);
      MC.abortChallenge = function patchedAbortChallenge(reason) {
        TipHalf.clear();
        return origAbort(reason);
      };
    }

    MC.__tipHalfCancelPatched = true;
    return true;
  }

  function watchBattleRestartClear() {
    if (document.__tipHalfRestartWatch) return;
    document.__tipHalfRestartWatch = true;
    // 回选人/重开等按钮：未消耗的减半标记一并清掉
    document.addEventListener(
      "click",
      (ev) => {
        const t = ev.target;
        if (!t || typeof t.closest !== "function") return;
        const restart = t.closest("#btn-restart, #btn-back-select, #btn-to-select, [data-clear-tip-half]");
        if (!restart) return;
        TipHalf.clear();
      },
      true
    );
  }

  // ---------- 包装 BattleEngine.prototype.applySkill ----------
  function patchBattlePrototype() {
    const BE = window.BattleEngine;
    if (!BE || !BE.prototype || typeof BE.prototype.applySkill !== "function") return false;
    if (BE.prototype.__tipHalfPatched) return true;

    const origApply = BE.prototype.applySkill;
    BE.prototype.applySkill = function patchedApplySkill(actor, skill, target, modifier) {
      let mod = modifier || {};
      const skillType = skill && skill.type;
      // 心算失败/超时：技能未真正造成伤害/治疗 → 不消耗减半
      const willFail = !!(mod.forceMiss || mod.forceFail);
      let mul = 1;
      if (!willFail && TipHalf.isPending() && TipHalf.isDamageOrHealType(skillType)) {
        mul = TipHalf.takeMulForSkillType(skillType);
      }
      if (mul !== 1) {
        mod = Object.assign({}, mod);
        const base = Number.isFinite(mod.powerMul) ? mod.powerMul : 1;
        mod.powerMul = base * mul;
        mod.tipHalf = true;
      }
      const fx = origApply.call(this, actor, skill, target, mod);
      if (fx && mod && mod.tipHalf) {
        fx.tipHalf = true;
        if (fx.message && !String(fx.message).includes("提醒：伤害/治疗减半")) {
          fx.message += "（提醒：伤害/治疗减半）";
        }
      }
      return fx;
    };

    BE.prototype.__tipHalfPatched = true;
    return true;
  }

  function installAll() {
    patchSpeak();
    watchTipButton();
    patchChallengeCancelClear();
    watchBattleRestartClear();
    patchBattlePrototype();
    TipHalf.syncUi();
  }

  installAll();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installAll);
  }
  setTimeout(installAll, 0);
  setTimeout(installAll, 300);

  window.installMathTipHalfOnBattle = function installMathTipHalfOnBattle() {
    // 兼容旧调用：原型已补丁即可
    return patchBattlePrototype();
  };
})();
