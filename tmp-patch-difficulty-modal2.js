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

  // els
  if (!t.includes("difficultyModal:")) {
    const needle = 'btnRestart: document.getElementById("btn-restart"),';
    const idx = t.indexOf(needle);
    must(idx >= 0, "btnRestart not found");
    const insert =
      needle +
      "\n    difficultyOptions: document.getElementById(\"difficulty-options\"),\n" +
      "    difficultyDesc: document.getElementById(\"difficulty-desc\"),\n" +
      "    difficultyModal: document.getElementById(\"difficulty-modal\"),\n" +
      "    difficultyModalOptions: document.getElementById(\"difficulty-modal-options\"),\n" +
      "    difficultyModalHint: document.getElementById(\"difficulty-modal-hint\"),\n" +
      "    btnDifficultyConfirm: document.getElementById(\"btn-difficulty-confirm\"),";
    t = t.slice(0, idx) + insert + t.slice(idx + needle.length);
  }

  // bind events if missing
  if (!t.includes("els.difficultyModalOptions.addEventListener") && !t.includes("difficultyModalOptions.addEventListener")) {
    const restartEnd =
      "    els.btnRestart.addEventListener(\"click\", (e) => {\n" +
      "      if (fx()) fx().playUi(\"click\", e.currentTarget);\n" +
      "      handlers.onRestart();\n" +
      "    });";
    const idx = t.indexOf(restartEnd);
    must(idx >= 0, "restart listener not found");
    const extra =
      restartEnd +
      "\n    if (els.difficultyOptions) {\n" +
      "      els.difficultyOptions.addEventListener(\"click\", (e) => {\n" +
      "        const btn = e.target.closest(\"[data-difficulty]\");\n" +
      "        if (!btn || !els.difficultyOptions.contains(btn)) return;\n" +
      "        const id = btn.getAttribute(\"data-difficulty\");\n" +
      "        if (!id) return;\n" +
      "        if (fx()) fx().playUi(\"select\", btn);\n" +
      "        if (handlers.onDifficultyChange) handlers.onDifficultyChange(id);\n" +
      "      });\n" +
      "    }\n" +
      "    if (els.difficultyModalOptions) {\n" +
      "      els.difficultyModalOptions.addEventListener(\"click\", (e) => {\n" +
      "        const btn = e.target.closest(\"[data-difficulty]\");\n" +
      "        if (!btn || !els.difficultyModalOptions.contains(btn)) return;\n" +
      "        const id = btn.getAttribute(\"data-difficulty\");\n" +
      "        if (!id) return;\n" +
      "        if (fx()) fx().playUi(\"select\", btn);\n" +
      "        setModalPending(id);\n" +
      "      });\n" +
      "    }\n" +
      "    if (els.btnDifficultyConfirm) {\n" +
      "      els.btnDifficultyConfirm.addEventListener(\"click\", (e) => {\n" +
      "        if (fx()) fx().playUi(\"start\", e.currentTarget);\n" +
      "        const id = pendingDifficultyId;\n" +
      "        if (handlers.onDifficultyConfirm) {\n" +
      "          handlers.onDifficultyConfirm(id);\n" +
      "        } else if (handlers.onDifficultyChange) {\n" +
      "          handlers.onDifficultyChange(id);\n" +
      "        }\n" +
      "        closeDifficultyModal();\n" +
      "      });\n" +
      "    }";
    t = t.slice(0, idx) + extra + t.slice(idx + restartEnd.length);
  }

  // close on battle
  if (!t.includes("closeDifficultyModal()")) {
    const battleEnd = '    if (els.phaseBadge) els.phaseBadge.textContent = "战斗";\n  }';
    const idx = t.indexOf(battleEnd);
    must(idx >= 0, "showBattle end not found");
    t =
      t.slice(0, idx) +
      '    if (els.phaseBadge) els.phaseBadge.textContent = "战斗";\n    closeDifficultyModal();\n  }' +
      t.slice(idx + battleEnd.length);
  }

  // exports
  if (!t.includes("openDifficultyModal,")) {
    const exp = "    setAutoBattleUi,\n  };";
    const idx = t.indexOf(exp);
    must(idx >= 0, "export block not found");
    t =
      t.slice(0, idx) +
      "    setAutoBattleUi,\n    setDifficultyUi,\n    openDifficultyModal,\n    closeDifficultyModal,\n    isDifficultyModalOpen,\n    getPendingDifficultyId,\n  };" +
      t.slice(idx + exp.length);
  }

  fs.writeFileSync(p, t, "utf8");
  const checks = {
    els: t.includes("difficultyModal:"),
    open: t.includes("function openDifficultyModal"),
    setUi: t.includes("function setDifficultyUi"),
    bind: t.includes("els.difficultyModalOptions.addEventListener"),
    exportOpen: t.includes("openDifficultyModal,"),
    closeBattle: t.includes("closeDifficultyModal();"),
  };
  console.log("ui", checks);
  must(Object.values(checks).every(Boolean), "ui incomplete");
}

function patchMain() {
  const p = "js/main.js";
  let t = fs.readFileSync(p, "utf8");

  if (!t.includes("function enterSelectScreen")) {
    const needle = "  function restart() {";
    const idx = t.indexOf(needle);
    must(idx >= 0, "restart not found");
    const enter =
      "  function enterSelectScreen() {\n" +
      "    UI.showSelect();\n" +
      "    refreshSelect();\n" +
      "    UI.setDifficultyUi(difficultyId);\n" +
      "    if (typeof UI.openDifficultyModal === \"function\") {\n" +
      "      UI.openDifficultyModal(difficultyId);\n" +
      "    }\n" +
      "  }\n\n";
    t = t.slice(0, idx) + enter + t.slice(idx);
  }

  // rewrite restart body to use enterSelectScreen
  if (t.includes("function restart()") && t.includes("UI.showSelect();") && t.includes("UI.setDifficultyUi(difficultyId);")) {
    t = t.replace(
      /function restart\(\) \{[\s\S]*?\n  \}/,
      `function restart() {
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

  // init: bind confirm + enterSelectScreen
  if (!t.includes("onDifficultyConfirm")) {
    t = t.replace(
      "onDifficultyChange: setDifficulty,",
      "onDifficultyChange: setDifficulty,\n      onDifficultyConfirm: setDifficulty,"
    );
  }

  // replace trailing init showSelect/refresh with enterSelectScreen if present
  if (t.includes("UI.showSelect();\n    refreshSelect();\n  }") && t.includes("function enterSelectScreen")) {
    t = t.replace(
      "UI.setAutoBattleUi(autoBattleEnabled);\n    UI.setDifficultyUi(difficultyId);\n\n    UI.showSelect();\n    refreshSelect();\n  }",
      "UI.setAutoBattleUi(autoBattleEnabled);\n    enterSelectScreen();\n  }"
    );
    // fallback if setDifficultyUi line missing
    t = t.replace(
      "UI.setAutoBattleUi(autoBattleEnabled);\n\n    UI.showSelect();\n    refreshSelect();\n  }",
      "UI.setAutoBattleUi(autoBattleEnabled);\n    enterSelectScreen();\n  }"
    );
  }

  fs.writeFileSync(p, t, "utf8");
  const checks = {
    enter: t.includes("function enterSelectScreen"),
    openCall: t.includes("UI.openDifficultyModal"),
    confirm: t.includes("onDifficultyConfirm"),
    restartEnter: t.includes("enterSelectScreen();"),
  };
  console.log("main", checks);
  must(Object.values(checks).every(Boolean), "main incomplete");
}

patchUi();
patchMain();
console.log("PATCH_DIFFICULTY_MODAL2_OK");
