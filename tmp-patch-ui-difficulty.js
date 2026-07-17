const fs = require("fs");

function patchUi() {
  const p = "js/ui.js";
  let t = fs.readFileSync(p, "utf8");

  if (!t.includes("difficultyOptions:")) {
    t = t.replace(
      'btnRestart: document.getElementById("btn-restart"),\n  };',
      'btnRestart: document.getElementById("btn-restart"),\n    difficultyOptions: document.getElementById("difficulty-options"),\n    difficultyDesc: document.getElementById("difficulty-desc"),\n  };'
    );
  }

  if (!t.includes("function setDifficultyUi")) {
    const insert = `
  function setDifficultyUi(difficultyId) {
    const MC = window.MathChallenge;
    const id = MC && MC.isDifficultyId(difficultyId) ? difficultyId : (MC ? MC.DEFAULT_DIFFICULTY : "easy");
    const cfg = MC ? MC.getDifficulty(id) : { label: "初级", desc: "直接出手，和现在一样" };
    if (els.difficultyDesc) {
      els.difficultyDesc.textContent = cfg.desc || "";
    }
    if (els.difficultyOptions) {
      els.difficultyOptions.querySelectorAll("[data-difficulty]").forEach((btn) => {
        const active = btn.getAttribute("data-difficulty") === id;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }
  }

`;
    t = t.replace("  function bindStatic(handlers) {", insert + "  function bindStatic(handlers) {");
  }

  if (!t.includes("difficultyOptions.addEventListener") && !t.includes("els.difficultyOptions.addEventListener")) {
    t = t.replace(
      "    els.btnRestart.addEventListener(\"click\", (e) => {\n      if (fx()) fx().playUi(\"click\", e.currentTarget);\n      handlers.onRestart();\n    });\n  }",
      "    els.btnRestart.addEventListener(\"click\", (e) => {\n      if (fx()) fx().playUi(\"click\", e.currentTarget);\n      handlers.onRestart();\n    });\n    if (els.difficultyOptions) {\n      els.difficultyOptions.addEventListener(\"click\", (e) => {\n        const btn = e.target.closest(\"[data-difficulty]\");\n        if (!btn || !els.difficultyOptions.contains(btn)) return;\n        const id = btn.getAttribute(\"data-difficulty\");\n        if (!id) return;\n        if (fx()) fx().playUi(\"select\", btn);\n        if (handlers.onDifficultyChange) handlers.onDifficultyChange(id);\n      });\n    }\n  }"
    );
  }

  if (!t.includes("setDifficultyUi,")) {
    t = t.replace(
      "    setAutoBattleUi,\n  };",
      "    setAutoBattleUi,\n    setDifficultyUi,\n  };"
    );
  }

  fs.writeFileSync(p, t, "utf8");
  console.log("ui patched", {
    els: t.includes("difficultyOptions:"),
    fn: t.includes("function setDifficultyUi"),
    bind: t.includes("onDifficultyChange"),
    export: t.includes("setDifficultyUi,"),
  });
}

function patchMain() {
  const p = "js/main.js";
  let t = fs.readFileSync(p, "utf8");

  if (!t.includes("difficultyId")) {
    t = t.replace(
      "  let autoBattleEnabled = false;\n  let randomizing = false;\n  let randomFinalEffect = false;",
      "  let autoBattleEnabled = false;\n  let difficultyId = (window.MathChallenge && window.MathChallenge.loadDifficultyId()) || \"easy\";\n  let randomizing = false;\n  let randomFinalEffect = false;"
    );
  }

  if (!t.includes("function setDifficulty")) {
    t = t.replace(
      "  function toggleAutoBattle() {",
      "  function setDifficulty(id) {\n    const MC = window.MathChallenge;\n    if (MC && MC.isDifficultyId(id)) {\n      difficultyId = MC.saveDifficultyId(id);\n    } else if (MC) {\n      difficultyId = MC.DEFAULT_DIFFICULTY;\n    } else {\n      difficultyId = \"easy\";\n    }\n    UI.setDifficultyUi(difficultyId);\n  }\n\n  function toggleAutoBattle() {"
    );
  }

  if (!t.includes("difficulty: difficultyId")) {
    t = t.replace(
      "    battle = new window.BattleEngine({\n      heroes,\n      monsters,\n      autoBattle: autoBattleEnabled,",
      "    battle = new window.BattleEngine({\n      heroes,\n      monsters,\n      autoBattle: autoBattleEnabled,\n      difficulty: difficultyId,"
    );
  }

  if (!t.includes("难度：")) {
    t = t.replace(
      "    UI.appendLog(`${heroes.map((h) => h.name).join(\"、\")} VS ${monsters.map((m) => m.name).join(\"、\")}`);\n    if (autoBattleEnabled) {\n      UI.appendLog(\"自动：开\");\n    }",
      "    UI.appendLog(`${heroes.map((h) => h.name).join(\"、\")} VS ${monsters.map((m) => m.name).join(\"、\")}`);\n    {\n      const MC = window.MathChallenge;\n      const cfg = MC ? MC.getDifficulty(difficultyId) : null;\n      UI.appendLog(`难度：${cfg ? cfg.label : \"初级\"}`);\n    }\n    if (autoBattleEnabled) {\n      UI.appendLog(\"自动：开\");\n    }"
    );
  }

  if (!t.includes("onDifficultyChange")) {
    t = t.replace(
      "      onToggleAuto: toggleAutoBattle,\n      onRestart: restart,\n    });\n    UI.setAutoBattleUi(autoBattleEnabled);",
      "      onToggleAuto: toggleAutoBattle,\n      onDifficultyChange: setDifficulty,\n      onRestart: restart,\n    });\n    UI.setAutoBattleUi(autoBattleEnabled);\n    UI.setDifficultyUi(difficultyId);"
    );
  }

  fs.writeFileSync(p, t, "utf8");
  console.log("main patched", {
    difficultyId: t.includes("let difficultyId"),
    setDifficulty: t.includes("function setDifficulty"),
    engine: t.includes("difficulty: difficultyId"),
    bind: t.includes("onDifficultyChange"),
  });
}

function patchIndexScript() {
  const p = "index.html";
  let t = fs.readFileSync(p, "utf8");
  if (!t.includes("js/math-challenge.js")) {
    t = t.replace(
      '<script src="js/data.js?v=roster-25-12"></script>\n  <script src="js/battle.js?v=expanded-skills-3"></script>',
      '<script src="js/data.js?v=roster-25-12"></script>\n  <script src="js/math-challenge.js?v=difficulty-1"></script>\n  <script src="js/battle.js?v=expanded-skills-3"></script>'
    );
    fs.writeFileSync(p, t, "utf8");
  }
  console.log("index script", t.includes("math-challenge.js"));
}

patchUi();
patchMain();
patchIndexScript();
