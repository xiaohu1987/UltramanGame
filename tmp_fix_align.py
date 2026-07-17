from pathlib import Path

# layout-fit.css
layout = Path("css/layout-fit.css")
text = layout.read_text(encoding="utf-8")
old = """#screen-select .select-actions {
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
}
"""
new = """/* 取消 .panel-actions 的 margin-top，保证进度与按钮同一水平线 */
#screen-select .select-merged-bar .select-actions,
#screen-select .select-merged-bar .select-actions.panel-actions,
#screen-select .select-actions {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
  margin: 0;
  padding: 0;
  height: 40px;
  min-height: 40px;
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
}
"""
if old not in text:
    raise SystemExit("layout-fit block not found")
layout.write_text(text.replace(old, new, 1), encoding="utf-8")
print("layout-fit updated")

# duel-table.css
duel = Path("css/duel-table.css")
text = duel.read_text(encoding="utf-8")
old = """#screen-select .select-actions {
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
}
"""
new = """/* 取消 .panel-actions 的 margin-top，保证进度与按钮同一水平线 */
#screen-select .select-merged-bar .select-actions,
#screen-select .select-merged-bar .select-actions.panel-actions,
#screen-select .select-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: nowrap;
  margin: 0;
  padding: 0;
  height: 40px;
  min-height: 40px;
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
}
"""
if old not in text:
    raise SystemExit("duel-table block not found")
duel.write_text(text.replace(old, new, 1), encoding="utf-8")
print("duel-table updated")

# kids-ui.css
kids = Path("css/kids-ui.css")
text = kids.read_text(encoding="utf-8")
old = """/* 覆盖全局 .btn.primary 更大尺寸，保持与进度条同高 */
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
}
"""
new = """/* 覆盖全局 .btn.primary 更大尺寸，并取消 panel-actions 下沉 */
#screen-select .select-merged-bar .select-actions,
#screen-select .select-merged-bar .select-actions.panel-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin: 0;
  padding: 0;
  height: 40px;
  min-height: 40px;
}

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
}
"""
if old not in text:
    raise SystemExit("kids-ui block not found")
kids.write_text(text.replace(old, new, 1), encoding="utf-8")
print("kids-ui updated")
