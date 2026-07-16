/**
 * 游戏流程控制：选角 → 战斗 → 结算 → 重开
 */

// 选角限制 3 人；开战时写入双方阵容日志
// 再来一局会清空选择并回到选角阶段
// 战斗站位：奥特曼左侧，怪兽右侧

(function () {
  const { HERO_ROSTER, createHeroTeam, pickRandomMonsters } = window.GameData;
  const UI = window.GameUI;

  /** @type {string[]} */
  let selectedIds = [];
  /** @type {BattleEngine|null} */
  let battle = null;
  /** 一键全自动打怪开关（跨局保持） */
  let autoBattleEnabled = false;

  function refreshSelect() {
    UI.renderSelectScreen(HERO_ROSTER, selectedIds, {
      onToggle: toggleHero,
    });
  }

  function toggleHero(id) {
    const idx = selectedIds.indexOf(id);
    if (idx >= 0) {
      selectedIds.splice(idx, 1);
    } else {
      if (selectedIds.length >= 3) {
        UI.els.phaseBadge.textContent = "最多 3 个";
        setTimeout(() => {
          if (!battle) UI.els.phaseBadge.textContent = "选人";
        }, 1000);
        return;
      }
      selectedIds.push(id);
    }
    refreshSelect();
  }

  function clearSelect() {
    selectedIds = [];
    refreshSelect();
  }

  function shuffle(list) {
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  /** 随机挑选 3 名不重复奥特曼，可重复点击刷新阵容 */
  function randomSelect() {
    const pool = HERO_ROSTER.map((h) => h.id);
    if (pool.length < 3) return;
    selectedIds = shuffle(pool).slice(0, 3);
    UI.els.phaseBadge.textContent = "随机好了";
    setTimeout(() => {
      if (!battle) UI.els.phaseBadge.textContent = "选人";
    }, 900);
    refreshSelect();
  }

  function startBattle() {
    if (selectedIds.length !== 3) return;

    const heroes = createHeroTeam(selectedIds);
    const monsters = pickRandomMonsters(3);

    if (window.ArcadeFX) {
      window.ArcadeFX.unlockAudio();
      window.ArcadeFX.resetCombo();
    }

    UI.showBattle();
    UI.els.battleLog.innerHTML = "";

    battle = new window.BattleEngine({
      heroes,
      monsters,
      autoBattle: autoBattleEnabled,
      // 与指向性特效节奏对齐：轨迹 + 命中反馈后再推进
      resolveDelay: 920,
      aiThinkDelay: 620,
      autoPlayerDelay: 460,
      onUpdate: (state) => {
        UI.renderBattle(state, {
          onSkill: (skillId) => battle && battle.selectSkill(skillId),
          onTarget: (uid) => battle && battle.selectTarget(uid),
        });
      },
      onLog: (msg, skillType) => UI.appendLog(msg, skillType),
      onFx: (result) => UI.playFx(result),
      onEnd: (winner) => {
        UI.els.phaseBadge.textContent = "结算";
        setTimeout(() => {
          if (window.ArcadeFX && typeof window.ArcadeFX.playResult === "function") {
            window.ArcadeFX.playResult(winner);
          }
          UI.showResult(winner);
        }, 450);
      },
    });

    UI.setAutoBattleUi(autoBattleEnabled);
    // 开战日志由 BattleEngine.start 写入，这里只补阵容与自动状态
    UI.appendLog(`${heroes.map((h) => h.name).join("、")} VS ${monsters.map((m) => m.name).join("、")}`);
    if (autoBattleEnabled) {
      UI.appendLog("自动：开");
    }
    battle.start();
  }

  function toggleAutoBattle() {
    autoBattleEnabled = !autoBattleEnabled;
    if (battle) {
      battle.setAutoBattle(autoBattleEnabled);
      UI.renderBattle(battle.snapshot(), {
        onSkill: (skillId) => battle && battle.selectSkill(skillId),
        onTarget: (uid) => battle && battle.selectTarget(uid),
      });
    } else {
      UI.setAutoBattleUi(autoBattleEnabled);
    }
    if (UI.els.battleLog) {
      UI.appendLog(autoBattleEnabled ? "自动：开" : "自动：关");
    }
  }

  function restart() {
    battle = null;
    selectedIds = [];
    if (window.ArcadeFX) window.ArcadeFX.resetCombo();
    UI.showSelect();
    refreshSelect();
  }

  function init() {
    if (window.ArcadeFX) {
      window.ArcadeFX.init({ shakeTarget: document.getElementById("app") });
      // 首次交互解锁音频
      const unlock = () => {
        window.ArcadeFX.unlockAudio();
        document.removeEventListener("pointerdown", unlock);
        document.removeEventListener("keydown", unlock);
      };
      document.addEventListener("pointerdown", unlock, { once: true });
      document.addEventListener("keydown", unlock, { once: true });
    }

    UI.bindStatic({
      onClear: clearSelect,
      onRandom: randomSelect,
      onStart: startBattle,
      onCancelTarget: () => battle && battle.cancelTarget(),
      onToggleAuto: toggleAutoBattle,
      onRestart: restart,
    });
    UI.setAutoBattleUi(autoBattleEnabled);

    UI.showSelect();
    refreshSelect();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
