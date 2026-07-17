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
  const nl = t.includes("\r\n") ? "\r\n" : "\n";

  // els
  if (!t.includes("difficultyModal:")) {
    const needle = `btnRestart: document.getElementById("btn-restart"),`;
    const idx = t.indexOf(needle);
    must(idx >= 0, "btnRestart not found");
    const insert =
      needle +
      `${nl}    difficultyOptions: document.getElementById("difficulty-options"),` +
      `${nl}    difficultyDesc: document.getElementById("difficulty-desc"),` +
      `${nl}    difficultyModal: document.getElementById("difficulty-modal"),` +
      `${nl}    difficultyModalOptions: document.getElementById("difficulty-modal-options"),` +
      `${nl}    difficultyModalHint: document.getElementById("difficulty-modal-hint"),` +
      `${nl}    btnDifficultyConfirm: document.getElementById("btn-difficulty-confirm"),`;
    t = t.slice(0, idx) + insert + t.slice(idx + needle.length);
  }

  // bind events
  if (!t.includes("difficultyModalOptions.addEventListener")) {
    const restartEnd =
      `    els.btnRestart.addEventListener("click", (e) => {${nl}` +
      `      if (fx()) fx().playUi("click", e.currentTarget);${nl}` +
      `      handlers.onRestart();${nl}` +
      `    });`;
    const idx = t.indexOf(restartEnd);
    must(idx >= 0, "restart listener not found");
    const extra =
      restartEnd +
      `${nl}    if (els.difficultyOptions) {` +
      `${nl}      els.difficultyOptions.addEventListener("click", (e) => {` +
      `${nl}        const btn = e.target.closest("[data-difficulty]");` +
      `${nl}        if (!btn || !els.difficultyOptions.contains(btn)) return;` +
      `${nl}        const id = btn.getAttribute("data-difficulty");` +
      `${nl}        if (!id) return;` +
      `${nl}        if (fx()) fx().playUi("select", btn);` +
      `${nl}        if (handlers.onDifficultyChange) handlers.onDifficultyChange(id);` +
      `${nl}      });` +
      `${nl}    }` +
      `${nl}    if (els.difficultyModalOptions) {` +
      `${nl}      els.difficultyModalOptions.addEventListener("click", (e) => {` +
      `${nl}        const btn = e.target.closest("[data-difficulty]");` +
      `${nl}        if (!btn || !els.difficultyModalOptions.contains(btn)) return;` +
      `${nl}        const id = btn.getAttribute("data-difficulty");` +
      `${nl}        if (!id) return;` +
      `${nl}        if (fx()) fx().playUi("select", btn);` +
      `${nl}        setModalPending(id);` +
      `${nl}      });` +
      `${nl}    }` +
      `${nl}    if (els.btnDifficultyConfirm) {` +
      `${nl}      els.btnDifficultyConfirm.addEventListener("click", (e) => {` +
      `${nl}        if (fx()) fx().playUi("start", e.currentTarget);` +
      `${nl}        const id = pendingDifficultyId;` +
      `${nl}        if (handlers.onDifficultyConfirm) {` +
      `${nl}          handlers.onDifficultyConfirm(id);` +
      `${nl}        } else if (handlers.onDifficultyChange) {` +
      `${nl}          handlers.onDifficultyChange(id);` +
      `${nl}        }` +
      `${nl}        closeDifficultyModal();` +
      `${nl}      });` +
      `${nl}    }`;
    t = t.slice(0, idx) + extra + t.slice(idx + restartEnd.length);
  }

  // close on battle
  if (!t.includes("closeDifficultyModal();")) {
    const battleLine = `if (els.phaseBadge) els.phaseBadge.textContent = "战斗";`;
    const idx = t.indexOf(battleLine);
    must(idx >= 0, "battle badge not found");
    // insert after this line
    const after = idx + battleLine.length;
    t = t.slice(0, after) + `${nl}    closeDifficultyModal();` + t.slice(after);
  }

  // exports
  if (!t.includes("openDifficultyModal,")) {
    const exp = `    setAutoBattleUi,${nl}  };`;
    const idx = t.indexOf(exp);
    must(idx >= 0, "export block not found");
    t =
      t.slice(0, idx) +
      `    setAutoBattleUi,${nl}    setDifficultyUi,${nl}    openDifficultyModal,${nl}    closeDifficultyModal,${nl}    isDifficultyModalOpen,${nl}    getPendingDifficultyId,${nl}  };` +
      t.slice(idx + exp.length);
  }

  fs.writeFileSync(p, t, "utf8");
  const checks = {
    els: t.includes("difficultyModal:"),
    open: t.includes("function openDifficultyModal"),
    setUi: t.includes("function setDifficultyUi"),
    bind: t.includes("difficultyModalOptions.addEventListener"),
    exportOpen: t.includes("openDifficultyModal,"),
    closeBattle: t.includes("closeDifficultyModal();"),
  };
  console.log("ui", checks);
  must(Object.values(checks).every(Boolean), "ui incomplete");
}

function patchMain() {
  const p = "js/main.js";
  let t = fs.readFileSync(p, "utf8");
  const nl = t.includes("\r\n") ? "\r\n" : "\n";

  if (!t.includes("function enterSelectScreen")) {
    const needle = "  function restart() {";
    const idx = t.indexOf(needle);
    must(idx >= 0, "restart not found");
    const enter =
      `  function enterSelectScreen() {${nl}` +
      `    UI.showSelect();${nl}` +
      `    refreshSelect();${nl}` +
      `    UI.setDifficultyUi(difficultyId);${nl}` +
      `    if (typeof UI.openDifficultyModal === "function") {${nl}` +
      `      UI.openDifficultyModal(difficultyId);${nl}` +
      `    }${nl}` +
      `  }${nl}${nl}`;
    t = t.slice(0, idx) + enter + t.slice(idx);
  }

  // restart body
  const restartRe = /function restart\(\) \{[\s\S]*?\n  \}/;
  if (restartRe.test(t) && !t.includes("enterSelectScreen();")) {
    t = t.replace(
      restartRe,
      `function restart() {${nl}` +
        `    battle = null;${nl}` +
        `    selectedIds = [];${nl}` +
        `    if (window.ArcadeFX) window.ArcadeFX.resetCombo();${nl}` +
        `    if (window.MathChallenge && typeof window.MathChallenge.abortChallenge === "function") {${nl}` +
        `      window.MathChallenge.abortChallenge("restart");${nl}` +
        `    }${nl}` +
        `    enterSelectScreen();${nl}` +
        `  }`
    );
  }

  if (!t.includes("onDifficultyConfirm")) {
    t = t.replace(
      "onDifficultyChange: setDifficulty,",
      `onDifficultyChange: setDifficulty,${nl}      onDifficultyConfirm: setDifficulty,`
    );
  }

  // init enter
  if (t.includes("UI.showSelect();") && t.includes("function enterSelectScreen")) {
    // preferred exact block
    const a =
      `UI.setAutoBattleUi(autoBattleEnabled);${nl}    UI.setDifficultyUi(difficultyId);${nl}${nl}    UI.showSelect();${nl}    refreshSelect();${nl}  }`;
    if (t.includes(a)) {
      t = t.replace(a, `UI.setAutoBattleUi(autoBattleEnabled);${nl}    enterSelectScreen();${nl}  }`);
    } else {
      const b = `UI.setAutoBattleUi(autoBattleEnabled);${nl}${nl}    UI.showSelect();${nl}    refreshSelect();${nl}  }`;
      if (t.includes(b)) {
        t = t.replace(b, `UI.setAutoBattleUi(autoBattleEnabled);${nl}    enterSelectScreen();${nl}  }`);
      } else if (t.includes(`UI.showSelect();${nl}    refreshSelect();${nl}  }`)) {
        t = t.replace(
          `UI.setDifficultyUi(difficultyId);${nl}${nl}    UI.showSelect();${nl}    refreshSelect();${nl}  }`,
          `enterSelectScreen();${nl}  }`
        );
      }
    }
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
console.log("PATCH_DIFFICULTY_MODAL3_OK");
