const fs = require("fs");
const path = "css/math-challenge.css";
let s = fs.readFileSync(path, "utf8");

if (s.includes(".math-tip-panel")) {
  console.log("css already has tip styles");
  process.exit(0);
}

const append = `

/* ===== 提醒按钮 / 拆分提示 ===== */
.math-question,
.math-tip-panel,
.math-form,
.math-hint {
  position: relative;
  z-index: 1;
}

.math-question {
  display: grid;
  gap: 8px;
  min-height: 72px;
  align-content: center;
}

.math-q-expr {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.28em;
  line-height: 1.15;
}

.math-token {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0.7em;
}

.math-token-num {
  position: relative;
  min-width: 1.1em;
  padding: 0 0.08em;
  border-radius: 10px;
}

.math-token-op,
.math-token-q {
  opacity: 0.95;
}

.math-token-num.is-splitting {
  min-width: 2.4em;
  min-height: 1.15em;
}

.math-token-from,
.math-token-to {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.12em;
}

.math-token-from {
  position: absolute;
  inset: 0;
  color: #fff8d6;
  text-shadow: 0 0 14px rgba(255, 209, 102, 0.75);
  transition: opacity 0.35s ease, transform 0.45s cubic-bezier(0.16, 0.84, 0.28, 1);
}

.math-token-to {
  opacity: 0;
  transform: scale(0.55);
  color: #9ef0ff;
  text-shadow: 0 0 14px rgba(99, 210, 255, 0.7);
  transition: opacity 0.35s ease 0.12s, transform 0.5s cubic-bezier(0.16, 0.84, 0.28, 1) 0.08s;
}

.math-token-num.is-splitting.is-on .math-token-from {
  opacity: 0;
  transform: scale(0.55) translateY(-8px);
}

.math-token-num.is-splitting.is-on .math-token-to {
  opacity: 1;
  transform: scale(1);
}

.math-token-part {
  display: inline-block;
  animation: math-tip-part-pop 0.55s cubic-bezier(0.16, 0.84, 0.28, 1) both;
  animation-delay: calc(0.12s + var(--part-i, 0) * 0.08s);
}

.math-token-plus {
  opacity: 0.85;
  color: #ffd166;
}

.math-q-rewrite {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #9ef0ff;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.35s ease 0.18s, transform 0.4s ease 0.18s;
  text-shadow: 0 0 12px rgba(99, 210, 255, 0.45);
}

.math-q-rewrite.is-on {
  opacity: 1;
  transform: translateY(0);
}

.math-question.is-tip-morph {
  border-color: rgba(255, 209, 102, 0.42);
  background:
    radial-gradient(circle at 20% 30%, rgba(255, 209, 102, 0.16), transparent 60%),
    radial-gradient(circle at 80% 70%, rgba(99, 210, 255, 0.16), transparent 55%),
    rgba(6, 14, 26, 0.78);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    0 0 18px rgba(99, 210, 255, 0.12);
}

.math-tip-panel {
  margin: 0 0 12px;
  padding: 10px 12px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 209, 102, 0.28);
  background:
    linear-gradient(180deg, rgba(40, 34, 16, 0.72), rgba(12, 20, 34, 0.88));
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
  text-align: left;
}

.math-tip-panel[hidden] {
  display: none !important;
}

.math-tip-panel.is-show {
  animation: math-tip-panel-in 0.28s ease-out;
}

.math-tip-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.math-tip-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: #1a1408;
  background: linear-gradient(90deg, #ffd166, #ffe8a3);
  box-shadow: 0 0 12px rgba(255, 209, 102, 0.35);
}

.math-tip-head strong {
  color: #fff2c8;
  font-size: 0.95rem;
  font-weight: 900;
}

.math-tip-steps {
  display: grid;
  gap: 6px;
}

.math-tip-step {
  position: relative;
  padding: 6px 8px 6px 28px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: #e7f6ff;
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1.35;
  opacity: 0;
  transform: translateX(-8px);
}

.math-tip-panel.is-show .math-tip-step {
  animation: math-tip-step-in 0.35s ease-out both;
  animation-delay: calc(0.08s + var(--step-i, 0) * 0.08s);
}

.math-tip-step::before {
  content: counter(math-tip-step);
  counter-increment: math-tip-step;
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.68rem;
  font-weight: 900;
  color: #102038;
  background: #63d2ff;
  box-shadow: 0 0 8px rgba(99, 210, 255, 0.45);
}

.math-tip-steps {
  counter-reset: math-tip-step;
}

.math-actions {
  display: grid;
  grid-template-columns: 1fr 1.35fr;
  gap: 8px;
  margin-top: 4px;
}

.math-tip-btn {
  min-height: 46px;
  font-size: 1.02rem;
  font-weight: 800;
  color: #fff2c8;
  border: 1px solid rgba(255, 209, 102, 0.45);
  background:
    linear-gradient(180deg, rgba(80, 58, 12, 0.9), rgba(36, 28, 10, 0.95));
  box-shadow: 0 0 0 1px rgba(255, 209, 102, 0.08), 0 8px 18px rgba(0, 0, 0, 0.22);
}

.math-tip-btn:hover:not(:disabled) {
  border-color: rgba(255, 230, 150, 0.75);
  box-shadow:
    0 0 0 1px rgba(255, 209, 102, 0.16),
    0 0 18px rgba(255, 209, 102, 0.22);
}

.math-tip-btn.is-used {
  color: #dff7ff;
  border-color: rgba(99, 210, 255, 0.45);
  background:
    linear-gradient(180deg, rgba(24, 56, 78, 0.95), rgba(12, 28, 42, 0.98));
}

.math-tip-btn:disabled,
.math-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.math-submit {
  margin-top: 0;
}

@keyframes math-tip-panel-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes math-tip-step-in {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes math-tip-part-pop {
  0% {
    opacity: 0;
    transform: scale(0.4) translateY(8px);
  }
  60% {
    opacity: 1;
    transform: scale(1.08) translateY(0);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (max-width: 420px) {
  .math-actions {
    grid-template-columns: 1fr;
  }

  .math-question {
    font-size: 1.45rem;
  }

  .math-q-rewrite {
    font-size: 0.95rem;
  }
}
`;

// Update the shared position rule to include tip panel without duplicating .math-question rules badly
// Existing rule:
// .math-modal-head,
// .math-timer,
// .math-question,
// .math-form,
// .math-hint {
//   position: relative;
//   z-index: 1;
// }

const oldPos = `.math-modal-head,
.math-timer,
.math-question,
.math-form,
.math-hint {
  position: relative;
  z-index: 1;
}`;

const newPos = `.math-modal-head,
.math-timer,
.math-question,
.math-tip-panel,
.math-form,
.math-hint {
  position: relative;
  z-index: 1;
}`;

if (s.includes(oldPos)) {
  s = s.replace(oldPos, newPos);
}

// Remove duplicate position block from append if already updated
const cleanedAppend = append.replace(
  `.math-question,
.math-tip-panel,
.math-form,
.math-hint {
  position: relative;
  z-index: 1;
}

`,
  ""
);

fs.writeFileSync(path, s.trimEnd() + "\n" + cleanedAppend);
console.log("math-challenge.css patched", fs.statSync(path).size);
