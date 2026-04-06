const statusEl = document.getElementById("data-status")
const resultsEl = document.getElementById("results")
const previewEl = document.getElementById("column-preview")
const formEl = document.getElementById("navigator-form")
const currentInput = document.getElementById("current-query")
const targetInput = document.getElementById("target-query")
const resetButton = document.getElementById("reset-button")
const suggestionsEl = document.getElementById("query-suggestions")
const builderModeButtons = Array.from(document.querySelectorAll(".builder-chip"))

const viewerModal = document.getElementById("viewer-modal")
const viewerMeta = document.getElementById("viewer-meta")
const viewerImage = document.getElementById("viewer-image")
const viewerStage = document.getElementById("viewer-stage")
const viewerStageMeta = document.getElementById("viewer-stage-meta")
const viewerWatermark = document.getElementById("viewer-watermark")
const viewerTopbar = document.getElementById("viewer-topbar")
const viewerControls = document.getElementById("viewer-controls")
const viewerPrevButton = document.getElementById("viewer-prev")
const viewerNextButton = document.getElementById("viewer-next")
const viewerCloseButton = document.getElementById("viewer-close")
const viewerSearchInput = document.getElementById("viewer-search-input")
const viewerSearchResults = document.getElementById("viewer-search-results")
const viewerZoomInput = document.getElementById("viewer-zoom")
const viewerColumnInput = document.getElementById("viewer-column-input")

const builderFields = {
  current: {
    queryInput: currentInput,
    parashahPanel: document.getElementById("current-parashah-panel"),
    parashahSelect: document.getElementById("current-parashah-select"),
    referencePanel: document.getElementById("current-reference-panel"),
    bookSelect: document.getElementById("current-book-select"),
    chapterSelect: document.getElementById("current-chapter-select"),
    verseSelect: document.getElementById("current-verse-select"),
    wordsPanel: document.getElementById("current-words-panel"),
    wordsInput: document.getElementById("current-words-input"),
  },
  target: {
    queryInput: targetInput,
    parashahPanel: document.getElementById("target-parashah-panel"),
    parashahSelect: document.getElementById("target-parashah-select"),
    referencePanel: document.getElementById("target-reference-panel"),
    bookSelect: document.getElementById("target-book-select"),
    chapterSelect: document.getElementById("target-chapter-select"),
    verseSelect: document.getElementById("target-verse-select"),
    wordsPanel: document.getElementById("target-words-panel"),
    wordsInput: document.getElementById("target-words-input"),
  },
}

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
  searchQuery: "",
  zoomFactor: 1,
  fitScale: 1,
}
let touchStartX = null
let touchStartY = null
let liveSearchTimer = null
const builderState = {
  current: { mode: "free" },
  target: { mode: "free" },
}

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

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function normalizeCharForMap(char) {
  return char
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[־-]/g, " ")
    .replace(/["'׳״:;,.!?()[\]{}<>|/\\]/g, " ")
    .replace(/[^\p{Script=Hebrew}A-Za-z0-9\s]/gu, " ")
    .toLowerCase()
}

function buildHighlightMap(text) {
  let normalized = ""
  const map = []
  let pendingSpace = false
  let pendingSpaceStart = null

  for (let index = 0; index < text.length; index += 1) {
    const chunk = normalizeCharForMap(text[index])
    for (const char of chunk) {
      if (/\s/.test(char)) {
        if (!normalized) continue
        pendingSpace = true
        if (pendingSpaceStart === null) pendingSpaceStart = index
        continue
      }

      if (pendingSpace) {
        normalized += " "
        map.push({ start: pendingSpaceStart ?? index, end: index })
        pendingSpace = false
        pendingSpaceStart = null
      }

      normalized += char
      map.push({ start: index, end: index + 1 })
    }
  }

  return { normalized, map }
}

function mergeRanges(ranges) {
  if (!ranges.length) return []
  const sorted = [...ranges].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  return sorted.reduce((merged, current) => {
    const previous = merged.at(-1)
    if (!previous || current[0] > previous[1]) {
      merged.push([...current])
      return merged
    }
    previous[1] = Math.max(previous[1], current[1])
    return merged
  }, [])
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

function renderSelectOptions(selectEl, items, { value = null, includeBlankLabel = null } = {}) {
  const optionItems = includeBlankLabel === null ? [...items] : [{ value: "", label: includeBlankLabel }, ...items]
  selectEl.innerHTML = optionItems
    .map(
      (item) =>
        `<option value="${escapeHtml(String(item.value))}">${escapeHtml(String(item.label))}</option>`,
    )
    .join("")

  const stringValue = value === null || value === undefined ? null : String(value)
  const hasValue = stringValue !== null && optionItems.some((item) => String(item.value) === stringValue)
  selectEl.value = hasValue ? stringValue : String(optionItems[0]?.value ?? "")
}

function chapterOptionsForBook(book) {
  const chapterMap = navigatorData.bookChapters.get(book)
  if (!chapterMap) return []

  return [...chapterMap.keys()]
    .sort((a, b) => a - b)
    .map((chapter) => ({
      value: chapter,
      label: `פרק ${chapter}`,
    }))
}

function verseOptionsForReference(book, chapter) {
  if (!book || !chapter) return []
  const chapterMap = navigatorData.bookChapters.get(book)
  const maxVerse = chapterMap?.get(Number(chapter)) || 0

  return Array.from({ length: maxVerse }, (_, index) => {
    const verse = index + 1
    return {
      value: verse,
      label: `פסוק ${verse}`,
    }
  })
}

function populateChapterSelect(side, preferredChapter = null) {
  const fields = builderFields[side]
  const book = fields.bookSelect.value || navigatorData.books[0] || ""
  const chapters = chapterOptionsForBook(book)
  renderSelectOptions(fields.chapterSelect, chapters, { value: preferredChapter })
  return fields.chapterSelect.value
}

function populateVerseSelect(side, preferredVerse = null) {
  const fields = builderFields[side]
  const verses = verseOptionsForReference(fields.bookSelect.value, fields.chapterSelect.value)
  renderSelectOptions(fields.verseSelect, verses, {
    value: preferredVerse,
    includeBlankLabel: "תחילת הפרק",
  })
}

function composeStructuredQuery(side) {
  const state = builderState[side]
  const fields = builderFields[side]
  const words = normalizeSpaces(fields.wordsInput.value)

  if (state.mode === "free") {
    return normalizeSpaces(fields.queryInput.value)
  }

  let anchor = ""
  if (state.mode === "parashah") {
    anchor = normalizeSpaces(fields.parashahSelect.value)
  }

  if (state.mode === "reference") {
    const book = normalizeSpaces(fields.bookSelect.value)
    const chapter = normalizeSpaces(fields.chapterSelect.value)
    const verse = normalizeSpaces(fields.verseSelect.value)
    if (book && chapter) {
      anchor = verse ? `${book} ${chapter} ${verse}` : `${book} ${chapter}`
    }
  }

  if (anchor && words) return `${anchor} + ${words}`
  return anchor || words
}

function refreshBuilderUi(side) {
  const mode = builderState[side].mode
  const fields = builderFields[side]

  fields.queryInput.readOnly = mode !== "free"
  fields.queryInput.placeholder =
    mode === "free" ? "פרשה / פרק / פסוק / מילים / עמודה" : "נבנה אוטומטית"
  fields.parashahPanel.hidden = mode !== "parashah"
  fields.referencePanel.hidden = mode !== "reference"
  fields.wordsPanel.hidden = mode === "free"

  builderModeButtons.forEach((button) => {
    if (button.dataset.side !== side) return
    button.classList.toggle("is-active", button.dataset.mode === mode)
  })
}

function syncStructuredQuery(side, { live = true } = {}) {
  if (builderState[side].mode === "free") return
  builderFields[side].queryInput.value = composeStructuredQuery(side)
  if (live) scheduleLiveSearch()
}

function setBuilderMode(side, mode, { live = true } = {}) {
  builderState[side].mode = mode
  refreshBuilderUi(side)
  if (mode !== "free") {
    syncStructuredQuery(side, { live })
  } else if (live) {
    scheduleLiveSearch()
  }
}

function initializeBuilders() {
  const parashahOptions = navigatorData.parashot.map((parashah) => ({
    value: parashah.name_display,
    label: `${parashah.order}. ${parashah.name_display}`,
  }))
  const bookOptions = navigatorData.books.map((book) => ({ value: book, label: book }))

  ;["current", "target"].forEach((side) => {
    const fields = builderFields[side]

    renderSelectOptions(fields.parashahSelect, parashahOptions, {
      value: navigatorData.parashot[0]?.name_display,
    })
    renderSelectOptions(fields.bookSelect, bookOptions, { value: navigatorData.books[0] })
    const chapter = populateChapterSelect(side, 1)
    populateVerseSelect(side, "")
    if (chapter) fields.chapterSelect.value = String(chapter)
    fields.wordsInput.value = ""
    refreshBuilderUi(side)
  })
}

function buildIndexes() {
  navigatorData.parashahByOrder = new Map()
  navigatorData.parashahByKey = new Map()
  navigatorData.verseByKey = new Map()
  navigatorData.columnsByNumber = new Map()
  navigatorData.verseItems = []
  navigatorData.books = []
  navigatorData.bookChapters = new Map()

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
    item.parashahKey = normalizeKey(item.parashah)
    navigatorData.verseByKey.set(item.key, item)
    navigatorData.verseItems.push(item)

    if (!navigatorData.bookChapters.has(item.book)) {
      navigatorData.bookChapters.set(item.book, new Map())
      navigatorData.books.push(item.book)
    }

    const chapterMap = navigatorData.bookChapters.get(item.book)
    chapterMap.set(item.chapter, Math.max(chapterMap.get(item.chapter) || 0, item.verse))
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
  return { book, chapter, verse, explicitVerse: Boolean(parts[2]) }
}

function findTermsInOrder(text, terms) {
  const positions = []
  let fromIndex = 0

  for (const term of terms) {
    const position = text.indexOf(term, fromIndex)
    if (position === -1) return null
    positions.push(position)
    fromIndex = position + term.length
  }

  return {
    firstPosition: positions[0],
    span: positions.at(-1) + terms.at(-1).length - positions[0],
  }
}

function textMatchLabel(mode) {
  if (mode === "exact_start") return "מילים ברצף בתחילת הפסוק"
  if (mode === "exact_phrase") return "מילים ברצף"
  if (mode === "ordered_terms") return "מילים באותו סדר"
  return "כל המילים נמצאו"
}

function scoreTextMatch(verse, normalizedQuery, terms) {
  const text = verse.searchText
  const allTermsFound = terms.every((term) => text.includes(term))
  if (!allTermsFound) return null

  const exactStart = text.startsWith(normalizedQuery)
  const exactPhrase = text.includes(normalizedQuery)
  const ordered = terms.length > 1 ? findTermsInOrder(text, terms) : null
  const firstTermPosition = terms
    .map((term) => text.indexOf(term))
    .filter((position) => position >= 0)
    .sort((a, b) => a - b)[0]

  let bucket = 1
  let mode = "unordered_terms"
  let span = 999
  let firstPosition = firstTermPosition ?? 999

  if (exactStart) {
    bucket = 4
    mode = "exact_start"
    span = normalizedQuery.length
    firstPosition = 0
  } else if (exactPhrase) {
    bucket = 3
    mode = "exact_phrase"
    span = normalizedQuery.length
    firstPosition = text.indexOf(normalizedQuery)
  } else if (ordered) {
    bucket = 2
    mode = "ordered_terms"
    span = ordered.span
    firstPosition = ordered.firstPosition
  }

  return {
    bucket,
    mode,
    span,
    firstPosition,
  }
}

function collectTextMatches(query) {
  const normalizedQuery = normalizeKey(query)
  if (!normalizedQuery) return []

  const terms = normalizedQuery.split(" ").filter(Boolean)
  return navigatorData.verseItems
    .map((verse) => {
      const score = scoreTextMatch(verse, normalizedQuery, terms)
      if (!score) return null
      return {
        ...verse,
        ...score,
        matchLabel: textMatchLabel(score.mode),
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      return (
        b.bucket - a.bucket ||
        a.span - b.span ||
        a.firstPosition - b.firstPosition ||
        a.columnFloat - b.columnFloat
      )
    })
}

function findTextMatches(query, limit = 12) {
  return collectTextMatches(query).slice(0, limit)
}

function anchorBucket(match, anchor) {
  if (!anchor) return 0

  if (anchor.chapter && anchor.book === match.book && anchor.chapter === match.chapter) {
    return 4
  }

  if (anchor.parashahKey && anchor.parashahKey === match.parashahKey) {
    return 3
  }

  if (anchor.book && anchor.book === match.book) {
    return 2
  }

  return 1
}

function sortMatchesByAnchor(matches, anchor) {
  if (!anchor || !Number.isFinite(anchor.columnFloat)) return [...matches]

  return [...matches].sort((a, b) => {
    return (
      anchorBucket(b, anchor) - anchorBucket(a, anchor) ||
      Math.abs(a.columnFloat - anchor.columnFloat) - Math.abs(b.columnFloat - anchor.columnFloat) ||
      b.bucket - a.bucket ||
      a.span - b.span ||
      a.firstPosition - b.firstPosition ||
      a.columnFloat - b.columnFloat
    )
  })
}

function parsePlusQuery(query) {
  if (!query.includes("+")) return null
  const [anchorRaw, ...rest] = query.split("+")
  const anchorQuery = normalizeSpaces(anchorRaw)
  const textQuery = normalizeSpaces(rest.join("+"))
  if (!anchorQuery || !textQuery) return null
  return { anchorQuery, textQuery }
}

function getMatchRanges(match, normalizedQuery, terms) {
  if (match.mode === "exact_start" || match.mode === "exact_phrase") {
    const start = match.searchText.indexOf(normalizedQuery)
    return start >= 0 ? [[start, start + normalizedQuery.length]] : []
  }

  if (match.mode === "ordered_terms") {
    const ranges = []
    let fromIndex = 0
    for (const term of terms) {
      const start = match.searchText.indexOf(term, fromIndex)
      if (start === -1) continue
      ranges.push([start, start + term.length])
      fromIndex = start + term.length
    }
    return ranges
  }

  return terms
    .map((term) => {
      const start = match.searchText.indexOf(term)
      return start >= 0 ? [start, start + term.length] : null
    })
    .filter(Boolean)
}

function highlightMatchText(originalText, match, queryText) {
  const normalizedQuery = normalizeKey(queryText)
  const terms = normalizedQuery.split(" ").filter(Boolean)
  const ranges = mergeRanges(getMatchRanges(match, normalizedQuery, terms))
  if (!ranges.length) return escapeHtml(originalText)

  const { normalized, map } = buildHighlightMap(originalText)
  if (!map.length || normalized !== match.searchText) {
    return escapeHtml(originalText)
  }

  const originalRanges = mergeRanges(
    ranges
      .map(([start, end]) => {
        const first = map[start]
        const last = map[end - 1]
        return first && last ? [first.start, last.end] : null
      })
      .filter(Boolean),
  )

  if (!originalRanges.length) return escapeHtml(originalText)

  let cursor = 0
  return originalRanges
    .map(([start, end]) => {
      const before = escapeHtml(originalText.slice(cursor, start))
      const marked = `<mark>${escapeHtml(originalText.slice(start, end))}</mark>`
      cursor = end
      return before + marked
    })
    .join("") + escapeHtml(originalText.slice(cursor))
}

function resolveStandardQuery(query) {
  const value = normalizeSpaces(query)
  if (!value) throw new Error("צריך למלא לפחות שדה אחד.")

  const directColumn = findDirectColumn(value)
  if (directColumn !== null) {
    const summary = getColumnSummary(directColumn)
    return {
      kind: "column",
      label: `עמודה ${directColumn}`,
      columnFloat: directColumn,
      column: directColumn,
      lineFloat: 1,
      exact: true,
      detail: "עמודה ידנית",
      anchorContext: {
        columnFloat: directColumn,
        parashahKey: summary?.parashot?.[0] ? normalizeKey(summary.parashot[0]) : null,
        book: summary?.books?.[0] || null,
        chapter: summary?.chapters?.length === 1 ? parseHebrewNumber(String(summary.chapters[0])) : null,
      },
    }
  }

  const parashah = resolveParashah(value)
  if (parashah) {
    const summary = getColumnSummary(parashah.column)
    return {
      kind: "parashah",
      label: `פרשת ${parashah.name_display}`,
      columnFloat: parashah.column,
      column: parashah.column,
      lineFloat: parashah.line,
      exact: true,
      detail: `פרשה #${parashah.order}`,
      anchorContext: {
        columnFloat: parashah.column,
        parashahKey: normalizeKey(parashah.name_display),
        book: summary?.books?.[0] || null,
      },
    }
  }

  const reference = parseReference(value)
  if (reference) {
    const verse = navigatorData.verseByKey.get(`${reference.book}:${reference.chapter}:${reference.verse}`)
    if (!verse) throw new Error("ההפניה לא נמצאה.")

    return {
      kind: "verse",
      label: `${reference.book} ${reference.chapter}:${reference.verse}`,
      columnFloat: verse.columnFloat,
      column: verse.column,
      lineFloat: verse.lineFloat,
      exact: verse.exact,
      detail: `${verse.parashah} | ${verse.exact ? "מדויק" : "משוער"}`,
      anchorContext: {
        columnFloat: verse.columnFloat,
        book: reference.book,
        chapter: reference.chapter,
        parashahKey: verse.parashahKey,
      },
    }
  }

  const matches = findTextMatches(value, 6)
  if (!matches.length) {
    throw new Error("לא מצאתי פרשה, פסוק, עמודה או מילים מתאימות.")
  }

  const best = matches[0]
  return {
    kind: "text",
    label: `${best.book} ${best.chapter}:${best.verse}`,
    columnFloat: best.columnFloat,
    column: best.column,
    lineFloat: best.lineFloat,
    exact: best.exact,
    detail: `${best.parashah} | ${best.matchLabel}`,
    queryText: value,
    verseTextHtml: highlightMatchText(best.text, best, value),
    anchorContext: {
      columnFloat: best.columnFloat,
      book: best.book,
      chapter: best.chapter,
      parashahKey: best.parashahKey,
    },
  }
}

function resolveQuery(query) {
  const value = normalizeSpaces(query)
  const plusQuery = parsePlusQuery(value)
  if (plusQuery) {
    const anchor = resolveStandardQuery(plusQuery.anchorQuery)
    const matches = sortMatchesByAnchor(
      findTextMatches(plusQuery.textQuery, 12),
      anchor.anchorContext || anchor,
    )

    if (!matches.length) {
      throw new Error("לא מצאתי מילים קרובות לעוגן שבחרת.")
    }

    const best = matches[0]
    return {
      kind: "nearText",
      label: `${best.book} ${best.chapter}:${best.verse}`,
      columnFloat: best.columnFloat,
      column: best.column,
      lineFloat: best.lineFloat,
      exact: best.exact,
      detail: `${best.parashah} | ${best.matchLabel} | קרוב ל${anchor.label}`,
      queryText: value,
      verseTextHtml: highlightMatchText(best.text, best, plusQuery.textQuery),
      anchorLabel: anchor.label,
      anchorColumn: anchor.column,
    }
  }

  return resolveStandardQuery(value)
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

function viewerRangeText(summary) {
  if (!summary) return "לא זמין"
  return summary.first_ref === summary.last_ref
    ? summary.first_ref
    : `${summary.first_ref} עד ${summary.last_ref}`
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

function viewerStageMetaHtml(summary) {
  if (!summary) return ""
  return `
    ${summaryPills(summary)}
    <span class="meta-pill meta-pill-range">${viewerRangeText(summary)}</span>
  `
}

function getColumnAnchorContext(summary, column = summary?.column || 1) {
  if (!summary) return { columnFloat: column }

  const chapter =
    summary.chapters?.length === 1
      ? Number(summary.chapters[0]) || parseHebrewNumber(String(summary.chapters[0]))
      : null

  return {
    columnFloat: column,
    book: summary.books?.[0] || null,
    chapter,
    parashahKey: summary.parashot?.[0] ? normalizeKey(summary.parashot[0]) : null,
  }
}

function extractLocationSearchQuery(location) {
  if (!location?.queryText) return ""
  const plusQuery = parsePlusQuery(location.queryText)
  return plusQuery ? plusQuery.textQuery : location.queryText
}

function getViewerSearchMatches(query, summary, limit = 6) {
  const value = normalizeSpaces(query)
  if (!value || !summary) return []

  return sortMatchesByAnchor(
    collectTextMatches(value),
    getColumnAnchorContext(summary, viewerState.column),
  )
    .slice(0, limit)
    .map((match) => ({
      ...match,
      inCurrentColumn: match.column === viewerState.column,
      columnDistance: Math.abs(match.column - viewerState.column),
    }))
}

function viewerWatermarkHtml(summary, searchQuery = "") {
  if (!summary) return ""
  return `
    <div class="viewer-watermark-column">עמודה ${summary.column}</div>
    <div class="viewer-watermark-range">${viewerRangeText(summary)}</div>
    <div class="viewer-watermark-parashah">${summary.parashot.join(" · ")}</div>
    ${
      searchQuery
        ? `<div class="viewer-watermark-search">${escapeHtml(searchQuery)}</div>`
        : ""
    }
  `
}

function renderViewerSearch(summary = getColumnSummary(viewerState.column)) {
  viewerWatermark.innerHTML = viewerWatermarkHtml(summary, viewerState.searchQuery)

  const value = normalizeSpaces(viewerState.searchQuery)
  if (!value) {
    viewerSearchResults.hidden = true
    viewerSearchResults.innerHTML = ""
    return
  }

  const matches = getViewerSearchMatches(value, summary)
  viewerSearchResults.hidden = false

  if (!matches.length) {
    viewerSearchResults.innerHTML = `
      <div class="viewer-search-empty">לא מצאתי התאמה קרובה לעמודה הזאת.</div>
    `
    return
  }

  viewerSearchResults.innerHTML = matches
    .map((match) => {
      const placeLabel = match.inCurrentColumn
        ? "בעמודה הזאת"
        : `עמודה ${match.column} · ${match.columnDistance} ${match.columnDistance === 1 ? "צעד" : "צעדים"}`

      return `
        <button
          class="viewer-search-hit${match.inCurrentColumn ? " is-current" : ""}"
          type="button"
          data-column="${match.column}"
        >
          <div class="viewer-search-hit-head">
            <strong>${match.book} ${match.chapter}:${match.verse}</strong>
            <span>${placeLabel}</span>
          </div>
          <div class="viewer-search-hit-text">${highlightMatchText(match.text, match, value)}</div>
        </button>
      `
    })
    .join("")
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
      <div class="location-meta">
        ${location.queryText ? `<div class="location-query">${location.queryText}</div>` : ""}
        <div class="location-label">${location.label}</div>
        ${location.anchorLabel ? `<div>עוגן: ${location.anchorLabel}</div>` : ""}
        <div>עמודה ${columnText}</div>
        <div>שורה ${lineText}</div>
        <div>${location.detail}</div>
        ${location.verseTextHtml ? `<p class="location-verse">${location.verseTextHtml}</p>` : ""}
      </div>
    </article>
  `
}

function renderError(message) {
  resultsEl.className = "results"
  resultsEl.innerHTML = `
    <article class="error-card">
      <h3>לא מצאתי</h3>
      <p>${message}</p>
    </article>
  `
  renderPreview()
}

function renderSingle(location, title = "היעד") {
  resultsEl.className = "results"
  resultsEl.innerHTML = formatLocation(location)
  renderPreview([{ title, location }])
}

function renderComparison(current, target) {
  const delta = target.columnFloat - current.columnFloat
  const absDelta = Math.abs(delta)
  const direction =
    absDelta < 0.25 ? "אותו מקום" : delta > 0 ? "קדימה" : "אחורה"
  const message =
    absDelta < 0.25 ? "כמעט בלי גלילה" : `${formatNumber(absDelta, 1)} עמודות ${direction}`

  resultsEl.className = "results"
  resultsEl.innerHTML = `
    <article class="summary-card">
      <h3>גלילה</h3>
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
    previewEl.innerHTML = "<p>כאן יופיעו העמודות.</p>"
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
              ? location.label
              : `${Math.abs(delta)} ${delta > 0 ? "קדימה" : "אחורה"}`
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
                מסך מלא
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

function resetState() {
  currentInput.value = ""
  targetInput.value = ""
  ;["current", "target"].forEach((side) => {
    const fields = builderFields[side]
    if (navigatorData) {
      fields.parashahSelect.value = navigatorData.parashot[0]?.name_display || ""
      fields.bookSelect.value = navigatorData.books[0] || ""
      populateChapterSelect(side, 1)
      populateVerseSelect(side, "")
    }
    fields.wordsInput.value = ""
    setBuilderMode(side, "free", { live: false })
  })
  resultsEl.className = "results empty-state"
  resultsEl.innerHTML = "<p>מלא שדה אחד או שניים.</p>"
  renderPreview()
}

function tryResolveQuery(value) {
  try {
    return value ? resolveQuery(value) : null
  } catch {
    return null
  }
}

function renderTypingState() {
  resultsEl.className = "results empty-state"
  resultsEl.innerHTML = "<p>ממשיך לחפש...</p>"
  renderPreview()
}

function runSearch({ live = false } = {}) {
  try {
    const currentValue = normalizeSpaces(currentInput.value)
    const targetValue = normalizeSpaces(targetInput.value)

    if (!currentValue && !targetValue) {
      if (live) {
        resetState()
        return
      }
      throw new Error("צריך למלא לפחות שדה אחד.")
    }

    if (live) {
      const currentLocation = tryResolveQuery(currentValue)
      const targetLocation = tryResolveQuery(targetValue)

      if (currentLocation && targetLocation) {
        renderComparison(currentLocation, targetLocation)
        return
      }

      if (currentLocation) {
        renderSingle(currentLocation, "המיקום")
        return
      }

      if (targetLocation) {
        renderSingle(targetLocation, "היעד")
        return
      }

      renderTypingState()
      return
    }

    if (!currentValue || !targetValue) {
      const singleValue = targetValue || currentValue
      const title = targetValue ? "היעד" : "המיקום"
      renderSingle(resolveQuery(singleValue), title)
      return
    }

    renderComparison(resolveQuery(currentValue), resolveQuery(targetValue))
  } catch (error) {
    renderError(error.message)
  }
}

function scheduleLiveSearch() {
  clearTimeout(liveSearchTimer)
  liveSearchTimer = setTimeout(() => {
    runSearch({ live: true })
  }, 140)
}

function getViewerFitScale() {
  if (!viewerImage.naturalWidth || !viewerImage.naturalHeight) return 1

  const computedStyle =
    typeof getComputedStyle === "function"
      ? getComputedStyle(viewerStage)
      : {
          paddingLeft: "0",
          paddingRight: "0",
          paddingTop: "0",
          paddingBottom: "0",
        }

  const paddingX =
    parseFloat(computedStyle.paddingLeft || "0") + parseFloat(computedStyle.paddingRight || "0")
  const paddingY =
    parseFloat(computedStyle.paddingTop || "0") + parseFloat(computedStyle.paddingBottom || "0")
  const stageWidth = (viewerStage.clientWidth || 900) - paddingX
  const stageHeight =
    (viewerStage.clientHeight || 900) -
    paddingY -
    Number(viewerTopbar.offsetHeight || 0) -
    Number(viewerControls.offsetHeight || 0) -
    Number(viewerStageMeta.offsetHeight || 0) -
    20

  if (stageWidth <= 0 || stageHeight <= 0) return 1

  return Math.max(
    0.05,
    Math.min(stageWidth / viewerImage.naturalWidth, stageHeight / viewerImage.naturalHeight),
  )
}

function syncViewerScale() {
  if (!viewerState.open || !viewerImage.naturalWidth || !viewerImage.naturalHeight) return
  viewerState.fitScale = getViewerFitScale()
  const width = viewerImage.naturalWidth * viewerState.fitScale * viewerState.zoomFactor
  viewerImage.style.width = `${Math.max(width, 80)}px`
}

function resetViewerPosition() {
  viewerStage.scrollTop = 0
  viewerStage.scrollLeft = 0
}

function openViewer({ title, column, subtitle = "", searchQuery = "" }) {
  const summary = getColumnSummary(column)
  viewerState.open = true
  viewerState.column = clampColumn(column)
  viewerState.title = title
  viewerState.subtitle = subtitle
  viewerState.searchQuery = normalizeSpaces(searchQuery)
  viewerState.zoomFactor = 1
  viewerSearchInput.value = viewerState.searchQuery
  viewerZoomInput.value = "1"

  document.body.style.overflow = "hidden"
  viewerModal.hidden = false
  resetViewerPosition()
  renderViewer(summary)
}

function closeViewer() {
  viewerState.open = false
  viewerState.searchQuery = ""
  viewerSearchInput.value = ""
  viewerSearchResults.hidden = true
  viewerSearchResults.innerHTML = ""
  document.body.style.overflow = ""
  viewerModal.hidden = true
}

function setViewerColumn(column, { resetScroll = true } = {}) {
  viewerState.column = clampColumn(column)
  if (resetScroll) resetViewerPosition()
  renderViewer()
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
  viewerStageMeta.innerHTML = viewerStageMetaHtml(currentSummary)
  viewerColumnInput.value = String(viewerState.column)
  const imagePath = columnImagePath(viewerState.column)
  viewerImage.src = imagePath
  viewerImage.alt = `${viewerState.title} - עמודה ${viewerState.column}`
  renderViewerSearch(currentSummary)
  syncViewerScale()
  viewerPrevButton.disabled = viewerState.column <= 1
  viewerNextButton.disabled = viewerState.column >= navigatorData.layout.columns
}

async function init() {
  try {
    setStatus("טוען...")
    const response = await fetch("./data/navigator_data.json")
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    navigatorData = await response.json()
    buildIndexes()
    buildSuggestions()
    initializeBuilders()
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

currentInput.addEventListener("input", () => {
  scheduleLiveSearch()
})

targetInput.addEventListener("input", () => {
  scheduleLiveSearch()
})

builderModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setBuilderMode(button.dataset.side, button.dataset.mode)
  })
})

;["current", "target"].forEach((side) => {
  const fields = builderFields[side]

  fields.parashahSelect.addEventListener("change", () => {
    syncStructuredQuery(side)
  })

  fields.bookSelect.addEventListener("change", () => {
    populateChapterSelect(side)
    populateVerseSelect(side, "")
    syncStructuredQuery(side)
  })

  fields.chapterSelect.addEventListener("change", () => {
    populateVerseSelect(side, "")
    syncStructuredQuery(side)
  })

  fields.verseSelect.addEventListener("change", () => {
    syncStructuredQuery(side)
  })

  fields.wordsInput.addEventListener("input", () => {
    syncStructuredQuery(side)
  })
})

resetButton.addEventListener("click", () => {
  clearTimeout(liveSearchTimer)
  resetState()
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
      searchQuery: extractLocationSearchQuery(state.location),
    })
  }
})

viewerPrevButton.addEventListener("click", () => {
  setViewerColumn(viewerState.column - 1)
})

viewerNextButton.addEventListener("click", () => {
  setViewerColumn(viewerState.column + 1)
})

viewerCloseButton.addEventListener("click", () => {
  closeViewer()
})

viewerSearchInput.addEventListener("input", () => {
  viewerState.searchQuery = normalizeSpaces(viewerSearchInput.value)
  renderViewerSearch()
})

viewerSearchResults.addEventListener("click", (event) => {
  const target = event.target.closest("[data-column]")
  if (!target) return
  const nextColumn = Number(target.dataset.column)
  if (!nextColumn) return
  if (nextColumn === viewerState.column) return
  setViewerColumn(nextColumn)
})

viewerZoomInput.addEventListener("input", () => {
  viewerState.zoomFactor = Number(viewerZoomInput.value)
  syncViewerScale()
})

viewerColumnInput.addEventListener("change", () => {
  const nextColumn = Number(viewerColumnInput.value)
  if (!nextColumn) return
  setViewerColumn(nextColumn)
})

viewerColumnInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return
  event.preventDefault()
  const nextColumn = Number(viewerColumnInput.value)
  if (!nextColumn) return
  setViewerColumn(nextColumn)
})

viewerModal.addEventListener("click", (event) => {
  if (event.target === viewerModal) closeViewer()
})

document.addEventListener("keydown", (event) => {
  if (!viewerState.open) return
  if (event.key === "Escape") closeViewer()
  if (event.key === "ArrowLeft") {
    setViewerColumn(viewerState.column + 1)
  }
  if (event.key === "ArrowRight") {
    setViewerColumn(viewerState.column - 1)
  }
})

viewerStage.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0]?.clientX ?? null
  touchStartY = event.changedTouches[0]?.clientY ?? null
})

viewerStage.addEventListener("touchend", (event) => {
  if (touchStartX === null) return
  const endX = event.changedTouches[0]?.clientX ?? null
  const endY = event.changedTouches[0]?.clientY ?? null
  if (endX === null) return
  const delta = endX - touchStartX
  const deltaY = endY === null || touchStartY === null ? 0 : endY - touchStartY
  touchStartX = null
  touchStartY = null
  if (viewerState.zoomFactor > 1.05) return
  if (Math.abs(delta) < 28) return
  if (Math.abs(delta) < Math.abs(deltaY) * 1.15) return
  setViewerColumn(viewerState.column + (delta < 0 ? 1 : -1))
})

viewerImage.addEventListener("load", () => {
  syncViewerScale()
})

if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("resize", () => {
    if (!viewerState.open) return
    syncViewerScale()
  })
}

init()
