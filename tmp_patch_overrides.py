from pathlib import Path

# ---- layout-fit.css ----
layout = Path("css/layout-fit.css")
lt = layout.read_text(encoding="utf-8")

old_layout = """#screen-select .select-merged-bar {
  min-height: 0;
  gap: 10px;
  padding: 6px 10px;
}

#screen-select .select-merged-right {
  gap: 8px;
}

#screen-select .select-hero-copy h2 {
  margin: 0 0 2px;
  font-size: 1rem;
  line-height: 1.15;
}

#screen-select .select-hero-copy p {
  margin: 0;
  font-size: 0.74rem;
  line-height: 1.2;
}

#screen-select .select-progress {
  min-width: 108px;
  max-width: 124px;
  padding: 5px 8px;
  border-radius: 10px;
}

#screen-select .select-merged-bar .select-progress {
  min-width: 88px;
  max-width: 104px;
  padding: 4px 7px;
}

#screen-select .select-progress-label {
  margin-bottom: 0;
  font-size: 0.62rem;
}

#screen-select .select-progress-count {
  font-size: 1.02rem;
  line-height: 1.05;
}

#screen-select .select-progress-track {
  margin-top: 3px;
  height: 4px;
}

#screen-select .select-status-text {
  margin-top: 2px;
  font-size: 0.64rem;
  line-height: 1.15;
}

#screen-select .select-merged-bar .select-status-text {
  margin-top: 0;
  font-size: 0.72rem;
  line-height: 1.2;
}

#screen-select .select-actions {
  gap: 6px;
  flex-wrap: nowrap;
}

#screen-select .select-actions .btn {
  min-height: 34px;
  padding: 5px 10px;
}"""

new_layout = """#screen-select .select-merged-bar {
  min-height: 0;
  gap: 10px;
  padding: 6px 10px;
}

#screen-select .select-merged-right {
  gap: 8px;
  align-items: center;
}

#screen-select .select-hero-copy h2 {
  margin: 0 0 2px;
  font-size: 1rem;
  line-height: 1.15;
}

#screen-select .select-hero-copy p {
  margin: 0;
  font-size: 0.74rem;
  line-height: 1.2;
}

/* 进度与按钮统一高度，避免一大一小 */
#screen-select .select-merged-bar .select-progress,
#screen-select .select-merged-bar .select-actions .btn {
  box-sizing: border-box;
  min-height: 40px;
  height: 40px;
  border-radius: 12px;
}

#screen-select .select-progress,
#screen-select .select-merged-bar .select-progress {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-width: 108px;
  max-width: 124px;
  padding: 6px 12px;
}

#screen-select .select-progress-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

#screen-select .select-progress-label {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1;
}

#screen-select .select-progress-count {
  font-size: 0.98rem;
  line-height: 1;
}

#screen-select .select-progress-total {
  font-size: 0.78rem;
}

#screen-select .select-progress-track {
  margin-top: 0;
  height: 4px;
}

#screen-select .select-status-text {
  margin-top: 2px;
  font-size: 0.64rem;
  line-height: 1.15;
}

#screen-select .select-merged-bar .select-status-text {
  margin-top: 0;
  font-size: 0.72rem;
  line-height: 1.2;
}

#screen-select .select-actions {
  gap: 8px;
  flex-wrap: nowrap;
  align-items: center;
}

#screen-select .select-actions .btn,
#screen-select .select-merged-bar .select-actions .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 76px;
  min-height: 40px;
  height: 40px;
  padding: 0 14px;
  font-size: 0.9rem;
  line-height: 1;
}

#screen-select .select-merged-bar .select-actions .btn.primary {
  min-width: 84px;
  padding: 0 16px;
}"""

if old_layout not in lt:
    raise SystemExit("layout-fit block not found")
lt = lt.replace(old_layout, new_layout, 1)
layout.write_text(lt, encoding="utf-8")
print("layout-fit.css updated")

# ---- duel-table.css ----
duel = Path("css/duel-table.css")
dt = duel.read_text(encoding="utf-8")

old_duel = """#screen-select .select-progress {
  flex: 0 0 auto;
  min-width: 108px;
  max-width: 124px;
  padding: 5px 8px;
  border-radius: 10px;
}

#screen-select .select-progress-label {
  margin-bottom: 0;
  font-size: 0.62rem;
  line-height: 1.1;
}

#screen-select .select-progress-count {
  font-size: 1.02rem;
  line-height: 1.05;
}

#screen-select .select-progress-total {
  font-size: 0.78rem;
}

#screen-select .select-progress-track {
  margin-top: 3px;
  height: 4px;
}

#screen-select .select-status-text {
  margin-top: 2px;
  font-size: 0.64rem;
  line-height: 1.15;
}

/* Title + progress + actions merged into one compact bar. */
#screen-select .select-merged-bar {
  min-height: 0;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 12px;
}

#screen-select .select-merged-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

#screen-select .select-merged-bar .select-progress {
  min-width: 88px;
  max-width: 104px;
  padding: 4px 7px;
}

#screen-select .select-merged-bar .select-status-text {
  margin-top: 0;
  font-size: 0.72rem;
  line-height: 1.2;
  opacity: 0.9;
}

#screen-select .selected-slot,
#screen-select .selected-slot-body {
  min-height: 196px;
}

#screen-select .select-toolbar {
  min-height: 0;
  padding: 0;
  border: 0;
  background: transparent;
}

#screen-select .select-filter-hint { font-size: 0.76rem; }

#screen-select .select-actions { gap: 6px; }

#screen-select .select-actions .btn {
  min-height: 34px;
  padding: 5px 10px;
}"""

new_duel = """/* Title + progress + actions merged into one compact bar. */
#screen-select .select-merged-bar {
  min-height: 0;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 12px;
}

#screen-select .select-merged-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

/* Keep progress chip and action buttons the same size. */
#screen-select .select-merged-bar .select-progress,
#screen-select .select-merged-bar .select-actions .btn {
  box-sizing: border-box;
  min-height: 40px;
  height: 40px;
  border-radius: 12px;
}

#screen-select .select-progress,
#screen-select .select-merged-bar .select-progress {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-width: 108px;
  max-width: 124px;
  padding: 6px 12px;
}

#screen-select .select-progress-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

#screen-select .select-progress-label {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1;
}

#screen-select .select-progress-count {
  font-size: 0.98rem;
  line-height: 1;
}

#screen-select .select-progress-total {
  font-size: 0.78rem;
}

#screen-select .select-progress-track {
  margin-top: 0;
  height: 4px;
}

#screen-select .select-status-text {
  margin-top: 2px;
  font-size: 0.64rem;
  line-height: 1.15;
}

#screen-select .select-merged-bar .select-status-text {
  margin-top: 0;
  font-size: 0.72rem;
  line-height: 1.2;
  opacity: 0.9;
}

#screen-select .selected-slot,
#screen-select .selected-slot-body {
  min-height: 196px;
}

#screen-select .select-toolbar {
  min-height: 0;
  padding: 0;
  border: 0;
  background: transparent;
}

#screen-select .select-filter-hint { font-size: 0.76rem; }

#screen-select .select-actions {
  gap: 8px;
  align-items: center;
  flex-wrap: nowrap;
}

#screen-select .select-actions .btn,
#screen-select .select-merged-bar .select-actions .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 76px;
  min-height: 40px;
  height: 40px;
  padding: 0 14px;
  font-size: 0.9rem;
  line-height: 1;
}

#screen-select .select-merged-bar .select-actions .btn.primary {
  min-width: 84px;
  padding: 0 16px;
}"""

if old_duel not in dt:
    raise SystemExit("duel-table block not found")
dt = dt.replace(old_duel, new_duel, 1)
duel.write_text(dt, encoding="utf-8")
print("duel-table.css updated")

# ---- kids-ui.css ----
kids = Path("css/kids-ui.css")
kt = kids.read_text(encoding="utf-8")

old_kids = """#screen-select .select-merged-bar {
  gap: 10px;
  padding: 6px 10px;
}

#screen-select .select-merged-bar .select-status-text {
  margin-top: 0;
  font-size: 0.74rem;
  line-height: 1.2;
  font-weight: 600;
  color: var(--muted);
}

#screen-select .select-merged-right {
  gap: 8px;
}"""

new_kids = """#screen-select .select-merged-bar {
  gap: 10px;
  padding: 6px 10px;
}

#screen-select .select-merged-bar .select-status-text {
  margin-top: 0;
  font-size: 0.74rem;
  line-height: 1.2;
  font-weight: 600;
  color: var(--muted);
}

#screen-select .select-merged-right {
  gap: 8px;
  align-items: center;
}

/* 覆盖全局 .btn.primary 更大尺寸，保持与进度条同高 */
#screen-select .select-merged-bar .select-progress,
#screen-select .select-merged-bar .select-actions .btn,
#screen-select .select-merged-bar .select-actions .btn.primary {
  min-height: 40px;
  height: 40px;
  border-radius: 12px;
  font-size: 0.9rem;
  padding: 0 14px;
}

#screen-select .select-merged-bar .select-actions .btn.primary {
  min-width: 84px;
  padding: 0 16px;
}"""

if old_kids not in kt:
    raise SystemExit("kids-ui block not found")
kt = kt.replace(old_kids, new_kids, 1)
kids.write_text(kt, encoding="utf-8")
print("kids-ui.css updated")
