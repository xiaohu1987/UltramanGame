/**
 * T6: wire math answer FX into challenge + battle flow
 */
const fs = require("fs");

function patchFile(path, mutator) {
  let s = fs.readFileSync(path, "utf8");
  const nl = s.includes("\r\n") ? "\r\n" : "\n";
  const next = mutator(s, nl);
  if (next == null) {
    console.error("patch failed:", path);
    process.exit(1);
  }
  fs.writeFileSync(path, next);
  console.log("patched", path);
}

// ---------- math-challenge.js ----------
patchFile("js/math-challenge.js", (s, nl) => {
  if (s.includes("playAnswerExitFx")) {
    console.log("math-challenge already integrated");
    return s;
  }

  // helper before closeModal
  const helperNeedle = [
    "  function closeModal(result) {",
  ].join(nl);
  const helperInsert = [
    "  function getCardRect() {",
    "    const root = ensureModal();",
    "    const card = root.querySelector(\".math-modal-card\");",
    "    if (card && typeof card.getBoundingClientRect === \"function\") {",
    "      return card.getBoundingClientRect();",
    "    }",
    "    return {",
    "      left: window.innerWidth * 0.5 - 160,",
    "      top: window.innerHeight * 0.5 - 120,",
    "      width: 320,",
    "      height: 240,",
    "    };",
    "  }",
    "",
    "  function setCardFxOut(on) {",
    "    const root = ensureModal();",
    "    const card = root.querySelector(\".math-modal-card\");",
    "    if (card) card.classList.toggle(\"is-fx-out\", !!on);",
    "    root.classList.toggle(\"is-fx-playing\", !!on);",
    "  }",
    "",
    "  function playAnswerExitFx(correct, targetUid) {",
    "    const engine = window.ArcadeFX;",
    "    if (!engine || typeof engine.playMathAnswerFx !== \"function\") {",
    "      return Promise.resolve();",
    "    }",
    "    const sourceRect = getCardRect();",
    "    setCardFxOut(true);",
    "    return engine",
    "      .playMathAnswerFx({",
    "        correct: !!correct,",
    "        sourceRect,",
    "        targetUid: targetUid || null,",
    "        targetPoint: targetUid && typeof engine.centerOf === \"function\" ? engine.centerOf(targetUid) : null,",
    "      })",
    "      .catch(() => {});",
    "  }",
    "",
    "  function closeModal(result) {",
  ].join(nl);
  if (!s.includes(helperNeedle)) return null;
  s = s.replace(helperNeedle, helperInsert);

  // closeModal: also clear fx-out classes and cancel fx when hard-closing
  const closeNeedle = [
    "    const root = ensureModal();",
    "    root.hidden = true;",
    "    root.classList.remove(\"show\", \"is-urgent\");",
  ].join(nl);
  const closeInsert = [
    "    const root = ensureModal();",
    "    root.hidden = true;",
    "    root.classList.remove(\"show\", \"is-urgent\", \"is-fx-playing\");",
    "    setCardFxOut(false);",
    "    if (window.ArcadeFX && typeof window.ArcadeFX.cancelMathAnswerFx === \"function\") {",
    "      // only cancel if a sequence is still active without waiting (hard close / replace)",
    "      if (window.ArcadeFX.mathFx && window.ArcadeFX.mathFx.active) {",
    "        window.ArcadeFX.cancelMathAnswerFx();",
    "      }",
    "    }",
  ].join(nl);
  if (!s.includes(closeNeedle)) return null;
  s = s.replace(closeNeedle, closeInsert);

  // JSDoc options
  s = s.replace(
    "@param {{ difficultyId?: string, skillName?: string, actorName?: string }} options",
    "@param {{ difficultyId?: string, skillName?: string, actorName?: string, targetUid?: string, actorUid?: string }} options"
  );

  // store targetUid on session + rewrite finish
  const sessionNeedle = [
    "      activeSession = {",
    "        resolve,",
    "        question,",
    "        closed: false,",
    "        urgencyTimer: null,",
    "        raf: 0,",
    "        onKey: null,",
    "        urgent: false,",
    "      };",
    "",
    "      const finish = (correct, timedOut) => {",
    "        if (!activeSession || activeSession.closed) return;",
    "        const mod = buildResolveModifier(cfg.id, correct);",
    "        // 音效改由 ArcadeFX.playMathAnswerFx 按阶段触发，避免双重播放",
    "        closeModal({",
    "          correct,",
    "          timedOut: !!timedOut,",
    "          skipped: false,",
    "          question,",
    "          powerMul: mod.powerMul,",
    "          forceMiss: mod.forceMiss,",
    "          forceFail: mod.forceFail,",
    "          reason: timedOut ? \"timeout\" : mod.reason,",
    "          difficultyId: cfg.id,",
    "        });",
    "      };",
  ].join(nl);

  const sessionInsert = [
    "      activeSession = {",
    "        resolve,",
    "        question,",
    "        closed: false,",
    "        urgencyTimer: null,",
    "        raf: 0,",
    "        onKey: null,",
    "        urgent: false,",
    "        finishing: false,",
    "        targetUid: options.targetUid || null,",
    "        actorUid: options.actorUid || null,",
    "      };",
    "",
    "      const finish = (correct, timedOut) => {",
    "        if (!activeSession || activeSession.closed || activeSession.finishing) return;",
    "        activeSession.finishing = true;",
    "        const mod = buildResolveModifier(cfg.id, correct);",
    "        const targetUid = activeSession.targetUid;",
    "",
    "        // lock UI + stop timer/urgency before exit FX",
    "        stopUrgencyLoop();",
    "        setUrgencyVisual(false);",
    "        if (activeSession.raf) {",
    "          cancelAnimationFrame(activeSession.raf);",
    "          activeSession.raf = 0;",
    "        }",
    "        if (input) input.disabled = true;",
    "        if (submitBtn) submitBtn.disabled = true;",
    "        if (form) form.onsubmit = null;",
    "",
    "        const result = {",
    "          correct,",
    "          timedOut: !!timedOut,",
    "          skipped: false,",
    "          question,",
    "          powerMul: mod.powerMul,",
    "          forceMiss: mod.forceMiss,",
    "          forceFail: mod.forceFail,",
    "          reason: timedOut ? \"timeout\" : mod.reason,",
    "          difficultyId: cfg.id,",
    "        };",
    "",
    "        // 音效 + 粒子由 ArcadeFX 按阶段播放；结束后再 resolve 给战斗引擎",
    "        playAnswerExitFx(correct, targetUid).finally(() => {",
    "          closeModal(result);",
    "        });",
    "      };",
  ].join(nl);

  if (!s.includes(sessionNeedle)) return null;
  s = s.replace(sessionNeedle, sessionInsert);

  // reset fx-out when opening modal
  const openNeedle = [
    "    root.hidden = false;",
    "    root.classList.add(\"show\");",
    "    root.classList.remove(\"is-urgent\");",
  ].join(nl);
  const openInsert = [
    "    root.hidden = false;",
    "    root.classList.add(\"show\");",
    "    root.classList.remove(\"is-urgent\", \"is-fx-playing\");",
    "    setCardFxOut(false);",
  ].join(nl);
  if (!s.includes(openNeedle)) return null;
  s = s.replace(openNeedle, openInsert);

  return s;
});

// ---------- battle.js ----------
patchFile("js/battle.js", (s, nl) => {
  if (s.includes("targetUid: target")) {
    // may already have something similar; check exact
  }
  const needle = [
    "      window.MathChallenge.promptChallenge({",
    "        difficultyId: this.difficulty,",
    "        skillName: skill.name,",
    "        actorName: actor.name,",
    "      })",
  ].join(nl);
  const insert = [
    "      window.MathChallenge.promptChallenge({",
    "        difficultyId: this.difficulty,",
    "        skillName: skill.name,",
    "        actorName: actor.name,",
    "        actorUid: actor && actor.uid,",
    "        targetUid: target && target.uid,",
    "      })",
  ].join(nl);
  if (s.includes(insert)) {
    console.log("battle already integrated");
    return s;
  }
  if (!s.includes(needle)) return null;
  return s.replace(needle, insert);
});

// ---------- css ----------
patchFile("css/math-challenge.css", (s, nl) => {
  if (s.includes("is-fx-out")) {
    console.log("css already has is-fx-out");
    return s;
  }
  const extra = [
    "",
    "/* 答题离场特效：DOM 卡片交给 Canvas，避免双重显示 */",
    ".math-modal-card.is-fx-out {",
    "  opacity: 0 !important;",
    "  pointer-events: none !important;",
    "  transform: scale(0.96);",
    "  transition: opacity 0.12s ease, transform 0.12s ease;",
    "}",
    "",
    ".math-modal.is-fx-playing .math-modal-backdrop {",
    "  opacity: 0.35;",
    "  transition: opacity 0.2s ease;",
    "}",
    "",
  ].join(nl);
  return s + extra;
});

// syntax checks
for (const f of ["js/math-challenge.js", "js/battle.js"]) {
  try {
    new Function(fs.readFileSync(f, "utf8"));
    console.log("syntax OK", f);
  } catch (e) {
    console.error("syntax FAIL", f, e.message);
    process.exit(1);
  }
}
console.log("T6 integrate patch done");
