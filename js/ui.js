/**
 * 选角与战斗界面渲染
 * 小朋友友好：大图少字
 */

// 图片路径含空格时使用 encodeURI，避免加载失败
// 选角：上三框大图 + 下缩略图；0/3 计数、满 3 人启用开战
// 战斗站位：奥特曼左侧、怪兽右侧（由 index 布局保证）

(function () {
  const els = {
    phaseBadge: document.getElementById("phase-badge"),
    screenSelect: document.getElementById("screen-select"),
    screenBattle: document.getElementById("screen-battle"),
    heroGrid: document.getElementById("hero-grid"),
    selectedSlots: document.getElementById("selected-slots"),
    selectCount: document.getElementById("select-count"),
    selectProgressFill: document.getElementById("select-progress-fill"),
    selectStatusText: document.getElementById("select-status-text"),
    selectedList: document.getElementById("selected-list"),
    btnClear: document.getElementById("btn-clear"),
    btnRandom: document.getElementById("btn-random"),
    btnStart: document.getElementById("btn-start"),
    allyTeam: document.getElementById("ally-team"),
    enemyTeam: document.getElementById("enemy-team"),
    turnBanner: document.getElementById("turn-banner"),
    battleStage: document.getElementById("battle-stage"),
    currentActor: document.getElementById("current-actor"),
    monsterIntel: document.getElementById("monster-intel"),
    monsterIntelList: document.getElementById("monster-intel-list"),
    battleLog: document.getElementById("battle-log"),
    actorInfo: document.getElementById("actor-info"),
    targetHint: document.getElementById("target-hint"),
    skillButtons: document.getElementById("skill-buttons"),
    btnCancelTarget: document.getElementById("btn-cancel-target"),
    btnAutoBattle: document.getElementById("btn-auto-battle"),
    autoBattleLabel: document.getElementById("auto-battle-label"),
    resultModal: document.getElementById("result-modal"),
    resultTitle: document.getElementById("result-title"),
    resultDesc: document.getElementById("result-desc"),
    resultIcon: document.getElementById("result-icon"),
    resultKicker: document.getElementById("result-kicker"),
    btnRestart: document.getElementById("btn-restart"),
  };

  /** 技能类型默认图标 */
  const SKILL_ICON_BY_TYPE = {
    damage: "⚔️",
    damage_all: "💥",
    multi_hit: "👊",
    lifesteal: "🩸",
    poison: "☠️",
    heal: "💚",
    heal_all: "✨",
    revive: "🔆",
    revive_all: "🌟",
    dodge: "💨",
    buff_atk: "⚡",
    debuff_def: "🛡️",
  };

  const BATTLE_ARENAS = [
    { id: "city", name: "城市战区" },
    { id: "forest", name: "森林战区" },
    { id: "desert", name: "沙漠战区" },
    { id: "space", name: "太空战区" },
    { id: "ocean", name: "海底战区" },
  ];
  let lastArenaId = "";

  function fx() {
    return window.ArcadeFX || null;
  }

  function skillTypeLabel(type) {
    const map = {
      damage: "伤害",
      damage_all: "群攻",
      multi_hit: "连击",
      lifesteal: "吸血",
      poison: "中毒",
      heal: "治疗",
      heal_all: "群疗",
      revive: "复活",
      revive_all: "群复活",
      dodge: "闪避",
      buff_atk: "增益",
      debuff_def: "减益",
    };
    return map[type] || type;
  }

  /**
   * 技能图标映射：显式 icon > 名称关键词 > 类型默认
   * @param {{name?: string, type?: string, icon?: string}} skill
   */
  function skillIcon(skill) {
    if (!skill) return "⭐";
    if (skill.icon) return skill.icon;

    const name = skill.name || "";
    if (/光线|射线|光束|激光|斯派修姆|泽佩利昂|八分光轮|奥特射线|M87|希奈拉玛/.test(name)) return "✨";
    if (/拳|踢|斩|击|爪|尾|撞击|突进|冲撞|连打|飞踢|手镯/.test(name)) return "👊";
    if (/治愈|回复|再生|治疗|光能|恢复|疗愈/.test(name)) return "💚";
    if (/提升|强化|觉醒|爆发|充能|激励|战意|加速|增幅|号令/.test(name)) return "⚡";
    if (/削弱|破防|腐蚀|降低|防御|弱化|碎甲|压制|光轮/.test(name)) return "🔻";
    if (/护盾|守护|屏障|防御姿态/.test(name)) return "🛡️";

    return SKILL_ICON_BY_TYPE[skill.type] || "⭐";
  }

  function skillTypeClass(type) {
    const map = {
      damage: "type-damage",
      damage_all: "type-damage",
      multi_hit: "type-damage",
      lifesteal: "type-damage",
      poison: "type-debuff",
      heal: "type-heal",
      heal_all: "type-heal",
      revive: "type-heal",
      revive_all: "type-heal",
      dodge: "type-buff",
      buff_atk: "type-buff",
      debuff_def: "type-debuff",
    };
    return map[type] || "type-damage";
  }

  function skillCdText(skill) {
    if (!skill) return "可用";
    if (typeof skill.currentCd === "number" && skill.currentCd > 0) {
      return `等${skill.currentCd}`;
    }
    if (skill.cooldown > 0) return `等${skill.cooldown}`;
    return "可用";
  }

  function skillTargetLabel(target) {
    const map = {
      enemy: "敌方",
      ally: "友方",
      self: "自身",
    };
    return map[target] || "目标";
  }

  function renderSkillMiniList(skills, compact = false) {
    if (!skills || !skills.length) {
      return `<div class="skill-mini empty">暂无技能</div>`;
    }
    return `
      <ul class="skill-mini${compact ? " compact vertical" : ""}">
        ${skills
          .map(
            (s) => `
          <li class="${skillTypeClass(s.type)}${s.currentCd > 0 ? " on-cd" : ""}" title="${(s.desc || s.name || "").replace(/"/g, "&quot;")}">
            <span class="skill-icon ${skillTypeClass(s.type)}" aria-hidden="true">${skillIcon(s)}</span>
            <span class="skill-mini-text">
              <strong>${s.name}</strong>
              <em>${skillCdText(s)}</em>
              ${s.desc ? `<span class="skill-mini-desc">${s.desc}</span>` : ""}
            </span>
          </li>`
          )
          .join("")}
      </ul>
    `;
  }

  /** 悬停 3 秒后显示技能详情（非当前行动角色） */
  function bindSkillPeek(root) {
    if (!root) return;
    root.querySelectorAll(".fighter-card").forEach((card) => {
      let timer = null;
      const clear = () => {
        if (timer) {
          window.clearTimeout(timer);
          timer = null;
        }
        card.classList.remove("skill-peek");
      };
      card.addEventListener("pointerenter", () => {
        if (card.classList.contains("current") || card.classList.contains("targetable")) return;
        clear();
        timer = window.setTimeout(() => {
          card.classList.add("skill-peek");
          timer = null;
        }, 3000);
      });
      card.addEventListener("pointerleave", clear);
      card.addEventListener("pointercancel", clear);
      card.addEventListener("blur", clear);
    });
  }

  function hpPercent(unit) {
    return Math.max(0, Math.round((unit.hp / unit.maxHp) * 100));
  }

  /** 上方 3 个已选大图框 */
  function renderSelectedSlots(heroes, selectedIds, options = {}) {
    if (!els.selectedSlots) return;
    const slots = els.selectedSlots.querySelectorAll(".selected-slot");
    slots.forEach((slot, index) => {
      const id = selectedIds[index];
      const hero = id ? heroes.find((h) => h.id === id) : null;
      if (!hero) {
        slot.className = "selected-slot empty";
        slot.style.removeProperty("--accent");
        slot.innerHTML = `
          <div class="selected-slot-order">${index + 1}</div>
          <div class="selected-slot-body">
            <div class="selected-slot-empty">空位</div>
          </div>
        `;
        return;
      }
      slot.className = `selected-slot filled${options.isRandomizing ? " random-slot" : ""}${
        options.isRandomFinal ? " random-final-slot" : ""
      }`;
      slot.style.setProperty("--accent", hero.color);
      slot.innerHTML = `
        <div class="selected-slot-order">${index + 1}</div>
        <div class="selected-slot-body">
          <div class="selected-slot-stats" aria-label="${hero.name} 的战斗属性">
            <span>生命 <b>${hero.maxHp}</b></span>
            <span>攻击 <b>${hero.atk}</b></span>
            <span>防御 <b>${hero.def}</b></span>
            <span>速度 <b>${hero.spd}</b></span>
          </div>
          <div class="selected-slot-hero">
            <img src="${encodeURI(hero.image)}" alt="${hero.name}" class="selected-slot-avatar" loading="lazy" />
            <div class="selected-slot-name">${hero.name}</div>
          </div>
          <ul class="selected-slot-skills" aria-label="${hero.name} 的战斗技能">
            ${hero.skills
              .map(
                (skill) => `
                  <li>
                    <span class="selected-slot-skill-icon" aria-hidden="true">${skillIcon(skill)}</span>
                    <span class="selected-slot-skill-copy">
                      <strong>${skill.name}</strong>
                      <small>${skill.desc || "暂无说明"}</small>
                    </span>
                  </li>`
              )
              .join("")}
          </ul>
        </div>
      `;
    });
  }

  function renderSelectScreen(heroes, selectedIds, handlers) {
    // 下：缩略图全员
    els.heroGrid.innerHTML = "";
    heroes.forEach((hero) => {
      const selected = selectedIds.includes(hero.id);
      const order = selected ? selectedIds.indexOf(hero.id) + 1 : 0;
      const selectionLabel = selected ? `已选 ${order}` : selectedIds.length >= 3 ? "队伍已满" : "选择";
      const card = document.createElement("button");
      card.type = "button";
      card.className = `unit-card select-card select-thumb${selected ? " selected" : ""}${
        selectedIds.length >= 3 && !selected ? " locked" : ""
      }${selected && handlers.isRandomizing ? " random-candidate" : ""}${
        selected && handlers.isRandomFinal ? " random-final" : ""
      }`;
      card.style.setProperty("--accent", hero.color);
      card.dataset.heroId = hero.id;
      card.setAttribute("aria-pressed", selected ? "true" : "false");
      card.disabled = !!handlers.isRandomizing;
      card.title = selected ? `已选 ${order} · 再点取消` : hero.name;
      card.innerHTML = `
        <div class="select-card-glow" aria-hidden="true"></div>
        <div class="avatar-wrap select-avatar-wrap">
          <img src="${encodeURI(hero.image)}" alt="${hero.name}" class="avatar select-avatar" loading="lazy" />
          ${selected ? `<span class="select-order">${order}</span>` : ""}
        </div>
        <div class="card-body select-card-body">
          <div class="select-card-title">
            <h3>${hero.name}</h3>
          </div>
        </div>
        <div class="select-flag">${selectionLabel}</div>
      `;
      card.addEventListener("click", () => {
        if (fx()) fx().playUi("select", card);
        handlers.onToggle(hero.id);
      });
      els.heroGrid.appendChild(card);
    });

    // 上：3 个大图框
    renderSelectedSlots(heroes, selectedIds, handlers);

    // 计数 / 进度 / 状态
    const count = selectedIds.length;
    if (els.selectCount) els.selectCount.textContent = String(count);
    if (els.selectProgressFill) {
      els.selectProgressFill.style.width = `${Math.min(100, (count / 3) * 100)}%`;
    }
    if (els.selectStatusText) {
      if (count >= 3) els.selectStatusText.textContent = "队伍满了，可以开战！";
      else if (count === 0) els.selectStatusText.textContent = "先点下面小图选 3 个奥特曼";
      else els.selectStatusText.textContent = `再选 ${3 - count} 个就能开战`;
    }

    // 兼容旧 selected-list（若存在）
    if (els.selectedList) {
      els.selectedList.innerHTML = selectedIds
        .map((id, index) => {
          const hero = heroes.find((h) => h.id === id);
          if (!hero) return "";
          return `<li style="--accent:${hero.color}">${index + 1}. ${hero.name}</li>`;
        })
        .join("");
    }

    const isRandomizing = !!handlers.isRandomizing;
    els.heroGrid.classList.toggle("is-randomizing", isRandomizing);
    els.heroGrid.setAttribute("aria-busy", isRandomizing ? "true" : "false");
    els.btnRandom.disabled = isRandomizing;
    els.btnRandom.classList.toggle("is-randomizing", isRandomizing);
    els.btnClear.disabled = isRandomizing;
    els.btnStart.disabled = count !== 3 || isRandomizing;
  }

  function showSelect() {
    els.screenSelect.classList.add("active");
    els.screenBattle.classList.remove("active");
    if (els.phaseBadge) els.phaseBadge.textContent = "选人";
    if (els.resultModal) {
      els.resultModal.hidden = true;
      els.resultModal.className = "modal";
    }
  }

  function showBattle() {
    const choices = BATTLE_ARENAS.filter((arena) => arena.id !== lastArenaId);
    const arena = choices[Math.floor(Math.random() * choices.length)];
    lastArenaId = arena.id;
    els.screenBattle.dataset.arena = arena.id;
    els.screenBattle.dataset.arenaName = arena.name;
    els.screenBattle.setAttribute("aria-label", arena.name);
    els.screenSelect.classList.remove("active");
    els.screenBattle.classList.add("active");
    if (els.phaseBadge) els.phaseBadge.textContent = "战斗";
  }

  function setAutoBattleUi(on) {
    if (!els.btnAutoBattle) return;
    els.btnAutoBattle.classList.toggle("active", !!on);
    els.btnAutoBattle.setAttribute("aria-pressed", on ? "true" : "false");
    if (els.autoBattleLabel) els.autoBattleLabel.textContent = on ? "自动：开" : "自动：关";
    if (els.skillButtons) els.skillButtons.classList.toggle("auto-locked", !!on);
  }

  function pulseClass(el, className, ms = 400) {
    if (!el) return;
    el.classList.remove(className);
    // 强制回流，确保重复触发动画
    void el.offsetWidth;
    el.classList.add(className);
    window.setTimeout(() => el.classList.remove(className), ms);
  }

  function getUnitStatus(unit) {
    const effects = (unit.buffs || []).filter((effect) => effect && effect.turnsLeft > 0);
    const hasBuff = effects.some((effect) => effect.value > 0 && effect.kind !== "poison");
    const hasPoison = effects.some((effect) => effect.kind === "poison");
    const hasDebuff = effects.some((effect) => effect.value < 0 && effect.kind !== "poison");
    const text = effects
      .map((effect) => `${effect.label || "状态"} ${effect.turnsLeft}回合`)
      .join(" · ");

    return {
      hasBuff,
      hasDebuff,
      className: `${hasBuff ? " status-buff" : ""}${hasDebuff ? " status-debuff" : ""}${hasPoison ? " status-poison" : ""}`,
      text,
    };
  }

  function renderFighterCard(unit, state) {
    const pct = hpPercent(unit);
    const current = unit.uid === state.currentUid;
    const selecting = state.phase === "player_select_target";
    const isValidTarget =
      selecting &&
      unit.alive &&
      ((state.pendingSkill && state.pendingSkill.target === "enemy" && unit.side === "monster") ||
        (state.pendingSkill && state.pendingSkill.target === "ally" && unit.side === "hero") ||
        (state.pendingSkill && state.pendingSkill.target === "self" && unit.uid === state.currentUid));

    const status = getUnitStatus(unit);

    const skillBlock = `
      <div class="fighter-skills" aria-label="${unit.name} 的技能">
        ${renderSkillMiniList(unit.skills, true)}
      </div>
    `;

    return `
      <article
        class="fighter-card ${unit.side === "hero" ? "hero" : "enemy"}${unit.alive ? "" : " dead"}${
          current ? " current" : ""
        }${selecting && isValidTarget ? " targetable" : ""}${selecting && !isValidTarget ? " dimmed" : ""}"
        data-uid="${unit.uid}"
        data-side="${unit.side}"
        style="--accent:${unit.color}"
        tabindex="0"
      >
        <div class="fighter-layout">
          <div class="avatar-frame${status.className}"${status.text ? ` aria-label="${unit.name}：${status.text}"` : ""}>
            <img src="${encodeURI(unit.image)}" alt="${unit.name}" class="avatar" loading="lazy" />
          </div>
          <div class="fighter-info-block">
            <div class="fighter-name-chip">${unit.name}</div>
            <div class="fighter-stats" aria-label="战斗属性">
              <span>攻 <b>${unit.atk}</b></span>
              <span>防 <b>${unit.def}</b></span>
              <span>速 <b>${unit.spd}</b></span>
            </div>
            ${skillBlock}
            <div class="hp-bar">
              <div class="hp-fill" style="width:${pct}%"></div>
              <div class="hp-glow" style="width:${pct}%"></div>
            </div>
            <div class="hp-text">❤️ ${unit.hp}/${unit.maxHp}</div>
            <div class="buff-line">${status.text}</div>
          </div>
        </div>
        <div class="float-layer" data-float="${unit.uid}"></div>
        <div class="fx-layer" data-fx="${unit.uid}" aria-hidden="true"></div>
      </article>
    `;
  }

  /** 中央情报区：展示敌方怪兽技能详情（兼容旧节点） */
  function renderMonsterIntel(monsters, currentUid) {
    if (!els.monsterIntelList) return;
    if (!monsters || !monsters.length) {
      els.monsterIntelList.innerHTML = `<div class="monster-intel-empty">暂无怪兽</div>`;
      return;
    }

    els.monsterIntelList.innerHTML = monsters
      .map((monster) => {
        const active = monster.uid === currentUid ? " active" : "";
        const dead = !monster.alive ? " dead" : "";
        const skills = (monster.skills || [])
          .map(
            (s) => `
            <li class="intel-skill ${skillTypeClass(s.type)}${s.currentCd > 0 ? " on-cd" : ""}">
              <span class="skill-icon ${skillTypeClass(s.type)}" aria-hidden="true">${skillIcon(s)}</span>
              <div class="intel-skill-body">
                <div class="intel-skill-top">
                  <strong>${s.name}</strong>
                  <span>${s.currentCd > 0 ? `等${s.currentCd}` : "可用"}</span>
                </div>
              </div>
            </li>`
          )
          .join("");

        return `
          <article class="monster-intel-card${active}${dead}" style="--accent:${monster.color}" data-uid="${monster.uid}">
            <div class="monster-intel-card-head">
              <img src="${encodeURI(monster.image)}" alt="${monster.name}" loading="lazy" />
              <div>
                <h4>${monster.name}</h4>
                <p>❤️ ${monster.hp}/${monster.maxHp}</p>
              </div>
              <span class="monster-status">${monster.alive ? (monster.uid === currentUid ? "出手" : "等待") : "倒下"}</span>
            </div>
            <ul class="intel-skill-list">
              ${skills || `<li class="intel-skill empty">暂无技能</li>`}
            </ul>
          </article>
        `;
      })
      .join("");
  }

  function renderUpcomingTurns(upcomingTurns) {
    if (!upcomingTurns || !upcomingTurns.length) {
      return `
        <section class="turn-order" aria-label="行动预告">
          <div class="turn-order-title">行动预告</div>
          <div class="turn-order-empty">本局行动即将结束</div>
        </section>
      `;
    }

    return `
      <section class="turn-order" aria-label="接下来 4 次行动">
        <div class="turn-order-title">行动预告 <span>接下来 4 次</span></div>
        <ol class="turn-order-list">
          ${upcomingTurns
            .map(
              (unit, index) => `
                <li class="turn-order-item ${unit.side}" style="--turn-accent:${unit.color}">
                  <span class="turn-order-index">${index + 1}</span>
                  <img src="${encodeURI(unit.image)}" alt="" aria-hidden="true" loading="lazy" />
                  <span class="turn-order-copy">
                    <strong>${unit.name}</strong>
                    <small>第 ${unit.turn} 回合</small>
                  </span>
                </li>
              `
            )
            .join("")}
        </ol>
      </section>
    `;
  }

  /** 中间当前行动大图 */
  function renderCurrentActor(current, upcomingTurns) {
    if (!els.currentActor) return;
    if (!current) {
      els.currentActor.innerHTML = `<div class="current-actor-empty">等待出手</div>`;
      return;
    }
    const sideLabel = current.side === "hero" ? "奥特曼" : "怪兽";
    const status = getUnitStatus(current);
    els.currentActor.innerHTML = `
      <div class="current-actor-card ${current.side}" style="--accent:${current.color}" data-uid="${current.uid}" data-fx-actor="${current.uid}">
        <div class="current-actor-badge">${sideLabel}</div>
        <div class="current-actor-avatar current-actor-avatar-frame${status.className}"${status.text ? ` aria-label="${current.name}：${status.text}"` : ""}>
          <img src="${encodeURI(current.image)}" alt="${current.name}" class="current-actor-avatar-image" loading="lazy" />
        </div>
        <div class="current-actor-name">${current.name}</div>
        ${renderUpcomingTurns(upcomingTurns)}
        <div class="current-actor-hp">❤️ ${current.hp}/${current.maxHp}</div>
        <div class="fx-layer current-actor-fx" data-fx-center="${current.uid}" aria-hidden="true"></div>
      </div>
    `;
  }

  function renderBattle(state, handlers) {
    setAutoBattleUi(!!state.autoBattle);
    // 硬约束：左侧 ally-team 只渲染奥特曼，右侧 enemy-team 只渲染怪兽
    els.allyTeam.innerHTML = state.heroes.map((u) => renderFighterCard(u, state)).join("");
    els.enemyTeam.innerHTML = state.monsters.map((u) => renderFighterCard(u, state)).join("");
    bindSkillPeek(els.screenBattle);
    renderMonsterIntel(state.monsters, state.currentUid);

    const current = [...state.heroes, ...state.monsters].find((u) => u.uid === state.currentUid);
    renderCurrentActor(current, state.upcomingTurns);

    if (state.phase === "ended") {
      els.turnBanner.textContent = "打完了";
      els.actorInfo.textContent = "本局结束";
      els.targetHint.textContent = "";
      els.skillButtons.innerHTML = "";
      els.btnCancelTarget.hidden = true;
      els.btnCancelTarget.textContent = "取消";
      if (els.skillButtons) {
        els.skillButtons.classList.remove(
          "selecting-target",
          "auto-locked",
          "monster-skill-view",
          "resolve-action-view"
        );
      }
    } else if (current) {
      const sideLabel = current.side === "hero" ? "你" : "怪兽";
      const attackRampText = state.attackRampPercent > 0 ? ` · 战意+${state.attackRampPercent}%` : "";
      els.turnBanner.textContent = `第 ${state.turn} 回合 · ${sideLabel}${attackRampText}`;
      els.actorInfo.innerHTML = `轮到 <span class="actor-name" style="--accent:${current.color}">${current.name}</span>`;
      pulseClass(els.turnBanner, "banner-pop", 360);
    }

    const autoChoice = state.autoChoice || null;
    const autoSkillName = autoChoice ? autoChoice.skillName : "";
    const autoTargetName = autoChoice ? autoChoice.targetName : "";
    const isMonsterActor = !!(current && current.side === "monster");
    const isMonsterSkillPhase =
      isMonsterActor && (state.phase === "ai_thinking" || state.phase === "resolving");
    const showAutoSkill =
      !!state.autoBattle &&
      current &&
      current.side === "hero" &&
      (state.phase === "player_select_skill" || state.phase === "resolving");
    const isHeroResolving =
      !!(current && current.side === "hero" && state.phase === "resolving");
    const isResolvingAction = state.phase === "resolving" && !!autoChoice;

    if (state.phase === "player_select_target") {
      const pendingName = state.pendingSkill ? state.pendingSkill.name : "技能";
      els.targetHint.textContent = `点目标 · ${pendingName}`;
      els.btnCancelTarget.hidden = false;
      els.btnCancelTarget.textContent = "取消技能";
      if (els.skillButtons) els.skillButtons.classList.add("selecting-target");
    } else {
      if (showAutoSkill) {
        els.targetHint.textContent = autoSkillName
          ? `自动 · ${autoSkillName}${autoTargetName ? ` → ${autoTargetName}` : ""}`
          : "自动中…";
      } else if (isMonsterSkillPhase) {
        els.targetHint.textContent = autoSkillName
          ? `怪兽 · ${autoSkillName}${autoTargetName ? ` → ${autoTargetName}` : ""}`
          : "怪兽思考中…";
      } else if (isHeroResolving) {
        els.targetHint.textContent = autoSkillName
          ? `出手中 · ${autoSkillName}${autoTargetName ? ` → ${autoTargetName}` : ""}`
          : "出手中…";
      } else {
        els.targetHint.textContent = state.phase === "player_select_skill" ? "点一个技能" : "";
      }
      els.btnCancelTarget.hidden = true;
      els.btnCancelTarget.textContent = "取消";
      if (els.skillButtons) els.skillButtons.classList.remove("selecting-target");
    }

    // 技能按钮：手动选技能/目标、自动战斗、怪兽回合都保留列表
    els.skillButtons.innerHTML = "";
    const showHeroSkillPanel =
      current &&
      current.side === "hero" &&
      (state.phase === "player_select_skill" ||
        state.phase === "player_select_target" ||
        state.phase === "resolving");
    const showSkillPanel = showHeroSkillPanel || isMonsterSkillPhase;

    // 怪兽回合 / 自动战斗：技能区只读
    if (els.skillButtons) {
      els.skillButtons.classList.toggle(
        "auto-locked",
        !!state.autoBattle || isMonsterSkillPhase || isHeroResolving
      );
      els.skillButtons.classList.toggle("monster-skill-view", isMonsterSkillPhase);
      els.skillButtons.classList.toggle("resolve-action-view", isResolvingAction);
    }

    if (showSkillPanel) {
      const selectingTarget = state.phase === "player_select_target";
      const pendingSkillId = state.pendingSkill ? state.pendingSkill.id : null;
      const autoSkillId = autoChoice ? autoChoice.skillId : null;
      const isAutoMode = !!state.autoBattle && current.side === "hero";
      const isReadOnly = isAutoMode || isMonsterSkillPhase || isHeroResolving;

      const owner = document.createElement("div");
      owner.className = "skill-owner";
      owner.style.setProperty("--accent", current.color);
      owner.innerHTML = `
        <div class="skill-owner-frame">
          <img src="${encodeURI(current.image)}" alt="${current.name}" class="skill-owner-avatar" loading="lazy" />
        </div>
        <div class="skill-owner-meta">
          <strong>${current.name}</strong>
          <span>${
            isMonsterSkillPhase
              ? autoSkillName
                ? `使用 ${autoSkillName}`
                : "思考中…"
              : isAutoMode
                ? autoSkillName
                  ? `自动用 ${autoSkillName}`
                  : "自动选择中…"
                : isHeroResolving
                  ? autoSkillName
                    ? `使用 ${autoSkillName}`
                    : "出手中…"
                  : selectingTarget
                    ? "已选技能，点目标"
                    : "点技能出手"
          }</span>
        </div>
      `;
      els.skillButtons.appendChild(owner);

      current.skills.forEach((skill) => {
        const btn = document.createElement("button");
        btn.type = "button";
        const isPending = selectingTarget && pendingSkillId === skill.id;
        const isAutoSelected = isReadOnly && autoSkillId === skill.id;
        const isResolvingSelected = isResolvingAction && isAutoSelected;
        btn.className = `skill-btn ${skillTypeClass(skill.type)}${
          isPending || isAutoSelected ? " is-pending" : ""
        }${isAutoSelected ? " is-auto-selected" : ""}${
          isResolvingSelected ? " is-resolving" : ""
        }`;
        btn.style.setProperty("--accent", current.color);
        const friendlyUnits = current.side === "hero" ? state.heroes : state.monsters;
        const enemyUnits = current.side === "hero" ? state.monsters : state.heroes;
        const usableTargets =
          skill.target === "self" ||
          (skill.target === "ally" && friendlyUnits.some((unit) => unit.alive)) ||
          (skill.target === "enemy" && enemyUnits.some((unit) => unit.alive)) ||
          (skill.target === "all_enemies" && enemyUnits.some((unit) => unit.alive)) ||
          (skill.target === "all_allies" && friendlyUnits.some((unit) => unit.alive)) ||
          (skill.target === "dead_ally" && friendlyUnits.some((unit) => !unit.alive)) ||
          (skill.target === "all_dead_allies" && friendlyUnits.some((unit) => !unit.alive));
        const usable = skill.currentCd <= 0 && usableTargets;
        // 只读（自动/怪兽）：全部锁定，仅高亮预选技能
        // 选目标阶段：保留技能列表，锁定其他技能，突出已选技能
        if (isReadOnly) {
          btn.disabled = true;
        } else {
          btn.disabled = selectingTarget ? !isPending : !usable;
        }
        if (selectingTarget || isAutoSelected) {
          btn.setAttribute("aria-pressed", isPending || isAutoSelected ? "true" : "false");
        } else {
          btn.removeAttribute("aria-pressed");
        }
        const metaText = isResolvingSelected
          ? "出手中"
          : isAutoSelected
            ? isMonsterSkillPhase
              ? "出手"
              : isHeroResolving && !isAutoMode
                ? "出手"
                : "自动"
            : isPending
              ? "已选"
              : skill.currentCd > 0
                ? `等 ${skill.currentCd}`
                : "可用";
        const descText = isResolvingSelected
          ? autoTargetName
            ? `目标 · ${autoTargetName}`
            : "结算中…"
          : skill.desc || "暂无说明";
        btn.innerHTML = `
          <span class="skill-head">
            <span class="skill-icon ${skillTypeClass(skill.type)}" aria-hidden="true">${skillIcon(skill)}</span>
            <span class="skill-name">${skill.name}</span>
          </span>
          <span class="skill-meta">${metaText}</span>
          <span class="skill-desc">${descText}</span>
          ${
            isResolvingSelected
              ? `<span class="skill-resolve-bar" aria-hidden="true"><span></span></span>`
              : ""
          }
        `;
        if (!isReadOnly && !selectingTarget) {
          btn.addEventListener("click", () => {
            if (fx()) fx().playUi("click", btn);
            handlers.onSkill(skill.id);
          });
        } else if (!isReadOnly && isPending) {
          // 再次点击已选技能 = 取消，回到技能选择
          btn.addEventListener("click", () => {
            if (fx()) fx().playUi("click", btn);
            handlers.onCancelTarget();
          });
        }
        els.skillButtons.appendChild(btn);
      });
    }

    // 目标点击
    if (state.phase === "player_select_target" && !state.autoBattle) {
      els.screenBattle.querySelectorAll(".fighter-card.targetable").forEach((card) => {
        card.addEventListener("click", () => {
          if (fx()) fx().playUi("click", card);
          handlers.onTarget(card.dataset.uid);
        });
      });
    }
  }

  function appendLog(message, skillType) {
    const line = document.createElement("div");
    line.className = "log-line";
    if (skillType) {
      line.classList.add(skillTypeClass(skillType));
    }
    line.textContent = message;
    els.battleLog.appendChild(line);
    // 次级信息流：只保留最近若干条，避免战报抢主视觉
    const maxLines = 8;
    while (els.battleLog.children.length > maxLines) {
      els.battleLog.removeChild(els.battleLog.firstChild);
    }
    els.battleLog.scrollTop = els.battleLog.scrollHeight;
  }

  function playFx(kind, payload) {
    const engine = fx();
    if (!engine) return;

    // 战斗引擎直接传入完整 result 对象
    if (kind && typeof kind === "object") {
      if (typeof engine.playBattleFx === "function") {
        engine.playBattleFx(kind);
      }
      return;
    }

    // 兼容旧调用：kind + payload
    if (payload && typeof engine.playBattleFx === "function") {
      engine.playBattleFx({
        ...payload,
        skillType:
          payload.skillType ||
          (kind === "hit" ? "damage" : kind === "buff" ? "buff_atk" : kind === "debuff" ? "debuff_def" : kind),
      });
      return;
    }

    if (kind === "hit" && engine.playHit) engine.playHit(payload);
    else if (kind === "heal" && engine.playHeal) engine.playHeal(payload);
    else if (kind === "buff" && engine.playBuff) engine.playBuff(payload);
    else if (kind === "debuff" && engine.playDebuff) engine.playDebuff(payload);
    else if (kind === "ko" && engine.playKo) engine.playKo(payload);
    else if (kind === "cast" && engine.playCast) engine.playCast(payload);
  }

  function showResult(winner) {
    if (!els.resultModal) return;
    const results = {
      hero: {
        className: "victory",
        icon: "🏆",
        kicker: "VICTORY",
        title: "光之战士胜利！",
        desc: "怪兽军团已经撤退，下一场也拜托你了！",
      },
      monster: {
        className: "defeat",
        icon: "⚠",
        kicker: "DEFEAT",
        title: "怪兽占了上风",
        desc: "这次先调整战术，再来一场漂亮的反击！",
      },
      draw: {
        className: "draw",
        icon: "✦",
        kicker: "DRAW",
        title: "势均力敌",
        desc: "双方同时耗尽能量，下次再分高下！",
      },
    };
    const result = results[winner] || results.draw;
    els.resultModal.className = `modal show result-${result.className}`;
    els.resultTitle.textContent = result.title;
    els.resultDesc.textContent = result.desc;
    if (els.resultIcon) els.resultIcon.textContent = result.icon;
    if (els.resultKicker) els.resultKicker.textContent = result.kicker;
    els.resultModal.hidden = false;
  }

  function bindStatic(handlers) {
    els.btnClear.addEventListener("click", (e) => {
      if (fx()) fx().playUi("click", e.currentTarget);
      handlers.onClear();
    });
    if (els.btnRandom) {
      els.btnRandom.addEventListener("click", (e) => {
        if (fx()) fx().playUi("select", e.currentTarget);
        if (handlers.onRandom) handlers.onRandom();
      });
    }
    els.btnStart.addEventListener("click", (e) => {
      if (fx()) fx().playUi("start", e.currentTarget);
      handlers.onStart();
    });
    els.btnCancelTarget.addEventListener("click", (e) => {
      if (fx()) fx().playUi("click", e.currentTarget);
      handlers.onCancelTarget();
    });
    if (els.btnAutoBattle) {
      els.btnAutoBattle.addEventListener("click", (e) => {
        if (fx()) fx().playUi("click", e.currentTarget);
        if (handlers.onToggleAuto) handlers.onToggleAuto();
      });
    }
    els.btnRestart.addEventListener("click", (e) => {
      if (fx()) fx().playUi("click", e.currentTarget);
      handlers.onRestart();
    });
  }

  // 初始化特效层
  if (fx()) {
    fx().init({ shakeTarget: document.getElementById("app") });
  }

  window.GameUI = {
    els,
    skillIcon,
    skillTypeLabel,
    renderSelectScreen,
    showSelect,
    showBattle,
    renderBattle,
    appendLog,
    playFx,
    showResult,
    bindStatic,
    setAutoBattleUi,
  };
})();
