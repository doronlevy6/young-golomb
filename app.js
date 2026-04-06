const statusEl = document.getElementById("data-status")
const resultsEl = document.getElementById("results")
const previewEl = document.getElementById("column-preview")
const formEl = document.getElementById("navigator-form")
const currentInput = document.getElementById("current-query")
const targetInput = document.getElementById("target-query")
const resetButton = document.getElementById("reset-button")
const suggestionsEl = document.getElementById("query-suggestions")
const readingDefaultsEl = document.getElementById("reading-defaults")

const viewerModal = document.getElementById("viewer-modal")
const viewerMeta = document.getElementById("viewer-meta")
const viewerMedia = document.getElementById("viewer-media")
const viewerHighlights = document.getElementById("viewer-highlights")
const viewerImage = document.getElementById("viewer-image")
const viewerStage = document.getElementById("viewer-stage")
const viewerWatermark = document.getElementById("viewer-watermark")
const viewerTopbar = document.getElementById("viewer-topbar")
const viewerControls = document.getElementById("viewer-controls")
const viewerPrevButton = document.getElementById("viewer-prev")
const viewerNextButton = document.getElementById("viewer-next")
const viewerCloseButton = document.getElementById("viewer-close")
const viewerSearchToggleButton = document.getElementById("viewer-search-toggle")
const viewerSearchPanel = document.getElementById("viewer-search-panel")
const viewerSearchInput = document.getElementById("viewer-search-input")
const viewerSearchResults = document.getElementById("viewer-search-results")
const viewerZoomInput = document.getElementById("viewer-zoom")
const viewerColumnInput = document.getElementById("viewer-column-input")

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

const torahBooks = new Set(["בראשית", "שמות", "ויקרא", "במדבר", "דברים"])
const scheduledReadingPrefixes = {
  previous: ["קריאה אחרונה", "קריאה קודמת", "הקריאה האחרונה"],
  next: ["קריאה הבאה", "הקריאה הבאה"],
}

let navigatorData = null
let previewState = []
let comparisonState = null
let autoReadingsState = {
  previous: null,
  next: null,
  today: "",
  sourceUrl: "",
  loading: false,
  error: "",
}
let viewerState = {
  open: false,
  column: 1,
  title: "",
  subtitle: "",
  searchOpen: false,
  searchQuery: "",
  zoomFactor: 1,
  fitScale: 1,
}
let touchStartX = null
let touchStartY = null
let liveSearchTimer = null

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

function getIsraelDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(date)
    .reduce((result, part) => {
      if (part.type !== "literal") result[part.type] = part.value
      return result
    }, {})

  return `${parts.year}-${parts.month}-${parts.day}`
}

function addDaysToIsoDate(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function formatReadingDate(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`)
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    weekday: "short",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(date)
}

function normalizeHebcalBook(bookName) {
  return bookAliases[normalizeKey(bookName)] || null
}

function isTorahBook(bookName) {
  const normalized = normalizeHebcalBook(bookName)
  return normalized ? torahBooks.has(normalized) : false
}

function formatReadingInputValue(role, reading) {
  const prefix = role === "previous" ? "קריאה אחרונה" : "קריאה הבאה"
  return `${prefix}: ${reading.name}`
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
  ;["קריאה אחרונה", "קריאה הבאה", "בראשית ג", "שמות כ", "במדבר כב ב", "עמודה 44", "והנחש היה ערום"].forEach((value) => {
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

function parseRefToken(refToken) {
  const [chapterRaw, verseRaw] = String(refToken || "").split(":")
  const chapter = parseHebrewNumber(chapterRaw)
  const verse = parseHebrewNumber(verseRaw)
  if (!chapter || !verse) return null
  return { chapter, verse }
}

function parseHebcalRange(bookName, beginRef, endRef) {
  const book = normalizeHebcalBook(bookName)
  if (!book || !isTorahBook(book)) return null

  const start = parseRefToken(beginRef)
  const end = parseRefToken(endRef)
  if (!start || !end) return null

  return { book, start, end }
}

function getAliyahSortKey(key) {
  if (/^\d+$/.test(String(key))) return Number(key)
  return String(key).toUpperCase() === "M" ? 99 : 199
}

function getTorahRangesFromAliyot(aliyot = {}) {
  return Object.entries(aliyot)
    .sort((a, b) => getAliyahSortKey(a[0]) - getAliyahSortKey(b[0]))
    .map(([, aliyah]) => parseHebcalRange(aliyah.k, aliyah.b, aliyah.e))
    .filter(Boolean)
}

function getTorahRangesFromHebcalItem(item) {
  if (Array.isArray(item.summaryParts) && item.summaryParts.length) {
    const summaryRanges = item.summaryParts
      .map((part) => parseHebcalRange(part.k, part.b, part.e))
      .filter(Boolean)
    if (summaryRanges.length) return summaryRanges
  }

  if (item.weekday) {
    const weekdayRanges = getTorahRangesFromAliyot(item.weekday)
    if (weekdayRanges.length) return weekdayRanges
  }

  return getTorahRangesFromAliyot(item.fullkriyah)
}

function formatRangeSegment(range) {
  const endLabel =
    range.start.chapter === range.end.chapter
      ? String(range.end.verse)
      : `${range.end.chapter}:${range.end.verse}`

  return `${range.book} ${range.start.chapter}:${range.start.verse}-${endLabel}`
}

function getHebcalReadingName(item) {
  if (typeof item.name === "string") return item.name
  return item.name?.he || item.name?.en || item.summary || "קריאה"
}

function getHebcalReadingTypeLabel(item) {
  if (item.type === "holiday") return "קריאת חג"
  if (item.weekday) return "קריאת שני/חמישי"
  return "קריאת שבת"
}

function createReadingAnchor(verse) {
  return {
    refLabel: `${verse.book} ${verse.chapter}:${verse.verse}`,
    book: verse.book,
    chapter: verse.chapter,
    verse: verse.verse,
    columnFloat: verse.columnFloat,
    column: verse.column,
    lineFloat: verse.lineFloat,
    exact: verse.exact,
    parashahKey: verse.parashahKey,
  }
}

function createScheduledReadingRecord(item) {
  const ranges = getTorahRangesFromHebcalItem(item)
  if (!ranges.length) return null

  const firstRange = ranges[0]
  const lastRange = ranges.at(-1)
  const startVerse = navigatorData.verseByKey.get(
    `${firstRange.book}:${firstRange.start.chapter}:${firstRange.start.verse}`,
  )
  const endVerse = navigatorData.verseByKey.get(
    `${lastRange.book}:${lastRange.end.chapter}:${lastRange.end.verse}`,
  )

  if (!startVerse || !endVerse) return null

  return {
    date: item.date,
    displayDate: formatReadingDate(item.date),
    name: getHebcalReadingName(item),
    typeLabel: getHebcalReadingTypeLabel(item),
    summary: item.summary || "",
    rangeLabel: ranges.map((range) => formatRangeSegment(range)).join(" | "),
    start: createReadingAnchor(startVerse),
    end: createReadingAnchor(endVerse),
  }
}

function getScheduledReadingKey(query) {
  const value = normalizeKey(query)
  if (!value) return null

  for (const [readingKey, prefixes] of Object.entries(scheduledReadingPrefixes)) {
    if (prefixes.some((prefix) => value.startsWith(normalizeKey(prefix)))) {
      return readingKey
    }
  }

  return null
}

function createScheduledReadingLocation(reading, role, rawQuery = "") {
  const anchor = role === "previous" ? reading.end : reading.start
  const anchorLabel = role === "previous" ? "סוף הקריאה" : "תחילת הקריאה"

  return {
    kind: "scheduledReading",
    label: anchorLabel,
    columnFloat: anchor.columnFloat,
    column: anchor.column,
    lineFloat: anchor.lineFloat,
    exact: anchor.exact,
    detail: `${reading.typeLabel} | ${reading.rangeLabel}`,
    queryText: normalizeSpaces(rawQuery) || formatReadingInputValue(role, reading),
    searchQuery: "",
    readingName: reading.name,
    readingDate: reading.displayDate,
    readingStartRef: reading.start.refLabel,
    readingStartColumn: reading.start.column,
    readingEndRef: reading.end.refLabel,
    readingEndColumn: reading.end.column,
    anchorContext: {
      columnFloat: anchor.columnFloat,
      book: anchor.book,
      chapter: anchor.chapter,
      parashahKey: anchor.parashahKey,
    },
  }
}

function renderReadingDefaults() {
  if (!readingDefaultsEl) return

  if (autoReadingsState.loading) {
    readingDefaultsEl.hidden = false
    readingDefaultsEl.innerHTML = `
      <div class="reading-pill">
        <strong>טוען קריאות...</strong>
      </div>
    `
    return
  }

  const cards = []
  if (autoReadingsState.previous) {
    cards.push(`
      <button class="reading-pill" type="button" data-fill-reading="previous">
        <strong>אחרונה: ${escapeHtml(autoReadingsState.previous.name)}</strong>
        <span>${escapeHtml(autoReadingsState.previous.displayDate)} · ${escapeHtml(autoReadingsState.previous.start.refLabel)} → ${escapeHtml(autoReadingsState.previous.end.refLabel)}</span>
      </button>
    `)
  }
  if (autoReadingsState.next) {
    cards.push(`
      <button class="reading-pill" type="button" data-fill-reading="next">
        <strong>הבאה: ${escapeHtml(autoReadingsState.next.name)}</strong>
        <span>${escapeHtml(autoReadingsState.next.displayDate)} · ${escapeHtml(autoReadingsState.next.start.refLabel)} → ${escapeHtml(autoReadingsState.next.end.refLabel)}</span>
      </button>
    `)
  }

  readingDefaultsEl.hidden = cards.length === 0
  readingDefaultsEl.innerHTML = cards.join("")
}

function applyAutoReadingDefaults() {
  let changed = false

  if (!normalizeSpaces(currentInput.value) && autoReadingsState.previous) {
    currentInput.value = formatReadingInputValue("previous", autoReadingsState.previous)
    changed = true
  }

  if (!normalizeSpaces(targetInput.value) && autoReadingsState.next) {
    targetInput.value = formatReadingInputValue("next", autoReadingsState.next)
    changed = true
  }

  if (changed) runSearch({ live: true })
}

async function loadAutoReadings() {
  autoReadingsState.loading = true
  autoReadingsState.error = ""
  renderReadingDefaults()

  try {
    const today = getIsraelDateString()
    const start = addDaysToIsoDate(today, -21)
    const end = addDaysToIsoDate(today, 21)
    const sourceUrl = `https://www.hebcal.com/leyning?cfg=json&start=${start}&end=${end}&i=on&triennial=off`
    const response = await fetch(sourceUrl)
    if (!response.ok) throw new Error(`Hebcal HTTP ${response.status}`)

    const payload = await response.json()
    const items = Array.isArray(payload.items) ? payload.items : []
    const readings = items
      .map((item) => createScheduledReadingRecord(item))
      .filter(Boolean)
      .sort((a, b) => a.date.localeCompare(b.date))

    autoReadingsState.previous = readings.filter((reading) => reading.date <= today).at(-1) || null
    autoReadingsState.next = readings.find((reading) => reading.date > today) || null
    autoReadingsState.today = today
    autoReadingsState.sourceUrl = sourceUrl
  } catch (error) {
    autoReadingsState.previous = null
    autoReadingsState.next = null
    autoReadingsState.error = error.message
    console.error(error)
  } finally {
    autoReadingsState.loading = false
    renderReadingDefaults()
    if (getScheduledReadingKey(currentInput.value) || getScheduledReadingKey(targetInput.value)) {
      runSearch({ live: true })
    } else {
      applyAutoReadingDefaults()
    }
  }
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

  const scheduledReadingKey = getScheduledReadingKey(value)
  if (scheduledReadingKey) {
    const reading = autoReadingsState[scheduledReadingKey]
    if (!reading) throw new Error("הקריאות האוטומטיות עדיין לא נטענו.")
    return createScheduledReadingLocation(reading, scheduledReadingKey, value)
  }

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

function viewerWatermarkHtml(summary) {
  if (!summary) return ""
  return `
    <div class="viewer-watermark-column">עמודה ${summary.column}</div>
    <div class="viewer-watermark-range">${viewerRangeText(summary)}</div>
    <div class="viewer-watermark-parashah">${summary.parashot.join(" · ")}</div>
  `
}

function getColumnAnchorContext(summary, column = summary?.column || viewerState.column) {
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
  if (typeof location?.searchQuery === "string") return location.searchQuery
  if (!location?.queryText) return ""
  const plusQuery = parsePlusQuery(location.queryText)
  return plusQuery ? plusQuery.textQuery : location.queryText
}

function getViewerSearchMatches(query, summary, limit = 6) {
  const value = normalizeSpaces(query)
  if (!value || !summary) return []

  const currentColumn = viewerState.column
  const anchor = getColumnAnchorContext(summary, currentColumn)

  return collectTextMatches(value)
    .map((match) => ({
      ...match,
      columnDistance: Math.abs(match.column - currentColumn),
      inCurrentColumn: match.column === currentColumn,
    }))
    .filter((match) => match.columnDistance <= 6)
    .sort((a, b) => {
      const proximityA =
        a.columnDistance === 0 ? 3 : a.columnDistance <= 2 ? 2 : 1
      const proximityB =
        b.columnDistance === 0 ? 3 : b.columnDistance <= 2 ? 2 : 1

      return (
        proximityB - proximityA ||
        a.columnDistance - b.columnDistance ||
        anchorBucket(b, anchor) - anchorBucket(a, anchor) ||
        b.bucket - a.bucket ||
        a.span - b.span ||
        a.firstPosition - b.firstPosition ||
        a.columnFloat - b.columnFloat
      )
    })
    .slice(0, limit)
}

function getViewerCurrentColumnMatches(query, limit = 4) {
  const value = normalizeSpaces(query)
  if (!value) return []

  return collectTextMatches(value)
    .filter((match) => match.column === viewerState.column)
    .sort((a, b) => a.lineFloat - b.lineFloat || a.verse - b.verse)
    .slice(0, limit)
}

function renderViewerHighlights() {
  const query = normalizeSpaces(viewerState.searchQuery)
  if (!query) {
    viewerHighlights.innerHTML = ""
    return
  }

  const matches = getViewerCurrentColumnMatches(query)
  if (!matches.length) {
    viewerHighlights.innerHTML = ""
    return
  }

  viewerHighlights.innerHTML = matches
    .map((match) => {
      const top = Math.max(2, Math.min(98, ((match.lineFloat - 1) / 42) * 100))
      return `
        <div class="viewer-highlight" style="top:${top}%;">
          <div class="viewer-highlight-label">${escapeHtml(query)} · ${match.book} ${match.chapter}:${match.verse}</div>
        </div>
      `
    })
    .join("")
}

function renderViewerSearch(summary = getColumnSummary(viewerState.column)) {
  viewerSearchPanel.hidden = !viewerState.searchOpen
  viewerSearchToggleButton.classList.toggle("is-active", viewerState.searchOpen)
  viewerSearchToggleButton.textContent = viewerState.searchOpen ? "סגור חיפוש" : "חיפוש מילה"
  if (!viewerState.searchOpen) return

  viewerSearchInput.value = viewerState.searchQuery

  const query = normalizeSpaces(viewerState.searchQuery)
  if (!query) {
    viewerSearchResults.innerHTML = `
      <div class="viewer-search-hint">כתוב מילה ונחפש באותה עמודה או בעמודות שלידה.</div>
    `
    return
  }

  const matches = getViewerSearchMatches(query, summary)
  if (!matches.length) {
    viewerSearchResults.innerHTML = `
      <div class="viewer-search-empty">לא מצאתי מילה קרובה באותה עמודה או ליד.</div>
    `
    return
  }

  viewerSearchResults.innerHTML = matches
    .map((match) => {
      const placeLabel = match.inCurrentColumn
        ? "באותה עמודה"
        : `עמודה ${match.column} · ${match.columnDistance} ${match.columnDistance === 1 ? "עמודה" : "עמודות"}`

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
          <div class="viewer-search-hit-text">${highlightMatchText(match.text, match, query)}</div>
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
        ${location.readingName ? `<div>קריאה: ${location.readingName}</div>` : ""}
        ${location.readingDate ? `<div>תאריך: ${location.readingDate}</div>` : ""}
        ${
          location.readingStartRef
            ? `<div>תחילה: ${location.readingStartRef} · עמודה ${location.readingStartColumn}</div>`
            : ""
        }
        ${
          location.readingEndRef
            ? `<div>סוף: ${location.readingEndRef} · עמודה ${location.readingEndColumn}</div>`
            : ""
        }
        ${location.anchorLabel ? `<div>עוגן: ${location.anchorLabel}</div>` : ""}
        <div>עמודה ${columnText}</div>
        <div>שורה ${lineText}</div>
        <div>${location.detail}</div>
        ${location.verseTextHtml ? `<p class="location-verse">${location.verseTextHtml}</p>` : ""}
      </div>
    </article>
  `
}

function formatLocationMatch(location) {
  if (!location?.verseTextHtml) return ""
  const queryLabel = extractLocationSearchQuery(location)
  return `
    <div class="location-match">
      <div class="location-match-label">${queryLabel ? `מילים: ${escapeHtml(queryLabel)}` : "התאמה"}</div>
      <div class="location-match-text">${location.verseTextHtml}</div>
    </div>
  `
}

function renderError(message) {
  comparisonState = null
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
  comparisonState = null
  resultsEl.className = "results"
  resultsEl.innerHTML = formatLocation(location)
  renderPreview([{ title, location }])
}

function renderComparison(current, target, { sourceVisible = false } = {}) {
  comparisonState = { current, target, sourceVisible }
  renderComparisonState()
}

function renderComparisonState() {
  if (!comparisonState) return

  const { current, target, sourceVisible } = comparisonState
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
      <div class="summary-actions">
        <button
          class="ghost-button small-button"
          type="button"
          data-action="toggle-source"
        >
          ${sourceVisible ? "הסתר מקור" : "הצג מקור"}
        </button>
      </div>
    </article>
    <div class="location-grid">
      ${
        sourceVisible
          ? `<div class="location-slot location-slot-source">${formatLocation(current)}</div>`
          : ""
      }
      <div class="location-slot location-slot-target">${formatLocation(target)}</div>
    </div>
  `

  renderPreview(
    sourceVisible
      ? [
          { title: "עמודת המקור", location: current },
          { title: "עמודת היעד", location: target },
        ]
      : [{ title: "עמודת היעד", location: target }],
  )
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
              ${formatLocationMatch(location)}

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
  comparisonState = null
  currentInput.value = ""
  targetInput.value = ""
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
  const stageHeight = (viewerStage.clientHeight || window.innerHeight || 900) - paddingY

  if (stageWidth <= 0 || stageHeight <= 0) return 1

  const widthScale = stageWidth / viewerImage.naturalWidth
  const heightScale = stageHeight / viewerImage.naturalHeight

  return Math.max(0.05, Math.min(widthScale, heightScale))
}

function syncViewerScale() {
  if (!viewerState.open || !viewerImage.naturalWidth || !viewerImage.naturalHeight) return
  viewerState.fitScale = getViewerFitScale()
  const width = viewerImage.naturalWidth * viewerState.fitScale * viewerState.zoomFactor
  const safeWidth = `${Math.max(width, 80)}px`
  viewerMedia.style.width = safeWidth
  viewerImage.style.width = safeWidth
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
  viewerState.searchOpen = false
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
  viewerState.searchOpen = false
  viewerState.searchQuery = ""
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
  viewerWatermark.innerHTML = viewerWatermarkHtml(currentSummary)
  viewerColumnInput.value = String(viewerState.column)
  const imagePath = columnImagePath(viewerState.column)
  viewerImage.src = imagePath
  viewerImage.alt = `${viewerState.title} - עמודה ${viewerState.column}`
  renderViewerSearch(currentSummary)
  renderViewerHighlights()
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
    setStatus("מוכן", "ready")
    loadAutoReadings()
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

resetButton.addEventListener("click", () => {
  clearTimeout(liveSearchTimer)
  resetState()
  applyAutoReadingDefaults()
})

readingDefaultsEl.addEventListener("click", (event) => {
  const target = event.target.closest("[data-fill-reading]")
  if (!target) return

  const readingKey = target.dataset.fillReading
  const reading = autoReadingsState[readingKey]
  if (!reading) return

  if (readingKey === "previous") {
    currentInput.value = formatReadingInputValue("previous", reading)
  } else {
    targetInput.value = formatReadingInputValue("next", reading)
  }

  runSearch({ live: true })
})

resultsEl.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action='toggle-source']")
  if (!target || !comparisonState) return
  comparisonState.sourceVisible = !comparisonState.sourceVisible
  renderComparisonState()
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

viewerSearchToggleButton.addEventListener("click", () => {
  viewerState.searchOpen = !viewerState.searchOpen
  renderViewerSearch()
  if (viewerState.searchOpen && typeof viewerSearchInput.focus === "function") {
    viewerSearchInput.focus()
  }
})

viewerSearchInput.addEventListener("input", () => {
  viewerState.searchQuery = normalizeSpaces(viewerSearchInput.value)
  renderViewerSearch()
  renderViewerHighlights()
})

viewerSearchResults.addEventListener("click", (event) => {
  const target = event.target.closest("[data-column]")
  if (!target) return
  const nextColumn = Number(target.dataset.column)
  if (!nextColumn || nextColumn === viewerState.column) return
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
  if (event.key === "Escape") {
    if (viewerState.searchOpen) {
      viewerState.searchOpen = false
      renderViewerSearch()
      return
    }
    closeViewer()
    return
  }
  if (document.activeElement === viewerSearchInput && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
    return
  }
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
