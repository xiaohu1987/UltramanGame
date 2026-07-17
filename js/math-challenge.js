/**
 * 难度配置 + 心算挑战（出题 / 判题 / 弹窗）
 * 初级：不弹题；中级 10 内；高级 20 内；地狱 100 内加减法
 */

(function () {
  const STORAGE_KEY = "ultraman.difficulty";
  const DEFAULT_DIFFICULTY = "easy";
  const SUCCESS_BONUS = 1.05;
  // 最后 8 秒进入急迫红闪 + 急迫音效
  const URGENCY_SECONDS = 8;

  /** @type {Record<string, { id: string, label: string, enabled: boolean, max: number, timeLimit: number, bonusMul: number, desc: string }>} */
  const DIFFICULTIES = {
    easy: {
      id: "easy",
      label: "初级",
      enabled: false,
      max: 0,
      timeLimit: 30,
      bonusMul: SUCCESS_BONUS,
      desc: "直接出手，和现在一样",
    },
    normal: {
      id: "normal",
      label: "中级",
      enabled: true,
      max: 10,
      timeLimit: 30,
      bonusMul: SUCCESS_BONUS,
      desc: "10 以内加减法，答对 +5%",
    },
    hard: {
      id: "hard",
      label: "高级",
      enabled: true,
      max: 20,
      timeLimit: 30,
      bonusMul: SUCCESS_BONUS,
      desc: "20 以内加减法，答对 +5%",
    },
    hell: {
      id: "hell",
      label: "地狱级",
      enabled: true,
      max: 100,
      timeLimit: 30,
      bonusMul: SUCCESS_BONUS,
      desc: "100 以内加减法，答对 +5%",
    },
  };

  const DIFFICULTY_ORDER = ["easy", "normal", "hard", "hell"];

  function isDifficultyId(id) {
    return !!DIFFICULTIES[id];
  }

  function getDifficulty(id) {
    return DIFFICULTIES[isDifficultyId(id) ? id : DEFAULT_DIFFICULTY];
  }

  function listDifficulties() {
    return DIFFICULTY_ORDER.map((id) => DIFFICULTIES[id]);
  }

  function loadDifficultyId() {
    try {
      const saved = window.localStorage && window.localStorage.getItem(STORAGE_KEY);
      if (isDifficultyId(saved)) return saved;
    } catch (_) {
      /* ignore */
    }
    return DEFAULT_DIFFICULTY;
  }

  function saveDifficultyId(id) {
    const next = isDifficultyId(id) ? id : DEFAULT_DIFFICULTY;
    try {
      if (window.localStorage) window.localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {
      /* ignore */
    }
    return next;
  }

  /**
   * 生成一道非负结果的加减法
   * @param {number} max 操作数上限（含）
   * @param {() => number} [rng] 0~1 随机源，便于测试
   */
  function generateQuestion(max, rng = Math.random) {
    const limit = Math.max(1, Math.floor(max) || 1);
    const op = rng() < 0.5 ? "+" : "-";
    let a;
    let b;
    if (op === "+") {
      a = Math.floor(rng() * (limit + 1));
      b = Math.floor(rng() * (limit + 1));
    } else {
      a = Math.floor(rng() * (limit + 1));
      b = Math.floor(rng() * (a + 1)); // 保证 a >= b，结果非负
    }
    const answer = op === "+" ? a + b : a - b;
    return {
      a,
      b,
      op,
      answer,
      text: `${a} ${op} ${b} = ?`,
      max: limit,
    };
  }

  /**
   * @param {unknown} input
   * @param {number} answer
   */
  function judgeAnswer(input, answer) {
    if (input === null || input === undefined) return false;
    const raw = String(input).trim();
    if (!raw || !/^-?\d+$/.test(raw)) return false;
    const n = Number(raw);
    if (!Number.isFinite(n)) return false;
    return n === Number(answer);
  }

  /** 攻击类技能（答错 → Miss） */
  const DAMAGE_TYPES = new Set(["damage", "damage_all", "multi_hit", "lifesteal"]);

  function isDamageSkillType(type) {
    return DAMAGE_TYPES.has(type);
  }

  /**
   * 根据答题结果生成结算修正
   * @returns {{ success: boolean, powerMul: number, forceMiss: boolean, forceFail: boolean, reason: string }}
   */
  function buildResolveModifier(difficultyId, correct) {
    const cfg = getDifficulty(difficultyId);
    if (!cfg.enabled) {
      return {
        success: true,
        powerMul: 1,
        forceMiss: false,
        forceFail: false,
        reason: "skip",
      };
    }
    if (correct) {
      return {
        success: true,
        powerMul: cfg.bonusMul || SUCCESS_BONUS,
        forceMiss: false,
        forceFail: false,
        reason: "correct",
      };
    }
    return {
      success: false,
      powerMul: 0,
      forceMiss: true,
      forceFail: true,
      reason: "wrong",
    };
  }

  // ---------- 弹窗 UI（T4/T5） ----------

  let activeSession = null;

  function ensureModal() {
    let root = document.getElementById("math-challenge-modal");
    if (root) return root;

    root = document.createElement("div");
    root.id = "math-challenge-modal";
    root.className = "math-modal";
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "math-challenge-title");
    root.innerHTML = `
      <div class="math-modal-backdrop" data-math-ignore="1"></div>
      <div class="math-modal-card" role="document">
        <div class="math-modal-glow" aria-hidden="true"></div>
        <div class="math-modal-head">
          <div class="math-modal-kicker" id="math-challenge-kicker">心算挑战</div>
          <h2 id="math-challenge-title">算对再出手！</h2>
          <p class="math-modal-sub" id="math-challenge-sub">答对技能增强，答错会失败</p>
        </div>
        <div class="math-timer" aria-live="polite">
          <div class="math-timer-ring" aria-hidden="true">
            <svg viewBox="0 0 96 96">
              <circle class="math-timer-track" cx="48" cy="48" r="40"></circle>
              <circle class="math-timer-progress" cx="48" cy="48" r="40"></circle>
            </svg>
            <div class="math-timer-num" id="math-challenge-timer">30</div>
          </div>
          <div class="math-timer-bar" aria-hidden="true"><span id="math-challenge-bar"></span></div>
        </div>
        <div class="math-question" id="math-challenge-question">1 + 1 = ?</div>
        <form class="math-form" id="math-challenge-form" autocomplete="off">
          <label class="math-input-label" for="math-challenge-input">你的答案</label>
          <input
            id="math-challenge-input"
            class="math-input"
            type="text"
            inputmode="numeric"
            pattern="-?[0-9]*"
            maxlength="5"
            autocomplete="off"
            spellcheck="false"
            aria-label="填写答案"
          />
          <button id="math-challenge-submit" class="btn primary math-submit" type="submit">确定</button>
        </form>
        <p class="math-hint" id="math-challenge-hint">限时 30 秒 · 超时算错</p>
      </div>
    `;
    document.body.appendChild(root);
    return root;
  }

  function playSfx(name, intensity) {
    if (window.ArcadeFX && typeof window.ArcadeFX.sfx === "function") {
      window.ArcadeFX.sfx(name, intensity);
    }
  }

  function stopUrgencyLoop() {
    if (activeSession && activeSession.urgencyTimer) {
      clearInterval(activeSession.urgencyTimer);
      activeSession.urgencyTimer = null;
    }
  }

  function startUrgencyLoop() {
    stopUrgencyLoop();
    if (!activeSession) return;
    playSfx("urgency", 1);
    activeSession.urgencyTimer = setInterval(() => {
      if (!activeSession || activeSession.closed) {
        stopUrgencyLoop();
        return;
      }
      playSfx("urgency", 1.1);
    }, 420);
  }

  function setUrgencyVisual(on) {
    const root = ensureModal();
    root.classList.toggle("is-urgent", !!on);
  }

  function updateTimerUi(remain, total) {
    const root = ensureModal();
    const timerEl = root.querySelector("#math-challenge-timer");
    const barEl = root.querySelector("#math-challenge-bar");
    const progress = root.querySelector(".math-timer-progress");
    const sec = Math.max(0, Math.ceil(remain));
    if (timerEl) timerEl.textContent = String(sec);
    const ratio = total > 0 ? Math.max(0, Math.min(1, remain / total)) : 0;
    if (barEl) barEl.style.width = `${(ratio * 100).toFixed(2)}%`;
    if (progress) {
      const circ = 2 * Math.PI * 40;
      progress.style.strokeDasharray = `${circ}`;
      progress.style.strokeDashoffset = `${(circ * (1 - ratio)).toFixed(2)}`;
    }
  }

  function getCardRect() {
    const root = ensureModal();
    const card = root.querySelector(".math-modal-card");
    if (card && typeof card.getBoundingClientRect === "function") {
      return card.getBoundingClientRect();
    }
    return {
      left: window.innerWidth * 0.5 - 160,
      top: window.innerHeight * 0.5 - 120,
      width: 320,
      height: 240,
    };
  }

  function setCardFxOut(on) {
    const root = ensureModal();
    const card = root.querySelector(".math-modal-card");
    if (card) card.classList.toggle("is-fx-out", !!on);
    root.classList.toggle("is-fx-playing", !!on);
  }

  function playAnswerExitFx(correct, targetUid) {
    const engine = window.ArcadeFX;
    if (!engine || typeof engine.playMathAnswerFx !== "function") {
      return Promise.resolve();
    }
    const sourceRect = getCardRect();
    setCardFxOut(true);
    let targetPoint = null;
    if (targetUid && typeof engine.centerOf === "function") {
      targetPoint = engine.centerOf(targetUid);
    }
    return engine
      .playMathAnswerFx({
        correct: !!correct,
        sourceRect,
        targetUid: targetUid || null,
        targetPoint,
      })
      .catch(() => {});
  }

  function closeModal(result) {
    if (!activeSession || activeSession.closed) return;
    activeSession.closed = true;
    stopUrgencyLoop();
    setUrgencyVisual(false);
    if (activeSession.raf) {
      cancelAnimationFrame(activeSession.raf);
      activeSession.raf = 0;
    }
    if (activeSession.onKey) {
      document.removeEventListener("keydown", activeSession.onKey, true);
    }
    const root = ensureModal();
    root.hidden = true;
    root.classList.remove("show", "is-urgent", "is-fx-playing");
    setCardFxOut(false);
    if (window.ArcadeFX && typeof window.ArcadeFX.cancelMathAnswerFx === "function") {
      // only cancel if a sequence is still active without waiting (hard close / replace)
      if (window.ArcadeFX.mathFx && window.ArcadeFX.mathFx.active) {
        window.ArcadeFX.cancelMathAnswerFx();
      }
    }
    const form = root.querySelector("#math-challenge-form");
    if (form) form.onsubmit = null;
    const resolve = activeSession.resolve;
    activeSession = null;
    if (resolve) resolve(result);
  }

  /**
   * 弹出心算挑战；初级或未启用时立即成功跳过
   * @param {{ difficultyId?: string, skillName?: string, actorName?: string, targetUid?: string, actorUid?: string }} options
   * @returns {Promise<{ correct: boolean, timedOut: boolean, skipped: boolean, question: object|null, powerMul: number, forceMiss: boolean, forceFail: boolean, reason: string }>}
   */
  function promptChallenge(options = {}) {
    const difficultyId = options.difficultyId || loadDifficultyId();
    const cfg = getDifficulty(difficultyId);

    if (!cfg.enabled) {
      const mod = buildResolveModifier(difficultyId, true);
      return Promise.resolve({
        correct: true,
        timedOut: false,
        skipped: true,
        question: null,
        powerMul: mod.powerMul,
        forceMiss: mod.forceMiss,
        forceFail: mod.forceFail,
        reason: "skip",
        difficultyId: cfg.id,
      });
    }

    // 已有弹窗时先以超时失败关闭，避免叠层
    if (activeSession && !activeSession.closed) {
      closeModal({
        correct: false,
        timedOut: true,
        skipped: false,
        question: activeSession.question,
        powerMul: 0,
        forceMiss: true,
        forceFail: true,
        reason: "replaced",
        difficultyId: cfg.id,
      });
    }

    const question = generateQuestion(cfg.max);
    const root = ensureModal();
    const kicker = root.querySelector("#math-challenge-kicker");
    const title = root.querySelector("#math-challenge-title");
    const sub = root.querySelector("#math-challenge-sub");
    const qEl = root.querySelector("#math-challenge-question");
    const hint = root.querySelector("#math-challenge-hint");
    const input = root.querySelector("#math-challenge-input");
    const form = root.querySelector("#math-challenge-form");
    const submitBtn = root.querySelector("#math-challenge-submit");

    if (kicker) kicker.textContent = `${cfg.label} · 心算挑战`;
    if (title) title.textContent = "算对再出手！";
    if (sub) {
      const who = options.actorName ? `${options.actorName} 的` : "";
      const skill = options.skillName ? `「${options.skillName}」` : "技能";
      sub.textContent = `${who}${skill} · 答对威力 +5%`;
    }
    if (qEl) qEl.textContent = question.text;
    if (hint) hint.textContent = `限时 ${cfg.timeLimit} 秒 · 超时算错 · ${cfg.desc}`;
    if (input) {
      input.value = "";
      input.disabled = false;
    }
    if (submitBtn) submitBtn.disabled = false;

    root.hidden = false;
    root.classList.add("show");
    root.classList.remove("is-urgent", "is-fx-playing");
    setCardFxOut(false);
    updateTimerUi(cfg.timeLimit, cfg.timeLimit);

    return new Promise((resolve) => {
      const startedAt = performance.now();
      const totalMs = cfg.timeLimit * 1000;

      activeSession = {
        resolve,
        question,
        closed: false,
        urgencyTimer: null,
        raf: 0,
        onKey: null,
        urgent: false,
        finishing: false,
        targetUid: options.targetUid || null,
        actorUid: options.actorUid || null,
      };

      const finish = (correct, timedOut) => {
        if (!activeSession || activeSession.closed || activeSession.finishing) return;
        activeSession.finishing = true;
        const mod = buildResolveModifier(cfg.id, correct);
        const targetUid = activeSession.targetUid;

        // lock UI + stop timer/urgency before exit FX
        stopUrgencyLoop();
        setUrgencyVisual(false);
        if (activeSession.raf) {
          cancelAnimationFrame(activeSession.raf);
          activeSession.raf = 0;
        }
        if (input) input.disabled = true;
        if (submitBtn) submitBtn.disabled = true;
        if (form) form.onsubmit = null;

        const result = {
          correct,
          timedOut: !!timedOut,
          skipped: false,
          question,
          powerMul: mod.powerMul,
          forceMiss: mod.forceMiss,
          forceFail: mod.forceFail,
          reason: timedOut ? "timeout" : mod.reason,
          difficultyId: cfg.id,
        };

        // 音效 + 粒子由 ArcadeFX 按阶段播放；动画结束后再 resolve 给战斗引擎
        playAnswerExitFx(correct, targetUid).finally(() => {
          closeModal(result);
        });
      };

      const onSubmit = (event) => {
        if (event) event.preventDefault();
        if (!activeSession || activeSession.closed) return;
        const value = input ? input.value : "";
        const ok = judgeAnswer(value, question.answer);
        finish(ok, false);
      };

      if (form) form.onsubmit = onSubmit;

      activeSession.onKey = (event) => {
        if (!activeSession || activeSession.closed) return;
        if (event.key === "Escape") {
          // 不允许跳过，Esc 视为放弃 → 答错
          event.preventDefault();
          finish(false, false);
        }
      };
      document.addEventListener("keydown", activeSession.onKey, true);

      const tick = (now) => {
        if (!activeSession || activeSession.closed) return;
        const remainMs = Math.max(0, totalMs - (now - startedAt));
        const remainSec = remainMs / 1000;
        updateTimerUi(remainSec, cfg.timeLimit);

        const urgent = remainSec <= URGENCY_SECONDS && remainSec > 0;
        if (urgent && !activeSession.urgent) {
          activeSession.urgent = true;
          setUrgencyVisual(true);
          startUrgencyLoop();
        }

        if (remainMs <= 0) {
          finish(false, true);
          return;
        }
        activeSession.raf = requestAnimationFrame(tick);
      };
      activeSession.raf = requestAnimationFrame(tick);

      // 聚焦输入
      requestAnimationFrame(() => {
        if (input && !activeSession?.closed) {
          input.focus();
          input.select();
        }
      });
      playSfx("select", 0.9);
    });
  }

  function abortChallenge(reason = "abort") {
    if (!activeSession || activeSession.closed) return;
    closeModal({
      correct: false,
      timedOut: false,
      skipped: false,
      question: activeSession.question,
      powerMul: 0,
      forceMiss: true,
      forceFail: true,
      reason,
      difficultyId: loadDifficultyId(),
    });
  }

  function isChallengeOpen() {
    return !!(activeSession && !activeSession.closed);
  }

  window.MathChallenge = {
    STORAGE_KEY,
    DEFAULT_DIFFICULTY,
    SUCCESS_BONUS,
    URGENCY_SECONDS,
    DIFFICULTIES,
    DIFFICULTY_ORDER,
    isDifficultyId,
    getDifficulty,
    listDifficulties,
    loadDifficultyId,
    saveDifficultyId,
    generateQuestion,
    judgeAnswer,
    isDamageSkillType,
    buildResolveModifier,
    promptChallenge,
    abortChallenge,
    isChallengeOpen,
  };
})();
