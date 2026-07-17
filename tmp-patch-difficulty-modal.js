const fs = require("fs");

function must(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
}

function patchUi() {
  const p = "js/ui.js";
  let t = fs.readFileSync(p, "utf8");

  // 1) els refs
  if (!t.includes("difficultyOptions:")) {
    t = t.replace(
      'btnRestart: document.getElementById("btn-restart"),\n  };',
      'btnRestart: document.getElementById("btn-restart"),\n    difficultyOptions: document.getElementById("difficulty-options"),\n    difficultyDesc: document.getElementById("difficulty-desc"),\n    difficultyModal: document.getElementById("difficulty-modal"),\n    difficultyModalOptions: document.getElementById("difficulty-modal-options"),\n    difficultyModalHint: document.getElementById("difficulty-modal-hint"),\n    btnDifficultyConfirm: document.getElementById("btn-difficulty-confirm"),\n  };'
    );
  } else if (!t.includes("difficultyModal:")) {
    t = t.replace(
      "difficultyOptions: document.getElementById(\"difficulty-options\"),\n    difficultyDesc: document.getElementById(\"difficulty-desc\"),",
      "difficultyOptions: document.getElementById(\"difficulty-options\"),\n    difficultyDesc: document.getElementById(\"difficulty-desc\"),\n    difficultyModal: document.getElementById(\"difficulty-modal\"),\n    difficultyModalOptions: document.getElementById(\"difficulty-modal-options\"),\n    difficultyModalHint: document.getElementById(\"difficulty-modal-hint\"),\n    btnDifficultyConfirm: document.getElementById(\"btn-difficulty-confirm\"),"
    );
  }

  // 2) pending state + helpers before setDifficultyUi / bindStatic
  if (!t.includes("pendingDifficultyId")) {
    const helpers = `
  /** 弹窗内临时选中，确认前不写 storage */
  let pendingDifficultyId = "easy";

  function normalizeDifficultyId(difficultyId) {
    const MC = window.MathChallenge;
    if (MC && MC.isDifficultyId(difficultyId)) return difficultyId;
    return (MC && MC.DEFAULT_DIFFICULTY) || "easy";
  }

  function getDifficultyCfg(difficultyId) {
    const MC = window.MathChallenge;
    const id = normalizeDifficultyId(difficultyId);
    if (MC) return MC.getDifficulty(id);
    return { id, label: "初级", desc: "直接出手，和现在一样" };
  }

  function paintDifficultyButtons(container, difficultyId) {
    if (!container) return;
    const id = normalizeDifficultyId(difficultyId);
    container.querySelectorAll("[data-difficulty]").forEach((btn) => {
      const active = btn.getAttribute("data-difficulty") === id;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function setModalPending(difficultyId) {
    pendingDifficultyId = normalizeDifficultyId(difficultyId);
    const cfg = getDifficultyCfg(pendingDifficultyId);
    paintDifficultyButtons(els.difficultyModalOptions, pendingDifficultyId);
    if (els.difficultyModalHint) {
      els.difficultyModalHint.textContent = cfg.desc || "";
    }
  }

  function openDifficultyModal(currentId) {
    setModalPending(currentId);
    if (!els.difficultyModal) return;
    els.difficultyModal.hidden = false;
    els.difficultyModal.classList.add("show");
    if (els.btnDifficultyConfirm) {
      try {
        els.btnDifficultyConfirm.focus({ preventScroll: true });
      } catch (_) {
        /* ignore */
      }
    }
  }

  function closeDifficultyModal() {
    if (!els.difficultyModal) return;
    els.difficultyModal.hidden = true;
    els.difficultyModal.classList.remove("show");
  }

  function isDifficultyModalOpen() {
    return !!(els.difficultyModal && !els.difficultyModal.hidden);
  }

  function getPendingDifficultyId() {
    return pendingDifficultyId;
  }

  function setDifficultyUi(difficultyId) {
    const id = normalizeDifficultyId(difficultyId);
    const cfg = getDifficultyCfg(id);
    if (els.difficultyDesc) {
      els.difficultyDesc.textContent = cfg.desc || "";
    }
    paintDifficultyButtons(els.difficultyOptions, id);
    // 弹窗打开时不覆盖用户正在点的临时档
    if (!isDifficultyModalOpen()) {
      setModalPending(id);
    }
  }

`;
    t = t.replace("  function bindStatic(handlers) {", helpers + "  function bindStatic(handlers) {");
  }

  // 3) close modal when entering battle
  if (!t.includes("closeDifficultyModal();") && t.includes("function showBattle()")) {
    t = t.replace(
      "    if (els.phaseBadge) els.phaseBadge.textContent = \"战斗\";\n  }",
      "    if (els.phaseBadge) els.phaseBadge.textContent = \"战斗\";\n    if (typeof closeDifficultyModal === \"function\") closeDifficultyModal();\n  }"
    );
  }

  // 4) bind modal + compact bar
  if (!t.includes("difficultyModalOptions.addEventListener") && !t.includes("els.difficultyModalOptions.addEventListener")) {
    const bindExtra = `
    if (els.difficultyOptions) {
      els.difficultyOptions.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-difficulty]");
        if (!btn || !els.difficultyOptions.contains(btn)) return;
        const id = btn.getAttribute("data-difficulty");
        if (!id) return;
        if (fx()) fx().playUi("select", btn);
        if (handlers.onDifficultyChange) handlers.onDifficultyChange(id);
      });
    }
    if (els.difficultyModalOptions) {
      els.difficultyModalOptions.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-difficulty]");
        if (!btn || !els.difficultyModalOptions.contains(btn)) return;
        const id = btn.getAttribute("data-difficulty");
        if (!id) return;
        if (fx()) fx().playUi("select", btn);
        setModalPending(id);
      });
    }
    if (els.btnDifficultyConfirm) {
      els.btnDifficultyConfirm.addEventListener("click", (e) => {
        if (fx()) fx().playUi("start", e.currentTarget);
        const id = pendingDifficultyId;
        if (handlers.onDifficultyConfirm) {
          handlers.onDifficultyConfirm(id);
        } else if (handlers.onDifficultyChange) {
          handlers.onDifficultyChange(id);
        }
        closeDifficultyModal();
      });
    }
`;
    t = t.replace(
      "    els.btnRestart.addEventListener(\"click\", (e) => {\n      if (fx()) fx().playUi(\"click\", e.currentTarget);\n      handlers.onRestart();\n    });\n  }",
      "    els.btnRestart.addEventListener(\"click\", (e) => {\n      if (fx()) fx().playUi(\"click\", e.currentTarget);\n      handlers.onRestart();\n    });" +
        bindExtra +
        "  }"
    );
  }

  // 5) exports
  if (!t.includes("setDifficultyUi,")) {
    t = t.replace(
      "    setAutoBattleUi,\n  };",
      "    setAutoBattleUi,\n    setDifficultyUi,\n    openDifficultyModal,\n    closeDifficultyModal,\n    isDifficultyModalOpen,\n    getPendingDifficultyId,\n  };"
    );
  } else if (!t.includes("openDifficultyModal,")) {
    t = t.replace(
      "    setDifficultyUi,\n  };",
      "    setDifficultyUi,\n    openDifficultyModal,\n    closeDifficultyModal,\n    isDifficultyModalOpen,\n    getPendingDifficultyId,\n  };"
    );
  }

  fs.writeFileSync(p, t, "utf8");
  const checks = {
    els: t.includes("difficultyModal:"),
    open: t.includes("function openDifficultyModal"),
    setUi: t.includes("function setDifficultyUi"),
    bindConfirm: t.includes("btnDifficultyConfirm"),
    exportOpen: t.includes("openDifficultyModal,"),
  };
  console.log("ui", checks);
  must(Object.values(checks).every(Boolean), "ui patch incomplete");
}

function patchMain() {
  const p = "js/main.js";
  let t = fs.readFileSync(p, "utf8");

  if (!t.includes("function enterSelectScreen")) {
    t = t.replace(
      "  function restart() {",
      `  function enterSelectScreen() {
    UI.showSelect();
    refreshSelect();
    UI.setDifficultyUi(difficultyId);
    if (typeof UI.openDifficultyModal === "function") {
      UI.openDifficultyModal(difficultyId);
    }
  }

  function restart() {`
    );
  }

  // restart uses enterSelectScreen
  if (t.includes("function restart()") && !t.includes("enterSelectScreen();")) {
    t = t.replace(
      `  function restart() {
    battle = null;
    selectedIds = [];
    if (window.ArcadeFX) window.ArcadeFX.resetCombo();
    if (window.MathChallenge && typeof window.MathChallenge.abortChallenge === "function") {
      window.MathChallenge.abortChallenge("restart");
    }
    UI.showSelect();
    refreshSelect();
    UI.setDifficultyUi(difficultyId);
  }`,
      `  function restart() {
    battle = null;
    selectedIds = [];
    if (window.ArcadeFX) window.ArcadeFX.resetCombo();
    if (window.MathChallenge && typeof window.MathChallenge.abortChallenge === "function") {
      window.MathChallenge.abortChallenge("restart");
    }
    enterSelectScreen();
  }`
    );
  }

  // init uses enterSelectScreen + confirm handler
  if (!t.includes("onDifficultyConfirm")) {
    t = t.replace(
      "      onDifficultyChange: setDifficulty,\n      onRestart: restart,\n    });\n    UI.setAutoBattleUi(autoBattleEnabled);\n    UI.setDifficultyUi(difficultyId);\n\n    UI.showSelect();\n    refreshSelect();\n  }",
      "      onDifficultyChange: setDifficulty,\n      onDifficultyConfirm: setDifficulty,\n      onRestart: restart,\n    });\n    UI.setAutoBattleUi(autoBattleEnabled);\n    enterSelectScreen();\n  }"
    );
  }

  // if setDifficultyUi missing from older main, ensure setDifficulty exists (already present)
  fs.writeFileSync(p, t, "utf8");
  const checks = {
    enter: t.includes("function enterSelectScreen"),
    openCall: t.includes("UI.openDifficultyModal"),
    confirm: t.includes("onDifficultyConfirm"),
    restartEnter: t.includes("enterSelectScreen();"),
  };
  console.log("main", checks);
  must(Object.values(checks).every(Boolean), "main patch incomplete");
}

patchUi();
patchMain();
console.log("PATCH_DIFFICULTY_MODAL_OK");
