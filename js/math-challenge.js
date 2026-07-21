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

  /**
   * 按 5 / 10 拆分，生成适合小朋友的心算提醒
   * 例：7+5 → 2+5+5；7-5 → 2+5-5
   */
  function buildMathTip(question) {
    if (!question || !Number.isFinite(question.a) || !Number.isFinite(question.b)) {
      return {
        available: false,
        base: 5,
        title: "",
        originalText: "",
        rewrittenText: "",
        steps: [],
        morph: null,
        reason: "invalid",
      };
    }

    const a = Number(question.a);
    const b = Number(question.b);
    const op = question.op === "-" ? "-" : "+";
    const max = Number(question.max) || Math.max(a, b, 10);
    const prefer10 = max > 10 || a >= 10 || b >= 10;
    const originalText = a + " " + op + " " + b + " = ?";

    if (op === "+") return buildAddTip(a, b, prefer10, originalText);
    return buildSubTip(a, b, prefer10, originalText);
  }

  function tipResult(partial) {
    return Object.assign(
      {
        available: true,
        base: 5,
        title: "小提示",
        originalText: "",
        rewrittenText: "",
        steps: [],
        morph: null,
        reason: "ok",
      },
      partial
    );
  }

  function buildAddTip(a, b, prefer10, originalText) {
    if (a === b && (a === 5 || a === 10)) {
      return tipResult({
        base: a,
        title: a === 10 ? "两个十" : "两个五",
        originalText: originalText,
        rewrittenText: a + " + " + b + " = " + a * 2,
        steps: [a + " + " + a + " = " + a * 2, "记住这个好朋友组合，算得更快！"],
        morph: null,
        reason: "double",
      });
    }

    // 优先：一边是 5/10 时，把另一边拆成「余数 + 5/10」
    // 例：7+5 → 2+5+5；12+10 → 2+10+10
    if (b === 5 && a > 5) {
      const rest = a - 5;
      return tipResult({
        base: 5,
        title: "拆成五",
        originalText: originalText,
        rewrittenText: rest + " + 5 + 5 = ?",
        steps: [
          "把 " + a + " 慢慢拆成 " + rest + " + 5",
          "现在变成 " + rest + " + 5 + 5",
          "两个 5 先凑成 10，再加 " + rest + " = " + (a + b),
        ],
        morph: { index: "a", from: a, parts: [rest, 5] },
        reason: "pair5-a",
      });
    }
    if (a === 5 && b > 5) {
      const rest = b - 5;
      return tipResult({
        base: 5,
        title: "拆成五",
        originalText: originalText,
        rewrittenText: "5 + " + rest + " + 5 = ?",
        steps: [
          "把 " + b + " 慢慢拆成 " + rest + " + 5",
          "现在变成 5 + " + rest + " + 5",
          "两个 5 先凑成 10，再加 " + rest + " = " + (a + b),
        ],
        morph: { index: "b", from: b, parts: [rest, 5] },
        reason: "pair5-b",
      });
    }
    if (b === 10 && a > 10) {
      const rest = a - 10;
      return tipResult({
        base: 10,
        title: "拆成十",
        originalText: originalText,
        rewrittenText: rest + " + 10 + 10 = ?",
        steps: [
          "把 " + a + " 慢慢拆成 " + rest + " + 10",
          "现在变成 " + rest + " + 10 + 10",
          "两个 10 先凑成 20，再加 " + rest + " = " + (a + b),
        ],
        morph: { index: "a", from: a, parts: [rest, 10] },
        reason: "pair10-a",
      });
    }
    if (a === 10 && b > 10) {
      const rest = b - 10;
      return tipResult({
        base: 10,
        title: "拆成十",
        originalText: originalText,
        rewrittenText: "10 + " + rest + " + 10 = ?",
        steps: [
          "把 " + b + " 慢慢拆成 " + rest + " + 10",
          "现在变成 10 + " + rest + " + 10",
          "两个 10 先凑成 20，再加 " + rest + " = " + (a + b),
        ],
        morph: { index: "b", from: b, parts: [rest, 10] },
        reason: "pair10-b",
      });
    }

    // 凑十：拆第二个数
    if (a > 0 && a < 10) {
      const need = 10 - a;
      if (b > need && need > 0) {
        const rest = b - need;
        return tipResult({
          base: 10,
          title: "凑十法",
          originalText: originalText,
          rewrittenText: a + " + " + need + " + " + rest + " = ?",
          steps: [
            "把 " + b + " 拆成 " + need + " + " + rest,
            "先算 " + a + " + " + need + " = 10",
            "再算 10 + " + rest + " = " + (10 + rest),
          ],
          morph: { index: "b", from: b, parts: [need, rest] },
          reason: "make10-b",
        });
      }
    }

    // 凑十：拆第一个数
    if (b > 0 && b < 10) {
      const need = 10 - b;
      if (a > need && need > 0) {
        const rest = a - need;
        return tipResult({
          base: 10,
          title: "凑十法",
          originalText: originalText,
          rewrittenText: need + " + " + rest + " + " + b + " = ?",
          steps: [
            "把 " + a + " 拆成 " + need + " + " + rest,
            "先算 " + need + " + " + b + " = 10",
            "再算 10 + " + rest + " = " + (10 + rest),
          ],
          morph: { index: "a", from: a, parts: [need, rest] },
          reason: "make10-a",
        });
      }
    }

    // 凑五
    if (!prefer10 || Math.max(a, b) <= 10) {
      if (a > 0 && a < 5) {
        const need = 5 - a;
        if (b > need && need > 0) {
          const rest = b - need;
          return tipResult({
            base: 5,
            title: "凑五法",
            originalText: originalText,
            rewrittenText: a + " + " + need + " + " + rest + " = ?",
            steps: [
              "把 " + b + " 拆成 " + need + " + " + rest,
              "先算 " + a + " + " + need + " = 5",
              "再算 5 + " + rest + " = " + (5 + rest),
            ],
            morph: { index: "b", from: b, parts: [need, rest] },
            reason: "make5-b",
          });
        }
      }
      if (b > 0 && b < 5) {
        const need = 5 - b;
        if (a > need && need > 0) {
          const rest = a - need;
          return tipResult({
            base: 5,
            title: "凑五法",
            originalText: originalText,
            rewrittenText: need + " + " + rest + " + " + b + " = ?",
            steps: [
              "把 " + a + " 拆成 " + need + " + " + rest,
              "先算 " + need + " + " + b + " = 5",
              "再算 5 + " + rest + " = " + (5 + rest),
            ],
            morph: { index: "a", from: a, parts: [need, rest] },
            reason: "make5-a",
          });
        }
      }
    }

    // 通用：把较大数按 5/10 拆（如 7+5 → 2+5+5）
    if (a >= b && a > 5) {
      const parts = a >= 10 && prefer10 && a !== 10 ? [10, a - 10].filter((x) => x > 0) : [a - 5, 5];
      if (parts.length === 2 && parts[0] > 0) {
        return tipResult({
          base: parts.includes(10) ? 10 : 5,
          title: parts.includes(10) ? "拆成十" : "拆成五",
          originalText: originalText,
          rewrittenText: parts[0] + " + " + parts[1] + " + " + b + " = ?",
          steps: [
            "把 " + a + " 慢慢拆成 " + parts[0] + " + " + parts[1],
            b === parts[1]
              ? "可以看到两个 " + parts[1] + "，先凑在一起更好算"
              : "先算 " + parts[1] + " + " + b + "，再加 " + parts[0],
            "结果还是 " + (a + b),
          ],
          morph: { index: "a", from: a, parts: parts },
          reason: "split-a",
        });
      }
    }

    if (b > 5) {
      const parts = b >= 10 && prefer10 && b !== 10 ? [10, b - 10].filter((x) => x > 0) : [b - 5, 5];
      if (parts.length === 2 && parts[0] > 0) {
        return tipResult({
          base: parts.includes(10) ? 10 : 5,
          title: parts.includes(10) ? "拆成十" : "拆成五",
          originalText: originalText,
          rewrittenText: a + " + " + parts[0] + " + " + parts[1] + " = ?",
          steps: [
            "把 " + b + " 慢慢拆成 " + parts[0] + " + " + parts[1],
            a === parts[1]
              ? "可以看到两个 " + parts[1] + "，先凑在一起更好算"
              : "先算 " + a + " + " + parts[1] + "，再加 " + parts[0],
            "结果还是 " + (a + b),
          ],
          morph: { index: "b", from: b, parts: parts },
          reason: "split-b",
        });
      }
    }

    return tipResult({
      available: true,
      base: prefer10 ? 10 : 5,
      title: "数一数",
      originalText: originalText,
      rewrittenText: originalText,
      steps: [opHintAdd(a, b), "答案是 " + (a + b)],
      morph: null,
      reason: "simple",
    });
  }

  function opHintAdd(a, b) {
    if (a === 0) return "0 加 " + b + "，还是 " + b;
    if (b === 0) return a + " 加 0，还是 " + a;
    return "从 " + a + " 再往后数 " + b + " 下";
  }

  function buildSubTip(a, b, prefer10, originalText) {
    if (b === 0) {
      return tipResult({
        base: 5,
        title: "减零",
        originalText: originalText,
        rewrittenText: originalText,
        steps: ["任何数减 0，还是它自己", "答案是 " + a],
        morph: null,
        reason: "sub-zero",
      });
    }

    if (a === b) {
      return tipResult({
        base: 5,
        title: "相同抵消",
        originalText: originalText,
        rewrittenText: originalText,
        steps: ["相同的数相减等于 0", "答案是 0"],
        morph: null,
        reason: "sub-same",
      });
    }

    // 经典：7-5 → 2+5-5
    if (a > b && b > 0) {
      const rest = a - b;
      const nice = b === 5 || b === 10 || rest <= 5 || a <= 20;
      if (nice || !prefer10) {
        return tipResult({
          base: b === 10 || a >= 10 ? 10 : 5,
          title: "拆开再减",
          originalText: originalText,
          rewrittenText: rest + " + " + b + " - " + b + " = ?",
          steps: [
            "把 " + a + " 拆成 " + rest + " + " + b,
            b + " 和 -" + b + " 抵消变成 0",
            "剩下 " + rest,
          ],
          morph: { index: "a", from: a, parts: [rest, b] },
          reason: "split-cancel",
        });
      }
    }

    // 从 10 拆：13-5 → 10+3-5
    if (a > 10) {
      const rest = a - 10;
      return tipResult({
        base: 10,
        title: "先拆十",
        originalText: originalText,
        rewrittenText: "10 + " + rest + " - " + b + " = ?",
        steps: [
          "把 " + a + " 拆成 10 + " + rest,
          "先算 10 - " + b + " = " + (10 - b),
          "再算 " + (10 - b) + " + " + rest + " = " + (a - b),
        ],
        morph: { index: "a", from: a, parts: [10, rest] },
        reason: "split10-sub",
      });
    }

    if (a > 5 && b < 5) {
      const rest = a - 5;
      return tipResult({
        base: 5,
        title: "拆成五",
        originalText: originalText,
        rewrittenText: "5 + " + rest + " - " + b + " = ?",
        steps: [
          "把 " + a + " 拆成 5 + " + rest,
          "先算 5 - " + b + " = " + (5 - b),
          "再加 " + rest + " 得 " + (a - b),
        ],
        morph: { index: "a", from: a, parts: [5, rest] },
        reason: "split5-sub",
      });
    }

    return tipResult({
      base: prefer10 ? 10 : 5,
      title: "倒着数",
      originalText: originalText,
      rewrittenText: originalText,
      steps: ["从 " + a + " 往前数 " + b + " 下", "答案是 " + (a - b)],
      morph: null,
      reason: "simple-sub",
    });
  }

  function clearTipUi(root) {
    stopMathTipSpeech();
    if (!root) return;
    const panel = root.querySelector("#math-challenge-tip-panel");
    const steps = root.querySelector("#math-challenge-tip-steps");
    const btn = root.querySelector("#math-challenge-tip-btn");
    const qEl = root.querySelector("#math-challenge-question");
    if (panel) {
      panel.hidden = true;
      panel.classList.remove("is-show", "is-animating");
    }
    if (steps) steps.innerHTML = "";
    if (btn) {
      btn.disabled = false;
      btn.classList.remove("is-used");
      btn.setAttribute("aria-expanded", "false");
    }
    if (qEl) qEl.classList.remove("is-tip-morph");
  }

  function renderQuestionPlain(qEl, text) {
    if (!qEl) return;
    qEl.classList.remove("is-tip-morph");
    qEl.innerHTML = "";
    const expr = document.createElement("div");
    expr.className = "math-q-expr";
    expr.id = "math-challenge-expr";
    expr.textContent = text;
    qEl.appendChild(expr);
  }

  function renderQuestionWithMorph(qEl, question, tip) {
    if (!qEl || !question) return;
    qEl.classList.add("is-tip-morph");
    qEl.innerHTML = "";

    const expr = document.createElement("div");
    expr.className = "math-q-expr is-morphing";
    expr.id = "math-challenge-expr";

    const makeNum = (value, morph) => {
      const wrap = document.createElement("span");
      wrap.className = "math-token math-token-num";
      if (morph && morph.from === value) {
        wrap.classList.add("is-splitting");
        wrap.setAttribute("data-from", String(morph.from));
        const from = document.createElement("span");
        from.className = "math-token-from";
        from.textContent = String(morph.from);
        const to = document.createElement("span");
        to.className = "math-token-to";
        morph.parts.forEach((part, idx) => {
          if (idx > 0) {
            const plus = document.createElement("span");
            plus.className = "math-token-plus";
            plus.textContent = "+";
            to.appendChild(plus);
          }
          const n = document.createElement("span");
          n.className = "math-token-part";
          n.textContent = String(part);
          n.style.setProperty("--part-i", String(idx));
          to.appendChild(n);
        });
        wrap.appendChild(from);
        wrap.appendChild(to);
      } else {
        wrap.textContent = String(value);
      }
      return wrap;
    };

    const makeOp = (op) => {
      const el = document.createElement("span");
      el.className = "math-token math-token-op";
      el.textContent = op;
      return el;
    };

    const morph = tip && tip.morph ? tip.morph : null;
    expr.appendChild(makeNum(question.a, morph && morph.index === "a" ? morph : null));
    expr.appendChild(makeOp(question.op));
    expr.appendChild(makeNum(question.b, morph && morph.index === "b" ? morph : null));
    const eq = document.createElement("span");
    eq.className = "math-token math-token-op";
    eq.textContent = "=";
    expr.appendChild(eq);
    const q = document.createElement("span");
    q.className = "math-token math-token-q";
    q.textContent = "?";
    expr.appendChild(q);

    qEl.appendChild(expr);

    if (tip && tip.rewrittenText && tip.rewrittenText !== tip.originalText) {
      const next = document.createElement("div");
      next.className = "math-q-rewrite";
      next.textContent = tip.rewrittenText;
      qEl.appendChild(next);
    }

    requestAnimationFrame(() => {
      expr.classList.add("is-on");
      const splitting = expr.querySelector(".is-splitting");
      if (splitting) splitting.classList.add("is-on");
      const rewrite = qEl.querySelector(".math-q-rewrite");
      if (rewrite) rewrite.classList.add("is-on");
    });
  }

  function showMathTip(root, question, prebuiltTip) {
    const tip = prebuiltTip || (activeSession && activeSession.tipPrebuilt) || buildMathTip(question);

    // 语音由 tip 按钮点击路径触发；这里只负责 UI


    const panel = root.querySelector("#math-challenge-tip-panel");
    const title = root.querySelector("#math-challenge-tip-title");
    const steps = root.querySelector("#math-challenge-tip-steps");
    const btn = root.querySelector("#math-challenge-tip-btn");
    const qEl = root.querySelector("#math-challenge-question");
    if (!panel || !steps || !qEl) return tip;

    if (title) title.textContent = tip.title || "小提示";
    steps.innerHTML = "";
    (tip.steps || []).forEach((line, i) => {
      const li = document.createElement("div");
      li.className = "math-tip-step";
      li.style.setProperty("--step-i", String(i));
      li.textContent = line;
      steps.appendChild(li);
    });

    panel.hidden = false;
    panel.classList.add("is-show", "is-animating");
    if (btn) {
      btn.classList.add("is-used");
      btn.setAttribute("aria-expanded", "true");
    }

    if (tip.morph) {
      renderQuestionWithMorph(qEl, question, tip);
      playSfx("buff", 0.85);
    } else {
      renderQuestionPlain(qEl, tip.originalText || question.text);
      playSfx("select", 0.8);
    }

    if (window.ArcadeFX && typeof window.ArcadeFX.flashScreen === "function") {
      window.ArcadeFX.flashScreen(0.12, "120,200,255");
    }

    setTimeout(() => {
      panel.classList.remove("is-animating");
    }, 900);

    return tip;
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
        <div class="math-question" id="math-challenge-question">
          <div class="math-q-expr" id="math-challenge-expr">1 + 1 = ?</div>
        </div>
        <div class="math-tip-panel" id="math-challenge-tip-panel" hidden>
          <div class="math-tip-head">
            <span class="math-tip-badge">提醒</span>
            <strong id="math-challenge-tip-title">小提示</strong>
          </div>
          <div class="math-tip-steps" id="math-challenge-tip-steps"></div>
        </div>
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
          <div class="math-actions">
            <button id="math-challenge-tip-btn" class="btn math-tip-btn" type="button" aria-expanded="false" aria-controls="math-challenge-tip-panel">提醒</button>
            <button id="math-challenge-submit" class="btn primary math-submit" type="submit">确定</button>
          </div>
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

  // ---------- 提醒语音（Web Speech API） ----------
  // 注意：Chrome/Edge 在 cancel() 后立刻 speak() 常会卡 1~5 秒；
  // 因此策略是：优先本地音色、尽量不 cancel、短句先出声、失败再兜底。
  let tipSpeechToken = 0;
  let tipSpeechUtterance = null;
  let tipSpeechVoices = [];
  let tipSpeechVoiceReady = false;
  let tipSpeechPrimed = false;
  let tipSpeechKeepAlive = 0;
  let tipSpeechWatchdog = 0;
  let tipSpeechQueue = [];
  let tipPreferredVoiceURI = "";
  let tipSpeechLastCancelAt = 0;

  function refreshTipSpeechVoices() {
    if (!window.speechSynthesis) return [];
    try {
      tipSpeechVoices = window.speechSynthesis.getVoices() || [];
    } catch (e) {
      tipSpeechVoices = [];
    }
    tipSpeechVoiceReady = tipSpeechVoices.length > 0;
    return tipSpeechVoices;
  }

  function scoreChineseVoice(v) {
    if (!v) return -999;
    const lang = String(v.lang || "").toLowerCase();
    const name = String(v.name || "").toLowerCase();
    const uri = String(v.voiceURI || "").toLowerCase();
    let n = 0;
    // 本地音色优先：在线神经音色常要等几秒才出声
    if (v.localService === true) n += 300;
    else if (v.localService === false) n -= 120;
    if (lang === "zh-cn" || lang === "zh_cn") n += 120;
    else if (lang.startsWith("zh-cn") || lang.startsWith("zh_cn")) n += 110;
    else if (lang.startsWith("zh")) n += 90;
    else if (lang.includes("cmn")) n += 80;
    else return -1;
    if (name.includes("desktop") || uri.includes("desktop")) n += 60;
    // 可爱风偏好：女声 / 童声 / 晓晓·瑶瑶·晓伊 等
    if (
      name.includes("xiaoxiao") ||
      name.includes("yaoyao") ||
      name.includes("yao yao") ||
      name.includes("xiaoyi") ||
      name.includes("xiao yi") ||
      name.includes("xiaochen") ||
      name.includes("xiao chen") ||
      name.includes("huihui") ||
      name.includes("hui hui")
    ) {
      n += 70;
    }
    if (
      name.includes("female") ||
      name.includes("girl") ||
      name.includes("child") ||
      name.includes("kid") ||
      name.includes("cute") ||
      name.includes("甜") ||
      name.includes("女") ||
      name.includes("童")
    ) {
      n += 45;
    }
    // 压低偏沉稳/男声
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
    if (name.includes("chinese") || name.includes("mandarin") || name.includes("中文") || name.includes("普通话")) n += 25;
    // 在线 neural 往往更慢，启动优先本地
    if (v.localService === false && (name.includes("online") || name.includes("neural") || name.includes("natural"))) n -= 40;
    else if (name.includes("natural") || name.includes("neural")) n += 10;
    return n;
  }

  function pickChineseVoice(preferLocalOnly) {
    const voices = tipSpeechVoices.length ? tipSpeechVoices : refreshTipSpeechVoices();
    if (!voices.length) return null;
    if (tipPreferredVoiceURI) {
      const remembered = voices.find((v) => v && v.voiceURI === tipPreferredVoiceURI);
      if (remembered && scoreChineseVoice(remembered) > 0) {
        if (!preferLocalOnly || remembered.localService) return remembered;
      }
    }
    let best = null;
    let bestScore = 0;
    for (let i = 0; i < voices.length; i++) {
      const v = voices[i];
      if (preferLocalOnly && !v.localService) continue;
      const sc = scoreChineseVoice(v);
      if (sc > bestScore) {
        bestScore = sc;
        best = v;
      }
    }
    if (best && best.voiceURI) tipPreferredVoiceURI = best.voiceURI;
    return bestScore > 0 ? best : null;
  }

  function clearTipSpeechTimers() {
    if (tipSpeechKeepAlive) {
      clearInterval(tipSpeechKeepAlive);
      tipSpeechKeepAlive = 0;
    }
    if (tipSpeechWatchdog) {
      clearTimeout(tipSpeechWatchdog);
      tipSpeechWatchdog = 0;
    }
  }

  function softStopMathTipSpeech() {
    // 只作废旧回调/队列，不调用 cancel（避免 Chrome 卡顿）
    tipSpeechToken += 1;
    tipSpeechUtterance = null;
    tipSpeechQueue = [];
    clearTipSpeechTimers();
  }

  function stopMathTipSpeech() {
    softStopMathTipSpeech();
    if (!window.speechSynthesis) return;
    // 仅在确实在播/排队时 cancel；并记录时间，随后 speak 需错开
    try {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
        tipSpeechLastCancelAt = Date.now();
      }
    } catch (e) {
      /* ignore */
    }
  }

  function resumeTipSpeechEngine() {
    if (!window.speechSynthesis) return;
    try {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    } catch (e) {
      /* ignore */
    }
  }

  function safeSpeak(utter) {
    if (!window.speechSynthesis || !utter) return false;
    resumeTipSpeechEngine();
    const run = () => {
      try {
        window.speechSynthesis.speak(utter);
      } catch (e) {
        /* ignore */
      }
    };
    // cancel 后立刻 speak 会卡几秒：至少错开一帧
    const sinceCancel = Date.now() - tipSpeechLastCancelAt;
    if (tipSpeechLastCancelAt && sinceCancel < 40) {
      setTimeout(run, 40 - sinceCancel);
    } else {
      run();
    }
    return true;
  }

  /** 弹窗打开时预热：只拉本地语音列表，不 speak/cancel */
  function warmMathTipSpeech() {
    if (!window.speechSynthesis) return;
    refreshTipSpeechVoices();
    resumeTipSpeechEngine();
    pickChineseVoice(true) || pickChineseVoice(false);
    tipSpeechPrimed = true;
  }

  /** 兼容旧调用：点击链路里不再 speak 空句（空句+cancel 会更慢） */
  function primeMathTipSpeechOnGesture() {
    if (!window.speechSynthesis) return;
    refreshTipSpeechVoices();
    resumeTipSpeechEngine();
    pickChineseVoice(true) || pickChineseVoice(false);
    if (window.ArcadeFX && typeof window.ArcadeFX.unlockAudio === "function") {
      try {
        window.ArcadeFX.unlockAudio();
      } catch (e) {
        /* ignore */
      }
    }
  }

  function softSpeakMathLine(line) {
    return String(line || "")
      .replace(/-/g, "减")
      .replace(/\+/g, "加")
      .replace(/=/g, "等于")
      .replace(/\?/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function buildMathTipSpeechChunks(tip, question) {
    if (!tip) return [];
    const title = String(tip.title || "小提示").trim();
    const original = String((tip.originalText || (question && question.text) || "").replace(/\s*=\s*\?\s*$/, "")).trim();
    const rewrite = String((tip.rewrittenText || "").replace(/\s*=\s*\?\s*$/, "").replace(/\s*=\s*\d+\s*$/, "")).trim();
    const steps = Array.isArray(tip.steps) ? tip.steps.filter(Boolean) : [];
    const chunks = [];
    // 可爱风文案：短开场 + 标题 + 原题/改写 + 步骤
    chunks.push("嘿，小提醒来啦");
    if (title) chunks.push(title);
    if (rewrite && rewrite !== original && rewrite !== tip.originalText) {
      chunks.push("可以想成 " + softSpeakMathLine(rewrite) + " 哦");
    }
    else if (original) {
      chunks.push("原题是 " + softSpeakMathLine(original) + " 呀");
    }
    steps.forEach((line, i) => {
      chunks.push("第" + (i + 1) + "步，" + softSpeakMathLine(line));
    });
    chunks.push("慢慢算，你超棒的");
    return chunks.map((c) => String(c || "").trim()).filter(Boolean);
  }

  function buildMathTipSpeechText(tip, question) {
    const chunks = buildMathTipSpeechChunks(tip, question);
    if (!chunks.length) return "";
    return chunks.join("。") + "。";
  }

  function makeUtterance(text, voice, opts) {
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = "zh-CN";
    // 可爱风听感：稍慢、更高更甜
    utter.rate = (opts && typeof opts.rate === "number") ? opts.rate : 0.96;
    utter.pitch = (opts && typeof opts.pitch === "number") ? opts.pitch : 1.28;
    utter.volume = (opts && typeof opts.volume === "number") ? opts.volume : 1;
    // 优先本地音色（启动快）；没有本地时不绑 voice，让系统默认立刻出声
    if (voice && voice.localService) utter.voice = voice;
    return utter;
  }

  function speakNextTipChunk(token) {
    if (token !== tipSpeechToken) return;
    if (!window.speechSynthesis) return;
    if (!tipSpeechQueue.length) {
      tipSpeechUtterance = null;
      clearTipSpeechTimers();
      return;
    }
    const text = tipSpeechQueue.shift();
    const voice = pickChineseVoice(true) || null;
    const utter = makeUtterance(text, voice, {
      rate: tipSpeechQueue.length ? 0.98 : 0.96,
      pitch: 1.28,
      volume: 1,
    });
    tipSpeechUtterance = utter;
    utter.onend = () => {
      if (token !== tipSpeechToken) return;
      speakNextTipChunk(token);
    };
    utter.onerror = () => {
      if (token !== tipSpeechToken) return;
      speakNextTipChunk(token);
    };
    safeSpeak(utter);
  }

  function armTipSpeechWatchdog(token, fullText) {
    clearTimeout(tipSpeechWatchdog);
    // 220ms 还没 speaking：用默认音色整段重试（不绑 voice）
    tipSpeechWatchdog = setTimeout(() => {
      tipSpeechWatchdog = 0;
      if (token !== tipSpeechToken) return;
      if (!window.speechSynthesis) return;
      resumeTipSpeechEngine();
      if (window.speechSynthesis.speaking) return;
      // 队列可能卡死：软重置后直接整段播
      tipSpeechQueue = [];
      try {
        if (window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
          tipSpeechLastCancelAt = Date.now();
        }
      } catch (e) {
        /* ignore */
      }
      const retry = makeUtterance(fullText || "提醒", null);
      tipSpeechUtterance = retry;
      safeSpeak(retry);
    }, 220);
  }

  function speakMathTip(tip, question) {
    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== "function") {
      return false;
    }
    // 优先用预构建文案，点击时少做字符串拼接
    const preText =
      tip && typeof tip.speechText === "string" && tip.speechText
        ? tip.speechText
        : (activeSession && activeSession.tipSpeechText) || "";
    const text = preText || buildMathTipSpeechText(tip, question);
    if (!text) return false;

    // 关键：不要无脑 cancel。若当前没在播，只作废旧 token。
    const busy = !!(window.speechSynthesis.speaking || window.speechSynthesis.pending);
    if (busy) {
      stopMathTipSpeech();
    } else {
      softStopMathTipSpeech();
    }
    const token = ++tipSpeechToken;

    if (window.ArcadeFX && typeof window.ArcadeFX.unlockAudio === "function") {
      try {
        window.ArcadeFX.unlockAudio();
      } catch (e) {
        /* ignore */
      }
    }

    refreshTipSpeechVoices();
    resumeTipSpeechEngine();
    // 启动优先本地音色；没有本地就先默认出声
    const voice = pickChineseVoice(true) || null;

    clearInterval(tipSpeechKeepAlive);
    tipSpeechKeepAlive = setInterval(() => {
      if (token !== tipSpeechToken) {
        clearTipSpeechTimers();
        return;
      }
      resumeTipSpeechEngine();
    }, 5000);

    const utter = makeUtterance(text, voice);
    tipSpeechUtterance = utter;
    tipSpeechQueue = [];

    // 语音列表晚到时只补 voice，不重播，避免“等几秒才开始”
    if (!voice && window.speechSynthesis) {
      const onVoices = () => {
        if (token !== tipSpeechToken || !tipSpeechUtterance) return;
        refreshTipSpeechVoices();
        const v = pickChineseVoice(true) || pickChineseVoice(false);
        if (v && v.localService) {
          try {
            tipSpeechUtterance.voice = v;
            if (v.voiceURI) tipPreferredVoiceURI = v.voiceURI;
          } catch (e) {
            /* ignore */
          }
        }
      };
      try {
        window.speechSynthesis.addEventListener("voiceschanged", onVoices, { once: true });
      } catch (e) {
        window.speechSynthesis.onvoiceschanged = onVoices;
      }
    } else if (voice && voice.voiceURI) {
      tipPreferredVoiceURI = voice.voiceURI;
    }

    // 同步 speak：必须在用户点击调用栈内触发
    try {
      window.speechSynthesis.speak(utter);
    } catch (e) {
      return false;
    }
    armTipSpeechWatchdog(token, text);
    return true;
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
    clearTipUi(root);
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
    clearTipUi(root);
    warmMathTipSpeech();
    // 预先算好提醒文案，点击时只负责开讲，减少首句延迟
    const prebuiltTip = buildMathTip(question);
    const prebuiltSpeechText = buildMathTipSpeechText(prebuiltTip, question);
    if (prebuiltTip) prebuiltTip.speechText = prebuiltSpeechText;
    if (qEl) renderQuestionPlain(qEl, question.text);
    if (hint) hint.textContent = `限时 ${cfg.timeLimit} 秒 · 超时算错 · ${cfg.desc} · 可点「提醒」拆分`;
    if (input) {
      input.value = "";
      input.disabled = false;
    }
    if (submitBtn) submitBtn.disabled = false;
    const tipBtn = root.querySelector("#math-challenge-tip-btn");
    if (tipBtn) tipBtn.disabled = false;

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
        tipUsed: false,
        tip: null,
        tipPrebuilt: null,
        tipSpeechText: "",
        targetUid: options.targetUid || null,
        actorUid: options.actorUid || null,
      };
      activeSession.tipPrebuilt = prebuiltTip;
      activeSession.tipSpeechText = prebuiltSpeechText;

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
        stopMathTipSpeech();
        if (input) input.disabled = true;
        if (submitBtn) submitBtn.disabled = true;
        if (tipBtn) tipBtn.disabled = true;
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

      if (tipBtn) {
        // pointerdown 比 click 更早，先解锁/拉本地音色
        tipBtn.onpointerdown = () => {
          if (!activeSession || activeSession.closed || activeSession.finishing || activeSession.tipUsed) return;
          primeMathTipSpeechOnGesture();
        };
        tipBtn.onclick = (event) => {
          if (event) event.preventDefault();
          if (!activeSession || activeSession.closed || activeSession.finishing) return;
          if (activeSession.tipUsed) return;
          activeSession.tipUsed = true;
          // 点击当下立刻开讲（用预构建 tip），再刷新 UI
          const tip = activeSession.tipPrebuilt || buildMathTip(question);
          primeMathTipSpeechOnGesture();
          speakMathTip(tip, question);
          activeSession.tip = showMathTip(root, question, tip);
          if (input && !input.disabled) input.focus();
        };
      }

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

  if (window.speechSynthesis) {
    try {
      refreshTipSpeechVoices();
      window.speechSynthesis.addEventListener("voiceschanged", refreshTipSpeechVoices);
      // 页面加载后尽快拉语音，减少首次提醒延迟
      setTimeout(warmMathTipSpeech, 0);
    } catch (e) {
      try {
        window.speechSynthesis.onvoiceschanged = refreshTipSpeechVoices;
      } catch (e2) {
        /* ignore */
      }
    }
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
    buildMathTip,
    speakMathTip,
    stopMathTipSpeech,
    warmMathTipSpeech,
    primeMathTipSpeechOnGesture,
    buildMathTipSpeechText,
    buildMathTipSpeechChunks,
    isDamageSkillType,
    buildResolveModifier,
    promptChallenge,
    abortChallenge,
    isChallengeOpen,
  };
})();
