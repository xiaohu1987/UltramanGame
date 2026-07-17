from pathlib import Path

path = Path("css/select-ui.css")
text = path.read_text(encoding="utf-8")

old_rows = "  grid-template-rows: auto auto auto auto;"
new_rows = "  grid-template-rows: auto auto auto;"
if old_rows not in text:
    raise SystemExit("rows not found")
text = text.replace(old_rows, new_rows, 1)

meta_block = """
.select-progress-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

"""
if ".select-progress-meta" not in text:
    anchor = (
        ".select-progress {\n"
        "  min-width: 160px;\n"
        "  padding: 12px 14px;\n"
        "  border-radius: 14px;\n"
        "  border: 1px solid rgba(99, 210, 255, 0.28);\n"
        "  background:\n"
        "    linear-gradient(180deg, rgba(47, 155, 255, 0.16), rgba(8, 18, 32, 0.55));\n"
        "  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);\n"
        "}\n\n"
    )
    if anchor not in text:
        raise SystemExit("progress anchor not found")
    text = text.replace(anchor, anchor + meta_block, 1)

merged = """/* 标题 + 进度 + 操作合并条 */
.select-merged-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 14px;
  border: 1px solid rgba(99, 210, 255, 0.16);
  background: rgba(8, 18, 32, 0.45);
}

.select-merged-bar .select-hero-copy {
  min-width: 0;
  flex: 1 1 auto;
}

.select-merged-bar .select-hero-copy h2 {
  margin: 0 0 2px;
}

.select-merged-bar .select-status-text {
  margin-top: 0;
  color: var(--muted);
  font-size: 0.86rem;
  font-weight: 600;
}

.select-merged-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

/* 合并条内：进度与按钮统一高度/圆角/字号 */
.select-merged-bar .select-progress,
.select-merged-bar .select-actions .btn {
  box-sizing: border-box;
  min-height: 40px;
  height: 40px;
  border-radius: 12px;
}

.select-merged-bar .select-progress {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-width: 108px;
  max-width: 124px;
  padding: 6px 12px;
}

.select-merged-bar .select-progress-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.select-merged-bar .select-progress-label {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1;
  white-space: nowrap;
}

.select-merged-bar .select-progress-count {
  font-size: 0.98rem;
  line-height: 1;
  white-space: nowrap;
}

.select-merged-bar .select-progress-total {
  font-size: 0.78rem;
  margin-left: 1px;
}

.select-merged-bar .select-progress-track {
  margin-top: 0;
  height: 4px;
}

.select-merged-bar .select-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.select-merged-bar .select-actions .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 76px;
  padding: 0 14px;
  font-size: 0.9rem;
  line-height: 1;
  white-space: nowrap;
}

.select-merged-bar .select-actions .btn.primary {
  min-width: 84px;
  padding: 0 16px;
}

"""
marker = "/* ===== 上：3 个已选大图框 ===== */"
if marker not in text:
    raise SystemExit("selected-slots marker not found")
if ".select-merged-bar" not in text:
    text = text.replace(marker, merged + marker, 1)

old_toolbar = """\
.select-toolbar {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(99, 210, 255, 0.16);
  background: rgba(8, 18, 32, 0.45);
}"""
new_toolbar = """\
.select-toolbar {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 0;
  border: 0;
  background: transparent;
}"""
if old_toolbar not in text:
    raise SystemExit("toolbar block not found")
text = text.replace(old_toolbar, new_toolbar, 1)

old_media = """\
  .select-progress {
    min-width: 0;
  }

  .selected-slot {
    min-height: 180px;
  }"""
new_media = """\
  .select-progress {
    min-width: 0;
  }

  .select-merged-right {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .select-merged-bar .select-progress,
  .select-merged-bar .select-actions .btn {
    height: 40px;
    min-height: 40px;
  }

  .selected-slot {
    min-height: 180px;
  }"""
if old_media not in text:
    raise SystemExit("media block not found")
text = text.replace(old_media, new_media, 1)

old_small = """\
@media (max-width: 560px) {
  .select-actions {
    flex-direction: column;
  }

  .select-actions .btn {
    width: 100%;
  }
}"""
new_small = """\
@media (max-width: 560px) {
  .select-merged-right {
    width: 100%;
  }

  .select-merged-bar .select-actions {
    width: 100%;
  }

  .select-merged-bar .select-actions .btn {
    flex: 1 1 0;
    min-width: 0;
  }

  .select-actions {
    flex-direction: column;
  }

  .select-actions .btn {
    width: 100%;
  }
}"""
if old_small not in text:
    raise SystemExit("small media not found")
text = text.replace(old_small, new_small, 1)

path.write_text(text, encoding="utf-8")
print("select-ui.css updated")
print("has merged", ".select-merged-bar" in text)
print("has meta", ".select-progress-meta" in text)
print("rows3", "grid-template-rows: auto auto auto;" in text)
