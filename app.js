const statusEl = document.getElementById("data-status")
const resultsEl = document.getElementById("results")
const previewEl = document.getElementById("column-preview")
const formEl = document.getElementById("navigator-form")
const currentInput = document.getElementById("current-query")
const targetInput = document.getElementById("target-query")
const swapButton = document.getElementById("swap-button")
const locateButton = document.getElementById("locate-button")
const resetButton = document.getElementById("reset-button")
const wordInput = document.getElementById("word-query")
const wordSearchButton = document.getElementById("word-search-button")
const wordResultsEl = document.getElementById("word-results")
const suggestionsEl = document.getElementById("query-suggestions")

const viewerModal = document.getElementById("viewer-modal")
const viewerMeta = document.getElementById("viewer-meta")
const viewerImage = document.getElementById("viewer-image")
const viewerStage = document.getElementById("viewer-stage")
const viewerStageMeta = document.getElementById("viewer-stage-meta")
const viewerPrevButton = document.getElementById("viewer-prev")
const viewerNextButton = document.getElementById("viewer-next")
const viewerCloseButton = document.getElementById("viewer-close")
const viewerZoomInput = document.getElementById("viewer-zoom")

const bookAliases = {
  בראשית: "בראשית",
  bereshit: "בראשית",
  bereishit: "בראשית",
  genesis: "בראשית",
  שמות: "שמות",
  shemot: "שמות",
  exodus: "שמות",
  ויקרא: "ויקרא",
  vayikra: "ויקרא",
  leviticus: "ויקרא",
  במדבר: "במדבר",
  bamidbar: "במדבר",
  numbers: "במדבר",
  דברים: "דברים",
  devarim: "דברים",
  deuteronomy: "דברים",
}

const parashahAliases = {
  תולדות: "תולדת",
  קדושים: "קדשים",
  פינחס: "פנחס",
  שופטים: "שפטים",
  ניצבים: "נצבים",
  בהעלותך: "בהעלתך",
  לךלך: "לך לך",
  ויקהלפקודי: "ויקהל",
}

let navigatorData = null
let previewState = []
let viewerState = {
  open: false,
  column: 1,
  title: "",
  subtitle: "",
  zoom: 1.4,
}
let touchStartX = null

function normalizeSpaces(text) {
  return text.replace(/\s+/g, " ").trim()
}

function normalizeHebrewText(text) {
  return normalizeSpaces(
    text
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .replace(/[־-]/g, " ")
      .replace(/["'׳״:;,.!?()[\]{}<>|/\\]/g, " ")
      .replace(/[^\p{Script=Hebrew}A-Za-z0-9\s]/gu, " "),
  )
}

function normalizeKey(text) {
  return normalizeSpaces(
    normalizeHebrewText(text)
      .toLowerCase()
      .replace(/^פרשת\s+/u, "")
      .replace(/^פרשה\s+/u, "")
      .replace(/^parashat\s+/u, "")
      .replace(/^parasha\s+/u, "")
      .replace(/^parsha\s+/u, ""),
  )
}

function parseHebrewNumber(token) {
  const cleaned = normalizeSpaces(token).replace(/['׳"״]/g, "")
  if (!cleaned) return null
  if (/^\d+$/.test(cleaned)) return Number(cleaned)

  const values = {
    א: 1,
    ב: 2,
    ג: 3,
    ד: 4,
    ה: 5,
    ו: 6,
    ז: 7,
    ח: 8,
    ט: 9,
    י: 10,
    כ: 20,
    ך: 20,
    ל: 30,
    מ: 40,
    ם: 40,
    נ: 50,
    ן: 50,
    ס: 60,
    ע: 70,
    פ: 80,
    ף: 80,
    צ: 90,
    ץ: 90,
    ק: 100,
    ר: 200,
    ש: 300,
    ת: 400,
  }

  let total = 0
  for (const char of cleaned) {
    if (!(char in values)) return null
    total += values[char]
  }
  return total
}

function clampColumn(column) {
  return Math.min(Math.max(column, 1), navigatorData.layout.columns)
}

function setStatus(text, mode = "") {
  statusEl.textContent = text
  statusEl.className = `status-pill${mode ? ` ${mode}` : ""}`
}

function formatNumber(value, digits = 1) {
  return Number(value).toLocaleString("he-IL", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function columnImagePath(column) {
  const padded = String(column).padStart(3, "0")
  return `./columns/Torah_Scroll_Col_${padded}_of_245.jpg`
}

function buildSuggestions() {
  const fragment = document.createDocumentFragment()
  navigatorData.parashot.forEach((parashah) => {
    const option = document.createElement("option")
    option.value = parashah.name_display
    fragment.appendChild(option)
  })
  ;["בראשית ג", "שמות כ", "במדבר כב ב", "עמודה 44", "והנחש היה ערום"].forEach((value) => {
    const option = document.createElement("option")
    option.value = value
    fragment.appendChild(option)
  })
  suggestionsEl.appendChild(fragment)
}

function buildIndexes() {
  navigatorData.parashahByOrder = new Map()
  navigatorData.parashahByKey = new Map()
  navigatorData.verseByKey = new Map()
  navigatorData.columnsByNumber = new Map()

  navigatorData.parashot.forEach((parashah) => {
    navigatorData.parashahByOrder.set(parashah.order, parashah)
    ;[
      normalizeKey(parashah.name_he),
      normalizeKey(parashah.name_display),
      normalizeKey(parashah.name_en),
    ]
      .map((key) => parashahAliases[key] || key)
      .forEach((key) => {
        if (key) navigatorData.parashahByKey.set(key, parashah)
      })
  })

  navigatorData.verses.forEach((verse) => {
    const item = {
      book: verse[0],
      chapter: verse[1],
      verse: verse[2],
      text: verse[3],
      columnFloat: verse[4],
      column: verse[5],
      lineFloat: verse[6],
      exact: verse[7],
      parashah: verse[8],
    }
    item.key = `${item.book}:${item.chapter}:${item.verse}`
    item.searchText = normalizeKey(item.text)
    navigatorData.verseByKey.set(item.key, item)
  })

  navigatorData.columns.forEach((column) => {
    navigatorData.columnsByNumber.set(column.column, column)
  })
}

function findDirectColumn(query) {
  const match = normalizeKey(query).match(/^(?:עמודה|עמוד|col|column|#)\s*(\d{1,3})$/u)
  if (!match) return null
  const column = Number(match[1])
  return column >= 1 && column <= navigatorData.layout.columns ? column : null
}

function resolveParashah(query) {
  const key = parashahAliases[normalizeKey(query)] || normalizeKey(query)
  if (!key) return null
  if (/^\d+$/.test(key)) return navigatorData.parashahByOrder.get(Number(key)) || null
  return navigatorData.parashahByKey.get(key) || null
}

function parseReference(query) {
  const cleaned = normalizeSpaces(query.replace(/[:.]/g, " "))
  const parts = cleaned.split(" ")
  if (parts.length < 2) return null

  const book = bookAliases[normalizeKey(parts[0])]
  if (!book) return null

  const chapter = parseHebrewNumber(parts[1])
  const verse = parts[2] ? parseHebrewNumber(parts[2]) : 1
  if (!chapter || !verse) return null
  return { book, chapter, verse }
}

function resolveQuery(query) {
  const value = normalizeSpaces(query)
  if (!value) throw new Error("צריך להזין ערך לחיפוש.")

  const directColumn = findDirectColumn(value)
  if (directColumn !== null) {
    return {
      kind: "column",
      label: `עמודה ${directColumn}`,
      columnFloat: directColumn,
      column: directColumn,
      lineFloat: 1,
      exact: true,
      detail: "עמודה ידנית",
    }
  }

  const parashah = resolveParashah(value)
  if (parashah) {
    return {
      kind: "parashah",
      label: `פרשת ${parashah.name_display}`,
      columnFloat: parashah.column,
      column: parashah.column,
      lineFloat: parashah.line,
      exact: true,
      detail: `פרשה #${parashah.order}`,
    }
  }

  const reference = parseReference(value)
  if (!reference) {
    throw new Error("לא הצלחתי להבין. נסה פרשה, ספר פרק פסוק או עמודה.")
  }

  const verse = navigatorData.verseByKey.get(`${reference.book}:${reference.chapter}:${reference.verse}`)
  if (!verse) throw new Error("ההפניה לא נמצאה בדאטה של התורה.")

  return {
    kind: "verse",
    label: `${reference.book} ${reference.chapter}:${reference.verse}`,
    columnFloat: verse.columnFloat,
    column: verse.column,
    lineFloat: verse.lineFloat,
    exact: verse.exact,
    detail: `${verse.parashah} | ${verse.exact ? "מדויק" : "משוער"}`,
  }
}

function getColumnSummary(column) {
  return navigatorData.columnsByNumber.get(clampColumn(column))
}

function chapterLabel(summary) {
  if (!summary || !summary.chapters?.length) return "לא זמין"
  return summary.chapters.length === 1
    ? summary.chapters[0]
    : `${summary.chapters[0]}–${summary.chapters.at(-1)}`
}

function formatRange(summary) {
  if (!summary) return "לא זמין"
  return summary.first_ref === summary.last_ref
    ? summary.first_ref
    : `${summary.first_ref} – ${summary.last_ref}`
}

function summaryInfoGrid(summary) {
  if (!summary) return ""
  return `
    <div class="preview-info">
      <div class="preview-info-grid">
        <div class="preview-info-item">
          <span>עמודה</span>
          <strong>${summary.column}</strong>
        </div>
        <div class="preview-info-item">
          <span>ספר</span>
          <strong>${summary.books.join(" · ")}</strong>
        </div>
        <div class="preview-info-item">
          <span>פרשה</span>
          <strong>${summary.parashot.join(" · ")}</strong>
        </div>
        <div class="preview-info-item">
          <span>פרק</span>
          <strong>${chapterLabel(summary)}</strong>
        </div>
      </div>
      <div class="preview-info-item">
        <span>טווח</span>
        <strong>${formatRange(summary)}</strong>
      </div>
    </div>
  `
}

function summaryPills(summary) {
  if (!summary) return ""
  return `
    <span class="meta-pill">עמודה ${summary.column}</span>
    <span class="meta-pill">${summary.books.join(" · ")}</span>
    <span class="meta-pill">${summary.parashot.join(" · ")}</span>
    <span class="meta-pill">פרק ${chapterLabel(summary)}</span>
  `
}

function formatLocation(location) {
  const columnText =
    location.exact && Math.abs(location.columnFloat - location.column) < 0.001
      ? String(location.column)
      : formatNumber(location.columnFloat, 2)
  const lineText = location.exact
    ? String(Math.round(location.lineFloat))
    : formatNumber(location.lineFloat, 1)

  return `
    <article class="location-card">
      <h3>${location.kind === "column" ? "מיקום" : "איתור"}</h3>
      <div class="location-meta">
        <div class="location-label">${location.label}</div>
        <div>עמודה ${columnText}</div>
        <div>שורה ${lineText}</div>
        <div>${location.exact ? "מדויק" : "משוער"} | ${location.detail}</div>
      </div>
    </article>
  `
}

function renderError(message) {
  resultsEl.className = "results"
  resultsEl.innerHTML = `
    <article class="error-card">
      <h3>יש בעיה</h3>
      <p>${message}</p>
    </article>
  `
  renderPreview()
}

function renderSingle(location) {
  resultsEl.className = "results"
  resultsEl.innerHTML = formatLocation(location)
  renderPreview([{ title: "עמודת היעד", location }])
}

function renderComparison(current, target) {
  const delta = target.columnFloat - current.columnFloat
  const absDelta = Math.abs(delta)
  const direction =
    absDelta < 0.25 ? "כמעט באותו מקום" : delta > 0 ? "קדימה" : "אחורה"
  const message =
    absDelta < 0.25
      ? "היעד כמעט באותה עמודה."
      : `צריך לגלול בערך ${formatNumber(absDelta, 1)} עמודות ${direction}.`

  resultsEl.className = "results"
  resultsEl.innerHTML = `
    <article class="summary-card">
      <h3>כמה לגלול</h3>
      <div class="summary-main">
        <span class="summary-value">${formatNumber(absDelta, 1)}</span>
        <span class="summary-direction">${direction}</span>
      </div>
      <p class="summary-note">${message}</p>
    </article>
    <div class="location-grid">
      ${formatLocation(current)}
      ${formatLocation(target)}
    </div>
  `

  renderPreview([
    { title: "עמודת המקור", location: current },
    { title: "עמודת היעד", location: target },
  ])
}

function renderPreview(items = []) {
  if (!items.length) {
    previewState = []
    previewEl.className = "column-preview empty-state"
    previewEl.innerHTML =
      "<p>אחרי חישוב יוצגו כאן עמודת המקור ועמודת היעד, עם מעבר קל לעמודות סמוכות.</p>"
    return
  }

  previewState = items.map((item, index) => ({
    id: `${item.title}-${index}`,
    title: item.title,
    location: item.location,
    previewColumn: item.location.column,
  }))
  renderPreviewState()
}

function renderPreviewState() {
  if (!previewState.length) return renderPreview()

  previewEl.className = "column-preview"
  previewEl.innerHTML = `
    <div class="preview-grid">
      ${previewState
        .map((item, index) => {
          const { title, location, previewColumn } = item
          const summary = getColumnSummary(previewColumn)
          const delta = previewColumn - location.column
          const note =
            delta === 0
              ? `זו העמודה של ${location.label}.`
              : `תצוגה זזה ${Math.abs(delta)} עמודות ${delta > 0 ? "קדימה" : "אחורה"}.`
          const nearby = [-2, -1, 0, 1, 2]
            .map((step) => clampColumn(previewColumn + step))
            .filter((value, itemIndex, values) => values.indexOf(value) === itemIndex)

          return `
            <article class="preview-card">
              <div class="preview-toolbar">
                <div class="preview-meta">
                  <strong>${title}</strong>
                  <div>עמודה ${previewColumn}</div>
                  <div>${note}</div>
                </div>
                <div class="preview-stepper">
                  <button class="icon-button" type="button" data-action="next" data-preview-index="${index}" aria-label="עמודה הבאה">+</button>
                  <button class="icon-button" type="button" data-action="prev" data-preview-index="${index}" aria-label="עמודה קודמת">−</button>
                </div>
              </div>

              ${summaryInfoGrid(summary)}

              <div class="preview-strip">
                ${nearby
                  .map(
                    (column) => `
                      <button
                        class="preview-chip${column === previewColumn ? " is-active" : ""}"
                        type="button"
                        data-action="jump"
                        data-preview-index="${index}"
                        data-column="${column}"
                      >
                        ${column}
                      </button>
                    `,
                  )
                  .join("")}
              </div>

              <button
                class="secondary-button preview-open"
                type="button"
                data-action="open"
                data-preview-index="${index}"
              >
                פתח גדול
              </button>

              <div
                class="preview-image-shell"
                role="button"
                tabindex="0"
                data-action="open"
                data-preview-index="${index}"
                aria-label="פתח עמודה ${previewColumn} לתצוגה גדולה"
              >
                <img
                  class="preview-image"
                  src="${columnImagePath(previewColumn)}"
                  alt="${title} - עמודה ${previewColumn}"
                  loading="lazy"
                  data-action="open"
                  data-preview-index="${index}"
                />
                <div
                  class="preview-image-meta"
                  data-action="open"
                  data-preview-index="${index}"
                >
                  ${summaryPills(summary)}
                </div>
              </div>
            </article>
          `
        })
        .join("")}
    </div>
  `
}

function renderWordResults(matches = [], query = "") {
  if (!query) {
    wordResultsEl.className = "word-results empty-state"
    wordResultsEl.innerHTML = "<p>אפשר לכתוב כמה מילים ולקבל פסוקים מתאימים עם עמודה.</p>"
    return
  }

  if (!matches.length) {
    wordResultsEl.className = "word-results empty-state"
    wordResultsEl.innerHTML = `<p>לא מצאתי תוצאות עבור <code>${query}</code>.</p>`
    return
  }

  wordResultsEl.className = "word-results"
  wordResultsEl.innerHTML = matches
    .map(
      (match) => `
        <article class="word-result">
          <div class="word-result-head">
            <div>
              <div class="word-result-title">${match.book} ${match.chapter}:${match.verse}</div>
              <div class="word-result-meta">עמודה ${match.column} | ${match.parashah}</div>
            </div>
            <div class="word-result-actions">
              <button
                class="ghost-button"
                type="button"
                data-word-action="target"
                data-ref="${match.book} ${match.chapter}:${match.verse}"
              >
                כיעד
              </button>
              <button
                class="secondary-button"
                type="button"
                data-word-action="open"
                data-ref="${match.book} ${match.chapter}:${match.verse}"
              >
                פתח
              </button>
            </div>
          </div>
          <p class="word-result-text">${match.text}</p>
        </article>
      `,
    )
    .join("")
}

function runWordSearch() {
  if (!navigatorData) return
  const query = normalizeSpaces(wordInput.value)
  const normalized = normalizeKey(query)
  if (!normalized) return renderWordResults([], "")

  const terms = normalized.split(" ").filter(Boolean)
  const matches = navigatorData.verses
    .map((verse) => navigatorData.verseByKey.get(`${verse[0]}:${verse[1]}:${verse[2]}`))
    .filter((verse) => terms.every((term) => verse.searchText.includes(term)))
    .sort((a, b) => {
      const aStarts = a.searchText.startsWith(normalized) ? 1 : 0
      const bStarts = b.searchText.startsWith(normalized) ? 1 : 0
      return bStarts - aStarts || a.columnFloat - b.columnFloat
    })
    .slice(0, 12)

  renderWordResults(matches, query)
}

function resetState() {
  currentInput.value = ""
  targetInput.value = ""
  wordInput.value = ""
  resultsEl.className = "results empty-state"
  resultsEl.innerHTML = "<p>הזן מיקום ויעד כדי לקבל גלילה מהירה בעמודות.</p>"
  renderPreview()
  renderWordResults([], "")
}

function runSearch({ locateOnly = false } = {}) {
  try {
    const currentValue = currentInput.value
    const targetValue = targetInput.value

    if (locateOnly || !currentValue.trim()) {
      if (!targetValue.trim()) throw new Error("חסר יעד לאיתור.")
      renderSingle(resolveQuery(targetValue))
      return
    }

    if (!targetValue.trim()) throw new Error("חסר יעד לחישוב הגלילה.")
    renderComparison(resolveQuery(currentValue), resolveQuery(targetValue))
  } catch (error) {
    renderError(error.message)
  }
}

function openViewer({ title, column, subtitle = "" }) {
  const summary = getColumnSummary(column)
  viewerState.open = true
  viewerState.column = clampColumn(column)
  viewerState.title = title
  viewerState.subtitle = subtitle
  viewerState.zoom = Number(viewerZoomInput.value || 1.4)

  document.body.style.overflow = "hidden"
  viewerModal.hidden = false
  renderViewer(summary)
}

function closeViewer() {
  viewerState.open = false
  document.body.style.overflow = ""
  viewerModal.hidden = true
}

function renderViewer(summary = getColumnSummary(viewerState.column)) {
  if (!viewerState.open) return
  const currentSummary = summary || getColumnSummary(viewerState.column)
  viewerMeta.innerHTML = `
    <div class="viewer-title">${viewerState.title} | עמודה ${viewerState.column}</div>
    <div class="viewer-subtitle">
      ${currentSummary.books.join(" · ")} | ${currentSummary.parashot.join(" · ")} | פרק ${chapterLabel(currentSummary)} | ${formatRange(currentSummary)}
    </div>
  `
  viewerStageMeta.innerHTML = summaryPills(currentSummary)
  viewerImage.src = columnImagePath(viewerState.column)
  viewerImage.alt = `${viewerState.title} - עמודה ${viewerState.column}`
  viewerImage.style.width = `${viewerState.zoom * 100}%`
  viewerPrevButton.disabled = viewerState.column <= 1
  viewerNextButton.disabled = viewerState.column >= navigatorData.layout.columns
}

async function init() {
  try {
    setStatus("טוען נתונים...")
    const response = await fetch("./data/navigator_data.json")
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    navigatorData = await response.json()
    buildIndexes()
    buildSuggestions()
    setStatus("מוכן", "ready")
  } catch (error) {
    setStatus("שגיאה", "error")
    renderError("לא הצלחתי לטעון את הנתונים.")
    console.error(error)
  }
}

formEl.addEventListener("submit", (event) => {
  event.preventDefault()
  runSearch()
})

locateButton.addEventListener("click", () => {
  runSearch({ locateOnly: true })
})

swapButton.addEventListener("click", () => {
  const current = currentInput.value
  currentInput.value = targetInput.value
  targetInput.value = current
})

resetButton.addEventListener("click", () => {
  resetState()
})

wordSearchButton.addEventListener("click", () => {
  runWordSearch()
})

wordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault()
    runWordSearch()
  }
})

document.querySelectorAll(".example-chip").forEach((button) => {
  button.addEventListener("click", () => {
    currentInput.value = button.dataset.current || ""
    targetInput.value = button.dataset.target || ""
    runSearch({ locateOnly: !button.dataset.current })
  })
})

wordResultsEl.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-word-action]")
  if (!button) return

  const reference = button.dataset.ref
  if (!reference) return

  if (button.dataset.wordAction === "target") {
    targetInput.value = reference
    return
  }

  targetInput.value = reference
  runSearch({ locateOnly: !currentInput.value.trim() })
})

previewEl.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]")
  if (!target || !previewState.length) return

  const index = Number(target.dataset.previewIndex)
  const state = previewState[index]
  if (!state) return

  if (target.dataset.action === "jump") {
    state.previewColumn = clampColumn(Number(target.dataset.column))
    return renderPreviewState()
  }

  if (target.dataset.action === "prev") {
    state.previewColumn = clampColumn(state.previewColumn - 1)
    return renderPreviewState()
  }

  if (target.dataset.action === "next") {
    state.previewColumn = clampColumn(state.previewColumn + 1)
    return renderPreviewState()
  }

  if (target.dataset.action === "open") {
    return openViewer({
      title: state.title,
      column: state.previewColumn,
      subtitle: state.location.label,
    })
  }
})

viewerPrevButton.addEventListener("click", () => {
  viewerState.column = clampColumn(viewerState.column - 1)
  renderViewer()
})

viewerNextButton.addEventListener("click", () => {
  viewerState.column = clampColumn(viewerState.column + 1)
  renderViewer()
})

viewerCloseButton.addEventListener("click", () => {
  closeViewer()
})

viewerZoomInput.addEventListener("input", () => {
  viewerState.zoom = Number(viewerZoomInput.value)
  renderViewer()
})

viewerModal.addEventListener("click", (event) => {
  if (event.target === viewerModal) closeViewer()
})

document.addEventListener("keydown", (event) => {
  if (!viewerState.open) return
  if (event.key === "Escape") closeViewer()
  if (event.key === "ArrowLeft") {
    viewerState.column = clampColumn(viewerState.column + 1)
    renderViewer()
  }
  if (event.key === "ArrowRight") {
    viewerState.column = clampColumn(viewerState.column - 1)
    renderViewer()
  }
})

viewerStage.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0]?.clientX ?? null
})

viewerStage.addEventListener("touchend", (event) => {
  if (touchStartX === null) return
  const endX = event.changedTouches[0]?.clientX ?? null
  if (endX === null) return
  const delta = endX - touchStartX
  touchStartX = null
  if (Math.abs(delta) < 50) return
  viewerState.column = clampColumn(viewerState.column + (delta < 0 ? 1 : -1))
  renderViewer()
})

init()
