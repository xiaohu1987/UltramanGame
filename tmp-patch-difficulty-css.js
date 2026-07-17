const fs = require("fs");
const p = "css/select-ui.css";
let t = fs.readFileSync(p, "utf8");
const marker = ".select-merged-right {";
const idx = t.indexOf(marker);
if (idx < 0) {
  console.error("marker missing");
  process.exit(1);
}
const endMarker = "/* 合并条内：进度与按钮统一高度/圆角/字号 */";
const endIdx = t.indexOf(endMarker, idx);
if (endIdx < 0) {
  console.error("end marker missing");
  process.exit(1);
}

const block = `.select-merged-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

/* 难度选择：开战前四档 */
.difficulty-picker {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(99, 210, 255, 0.18);
  background:
    radial-gradient(circle at 8% 20%, rgba(47, 155, 255, 0.16), transparent 55%),
    rgba(8, 18, 32, 0.42);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
}

.difficulty-picker-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.difficulty-picker-label {
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #9ad7ff;
}

.difficulty-picker-desc {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted);
}

.difficulty-options {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.difficulty-option {
  min-height: 40px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(120, 190, 255, 0.18);
  background: rgba(8, 18, 32, 0.55);
  color: #d7ecff;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.difficulty-option:hover {
  border-color: rgba(99, 210, 255, 0.55);
  transform: translateY(-1px);
}

.difficulty-option.is-active {
  border-color: color-mix(in srgb, var(--primary-2, #63d2ff) 70%, white 10%);
  color: #eaf7ff;
  background:
    radial-gradient(circle at 20% 30%, rgba(47, 155, 255, 0.28), transparent 60%),
    rgba(12, 28, 48, 0.88);
  box-shadow:
    0 0 0 1px rgba(99, 210, 255, 0.22),
    0 8px 18px rgba(47, 155, 255, 0.16);
}

.difficulty-option[data-difficulty="hell"].is-active {
  border-color: rgba(255, 93, 108, 0.72);
  background:
    radial-gradient(circle at 20% 30%, rgba(255, 93, 108, 0.28), transparent 60%),
    rgba(36, 14, 22, 0.9);
  box-shadow:
    0 0 0 1px rgba(255, 93, 108, 0.22),
    0 8px 18px rgba(255, 93, 108, 0.16);
}

@media (max-width: 720px) {
  .difficulty-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

`;

const next = t.slice(0, idx) + block + t.slice(endIdx);
fs.writeFileSync(p, next, "utf8");
console.log("patched", next.includes("difficulty-picker"));
