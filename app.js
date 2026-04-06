const statusEl = document.getElementById("data-status")
const resultsEl = document.getElementById("results")
const previewEl = document.getElementById("column-preview")
const formEl = document.getElementById("navigator-form")
const currentInput = document.getElementById("current-query")
const currentSegmentPicker = document.getElementById("current-segment-picker")
const targetInput = document.getElementById("target-query")
const targetSegmentPicker = document.getElementById("target-segment-picker")
const currentCalendarButton = document.getElementById("current-calendar-button")
const targetCalendarButton = document.getElementById("target-calendar-button")
const resetButton = document.getElementById("reset-button")
const clearCurrentButton = document.getElementById("clear-current-button")
const clearTargetButton = document.getElementById("clear-target-button")
const suggestionsEl = document.getElementById("query-suggestions")
const readingDefaultsEl = document.getElementById("reading-defaults")
const journalSummaryEl = document.getElementById("journal-summary")
const journalMonthsEl = document.getElementById("journal-months")
const calendarModal = document.getElementById("calendar-modal")
const calendarCloseButton = document.getElementById("calendar-close")
const calendarTitleEl = document.getElementById("calendar-title")
const calendarSubtitleEl = document.getElementById("calendar-subtitle")
const journalMonthSelect = document.getElementById("journal-month-select")
const journalYearSelect = document.getElementById("journal-year-select")
const journalPrevMonthButton = document.getElementById("journal-prev-month")
const journalNextMonthButton = document.getElementById("journal-next-month")
const modeTabsEl = document.getElementById("mode-tabs")
const timesViewEl = document.getElementById("times-view")
const navigatorViewEl = document.getElementById("navigator-view")
const todayInfoEl = document.getElementById("today-info")
const timesDateInput = document.getElementById("times-date-input")
const timesCalendarButton = document.getElementById("times-calendar-button")
const timesDateTodayButton = document.getElementById("times-date-today")
const timesMainTitleInput = document.getElementById("times-main-title")
const timesDafTimeInput = document.getElementById("times-daf-time")
const timesGreetingModeInput = document.getElementById("times-greeting-mode")
const timesGreetingInput = document.getElementById("times-greeting-input")
const timesSeasonModeInput = document.getElementById("times-season-mode")
const timesIncludeDafInput = document.getElementById("times-include-daf")
const timesResetFixedLinesButton = document.getElementById("times-reset-fixed-lines")
const timesFixedLinesList = document.getElementById("times-fixed-lines-list")
const timesAddExtraLineButton = document.getElementById("times-add-extra-line")
const timesExtraLinesList = document.getElementById("times-extra-lines-list")
const timesSummaryEl = document.getElementById("times-summary")
const timesCopyImageButton = document.getElementById("times-copy-image")
const timesDownloadImageButton = document.getElementById("times-download-image")
const timesCopyStatusEl = document.getElementById("times-copy-status")
const timesPosterPreview = document.getElementById("times-poster-preview")
const timesPosterCanvas = document.getElementById("times-poster-canvas")

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
  previous: ["קריאה קודמת", "הקריאה הקודמת", "קריאה אחרונה", "הקריאה האחרונה"],
  next: ["קריאה הבאה", "הקריאה הבאה"],
}
const israelTimeZone = "Asia/Jerusalem"
const bneiBrakGeoNameId = 295514
const bneiBrakCandleOffsetMinutes = 22
const featuredZmanim = [
  { key: "alotHaShachar", label: "עלות" },
  { key: "sunrise", label: "נץ" },
  { key: "sofZmanShma", label: "שמע" },
  { key: "chatzot", label: "חצות" },
  { key: "sunset", label: "שקיעה" },
  { keys: ["tzeit85deg", "tzeit7083deg"], label: "צאת" },
]
const appModes = {
  times: "times",
  navigator: "navigator",
}
const timesSettingsStorageKey = "torah-scroll-navigator.times-settings.v1"
const defaultTimesGreeting = "שבת שלום ומועדים לשמחה!"

let navigatorData = null
let previewState = []
let comparisonState = null
let appState = {
  mode: appModes.times,
}
let todayInfoState = {
  isoDate: getIsraelDateString(),
  hebrewDate: "",
  gregorianDate: "",
  locationLabel: "בני ברק",
  zmanim: [],
  loading: false,
  error: "",
}
let autoReadingsState = {
  readings: [],
  previous: null,
  next: null,
  today: "",
  rangeStart: "",
  rangeEnd: "",
  sourceUrl: "",
  loading: false,
  error: "",
}
let journalState = {
  selectedDate: "",
  visibleMonthKey: "",
  open: false,
  fieldKey: "target",
}
let querySegmentState = {
  current: null,
  target: null,
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
let timesCopyMessageTimer = null
let posterLogoImage = null
let posterPreviewUrl = ""
let timesState = {
  selectedDate: getIsraelDateString(),
  loading: false,
  error: "",
  rawTimes: null,
  calendarTimes: {
    candleLighting: null,
    havdalah: null,
  },
  readingName: "",
  readingTypeLabel: "",
  seasonLabel: "",
  fixedLineTemplate: [],
  baseSchedule: [],
  schedule: [],
  settings: {
    mainTitle: "",
    dafTime: "18:00",
    includeDaf: true,
    seasonMode: "auto",
    greetingMode: "auto",
    greeting: defaultTimesGreeting,
    fixedLineOverrides: {},
    hiddenFixedLineIds: [],
    extraLines: [],
  },
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

function getIsraelDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: israelTimeZone,
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

function getIsraelDateObject(isoDate) {
  return new Date(`${isoDate}T12:00:00Z`)
}

function formatReadingDate(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`)
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: israelTimeZone,
    weekday: "short",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(date)
}

function formatGregorianDate(isoDate) {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: israelTimeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(getIsraelDateObject(isoDate))
}

function formatHebrewDate(isoDate) {
  try {
    return new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
      timeZone: israelTimeZone,
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(getIsraelDateObject(isoDate))
  } catch {
    return new Intl.DateTimeFormat("he-IL", {
      timeZone: israelTimeZone,
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(getIsraelDateObject(isoDate))
  }
}

function formatHebrewDay(isoDate) {
  try {
    return new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
      timeZone: israelTimeZone,
      day: "numeric",
      month: "short",
    }).format(getIsraelDateObject(isoDate))
  } catch {
    return formatHebrewDate(isoDate)
  }
}

function formatClockTime(dateTimeValue) {
  const date =
    dateTimeValue instanceof Date
      ? dateTimeValue
      : new Date(dateTimeValue)
  if (Number.isNaN(date.getTime())) return ""

  return new Intl.DateTimeFormat("he-IL", {
    timeZone: israelTimeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date)
}

function parseIsoDateFromQuery(query) {
  const match = normalizeSpaces(query).match(/\b(\d{4}-\d{2}-\d{2})\b/)
  return match ? match[1] : ""
}

function formatReadingDateInputValue(reading) {
  return `${formatHebrewDay(reading.date)} · ${reading.name}`
}

function getReadingFromHebrewPrefixQuery(query) {
  const value = normalizeSpaces(query)
  if (!value || !value.includes("·")) return null

  const [prefixRaw, ...nameParts] = value.split("·")
  const prefixKey = normalizeKey(prefixRaw || "")
  const nameKey = normalizeKey(nameParts.join("·"))
  if (!prefixKey) return null

  return (
    autoReadingsState.readings.find((reading) => {
      const readingPrefixKey = normalizeKey(formatHebrewDay(reading.date))
      if (readingPrefixKey !== prefixKey) return false
      if (!nameKey) return true
      return normalizeKey(reading.name) === nameKey
    }) || null
  )
}

function renderTodayInfo() {
  if (!todayInfoEl) return

  const hebrewDate =
    todayInfoState.hebrewDate || formatHebrewDate(todayInfoState.isoDate || getIsraelDateString())
  const gregorianDate =
    todayInfoState.gregorianDate || formatGregorianDate(todayInfoState.isoDate || getIsraelDateString())
  const locationLabel = todayInfoState.locationLabel || "בני ברק"

  let zmanimHtml = `
    <div class="today-zman today-zman-placeholder is-message">
      <span>שעות היום</span>
      <strong>${todayInfoState.loading ? "טוען..." : "לא זמין כרגע"}</strong>
    </div>
  `

  if (todayInfoState.zmanim.length) {
    zmanimHtml = todayInfoState.zmanim
      .map(
        (zman) => `
          <div class="today-zman">
            <span>${zman.label}</span>
            <strong>${zman.time}</strong>
          </div>
        `,
      )
      .join("")
  } else if (todayInfoState.error) {
    zmanimHtml = `
      <div class="today-zman today-zman-placeholder is-message">
        <span>שעות היום</span>
        <strong>כרגע לא נטענו</strong>
      </div>
    `
  }

  todayInfoEl.innerHTML = `
    <div class="today-copy">
      <p class="today-kicker">היום בבני ברק</p>
      <h2 class="today-title">${escapeHtml(hebrewDate)}</h2>
      <div class="today-dates">
        <span>${escapeHtml(gregorianDate)}</span>
        <span>שעות היום לפי ${escapeHtml(locationLabel)}</span>
      </div>
    </div>
    <div class="today-zmanim">${zmanimHtml}</div>
  `
}

async function loadTodayInfo() {
  todayInfoState.isoDate = getIsraelDateString()
  todayInfoState.hebrewDate = formatHebrewDate(todayInfoState.isoDate)
  todayInfoState.gregorianDate = formatGregorianDate(todayInfoState.isoDate)
  todayInfoState.loading = true
  todayInfoState.error = ""
  renderTodayInfo()

  try {
    const response = await fetchWithTimeout(
      `https://www.hebcal.com/zmanim?cfg=json&geonameid=${bneiBrakGeoNameId}&date=${todayInfoState.isoDate}`,
    )
    if (!response.ok) throw new Error(`Hebcal zmanim HTTP ${response.status}`)

    const payload = await response.json()
    const times = payload?.times || {}
    todayInfoState.locationLabel =
      payload?.location?.city === "Bnei Brak" ? "בני ברק" : payload?.location?.city || "בני ברק"
    todayInfoState.zmanim = featuredZmanim
      .map((item) => {
        const candidateKeys = Array.isArray(item.keys) ? item.keys : [item.key]
        const value = candidateKeys.map((key) => times[key]).find(Boolean)
        if (!value) return null
        return { label: item.label, time: formatClockTime(value) }
      })
      .filter(Boolean)
  } catch (error) {
    todayInfoState.error = error.message
    todayInfoState.zmanim = []
    console.error(error)
  } finally {
    todayInfoState.loading = false
    renderTodayInfo()
  }
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

function addDaysToIsoDate(isoDate, days) {
  const date = getIsraelDateObject(isoDate)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("פג זמן הטעינה של השרת, נסה שוב.")
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

function normalizeTimeInput(value) {
  const match = String(value || "").match(/^([01]\d|2[0-3]):([0-5]\d)$/)
  return match ? `${match[1]}:${match[2]}` : ""
}

async function fetchCalendarCandleTimes(dateString) {
  const start = addDaysToIsoDate(dateString, -1)
  const end = dateString
  const url =
    `https://www.hebcal.com/hebcal?v=1&cfg=json` +
    `&start=${start}&end=${end}` +
    `&c=on&b=${bneiBrakCandleOffsetMinutes}&M=on&i=on` +
    `&geo=geoname&geonameid=${bneiBrakGeoNameId}`

  try {
    const response = await fetchWithTimeout(url)
    if (!response.ok) return { candleLighting: null, havdalah: null }
    const payload = await response.json()
    const items = Array.isArray(payload?.items) ? payload.items : []
    const candles = items.filter((item) => item?.category === "candles")
    const havdalot = items.filter((item) => item?.category === "havdalah")
    const preferredCandle =
      candles.find((item) => String(item.date || "").startsWith(`${dateString}T`)) ||
      candles.at(-1) ||
      null
    const preferredHavdalah =
      havdalot.find((item) => String(item.date || "").startsWith(`${dateString}T`)) ||
      null
    return {
      candleLighting: preferredCandle?.date ? new Date(preferredCandle.date) : null,
      havdalah: preferredHavdalah?.date ? new Date(preferredHavdalah.date) : null,
    }
  } catch {
    return { candleLighting: null, havdalah: null }
  }
}

function getIsraelOffsetHours(isoDate) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: israelTimeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZoneName: "shortOffset",
    }).formatToParts(getIsraelDateObject(isoDate))
    const offsetRaw = parts.find((part) => part.type === "timeZoneName")?.value || "GMT+2"
    const match = offsetRaw.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/)
    if (!match) return 2
    const hours = Number(match[1])
    const minutes = Number(match[2] || "0")
    return hours >= 0 ? hours + minutes / 60 : hours - minutes / 60
  } catch {
    return 2
  }
}

function getSeasonLabel(isoDate) {
  return getIsraelOffsetHours(isoDate) >= 3 ? "קיץ" : "חורף"
}

function normalizeGreetingMode(value) {
  return value === "custom" ? "custom" : "auto"
}

function normalizeSeasonMode(value) {
  return value === "summer" || value === "winter" ? value : "auto"
}

function normalizeGreetingInput(value) {
  return String(value || "")
    .replace(/[\r\n]+/g, " ")
    .slice(0, 180)
}

function normalizeMainTitle(value) {
  return String(value || "")
    .replace(/[\r\n]+/g, " ")
    .slice(0, 120)
}

function normalizeFixedLineField(value, maxLength = 80) {
  return normalizeSpaces(String(value || "")).slice(0, maxLength)
}

function normalizeFixedLineOverrides(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  const entries = Object.entries(value).slice(0, 40)
  return entries.reduce((accumulator, [rawId, rawOverride]) => {
    const id = normalizeSpaces(rawId)
    if (!id) return accumulator
    const override = rawOverride && typeof rawOverride === "object" ? rawOverride : {}
    const label = normalizeFixedLineField(override.label, 80)
    const time = normalizeFixedLineField(override.time, 32)
    if (label || time) {
      accumulator[id] = { label, time }
    }
    return accumulator
  }, {})
}

function normalizeHiddenFixedLineIds(items) {
  if (!Array.isArray(items)) return []
  const ids = items
    .map((item) => normalizeSpaces(String(item || "")))
    .filter(Boolean)
    .slice(0, 40)
  return [...new Set(ids)]
}

function normalizeExtraLine(item) {
  if (!item || typeof item !== "object") return null
  const text = normalizeSpaces(item.text || "")
  const afterId = normalizeSpaces(item.afterId || "")
  return { text, afterId }
}

function normalizeExtraLines(items) {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => normalizeExtraLine(item))
    .filter(Boolean)
    .slice(0, 12)
}

function loadTimesSettings() {
  try {
    const raw = localStorage.getItem(timesSettingsStorageKey)
    if (!raw) return
    const parsed = JSON.parse(raw)
    timesState.settings.mainTitle = normalizeMainTitle(parsed?.mainTitle)
    timesState.settings.dafTime = normalizeTimeInput(parsed?.dafTime) || timesState.settings.dafTime
    timesState.settings.includeDaf = parsed?.includeDaf !== false
    timesState.settings.seasonMode = normalizeSeasonMode(parsed?.seasonMode)
    timesState.settings.greetingMode = normalizeGreetingMode(parsed?.greetingMode)
    timesState.settings.greeting = normalizeGreetingInput(parsed?.greeting || "")
    timesState.settings.fixedLineOverrides = normalizeFixedLineOverrides(parsed?.fixedLineOverrides)
    timesState.settings.hiddenFixedLineIds = normalizeHiddenFixedLineIds(parsed?.hiddenFixedLineIds)
    timesState.settings.extraLines = normalizeExtraLines(parsed?.extraLines)
  } catch {
    timesState.settings = {
      ...timesState.settings,
      mainTitle: "",
      includeDaf: true,
      seasonMode: "auto",
      greetingMode: "auto",
      greeting: defaultTimesGreeting,
      fixedLineOverrides: {},
      hiddenFixedLineIds: [],
      extraLines: [],
    }
  }
}

function saveTimesSettings() {
  try {
    localStorage.setItem(timesSettingsStorageKey, JSON.stringify(timesState.settings))
  } catch {}
}

function setTimesCopyStatus(message, mode = "") {
  if (!timesCopyStatusEl) return
  clearTimeout(timesCopyMessageTimer)
  timesCopyStatusEl.textContent = message
  timesCopyStatusEl.className = `compact-hint${mode ? ` ${mode}` : ""}`
  if (message) {
    timesCopyMessageTimer = setTimeout(() => {
      timesCopyStatusEl.textContent = ""
      timesCopyStatusEl.className = "compact-hint"
    }, 3600)
  }
}

function setAppMode(mode) {
  appState.mode = mode === appModes.navigator ? appModes.navigator : appModes.times

  if (timesViewEl) {
    timesViewEl.hidden = appState.mode !== appModes.times
  }
  if (navigatorViewEl) {
    navigatorViewEl.hidden = appState.mode !== appModes.navigator
  }

  modeTabsEl?.querySelectorAll(".mode-tab").forEach((button) => {
    const isActive = button.dataset.tab === appState.mode
    button.classList.toggle("is-active", isActive)
    button.setAttribute("aria-pressed", isActive ? "true" : "false")
  })
}

function getTimesReadingMeta(dateString) {
  const sameDateReadings = (autoReadingsState.readings || []).filter((reading) => reading.date === dateString)
  const preferred =
    sameDateReadings.find((reading) => !reading.isWeekdayReading) ||
    sameDateReadings[0] ||
    null

  if (!preferred) return null
  return {
    name: preferred.name,
    typeLabel: preferred.typeLabel,
  }
}

function formatParashahDisplayName(name) {
  const rawName = normalizeSpaces(name || "")
  if (!rawName) return ""

  const cleaned = normalizeSpaces(
    rawName
      .replace(/^Parashat\s+/i, "")
      .replace(/^Parsha(?:t)?\s+/i, "")
      .replace(/^פרשת\s+/u, "")
      .replace(/^פרשה\s+/u, ""),
  )
  if (!cleaned) return ""

  return cleaned
}

function getTimesOccasionMeta({
  dateString = timesState.selectedDate,
  readingName = timesState.readingName,
  readingTypeLabel = timesState.readingTypeLabel,
} = {}) {
  const cleanedReadingName = normalizeSpaces(readingName || "")
  const dayIndex = getWeekdayIndex(dateString)
  const isHoliday = readingTypeLabel === "קריאת חג"
  const isShabbat = readingTypeLabel === "קריאת שבת" || dayIndex === 6

  if (isHoliday) {
    return {
      kind: "holiday",
      heading: "זמני חג",
      subheading: cleanedReadingName,
      autoGreeting: dayIndex === 6 ? "שבת שלום ומועדים לשמחה!" : "מועדים לשמחה!",
      exitLabel: "צאת החג",
      preExitNote: "5 דקות לפני צאת החג",
    }
  }

  if (isShabbat) {
    const parashahLabel = formatParashahDisplayName(cleanedReadingName)
    return {
      kind: "shabbat",
      heading: "זמני שבת",
      subheading: parashahLabel,
      autoGreeting: "שבת שלום! ❤️",
      exitLabel: "צאת שבת",
      preExitNote: "5 דקות לפני צאת שבת",
    }
  }

  return {
    kind: "day",
    heading: "זמני היום",
    subheading: cleanedReadingName,
    autoGreeting: "בשורות טובות!",
    exitLabel: "צאת היום",
    preExitNote: "5 דקות לפני צאת היום",
  }
}

function resolveSeasonLabel(dateString) {
  if (timesState.settings.seasonMode === "summer") return "קיץ"
  if (timesState.settings.seasonMode === "winter") return "חורף"
  return getSeasonLabel(dateString)
}

function getEffectiveGreeting(occasionMeta) {
  const greeting =
    timesState.settings.greetingMode === "custom"
      ? normalizeSpaces(timesState.settings.greeting || "") || occasionMeta.autoGreeting || defaultTimesGreeting
      : occasionMeta.autoGreeting || defaultTimesGreeting

  const cleanGreeting = String(greeting || "").replace(/\s+$/g, "")
  if (!cleanGreeting) return "❤️"
  if (/[❤️♥]\s*$/u.test(cleanGreeting)) return cleanGreeting
  return `${cleanGreeting} ❤️`
}

function numberToHebrewLetters(value) {
  const number = Number(value)
  if (!Number.isInteger(number) || number <= 0) return ""

  const hundreds = ["", "ק", "ר", "ש", "ת", "תק", "תר", "תש", "תת", "תתק"]
  const tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"]
  const units = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"]
  let n = number
  let letters = ""

  while (n >= 1000) {
    letters += "תתק"
    n -= 900
  }

  const hundredIndex = Math.floor(n / 100)
  letters += hundreds[hundredIndex]
  n %= 100

  if (n === 15) return letters + "טו"
  if (n === 16) return letters + "טז"

  const tenIndex = Math.floor(n / 10)
  letters += tens[tenIndex]
  n %= 10
  letters += units[n]

  return letters
}

function addHebrewGershayim(text) {
  const value = normalizeSpaces(text || "")
  if (!value) return ""
  if (value.length === 1) return `${value}׳`
  return `${value.slice(0, -1)}״${value.slice(-1)}`
}

function formatHebrewDateGematria(isoDate) {
  try {
    const parts = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
      timeZone: israelTimeZone,
      day: "numeric",
      month: "long",
      year: "numeric",
    }).formatToParts(getIsraelDateObject(isoDate))

    const dayNumber = Number(parts.find((part) => part.type === "day")?.value || "")
    const monthLabelRaw = normalizeSpaces(parts.find((part) => part.type === "month")?.value || "")
    const monthLabel = monthLabelRaw.replace(/^ב(?=[\p{Script=Hebrew}])/u, "")
    const yearNumber = Number(parts.find((part) => part.type === "year")?.value || "")
    if (!dayNumber || !monthLabel || !yearNumber) return formatHebrewDate(isoDate)

    const dayLabel = numberToHebrewLetters(dayNumber)
    const yearLabel = addHebrewGershayim(numberToHebrewLetters(yearNumber % 1000))
    return `${dayLabel} ${monthLabel} ${yearLabel}`
  } catch {
    return formatHebrewDate(isoDate)
  }
}

async function fetchTimesReadingMeta(dateString) {
  try {
    const response = await fetchWithTimeout(
      `https://www.hebcal.com/leyning?cfg=json&start=${dateString}&end=${dateString}&i=on&h=on&triennial=off`,
    )
    if (!response.ok) return null
    const payload = await response.json()
    const items = Array.isArray(payload.items) ? payload.items : []
    const preferred = items.find((item) => !item.weekday) || items[0] || null
    if (!preferred) return null

    return {
      name: getHebcalReadingName(preferred),
      typeLabel: getHebcalReadingTypeLabel(preferred),
    }
  } catch {
    return null
  }
}

function getZmanDate(times, key) {
  if (!times?.[key]) return null
  const date = new Date(times[key])
  return Number.isNaN(date.getTime()) ? null : date
}

function getEffectiveTimesHeading(occasionMeta = getTimesOccasionMeta()) {
  const customTitle = normalizeMainTitle(timesState.settings.mainTitle)
  if (normalizeSpaces(customTitle)) {
    return {
      title: customTitle,
      subtitle: "",
    }
  }
  return {
    title: occasionMeta.heading || "זמני היום",
    subtitle: normalizeSpaces(occasionMeta.subheading || ""),
  }
}

function applyFixedLineOverrides(
  schedule,
  overrides = timesState.settings.fixedLineOverrides,
  hiddenIds = timesState.settings.hiddenFixedLineIds,
) {
  if (!Array.isArray(schedule) || !schedule.length) return []
  const normalizedOverrides = normalizeFixedLineOverrides(overrides)
  const hiddenSet = new Set(normalizeHiddenFixedLineIds(hiddenIds))
  return schedule
    .filter((entry) => !hiddenSet.has(entry.id))
    .map((entry) => {
      const override = normalizedOverrides[entry.id]
      if (!override) return entry
      return {
        ...entry,
        label: override.label || entry.label,
        time: override.time || entry.time,
      }
    })
}

function updateFixedLineOverride(lineId, nextPatch = {}) {
  const id = normalizeSpaces(lineId)
  if (!id) return
  const overrides = normalizeFixedLineOverrides(timesState.settings.fixedLineOverrides)
  const existing = overrides[id] || { label: "", time: "" }
  const next = {
    label: normalizeFixedLineField(nextPatch.label ?? existing.label, 80),
    time: normalizeFixedLineField(nextPatch.time ?? existing.time, 32),
  }
  if (!next.label && !next.time) {
    delete overrides[id]
  } else {
    overrides[id] = next
  }
  timesState.settings.fixedLineOverrides = overrides
}

function updateFixedLineVisibility(lineId, isVisible) {
  const id = normalizeSpaces(lineId)
  if (!id) return
  const hiddenSet = new Set(normalizeHiddenFixedLineIds(timesState.settings.hiddenFixedLineIds))
  if (isVisible) hiddenSet.delete(id)
  else hiddenSet.add(id)
  timesState.settings.hiddenFixedLineIds = [...hiddenSet].slice(0, 40)
}

function applyExtraLinesToSchedule(baseSchedule, extraLines = []) {
  if (!baseSchedule.length) return []
  const validExtraLines = normalizeExtraLines(extraLines).filter((line) => line.text)
  if (!validExtraLines.length) return [...baseSchedule]
  const validTargetIds = new Set(baseSchedule.map((entry) => entry.id))
  const fallbackTargetId = baseSchedule.at(-1)?.id || ""

  const grouped = validExtraLines.reduce((map, line, index) => {
    const key = validTargetIds.has(line.afterId) ? line.afterId : fallbackTargetId
    if (!map.has(key)) map.set(key, [])
    map.get(key).push({
      id: `extra-${index}`,
      label: line.text,
      time: "",
      primary: false,
      isExtra: true,
    })
    return map
  }, new Map())

  const result = []
  baseSchedule.forEach((entry) => {
    result.push(entry)
    const extras = grouped.get(entry.id) || []
    extras.forEach((line) => result.push(line))
  })

  return result
}

function buildHolidaySchedule(times, seasonLabel, occasionMeta = {}, calendarTimes = {}) {
  const sunset = getZmanDate(times, "sunset")
  if (!sunset) return []

  const candleLighting =
    calendarTimes.candleLighting ||
    getZmanDate(times, "candleLighting") ||
    addMinutes(sunset, -bneiBrakCandleOffsetMinutes)
  const tzeit =
    calendarTimes.havdalah ||
    getZmanDate(times, "tzeit85deg") ||
    getZmanDate(times, "tzeit7083deg") ||
    getZmanDate(times, "tzeit") ||
    addMinutes(sunset, 40)
  const sofZmanShma = getZmanDate(times, "sofZmanShma")
  const shacharit = seasonLabel === "קיץ" ? "09:30" : "09:00"
  const dafTime = normalizeTimeInput(timesState.settings.dafTime) || "18:00"
  const exitLabel = occasionMeta.exitLabel || "צאת החג"
  const baseSchedule = [
    { id: "candle_lighting", label: "הדלקת נרות", time: formatClockTime(candleLighting), primary: true },
    { id: "mincha_at_candle", label: "מנחה", time: formatClockTime(addMinutes(candleLighting, 10)) },
    { id: "arvit_after_sunset", label: "ערבית", time: "25 דק׳ לאחר השקיעה" },
    { id: "shacharit", label: "שחרית", time: shacharit, primary: true },
    { id: "sof_zman_shma", label: "זמן אחרון לקריאת שמע", time: sofZmanShma ? formatClockTime(sofZmanShma) : "—" },
    { id: "mincha_before_exit", label: "ערבית", time: formatClockTime(addMinutes(tzeit, -5)) },
    { id: exitLabel === "צאת שבת" ? "tzeit_shabbat" : "tzeit_chag", label: exitLabel, time: formatClockTime(tzeit), primary: true },
  ]

  if (timesState.settings.includeDaf) {
    baseSchedule.splice(4, 0, {
      id: "daf_yomi",
      label: "שיעור הדף היומי",
      time: dafTime,
    })
  }

  return baseSchedule
}

function renderTimesFixedLinesEditor(baseSchedule = timesState.fixedLineTemplate) {
  if (!timesFixedLinesList) return
  const rows = Array.isArray(baseSchedule) ? baseSchedule : []
  const overrides = normalizeFixedLineOverrides(timesState.settings.fixedLineOverrides)
  const hiddenSet = new Set(normalizeHiddenFixedLineIds(timesState.settings.hiddenFixedLineIds))

  if (!rows.length) {
    timesFixedLinesList.innerHTML = `<p class="compact-hint">לאחר טעינת זמני היום תוכל לערוך שורות קבועות.</p>`
    return
  }

  timesFixedLinesList.innerHTML = rows
    .map(
      (entry) => {
        const override = overrides[entry.id] || {}
        const labelValue = override.label || entry.label
        const timeValue = override.time || entry.time || ""
        const isVisible = !hiddenSet.has(entry.id)
        return `
        <div class="times-fixed-row${isVisible ? "" : " is-hidden"}" data-fixed-id="${escapeHtml(entry.id)}">
          <label class="times-fixed-toggle">
            <input
              type="checkbox"
              ${isVisible ? "checked" : ""}
              data-action="fixed-visible"
              data-fixed-id="${escapeHtml(entry.id)}"
            />
            <span>להציג</span>
          </label>
          <input
            class="times-fixed-label"
            type="text"
            value="${escapeHtml(labelValue)}"
            placeholder="טקסט שורה"
            data-action="fixed-label"
            data-fixed-id="${escapeHtml(entry.id)}"
            ${isVisible ? "" : "disabled"}
          />
          <input
            class="times-fixed-time"
            type="text"
            value="${escapeHtml(timeValue)}"
            placeholder="שעה"
            data-action="fixed-time"
            data-fixed-id="${escapeHtml(entry.id)}"
            ${isVisible ? "" : "disabled"}
          />
        </div>
      `
      },
    )
    .join("")
}

function renderTimesExtraLinesEditor(baseSchedule = timesState.baseSchedule) {
  if (!timesExtraLinesList) return
  const lines = normalizeExtraLines(timesState.settings.extraLines)
  const targets = (baseSchedule || []).map((entry) => ({
    id: entry.id,
    label: entry.label,
  }))

  if (!targets.length) {
    timesExtraLinesList.innerHTML = `<p class="compact-hint">לאחר טעינת זמני היום תוכל להוסיף שורות מותאמות.</p>`
    return
  }

  if (!lines.length) {
    timesExtraLinesList.innerHTML = `<p class="compact-hint">אין שורות נוספות כרגע.</p>`
    return
  }

  timesExtraLinesList.innerHTML = lines
    .map(
      (line, index) => `
        <div class="times-extra-row" data-extra-index="${index}">
          <input
            class="times-extra-text"
            type="text"
            value="${escapeHtml(line.text)}"
            placeholder="טקסט נוסף"
            data-action="extra-text"
            data-extra-index="${index}"
          />
          <select
            class="times-extra-after"
            data-action="extra-after"
            data-extra-index="${index}"
          >
            ${targets
              .map(
                (target) => `
                  <option value="${target.id}" ${target.id === line.afterId ? "selected" : ""}>
                    אחרי ${escapeHtml(target.label)}
                  </option>
                `,
              )
              .join("")}
          </select>
          <button
            class="ghost-button small-button"
            type="button"
            data-action="extra-remove"
            data-extra-index="${index}"
          >
            הסר
          </button>
        </div>
      `,
    )
    .join("")
}

function renderTimesSummary() {
  if (timesDateInput) timesDateInput.value = timesState.selectedDate
  if (timesMainTitleInput && document.activeElement !== timesMainTitleInput) {
    timesMainTitleInput.value = normalizeMainTitle(timesState.settings.mainTitle)
  }
  if (timesDafTimeInput) timesDafTimeInput.value = normalizeTimeInput(timesState.settings.dafTime) || "18:00"
  if (timesGreetingModeInput) timesGreetingModeInput.value = normalizeGreetingMode(timesState.settings.greetingMode)
  if (timesGreetingInput) {
    const occasionMeta = getTimesOccasionMeta()
    const effectiveGreeting = getEffectiveGreeting(occasionMeta)
    const customGreeting = normalizeGreetingInput(timesState.settings.greeting || "")
    if (document.activeElement !== timesGreetingInput) {
      timesGreetingInput.value =
        normalizeGreetingMode(timesState.settings.greetingMode) === "custom"
          ? customGreeting
          : effectiveGreeting
    }
    timesGreetingInput.disabled = normalizeGreetingMode(timesState.settings.greetingMode) !== "custom"
  }
  if (timesSeasonModeInput) timesSeasonModeInput.value = normalizeSeasonMode(timesState.settings.seasonMode)
  if (timesIncludeDafInput) timesIncludeDafInput.checked = timesState.settings.includeDaf !== false
  if (!timesSummaryEl) return

  if (timesState.loading) {
    timesSummaryEl.className = "times-summary empty-state"
    timesSummaryEl.innerHTML = "<p>טוען זמני שבת/חג...</p>"
    if (timesPosterPreview) timesPosterPreview.removeAttribute("src")
    renderTimesFixedLinesEditor([])
    renderTimesExtraLinesEditor([])
    return
  }

  if (timesState.error) {
    timesSummaryEl.className = "times-summary empty-state"
    timesSummaryEl.innerHTML = `<p>${escapeHtml(timesState.error)}</p>`
    if (timesPosterPreview) timesPosterPreview.removeAttribute("src")
    renderTimesFixedLinesEditor([])
    renderTimesExtraLinesEditor([])
    return
  }

  const hebrewDate = formatHebrewDateGematria(timesState.selectedDate)
  const gregorianDate = formatReadingDate(timesState.selectedDate)
  const occasionMeta = getTimesOccasionMeta()
  const heading = getEffectiveTimesHeading(occasionMeta)
  const greeting = getEffectiveGreeting(occasionMeta)

  timesSummaryEl.className = "times-summary"
  timesSummaryEl.innerHTML = `
    <article class="times-card">
      <div class="times-card-head">
        <h3>${escapeHtml(heading.title)}</h3>
        ${heading.subtitle ? `<p class="times-card-subtitle">${escapeHtml(heading.subtitle)}</p>` : ""}
      </div>
      <p class="times-card-date">${escapeHtml(hebrewDate)} · ${escapeHtml(gregorianDate)}</p>
      <div class="times-lines">
        ${timesState.schedule
          .map(
            (entry) => `
              <div class="times-line${entry.primary ? " is-primary" : ""}">
                <span>${escapeHtml(entry.label)}</span>
                ${entry.time ? `<strong>${escapeHtml(entry.time)}</strong>` : ""}
              </div>
            `,
          )
          .join("")}
      </div>
      <p class="times-greeting">${escapeHtml(greeting)}</p>
    </article>
  `
  renderTimesFixedLinesEditor(timesState.fixedLineTemplate)
  renderTimesExtraLinesEditor(timesState.baseSchedule)
  renderTimesPosterImage()
}

function roundedRectPath(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + safeRadius, y)
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius)
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius)
  ctx.arcTo(x, y + height, x, y, safeRadius)
  ctx.arcTo(x, y, x + width, y, safeRadius)
  ctx.closePath()
}

function drawWrappedRtlText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = normalizeSpaces(text).split(" ").filter(Boolean)
  if (!words.length) return y

  let line = ""
  let currentY = y

  words.forEach((word, index) => {
    const testLine = line ? `${line} ${word}` : word
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY)
      currentY += lineHeight
      line = word
    } else {
      line = testLine
    }

    if (index === words.length - 1 && line) {
      ctx.fillText(line, x, currentY)
      currentY += lineHeight
    }
  })

  return currentY
}

function getPosterLogoImage() {
  if (posterLogoImage) return Promise.resolve(posterLogoImage)

  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      posterLogoImage = image
      resolve(image)
    }
    image.onerror = reject
    image.src = "./assets/goldmann-logo.png"
  })
}

async function renderTimesPosterImage() {
  if (!timesPosterCanvas || !timesPosterPreview) return
  if (timesState.loading || timesState.error || !timesState.schedule.length) return

  const canvas = timesPosterCanvas
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height

  const backgroundGradient = ctx.createLinearGradient(0, 0, 0, height)
  backgroundGradient.addColorStop(0, "#fbf6eb")
  backgroundGradient.addColorStop(1, "#ebdfc3")
  ctx.fillStyle = backgroundGradient
  ctx.fillRect(0, 0, width, height)

  const glow = ctx.createRadialGradient(width * 0.25, 0, 40, width * 0.25, 0, width * 0.8)
  glow.addColorStop(0, "rgba(126, 63, 40, 0.18)")
  glow.addColorStop(1, "rgba(126, 63, 40, 0)")
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height)

  ctx.shadowColor = "rgba(69, 47, 30, 0.12)"
  ctx.shadowBlur = 42
  ctx.shadowOffsetY = 10
  roundedRectPath(ctx, 56, 56, width - 112, height - 112, 34)
  ctx.fillStyle = "rgba(255, 252, 245, 0.96)"
  ctx.fill()
  ctx.shadowColor = "transparent"

  try {
    const logo = await getPosterLogoImage()
    const logoX = 92
    const logoY = height - 262
    const logoSize = 170
    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)
  } catch {}

  const occasionMeta = getTimesOccasionMeta()
  const heading = getEffectiveTimesHeading(occasionMeta)

  ctx.direction = "rtl"
  ctx.textAlign = "right"
  ctx.fillStyle = "#2e2418"
  ctx.font = '700 64px "Frank Ruhl Libre", serif'
  let headingBottom = drawWrappedRtlText(ctx, heading.title, width - 96, 146, width - 290, 72)

  if (heading.subtitle) {
    ctx.fillStyle = "#5f2817"
    ctx.font = '700 54px "Frank Ruhl Libre", serif'
    headingBottom = drawWrappedRtlText(ctx, heading.subtitle, width - 96, headingBottom + 28, width - 290, 62)
  }

  ctx.fillStyle = "#5f2817"
  ctx.font = '700 34px "Heebo", sans-serif'
  const dateLineBottom = drawWrappedRtlText(
    ctx,
    formatHebrewDateGematria(timesState.selectedDate),
    width - 96,
    headingBottom + 40,
    width - 170,
    40,
  )

  let y = dateLineBottom + 42
  timesState.schedule.forEach((entry) => {
    ctx.fillStyle = "#2e2418"
    ctx.font = entry.primary ? '800 52px "Heebo", sans-serif' : '700 44px "Heebo", sans-serif'
    const lineText = entry.time ? `${entry.label}: ${entry.time}` : entry.label
    y = drawWrappedRtlText(ctx, lineText, width - 96, y, width - 170, 56)
    y += 10
  })

  ctx.fillStyle = "#5f2817"
  ctx.font = '700 52px "Frank Ruhl Libre", serif'
  drawWrappedRtlText(
    ctx,
    getEffectiveGreeting(getTimesOccasionMeta()),
    width - 96,
    Math.min(height - 160, y + 46),
    width - 180,
    58,
  )

  if (posterPreviewUrl) {
    URL.revokeObjectURL(posterPreviewUrl)
    posterPreviewUrl = ""
  }

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"))
  if (!blob) return
  posterPreviewUrl = URL.createObjectURL(blob)
  timesPosterPreview.src = posterPreviewUrl
}

function getPosterBlob() {
  if (!timesPosterCanvas) return Promise.resolve(null)
  return new Promise((resolve) => {
    timesPosterCanvas.toBlob((blob) => resolve(blob || null), "image/png")
  })
}

async function shareTimesPosterImage(blob) {
  if (!blob || !navigator.share) return false
  try {
    const file = new File([blob], `zmanim-${timesState.selectedDate}.png`, { type: "image/png" })
    if (navigator.canShare && !navigator.canShare({ files: [file] })) return false
    await navigator.share({
      title: "זמני שבת/חג",
      files: [file],
    })
    return true
  } catch {
    return false
  }
}

function openTimesPosterPreviewForManualCopy(blob) {
  if (!blob) return
  const url = URL.createObjectURL(blob)
  window.open(url, "_blank", "noopener,noreferrer")
  setTimeout(() => URL.revokeObjectURL(url), 45000)
}

async function copyTimesPosterImage() {
  if (!timesState.schedule.length) return
  await renderTimesPosterImage()
  const blob = await getPosterBlob()
  if (!blob) return

  if (!navigator.clipboard || typeof window.ClipboardItem === "undefined") {
    const shared = await shareTimesPosterImage(blob)
    if (shared) {
      setTimesCopyStatus("נפתח חלון שיתוף למכשיר.", "success")
      return
    }
    openTimesPosterPreviewForManualCopy(blob)
    setTimesCopyStatus("נפתחה תמונה ללחיצה ארוכה והעתקה.", "success")
    return
  }

  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
    setTimesCopyStatus("התמונה הועתקה ללוח.", "success")
  } catch {
    const shared = await shareTimesPosterImage(blob)
    if (shared) {
      setTimesCopyStatus("נפתח חלון שיתוף למכשיר.", "success")
      return
    }
    openTimesPosterPreviewForManualCopy(blob)
    setTimesCopyStatus("לא התאפשרה העתקה ישירה. נפתחה תמונה ללחיצה ארוכה.", "error")
  }
}

async function downloadTimesPosterImage() {
  if (!timesState.schedule.length) return
  await renderTimesPosterImage()
  const blob = await getPosterBlob()
  if (!blob) return

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `zmanim-${timesState.selectedDate}.png`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
  setTimesCopyStatus("התמונה ירדה כ־PNG.", "success")
}

function getTimesDateQueryValue(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) ? value : getIsraelDateString()
}

async function loadHolidayTimes(dateString = timesState.selectedDate) {
  timesState.selectedDate = getTimesDateQueryValue(dateString)
  timesState.loading = true
  timesState.error = ""
  renderTimesSummary()

  try {
    const response = await fetchWithTimeout(
      `https://www.hebcal.com/zmanim?cfg=json&geonameid=${bneiBrakGeoNameId}&date=${timesState.selectedDate}`,
    )
    if (!response.ok) throw new Error("לא הצלחתי לטעון זמני היום.")
    const payload = await response.json()
    const seasonLabel = resolveSeasonLabel(timesState.selectedDate)

    const readingMeta = getTimesReadingMeta(timesState.selectedDate) || await fetchTimesReadingMeta(timesState.selectedDate)
    timesState.readingName = readingMeta?.name || ""
    timesState.readingTypeLabel = readingMeta?.typeLabel || ""
    const occasionMeta = getTimesOccasionMeta({
      dateString: timesState.selectedDate,
      readingName: timesState.readingName,
      readingTypeLabel: timesState.readingTypeLabel,
    })
    timesState.rawTimes = payload?.times || {}
    const calendarTimes = await fetchCalendarCandleTimes(timesState.selectedDate)
    timesState.calendarTimes = calendarTimes
    const generatedSchedule = buildHolidaySchedule(timesState.rawTimes, seasonLabel, occasionMeta, timesState.calendarTimes)
    timesState.fixedLineTemplate = generatedSchedule
    timesState.baseSchedule = applyFixedLineOverrides(
      timesState.fixedLineTemplate,
      timesState.settings.fixedLineOverrides,
      timesState.settings.hiddenFixedLineIds,
    )
    if (!timesState.baseSchedule.length) throw new Error("חסר מידע זמנים לתאריך הזה.")
    const schedule = applyExtraLinesToSchedule(timesState.baseSchedule, timesState.settings.extraLines)
    timesState.seasonLabel = seasonLabel
    timesState.schedule = schedule
  } catch (error) {
    timesState.error = error.message || "לא הצלחתי לחשב זמני שבת/חג."
    timesState.rawTimes = null
    timesState.calendarTimes = { candleLighting: null, havdalah: null }
    timesState.fixedLineTemplate = []
    timesState.baseSchedule = []
    timesState.schedule = []
  } finally {
    timesState.loading = false
    renderTimesSummary()
  }
}

function refreshTimesScheduleFromBase() {
  if (!timesState.baseSchedule.length) return
  timesState.schedule = applyExtraLinesToSchedule(timesState.baseSchedule, timesState.settings.extraLines)
}

function rebuildTimesScheduleLocally() {
  if (!timesState.rawTimes) return false
  const occasionMeta = getTimesOccasionMeta({
    dateString: timesState.selectedDate,
    readingName: timesState.readingName,
    readingTypeLabel: timesState.readingTypeLabel,
  })
  const seasonLabel = resolveSeasonLabel(timesState.selectedDate)
  timesState.seasonLabel = seasonLabel
  const generatedSchedule = buildHolidaySchedule(
    timesState.rawTimes,
    seasonLabel,
    occasionMeta,
    timesState.calendarTimes,
  )
  timesState.fixedLineTemplate = generatedSchedule
  timesState.baseSchedule = applyFixedLineOverrides(
    timesState.fixedLineTemplate,
    timesState.settings.fixedLineOverrides,
    timesState.settings.hiddenFixedLineIds,
  )
  refreshTimesScheduleFromBase()
  renderTimesSummary()
  return true
}

function normalizeHebcalBook(bookName) {
  return bookAliases[normalizeKey(bookName)] || null
}

function isTorahBook(bookName) {
  const normalized = normalizeHebcalBook(bookName)
  return normalized ? torahBooks.has(normalized) : false
}

function formatReadingInputValue(role, reading) {
  const prefix = role === "previous" ? "קריאה קודמת" : "קריאה הבאה"
  return `${prefix}: ${reading.name}`
}

function formatVerseReferenceLabel(verse) {
  const parashahLabel = verse.parashah ? ` (${verse.parashah})` : ""
  return `${verse.book} ${verse.chapter}:${verse.verse}${parashahLabel}`
}

function getCalendarRange(today) {
  const monthsBack = 1
  const monthsForward = 13

  const start = new Date(`${today}T00:00:00Z`)
  start.setUTCDate(1)
  start.setUTCMonth(start.getUTCMonth() - monthsBack)

  const end = new Date(`${today}T00:00:00Z`)
  end.setUTCDate(1)
  end.setUTCMonth(end.getUTCMonth() + monthsForward)
  end.setUTCDate(0)

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

function getMonthKey(isoDate) {
  return isoDate.slice(0, 7)
}

function getMonthStart(isoDate) {
  return `${getMonthKey(isoDate)}-01`
}

function addMonthsToDate(isoDate, months) {
  const date = new Date(`${getMonthStart(isoDate)}T00:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + months)
  return date.toISOString().slice(0, 10)
}

function getMonthTitle(isoDate) {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: israelTimeZone,
    month: "long",
    year: "numeric",
  }).format(new Date(`${getMonthStart(isoDate)}T00:00:00Z`))
}

function getDaysInMonth(isoDate) {
  const date = new Date(`${getMonthStart(isoDate)}T00:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + 1)
  date.setUTCDate(0)
  return date.getUTCDate()
}

function getWeekdayIndex(isoDate) {
  return new Date(`${isoDate}T00:00:00Z`).getUTCDay()
}

function getDayNumber(isoDate) {
  return Number(isoDate.slice(8, 10))
}

function getMonthKeysInRange(startIso, endIso) {
  const keys = []
  let cursor = getMonthStart(startIso)
  const endKey = getMonthKey(endIso)

  while (getMonthKey(cursor) <= endKey) {
    keys.push(getMonthKey(cursor))
    cursor = addMonthsToDate(cursor, 1)
  }

  return keys
}

function getJournalMonthKeys() {
  if (!autoReadingsState.rangeStart || !autoReadingsState.rangeEnd) return []
  return getMonthKeysInRange(autoReadingsState.rangeStart, autoReadingsState.rangeEnd)
}

function getJournalMonthName(monthKey) {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: israelTimeZone,
    month: "long",
  }).format(new Date(`${monthKey}-01T00:00:00Z`))
}

function getJournalYears() {
  return [...new Set(getJournalMonthKeys().map((monthKey) => monthKey.slice(0, 4)))]
}

function getJournalMonthKeysForYear(year) {
  return getJournalMonthKeys().filter((monthKey) => monthKey.startsWith(`${year}-`))
}

function getReadingOnOrAfterDate(dateString) {
  return autoReadingsState.readings.find((reading) => reading.date >= dateString) || null
}

function getReadingFromDateQuery(query) {
  const isoDate = parseIsoDateFromQuery(query)
  if (isoDate) return getReadingByDate(isoDate) || getReadingOnOrAfterDate(isoDate)
  return getReadingFromHebrewPrefixQuery(query)
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
  ;["קריאה קודמת", "קריאה הבאה", "2026-04-11", "בראשית ג", "שמות כ", "במדבר כב ב", "עמודה 44", "והנחש היה ערום"].forEach((value) => {
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

function parseSummaryRangeText(summaryRangeText) {
  const value = normalizeSpaces(String(summaryRangeText || "").replace(/[–—]/g, "-"))
  if (!value) return null

  const match = value.match(/^(.+?)\s+(\d+):(\d+)(?:\s*-\s*(?:(\d+):)?(\d+))?$/u)
  if (!match) return null

  const [, bookName, startChapterRaw, startVerseRaw, endChapterRaw, endVerseRaw] = match
  const startChapter = parseHebrewNumber(startChapterRaw)
  const startVerse = parseHebrewNumber(startVerseRaw)
  const endChapter = endChapterRaw ? parseHebrewNumber(endChapterRaw) : startChapter
  const endVerse = endVerseRaw ? parseHebrewNumber(endVerseRaw) : startVerse

  if (!startChapter || !startVerse || !endChapter || !endVerse) return null
  return parseHebcalRange(bookName, `${startChapter}:${startVerse}`, `${endChapter}:${endVerse}`)
}

function getTorahRangesFromSummary(summary) {
  if (typeof summary !== "string") return []
  return summary
    .split(/\s*[;|]\s*/u)
    .map((part) => parseSummaryRangeText(part))
    .filter(Boolean)
}

function getTorahRangesFromSummaryParts(summaryParts = []) {
  if (!Array.isArray(summaryParts)) return []

  return summaryParts
    .map((part) => {
      if (typeof part === "string") return parseSummaryRangeText(part)
      if (!part || typeof part !== "object") return null
      return parseHebcalRange(part.k || part.book, part.b || part.begin || part.start, part.e || part.end)
    })
    .filter(Boolean)
}

function getTorahRangesFromKriyahEntries(kriyah = {}) {
  const aliyahRanges = Object.entries(kriyah)
    .sort((a, b) => getAliyahSortKey(a[0]) - getAliyahSortKey(b[0]))
    .map(([, aliyah]) => parseHebcalRange(aliyah.k, aliyah.b, aliyah.e))
    .filter(Boolean)

  if (!aliyahRanges.length) return []

  return aliyahRanges.reduce((groups, range) => {
    const last = groups.at(-1)
    if (!last || last.book !== range.book) {
      groups.push({
        book: range.book,
        start: { ...range.start },
        end: { ...range.end },
      })
      return groups
    }

    last.end = { ...range.end }
    return groups
  }, [])
}

function getTorahRangesFromHebcalItem(item) {
  const summaryPartRanges = getTorahRangesFromSummaryParts(item.summaryParts)
  if (summaryPartRanges.length) {
    return summaryPartRanges
  }

  const torahRanges = getTorahRangesFromSummary(item.torah)
  if (torahRanges.length) {
    return torahRanges
  }

  const summaryRanges = getTorahRangesFromSummary(item.summary)
  if (summaryRanges.length) {
    return summaryRanges
  }

  if (item.weekday) {
    const weekdayRanges = getTorahRangesFromKriyahEntries(item.weekday)
    if (weekdayRanges.length) return weekdayRanges
  }

  return getTorahRangesFromKriyahEntries(item.fullkriyah)
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

function getCalendarReadingLabel(item) {
  if (item.type === "holiday") return getHebcalReadingName(item)
  if (getWeekdayIndex(item.date) === 6) return getHebcalReadingName(item)
  return ""
}

function createReadingAnchor(verse) {
  return {
    refLabel: formatVerseReferenceLabel(verse),
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

function getSegmentLabel(index) {
  const labels = ["ספר ראשון", "ספר שני", "ספר שלישי", "ספר רביעי"]
  return labels[index] || `ספר ${index + 1}`
}

function buildSegmentLabels(segments) {
  const countsByBook = segments.reduce((counts, segment) => {
    counts.set(segment.book, (counts.get(segment.book) || 0) + 1)
    return counts
  }, new Map())

  return segments.map((segment) => ({
    ...segment,
    label:
      countsByBook.get(segment.book) > 1
        ? `${getSegmentLabel(segment.index)} · ${segment.rangeLabel}`
        : `${getSegmentLabel(segment.index)} · ${segment.book}`,
  }))
}

function createReadingSegment(range, index) {
  const startVerse = navigatorData.verseByKey.get(
    `${range.book}:${range.start.chapter}:${range.start.verse}`,
  )
  const endVerse = navigatorData.verseByKey.get(
    `${range.book}:${range.end.chapter}:${range.end.verse}`,
  )

  if (!startVerse || !endVerse) return null

  return {
    index,
    label: getSegmentLabel(index),
    book: range.book,
    rangeLabel: formatRangeSegment(range),
    allowedRanges: [range],
    start: createReadingAnchor(startVerse),
    end: createReadingAnchor(endVerse),
  }
}

function getSegmentScrollDiffs(sourceSegments = [], targetSegments = []) {
  const diffs = []
  const pairCount = Math.min(sourceSegments.length, targetSegments.length)

  for (let index = 0; index < pairCount; index += 1) {
    const source = sourceSegments[index]
    const target = targetSegments[index]
    if (!source || !target) continue

    diffs.push({
      index,
      label: target.label,
      selectorLabel: getSegmentLabel(target.index),
      sourceSegmentIndex: source.index,
      targetSegmentIndex: target.index,
      sourceLocationKey: "current",
      targetLocationKey: "target",
      sourceAnchor: source.end,
      targetAnchor: target.start,
      sourceAnchorLabel: `סוף ${source.label}`,
      targetAnchorLabel: `תחילת ${target.label}`,
      delta: target.start.columnFloat - source.end.columnFloat,
      contextLabel: `מול ${source.label} הקודם`,
    })
  }

  if (targetSegments.length > pairCount && targetSegments.length > 1) {
    const baseTarget = targetSegments[0]
    for (let index = pairCount; index < targetSegments.length; index += 1) {
      const target = targetSegments[index]
      if (!target || target.index === 0 || !baseTarget) continue

      diffs.push({
        index,
        label: target.label,
        selectorLabel: getSegmentLabel(target.index),
        sourceSegmentIndex: baseTarget.index,
        targetSegmentIndex: target.index,
        sourceLocationKey: "target",
        targetLocationKey: "target",
        sourceAnchor: baseTarget.end,
        targetAnchor: target.start,
        sourceAnchorLabel: `סוף ${baseTarget.label}`,
        targetAnchorLabel: `תחילת ${target.label}`,
        delta: target.start.columnFloat - baseTarget.end.columnFloat,
        contextLabel: `אחרי ${baseTarget.label} הבא`,
      })
    }
  }

  return diffs
}

function createScheduledReadingRecord(item) {
  const ranges = getTorahRangesFromHebcalItem(item)
  if (!ranges.length) return null

  const segments = buildSegmentLabels(
    ranges
    .map((group, index) => createReadingSegment(group, index))
    .filter(Boolean),
  )

  if (!segments.length) return null

  const firstSegment = segments[0]
  const lastSegment = segments.at(-1)

  return {
    date: item.date,
    displayDate: formatReadingDate(item.date),
    hebrewDate: formatHebrewDate(item.date),
    name: getHebcalReadingName(item),
    calendarLabel: getCalendarReadingLabel(item),
    typeLabel: getHebcalReadingTypeLabel(item),
    isWeekdayReading: Boolean(item.weekday),
    summary: item.summary || "",
    rangeLabel: ranges.map((range) => formatRangeSegment(range)).join(" | "),
    segments,
    start: firstSegment.start,
    end: lastSegment.end,
    previousReadingDate: "",
    previousReadingName: "",
    scrollFromPrevious: null,
    segmentScrollsFromPrevious: [],
  }
}

function hasSecondBook(reading) {
  return (reading?.segments?.length || 0) > 1
}

function getPreviousReadingsForTarget(targetReading, { includeWeekday = false } = {}) {
  return autoReadingsState.readings.filter((reading) => {
    if (reading.date >= targetReading.date) return false
    if (!includeWeekday && reading.isWeekdayReading) return false
    return true
  })
}

function getDefaultSourceForTarget(targetReading) {
  const candidates = getPreviousReadingsForTarget(targetReading, { includeWeekday: false })
  if (!candidates.length) return null

  let sourceReading = candidates.at(-1)
  if (hasSecondBook(targetReading) && !hasSecondBook(sourceReading)) {
    const latestWithSecondBook = [...candidates].reverse().find((reading) => hasSecondBook(reading))
    if (latestWithSecondBook) sourceReading = latestWithSecondBook
  }

  return sourceReading
}

function describeScrollDelta(delta) {
  const absDelta = Math.abs(delta)
  if (absDelta < 0.25) return "כמעט בלי גלילה"
  return `${formatNumber(absDelta, 1)} עמודות ${delta > 0 ? "קדימה" : "אחורה"}`
}

function enrichReadingsWithScroll(readings) {
  return readings.map((reading, index) => {
    if (index === 0) return reading
    const previousReading = readings[index - 1]
    return {
      ...reading,
      previousReadingDate: previousReading.date,
      previousReadingName: previousReading.name,
      scrollFromPrevious: reading.start.columnFloat - previousReading.end.columnFloat,
      segmentScrollsFromPrevious:
        previousReading.segments.length > 1 || reading.segments.length > 1
          ? getSegmentScrollDiffs(previousReading.segments, reading.segments)
          : [],
    }
  })
}

function getReadingByDate(dateString) {
  return autoReadingsState.readings.find((reading) => reading.date === dateString) || null
}

function getSelectedJournalReading() {
  return getReadingByDate(journalState.selectedDate)
}

function getReadingAnchorRole(fieldKey = "target") {
  return fieldKey === "current" ? "previous" : "next"
}

function getScheduledReadingFromQuery(query) {
  const value = normalizeSpaces(query)
  if (!value) return null
  const plusQuery = parsePlusQuery(value)
  const anchorQuery = plusQuery ? plusQuery.anchorQuery : value
  const datedReading = getReadingFromDateQuery(anchorQuery)
  if (datedReading) return datedReading
  const scheduledReadingKey = getScheduledReadingKey(anchorQuery)
  if (!scheduledReadingKey) return null
  return autoReadingsState[scheduledReadingKey] || null
}

function getSegmentPickerOptions(query) {
  const value = normalizeSpaces(query)
  if (!value || !value.includes("+")) return []
  const reading = getScheduledReadingFromQuery(value)
  return reading?.segments?.length > 1 ? reading.segments : []
}

function renderSegmentPicker(fieldKey) {
  const picker = fieldKey === "current" ? currentSegmentPicker : targetSegmentPicker
  const input = fieldKey === "current" ? currentInput : targetInput
  if (!picker || !input) return

  const options = getSegmentPickerOptions(input.value)
  if (!options.length) {
    picker.hidden = true
    picker.innerHTML = ""
    querySegmentState[fieldKey] = null
    return
  }

  if (!Number.isInteger(querySegmentState[fieldKey]) || querySegmentState[fieldKey] >= options.length) {
    querySegmentState[fieldKey] = 0
  }

  picker.hidden = false
  picker.innerHTML = options
    .map(
      (segment, index) => `
        <button
          class="segment-chip${querySegmentState[fieldKey] === index ? " is-active" : ""}"
          type="button"
          data-segment-field="${fieldKey}"
          data-segment-index="${index}"
        >
          ${segment.label}
        </button>
      `,
    )
    .join("")
}

function renderAllSegmentPickers() {
  renderSegmentPicker("current")
  renderSegmentPicker("target")
}

function renderReadingSegments(segments = []) {
  if (segments.length <= 1) return ""

  return `
    <div class="reading-segments">
      ${segments
        .map(
          (segment) => `
            <div class="reading-segment">
              <span>${segment.label}</span>
              <strong>${segment.start.refLabel} · עמודה ${segment.start.column}</strong>
              <strong>${segment.end.refLabel} · עמודה ${segment.end.column}</strong>
            </div>
          `,
        )
        .join("")}
    </div>
  `
}

function renderReadingSegmentDiffs(segmentDiffs = [], { activeIndex = -1 } = {}) {
  if (!segmentDiffs.length) return ""

  return `
    <div class="reading-segment-diffs">
      ${segmentDiffs
        .map(
          (segment, index) => `
            <div class="reading-segment-diff${index === activeIndex ? " is-active" : ""}">
              <span>${segment.label}</span>
              ${segment.contextLabel ? `<div class="reading-segment-context">${segment.contextLabel}</div>` : ""}
              <strong>${describeScrollDelta(segment.delta)}</strong>
            </div>
          `,
        )
        .join("")}
    </div>
  `
}

function getLocationSegmentDiffs(current, target) {
  const currentSegments = current?.readingSegments || []
  const targetSegments = target?.readingSegments || []
  if (currentSegments.length <= 1 && targetSegments.length <= 1) return []
  return getSegmentScrollDiffs(currentSegments, targetSegments)
}

function renderSplitSegmentSelector(segmentDiffs = [], activeIndex = 0) {
  if (segmentDiffs.length <= 1) return ""

  return `
    <div class="split-segment-picker">
      <div class="split-segment-label">בחר ספר להשוואה</div>
      <div class="split-segment-selector" role="radiogroup" aria-label="בחירת ספר">
        ${segmentDiffs
          .map(
            (segment, index) => `
              <button
                class="segment-chip${index === activeIndex ? " is-active" : ""}"
                type="button"
                role="radio"
                aria-checked="${index === activeIndex ? "true" : "false"}"
                data-action="select-split-segment"
                data-split-index="${index}"
              >
                ${segment.selectorLabel || segment.label}
              </button>
            `,
          )
          .join("")}
      </div>
    </div>
  `
}

function createAnchoredLocation(baseLocation, anchor, { label = "", segmentIndex = null } = {}) {
  if (!baseLocation || !anchor) return baseLocation

  const hasSegmentIndex = Number.isInteger(segmentIndex)
  const selectedSegment =
    hasSegmentIndex && Array.isArray(baseLocation.readingSegments)
      ? baseLocation.readingSegments[segmentIndex] || null
      : null

  return {
    ...baseLocation,
    label: label || baseLocation.label,
    columnFloat: anchor.columnFloat,
    column: anchor.column,
    lineFloat: anchor.lineFloat,
    exact: anchor.exact,
    anchorLabel: label || baseLocation.anchorLabel || "",
    selectedSegmentIndex: hasSegmentIndex ? segmentIndex : baseLocation.selectedSegmentIndex,
    selectedSegmentLabel: selectedSegment?.label || baseLocation.selectedSegmentLabel || "",
    segmentRangeLabel: selectedSegment?.rangeLabel || baseLocation.segmentRangeLabel || "",
    segmentStartRef: selectedSegment?.start?.refLabel || baseLocation.segmentStartRef,
    segmentStartColumn: selectedSegment?.start?.column || baseLocation.segmentStartColumn,
    segmentEndRef: selectedSegment?.end?.refLabel || baseLocation.segmentEndRef,
    segmentEndColumn: selectedSegment?.end?.column || baseLocation.segmentEndColumn,
    anchorContext: baseLocation.anchorContext
      ? {
          ...baseLocation.anchorContext,
          columnFloat: anchor.columnFloat,
          book: selectedSegment?.book || baseLocation.anchorContext.book,
          chapter: selectedSegment?.start?.chapter || baseLocation.anchorContext.chapter,
          parashahKey: selectedSegment?.start?.parashahKey || baseLocation.anchorContext.parashahKey,
          restrictSearchToRange:
            selectedSegment?.allowedRanges?.length > 0
              ? true
              : baseLocation.anchorContext.restrictSearchToRange,
          allowedRanges:
            selectedSegment?.allowedRanges?.length > 0
              ? selectedSegment.allowedRanges
              : baseLocation.anchorContext.allowedRanges,
        }
      : baseLocation.anchorContext,
  }
}

function getComparisonLocationsForSegment(current, target, segmentDiff) {
  if (!segmentDiff) {
    return {
      sourceLocation: current,
      targetLocation: target,
    }
  }

  const sourceBase = segmentDiff.sourceLocationKey === "target" ? target : current
  const targetBase = segmentDiff.targetLocationKey === "current" ? current : target

  return {
    sourceLocation: createAnchoredLocation(sourceBase, segmentDiff.sourceAnchor, {
      label: segmentDiff.sourceAnchorLabel,
      segmentIndex: segmentDiff.sourceSegmentIndex,
    }),
    targetLocation: createAnchoredLocation(targetBase, segmentDiff.targetAnchor, {
      label: segmentDiff.targetAnchorLabel,
      segmentIndex: segmentDiff.targetSegmentIndex,
    }),
  }
}

function getNearestReadingsForDate(dateString) {
  const readings = autoReadingsState.readings || []
  return {
    previous: readings.filter((reading) => reading.date < dateString).at(-1) || null,
    next: readings.find((reading) => reading.date > dateString) || null,
  }
}

function renderJournalSummary() {
  if (!journalSummaryEl) return

  if (autoReadingsState.loading) {
    journalSummaryEl.className = "journal-summary empty-state"
    journalSummaryEl.innerHTML = "<p>טוען יומן...</p>"
    return
  }

  if (autoReadingsState.error) {
    journalSummaryEl.className = "journal-summary empty-state"
    journalSummaryEl.innerHTML = "<p>לא הצלחתי לטעון את יומן הקריאות.</p>"
    return
  }

  const reading = getSelectedJournalReading()
  if (!reading) {
    const selectedDate = journalState.selectedDate
    const displayDate = selectedDate ? formatReadingDate(selectedDate) : ""
    const nearby = selectedDate ? getNearestReadingsForDate(selectedDate) : { previous: null, next: null }

    journalSummaryEl.className = "journal-summary empty-state"
    journalSummaryEl.innerHTML = `
      <article class="journal-summary-card">
        <div class="journal-summary-head">
          <h3>${displayDate ? `אין קריאה ב־${escapeHtml(displayDate)}` : "בחר יום"}</h3>
        </div>
        <div class="journal-summary-grid">
          <div class="journal-stat">
            <span>קריאה קודמת</span>
            <strong>${nearby.previous ? `${escapeHtml(nearby.previous.name)} · ${escapeHtml(nearby.previous.displayDate)}` : "אין"}</strong>
          </div>
          <div class="journal-stat">
            <span>קריאה הבאה</span>
            <strong>${nearby.next ? `${escapeHtml(nearby.next.name)} · ${escapeHtml(nearby.next.displayDate)}` : "אין"}</strong>
          </div>
        </div>
      </article>
    `
    return
  }

  const scrollLabel =
    reading.scrollFromPrevious === null
      ? "זו הקריאה הראשונה בטווח"
      : describeScrollDelta(reading.scrollFromPrevious)
  const hasSplitScroll = reading.segmentScrollsFromPrevious.length > 0

  journalSummaryEl.className = "journal-summary"
  journalSummaryEl.innerHTML = `
    <article class="journal-summary-card">
      <div class="journal-summary-head">
        <h3>${escapeHtml(reading.name)}</h3>
        <div class="journal-summary-date">${escapeHtml(reading.displayDate)}</div>
      </div>
      ${
        hasSplitScroll
          ? renderReadingSegmentDiffs(reading.segmentScrollsFromPrevious)
          : `<div class="journal-scroll">${escapeHtml(scrollLabel)}</div>`
      }
      <div class="journal-summary-grid">
        <div class="journal-stat">
          <span>תחילת הקריאה</span>
          <strong>${escapeHtml(reading.start.refLabel)} · עמודה ${reading.start.column}</strong>
        </div>
        <div class="journal-stat">
          <span>סוף הקריאה</span>
          <strong>${escapeHtml(reading.end.refLabel)} · עמודה ${reading.end.column}</strong>
        </div>
        <div class="journal-stat">
          <span>מהקריאה שלפניה</span>
          <strong>${reading.previousReadingName ? `${escapeHtml(reading.previousReadingName)} · ${escapeHtml(reading.previousReadingDate)}` : "אין קודמת בטווח"}</strong>
        </div>
        <div class="journal-stat">
          <span>טווח</span>
          <strong>${escapeHtml(reading.rangeLabel)}</strong>
        </div>
      </div>
      ${renderReadingSegments(reading.segments)}
    </article>
  `
}

function renderJournalMonths() {
  if (!journalMonthsEl) return

  if (autoReadingsState.loading) {
    journalMonthsEl.className = "journal-months empty-state"
    journalMonthsEl.innerHTML = "<p>טוען חודשים...</p>"
    return
  }

  const readings = autoReadingsState.readings || []
  if (!readings.length) {
    journalMonthsEl.className = "journal-months empty-state"
    journalMonthsEl.innerHTML = "<p>אין כרגע נתוני יומן.</p>"
    return
  }

  const readingMap = new Map(readings.map((reading) => [reading.date, reading]))
  const weekdayLabels = ["א", "ב", "ג", "ד", "ה", "ו", "ש"]

  const monthKeys = getJournalMonthKeys()
  if (!monthKeys.length) {
    journalMonthsEl.className = "journal-months empty-state"
    journalMonthsEl.innerHTML = "<p>אין כרגע חודשים זמינים.</p>"
    return
  }

  if (!monthKeys.includes(journalState.visibleMonthKey)) {
    journalState.visibleMonthKey =
      getMonthKey(journalState.selectedDate || autoReadingsState.next?.date || autoReadingsState.today || monthKeys[0])
  }

  const monthKey = monthKeys.includes(journalState.visibleMonthKey) ? journalState.visibleMonthKey : monthKeys[0]
  const monthStart = `${monthKey}-01`
  const firstWeekday = getWeekdayIndex(monthStart)
  const daysInMonth = getDaysInMonth(monthStart)
  const cells = []

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push('<div class="journal-day-empty"></div>')
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const isoDate = `${monthKey}-${String(day).padStart(2, "0")}`
    const reading = readingMap.get(isoDate)
    const isSelected = journalState.selectedDate === isoDate
    const isToday = autoReadingsState.today === isoDate
    const label = reading?.calendarLabel || ""
    const hebrewDate = formatHebrewDay(isoDate)

    cells.push(`
      <button
        class="journal-day${reading ? " is-reading" : " is-disabled"}${label ? " has-label" : ""}${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}"
        type="button"
        data-journal-date="${isoDate}"
        data-has-reading="${reading ? "true" : "false"}"
      >
        <div class="journal-day-number">${day}</div>
        <div class="journal-day-hebrew">${escapeHtml(hebrewDate)}</div>
        ${label ? `<div class="journal-day-label">${escapeHtml(label)}</div>` : ""}
        ${reading && !label ? `<div class="journal-day-dot"></div>` : ""}
      </button>
    `)
  }

  journalMonthsEl.className = "journal-months"
  journalMonthsEl.innerHTML = `
    <section class="journal-month">
      <h3>${escapeHtml(getMonthTitle(monthStart))}</h3>
      <div class="journal-weekdays">
        ${weekdayLabels.map((label) => `<span>${label}</span>`).join("")}
      </div>
      <div class="journal-days">${cells.join("")}</div>
    </section>
  `
}

function renderJournalControls() {
  if (!journalMonthSelect || !journalYearSelect) return

  const monthKeys = getJournalMonthKeys()
  if (!monthKeys.length) {
    journalMonthSelect.innerHTML = ""
    journalYearSelect.innerHTML = ""
    journalMonthSelect.disabled = true
    journalYearSelect.disabled = true
    if (journalPrevMonthButton) journalPrevMonthButton.disabled = true
    if (journalNextMonthButton) journalNextMonthButton.disabled = true
    return
  }

  const visibleMonth = monthKeys.includes(journalState.visibleMonthKey) ? journalState.visibleMonthKey : monthKeys[0]
  const visibleYear = visibleMonth.slice(0, 4)
  const monthsForYear = getJournalMonthKeysForYear(visibleYear)
  const visibleMonthNumber = visibleMonth.slice(5, 7)

  journalYearSelect.disabled = false
  journalMonthSelect.disabled = false
  journalYearSelect.innerHTML = getJournalYears()
    .map((year) => `<option value="${year}">${year}</option>`)
    .join("")
  journalMonthSelect.innerHTML = monthsForYear
    .map((monthKey) => `<option value="${monthKey.slice(5, 7)}">${escapeHtml(getJournalMonthName(monthKey))}</option>`)
    .join("")

  journalYearSelect.value = visibleYear
  journalMonthSelect.value = visibleMonthNumber

  const monthIndex = monthKeys.indexOf(visibleMonth)
  if (journalPrevMonthButton) journalPrevMonthButton.disabled = monthIndex <= 0
  if (journalNextMonthButton) journalNextMonthButton.disabled = monthIndex === -1 || monthIndex >= monthKeys.length - 1
}

function renderJournal() {
  renderJournalControls()
  renderJournalSummary()
  renderJournalMonths()
}

function setJournalDate(dateString) {
  if (!dateString || journalState.selectedDate === dateString) return
  journalState.selectedDate = dateString
  journalState.visibleMonthKey = getMonthKey(dateString)
  renderJournal()
}

function setJournalVisibleMonth(monthKey) {
  if (!monthKey || journalState.visibleMonthKey === monthKey) return
  journalState.visibleMonthKey = monthKey
  if (!journalState.selectedDate.startsWith(monthKey)) {
    const firstReadingInMonth =
      autoReadingsState.readings.find((reading) => reading.date.startsWith(monthKey))?.date || `${monthKey}-01`
    journalState.selectedDate = firstReadingInMonth
  }
  renderJournal()
}

function openCalendarModal(fieldKey = "target") {
  const normalizedFieldKey =
    fieldKey === "current" || fieldKey === "target" || fieldKey === "times"
      ? fieldKey
      : "target"
  journalState.fieldKey = normalizedFieldKey
  const fieldInput =
    journalState.fieldKey === "current"
      ? currentInput
      : journalState.fieldKey === "target"
        ? targetInput
        : null
  const fallbackReading =
    journalState.fieldKey === "current"
      ? autoReadingsState.previous || autoReadingsState.next
      : journalState.fieldKey === "target"
        ? autoReadingsState.next || autoReadingsState.previous
        : getReadingByDate(timesState.selectedDate) || autoReadingsState.next || autoReadingsState.previous
  const selectedReading = fieldInput ? getScheduledReadingFromQuery(fieldInput.value) || fallbackReading : fallbackReading
  const targetDate =
    (fieldInput ? parseIsoDateFromQuery(fieldInput.value) : "") ||
    selectedReading?.date ||
    (journalState.fieldKey === "times" ? timesState.selectedDate : "") ||
    journalState.selectedDate ||
    autoReadingsState.today
  journalState.selectedDate = targetDate
  journalState.visibleMonthKey = getMonthKey(targetDate)
  if (calendarTitleEl && calendarSubtitleEl) {
    if (journalState.fieldKey === "times") {
      calendarTitleEl.textContent = "בחר תאריך לזמני שבת/חג"
      calendarSubtitleEl.textContent = "בחירת יום תעדכן את זמני היום ותזהה שבת/חג לפי הקריאה."
    } else {
      calendarTitleEl.textContent = "בחר תאריך יעד"
      calendarSubtitleEl.textContent = "בחירת יום תמלא יעד ומקור. אם אין קריאה באותו יום, נבחרת הקריאה הקרובה שאחריו."
    }
  }
  journalState.open = true
  calendarModal.hidden = false
  document.body.style.overflow = "hidden"
  renderJournal()
}

function closeCalendarModal() {
  journalState.open = false
  calendarModal.hidden = true
  document.body.style.overflow = ""
}

function applyJournalReading(dateString) {
  const selectedReading = getReadingFromDateQuery(dateString)

  if (journalState.fieldKey === "times") {
    closeCalendarModal()
    loadHolidayTimes(dateString)
    return
  }

  if (!selectedReading) return

  if (journalState.fieldKey === "current") {
    const nextReading = autoReadingsState.readings.find((reading) => reading.date > selectedReading.date) || null

    currentInput.value = formatReadingDateInputValue(selectedReading)
    querySegmentState.current = null
    renderSegmentPicker("current")

    if (nextReading) {
      targetInput.value = formatReadingDateInputValue(nextReading)
    } else {
      targetInput.value = ""
    }
    querySegmentState.target = null
    renderSegmentPicker("target")
  } else {
    const previousReading = getDefaultSourceForTarget(selectedReading)

    targetInput.value = formatReadingDateInputValue(selectedReading)
    querySegmentState.target = null
    renderSegmentPicker("target")

    if (previousReading) {
      currentInput.value = formatReadingDateInputValue(previousReading)
    } else {
      currentInput.value = ""
    }
    querySegmentState.current = null
    renderSegmentPicker("current")
  }

  closeCalendarModal()
  runSearch({ live: true })
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

function createScheduledReadingLocation(reading, role, rawQuery = "", { fieldKey = "" } = {}) {
  const selectedSegmentIndex = Number.isInteger(querySegmentState[fieldKey]) ? querySegmentState[fieldKey] : null
  const anchor = role === "previous" ? reading.end : reading.start
  const anchorLabel = role === "previous" ? "סוף הקריאה" : "תחילת הקריאה"
  const selectedSegment =
    selectedSegmentIndex !== null && reading.segments?.[selectedSegmentIndex]
      ? reading.segments[selectedSegmentIndex]
      : null
  const allowedRanges = selectedSegment
    ? selectedSegment.allowedRanges
    : reading.segments.flatMap((segment) => segment.allowedRanges || [])

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
    readingHebrewDate: reading.hebrewDate,
    readingStartRef: reading.start.refLabel,
    readingStartColumn: reading.start.column,
    readingEndRef: reading.end.refLabel,
    readingEndColumn: reading.end.column,
    readingSegments: reading.segments,
    readingSegmentScrollsFromPrevious: reading.segmentScrollsFromPrevious,
    selectedSegmentIndex,
    selectedSegmentLabel: selectedSegment?.label || "",
    anchorContext: {
      columnFloat: selectedSegment ? (role === "previous" ? selectedSegment.end.columnFloat : selectedSegment.start.columnFloat) : anchor.columnFloat,
      book: selectedSegment ? selectedSegment.book : anchor.book,
      chapter: selectedSegment ? selectedSegment.start.chapter : anchor.chapter,
      parashahKey: selectedSegment ? selectedSegment.start.parashahKey : anchor.parashahKey,
      restrictSearchToRange: allowedRanges.length > 0,
      allowedRanges,
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
        <strong>קודמת: ${escapeHtml(autoReadingsState.previous.name)}</strong>
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

  renderAllSegmentPickers()
  if (changed) runSearch({ live: true })
}

function getHebcalItemKey(item) {
  const nameToken =
    typeof item?.name === "string"
      ? item.name
      : item?.name?.he || item?.name?.en || ""
  return `${item?.date || ""}|${item?.type || ""}|${nameToken}|${item?.summary || ""}`
}

async function fetchLeyningItemsInChunks(start, end) {
  const chunkDays = 170
  const items = []
  const sourceUrls = []
  const seenKeys = new Set()
  let cursor = start

  while (cursor <= end) {
    const nextChunkEnd = addDaysToIsoDate(cursor, chunkDays)
    const chunkEnd = nextChunkEnd < end ? nextChunkEnd : end
    const sourceUrl = `https://www.hebcal.com/leyning?cfg=json&start=${cursor}&end=${chunkEnd}&i=on&triennial=off`
    sourceUrls.push(sourceUrl)

    const response = await fetchWithTimeout(sourceUrl)
    if (!response.ok) throw new Error(`Hebcal HTTP ${response.status}`)

    const payload = await response.json()
    const chunkItems = Array.isArray(payload.items) ? payload.items : []
    chunkItems.forEach((item) => {
      const key = getHebcalItemKey(item)
      if (seenKeys.has(key)) return
      seenKeys.add(key)
      items.push(item)
    })

    if (chunkEnd >= end) break
    cursor = addDaysToIsoDate(chunkEnd, 1)
  }

  return { items, sourceUrls }
}

async function loadAutoReadings() {
  autoReadingsState.loading = true
  autoReadingsState.error = ""
  renderReadingDefaults()
  renderJournal()

  try {
    const today = getIsraelDateString()
    const { start, end } = getCalendarRange(today)
    const { items, sourceUrls } = await fetchLeyningItemsInChunks(start, end)
    const readings = enrichReadingsWithScroll(
      items
      .map((item) => createScheduledReadingRecord(item))
      .filter(Boolean)
      .sort((a, b) => a.date.localeCompare(b.date)),
    )

    autoReadingsState.readings = readings
    autoReadingsState.previous = readings.filter((reading) => reading.date <= today).at(-1) || null
    autoReadingsState.next = readings.find((reading) => reading.date > today) || null
    autoReadingsState.today = today
    autoReadingsState.rangeStart = start
    autoReadingsState.rangeEnd = end
    autoReadingsState.sourceUrl = sourceUrls[0] || ""
    journalState.selectedDate =
      getReadingByDate(journalState.selectedDate)?.date ||
      autoReadingsState.next?.date ||
      autoReadingsState.previous?.date ||
      today
    journalState.visibleMonthKey = getMonthKey(journalState.selectedDate)
  } catch (error) {
    autoReadingsState.readings = []
    autoReadingsState.previous = null
    autoReadingsState.next = null
    autoReadingsState.rangeStart = ""
    autoReadingsState.rangeEnd = ""
    autoReadingsState.error = error.message
    console.error(error)
  } finally {
    autoReadingsState.loading = false
    renderReadingDefaults()
    renderJournal()
    const timesReadingMeta = getTimesReadingMeta(timesState.selectedDate)
    if (timesReadingMeta && !timesState.loading) {
      timesState.readingName = timesReadingMeta.name
      timesState.readingTypeLabel = timesReadingMeta.typeLabel
      renderTimesSummary()
    }
    if (getScheduledReadingFromQuery(currentInput.value) || getScheduledReadingFromQuery(targetInput.value)) {
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

function compareRefPosition(chapterA, verseA, chapterB, verseB) {
  if (chapterA !== chapterB) return chapterA - chapterB
  return verseA - verseB
}

function isMatchWithinAllowedRange(match, range) {
  if (match.book !== range.book) return false
  return (
    compareRefPosition(match.chapter, match.verse, range.start.chapter, range.start.verse) >= 0 &&
    compareRefPosition(match.chapter, match.verse, range.end.chapter, range.end.verse) <= 0
  )
}

function sortMatchesByAnchor(matches, anchor) {
  if (!anchor || !Number.isFinite(anchor.columnFloat)) return [...matches]

  return [...matches]
    .filter((match) => {
      if (!anchor.restrictSearchToRange) return true
      if (!Array.isArray(anchor.allowedRanges) || !anchor.allowedRanges.length) return true
      return anchor.allowedRanges.some((range) => isMatchWithinAllowedRange(match, range))
    })
    .sort((a, b) => {
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

function resolveStandardQuery(query, options = {}) {
  const value = normalizeSpaces(query)
  if (!value) throw new Error("צריך למלא לפחות שדה אחד.")

  const scheduledReadingKey = getScheduledReadingKey(value)
  if (scheduledReadingKey) {
    const reading = autoReadingsState[scheduledReadingKey]
    if (!reading) throw new Error("הקריאות האוטומטיות עדיין לא נטענו.")
    return createScheduledReadingLocation(reading, scheduledReadingKey, value, options)
  }

  const datedReading = getReadingFromDateQuery(value)
  if (datedReading) {
    return createScheduledReadingLocation(
      datedReading,
      getReadingAnchorRole(options.fieldKey),
      value,
      options,
    )
  }

  if (parseIsoDateFromQuery(value)) {
    throw new Error("אין קריאה בתאריך הזה או אחריו בטווח שנטען.")
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
      label: formatVerseReferenceLabel(verse),
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
    label: formatVerseReferenceLabel(best),
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

function resolveQuery(query, options = {}) {
  const value = normalizeSpaces(query)
  const plusQuery = parsePlusQuery(value)
  if (plusQuery) {
    const anchor = resolveStandardQuery(plusQuery.anchorQuery, options)
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
      label: formatVerseReferenceLabel(best),
      columnFloat: best.columnFloat,
      column: best.column,
      lineFloat: best.lineFloat,
      exact: best.exact,
      detail: `${best.parashah} | ${best.matchLabel} | קרוב ל${anchor.label}${anchor.selectedSegmentLabel ? ` · ${anchor.selectedSegmentLabel}` : ""}`,
      queryText: value,
      verseTextHtml: highlightMatchText(best.text, best, plusQuery.textQuery),
      anchorLabel: anchor.label,
      anchorColumn: anchor.column,
    }
  }

  return resolveStandardQuery(value, options)
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

function formatLocation(location, { showDetails = true } = {}) {
  const columnText =
    location.exact && Math.abs(location.columnFloat - location.column) < 0.001
      ? String(location.column)
      : formatNumber(location.columnFloat, 2)
  const lineText = location.exact
    ? String(Math.round(location.lineFloat))
    : formatNumber(location.lineFloat, 1)

  if (!showDetails) {
    return `
      <article class="location-card is-compact">
        <div class="location-meta">
          <div class="location-label">${location.label}</div>
          <div class="location-column-only">עמודה ${columnText}</div>
        </div>
      </article>
    `
  }

  return `
    <article class="location-card">
      <div class="location-meta">
        ${location.queryText ? `<div class="location-query">${location.queryText}</div>` : ""}
        <div class="location-label">${location.label}</div>
        ${location.readingName ? `<div>קריאה: ${location.readingName}</div>` : ""}
        ${
          location.readingDate
            ? `<div>תאריך: ${location.readingDate}${location.readingHebrewDate ? ` · ${location.readingHebrewDate}` : ""}</div>`
            : ""
        }
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
        ${location.selectedSegmentLabel ? `<div>ספר נבחר: ${location.selectedSegmentLabel}</div>` : ""}
        ${location.segmentRangeLabel ? `<div>טווח הספר: ${location.segmentRangeLabel}</div>` : ""}
        ${location.anchorLabel ? `<div>עוגן: ${location.anchorLabel}</div>` : ""}
        <div>עמודה ${columnText}</div>
        <div>שורה ${lineText}</div>
        <div>${location.detail}</div>
        ${renderReadingSegments(location.readingSegments)}
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
  const segmentDiffs = getLocationSegmentDiffs(current, target)
  const preferredTargetSegmentIndex = Number.isInteger(target?.selectedSegmentIndex)
    ? target.selectedSegmentIndex
    : null
  const preferredSplitIndex =
    preferredTargetSegmentIndex === null
      ? 0
      : Math.max(
          segmentDiffs.findIndex((segment) => segment.targetSegmentIndex === preferredTargetSegmentIndex),
          0,
        )

  comparisonState = {
    current,
    target,
    sourceVisible,
    showLocationDetails: false,
    activeSplitIndex: segmentDiffs.length ? preferredSplitIndex : null,
  }
  renderComparisonState()
}

function renderComparisonState() {
  if (!comparisonState) return

  const { current, target, sourceVisible, showLocationDetails } = comparisonState
  const segmentDiffs = getLocationSegmentDiffs(current, target)
  const hasSplitScroll = segmentDiffs.length > 0
  const fallbackSplitIndex =
    Number.isInteger(comparisonState.activeSplitIndex) && comparisonState.activeSplitIndex >= 0
      ? comparisonState.activeSplitIndex
      : 0
  const activeSplitIndex = hasSplitScroll
    ? Math.min(fallbackSplitIndex, segmentDiffs.length - 1)
    : null
  comparisonState.activeSplitIndex = activeSplitIndex

  const activeSegmentDiff = hasSplitScroll ? segmentDiffs[activeSplitIndex] : null
  const { sourceLocation, targetLocation } = getComparisonLocationsForSegment(
    current,
    target,
    activeSegmentDiff,
  )
  const delta = hasSplitScroll ? activeSegmentDiff.delta : target.columnFloat - current.columnFloat
  const absDelta = Math.abs(delta)
  const direction =
    absDelta < 0.25 ? "אותו מקום" : delta > 0 ? "קדימה" : "אחורה"
  const message =
    absDelta < 0.25 ? "כמעט בלי גלילה" : `${formatNumber(absDelta, 1)} עמודות ${direction}`

  resultsEl.className = "results"
  resultsEl.innerHTML = `
    <article class="summary-card summary-card-primary">
      <h3>כמה לגלול</h3>
      ${
        hasSplitScroll
          ? `
            ${renderSplitSegmentSelector(segmentDiffs, activeSplitIndex)}
            ${renderReadingSegmentDiffs(segmentDiffs, { activeIndex: activeSplitIndex })}
          `
          : `
            <div class="summary-main">
              <span class="summary-value">${formatNumber(absDelta, 1)}</span>
              <span class="summary-direction">${direction}</span>
            </div>
            <p class="summary-note">${message}</p>
          `
      }
      <div class="summary-actions">
        <button
          class="ghost-button small-button"
          type="button"
          data-action="toggle-source"
        >
          ${sourceVisible ? "הסתר מקור" : "הצג מקור"}
        </button>
        <label class="details-toggle">
          <input
            type="checkbox"
            data-action="toggle-location-details"
            ${showLocationDetails ? "checked" : ""}
          />
          <span>הצג פרטי עמודה</span>
        </label>
      </div>
    </article>
    <div class="location-grid">
      ${
        sourceVisible
          ? `<div class="location-slot location-slot-source">${formatLocation(sourceLocation, { showDetails: showLocationDetails })}</div>`
          : ""
      }
      <div class="location-slot location-slot-target">${formatLocation(targetLocation, { showDetails: showLocationDetails })}</div>
    </div>
  `

  renderPreview(
    sourceVisible
      ? [
          { title: "עמודת המקור", location: sourceLocation },
          { title: "עמודת היעד", location: targetLocation },
        ]
      : [{ title: "עמודת היעד", location: targetLocation }],
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
          const nearby = [-2, -1, 0, 1, 2]
            .map((step) => clampColumn(previewColumn + step))
            .filter((value, itemIndex, values) => values.indexOf(value) === itemIndex)

          return `
            <article class="preview-card">
              <div class="preview-toolbar">
                <div class="preview-meta">
                  <strong>${title}</strong>
                  <div class="preview-column-value">עמודה ${previewColumn}</div>
                </div>
                <div class="preview-stepper">
                  <button class="icon-button" type="button" data-action="next" data-preview-index="${index}" aria-label="עמודה הבאה">+</button>
                  <button class="icon-button" type="button" data-action="prev" data-preview-index="${index}" aria-label="עמודה קודמת">−</button>
                </div>
              </div>

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
                  <span class="meta-pill">עמודה ${previewColumn}</span>
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
  querySegmentState.current = null
  querySegmentState.target = null
  renderAllSegmentPickers()
  resultsEl.className = "results empty-state results-placeholder"
  resultsEl.innerHTML = "<p>בחר יעד כדי לדעת כמה לגלול.</p><p>אפשר גם לפתוח יומן.</p>"
  renderPreview()
}

function tryResolveQuery(value, options = {}) {
  try {
    return value ? resolveQuery(value, options) : null
  } catch {
    return null
  }
}

function renderTypingState() {
  resultsEl.className = "results empty-state results-placeholder"
  resultsEl.innerHTML = "<p>ממשיך לחפש את היעד...</p>"
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
      const currentLocation = tryResolveQuery(currentValue, { fieldKey: "current" })
      const targetLocation = tryResolveQuery(targetValue, { fieldKey: "target" })

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
      renderSingle(resolveQuery(singleValue, { fieldKey: targetValue ? "target" : "current" }), title)
      return
    }

    renderComparison(
      resolveQuery(currentValue, { fieldKey: "current" }),
      resolveQuery(targetValue, { fieldKey: "target" }),
    )
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
    loadTimesSettings()
    setAppMode(appState.mode)
    renderTimesSummary()
    renderJournal()
    renderTodayInfo()
    loadTodayInfo()
    loadHolidayTimes(timesState.selectedDate)
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

modeTabsEl?.addEventListener("click", (event) => {
  const target = event.target.closest("[data-tab]")
  if (!target) return
  setAppMode(target.dataset.tab)
})

timesDateInput?.addEventListener("change", () => {
  const nextDate = getTimesDateQueryValue(timesDateInput.value)
  if (nextDate === timesState.selectedDate) return
  loadHolidayTimes(nextDate)
})

timesDateTodayButton?.addEventListener("click", () => {
  loadHolidayTimes(getIsraelDateString())
})

timesMainTitleInput?.addEventListener("input", () => {
  timesState.settings.mainTitle = normalizeMainTitle(timesMainTitleInput.value)
  saveTimesSettings()
  renderTimesSummary()
})

timesDafTimeInput?.addEventListener("change", () => {
  const nextTime = normalizeTimeInput(timesDafTimeInput.value) || "18:00"
  timesState.settings.dafTime = nextTime
  saveTimesSettings()
  if (!rebuildTimesScheduleLocally()) {
    loadHolidayTimes(timesState.selectedDate)
  }
})

timesGreetingModeInput?.addEventListener("change", () => {
  timesState.settings.greetingMode = normalizeGreetingMode(timesGreetingModeInput.value)
  saveTimesSettings()
  renderTimesSummary()
})

timesGreetingInput?.addEventListener("input", () => {
  timesState.settings.greeting = normalizeGreetingInput(timesGreetingInput.value)
  saveTimesSettings()
  renderTimesSummary()
})

timesSeasonModeInput?.addEventListener("change", () => {
  timesState.settings.seasonMode = normalizeSeasonMode(timesSeasonModeInput.value)
  saveTimesSettings()
  if (!rebuildTimesScheduleLocally()) {
    loadHolidayTimes(timesState.selectedDate)
  }
})

timesIncludeDafInput?.addEventListener("change", () => {
  timesState.settings.includeDaf = Boolean(timesIncludeDafInput.checked)
  saveTimesSettings()
  if (!rebuildTimesScheduleLocally()) {
    loadHolidayTimes(timesState.selectedDate)
  }
})

timesResetFixedLinesButton?.addEventListener("click", () => {
  timesState.settings.fixedLineOverrides = {}
  timesState.settings.hiddenFixedLineIds = []
  saveTimesSettings()
  if (!rebuildTimesScheduleLocally()) {
    loadHolidayTimes(timesState.selectedDate)
  }
})

timesFixedLinesList?.addEventListener("input", (event) => {
  const target = event.target.closest("[data-fixed-id]")
  if (!target) return
  const fixedId = normalizeSpaces(String(target.dataset.fixedId || ""))
  if (!fixedId) return
  const action = String(target.dataset.action || "").trim()
  if (action === "fixed-label") {
    updateFixedLineOverride(fixedId, { label: target.value })
  } else if (action === "fixed-time") {
    updateFixedLineOverride(fixedId, { time: target.value })
  } else if (action === "fixed-visible") {
    updateFixedLineVisibility(fixedId, Boolean(target.checked))
  } else {
    return
  }
  saveTimesSettings()
  if (!rebuildTimesScheduleLocally()) {
    loadHolidayTimes(timesState.selectedDate)
  }
})

timesAddExtraLineButton?.addEventListener("click", () => {
  const defaultAfterId = timesState.baseSchedule.at(-1)?.id || "sof_zman_shma"
  timesState.settings.extraLines = normalizeExtraLines([
    ...(timesState.settings.extraLines || []),
    { text: "", afterId: defaultAfterId },
  ])
  saveTimesSettings()
  renderTimesExtraLinesEditor(timesState.baseSchedule)
})

timesExtraLinesList?.addEventListener("input", (event) => {
  const target = event.target.closest("[data-action='extra-text']")
  if (!target) return
  const index = Number(target.dataset.extraIndex)
  if (!Number.isInteger(index) || index < 0) return
  const items = [...normalizeExtraLines(timesState.settings.extraLines)]
  const existing = items[index] || { text: "", afterId: timesState.baseSchedule.at(-1)?.id || "" }
  items[index] = { ...existing, text: target.value }
  timesState.settings.extraLines = normalizeExtraLines(items)
  saveTimesSettings()
  refreshTimesScheduleFromBase()
  renderTimesSummary()
})

timesExtraLinesList?.addEventListener("change", (event) => {
  const target = event.target.closest("[data-action='extra-after']")
  if (!target) return
  const index = Number(target.dataset.extraIndex)
  if (!Number.isInteger(index) || index < 0) return
  const items = [...normalizeExtraLines(timesState.settings.extraLines)]
  const existing = items[index] || { text: "", afterId: timesState.baseSchedule.at(-1)?.id || "" }
  items[index] = { ...existing, afterId: normalizeSpaces(target.value) }
  timesState.settings.extraLines = normalizeExtraLines(items)
  saveTimesSettings()
  refreshTimesScheduleFromBase()
  renderTimesSummary()
})

timesExtraLinesList?.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action='extra-remove']")
  if (!target) return
  const index = Number(target.dataset.extraIndex)
  if (!Number.isInteger(index) || index < 0) return
  const items = [...normalizeExtraLines(timesState.settings.extraLines)]
  items.splice(index, 1)
  timesState.settings.extraLines = normalizeExtraLines(items)
  saveTimesSettings()
  refreshTimesScheduleFromBase()
  renderTimesSummary()
})

timesCopyImageButton?.addEventListener("click", () => {
  copyTimesPosterImage()
})

timesDownloadImageButton?.addEventListener("click", () => {
  downloadTimesPosterImage()
})

formEl?.addEventListener("submit", (event) => {
  event.preventDefault()
  runSearch()
})

currentInput?.addEventListener("input", () => {
  renderSegmentPicker("current")
  scheduleLiveSearch()
})

targetInput?.addEventListener("input", () => {
  renderSegmentPicker("target")
  scheduleLiveSearch()
})

resetButton?.addEventListener("click", () => {
  clearTimeout(liveSearchTimer)
  resetState()
})

readingDefaultsEl?.addEventListener("click", (event) => {
  const target = event.target.closest("[data-fill-reading]")
  if (!target) return

  const readingKey = target.dataset.fillReading
  const reading = autoReadingsState[readingKey]
  if (!reading) return

  if (readingKey === "previous") {
    currentInput.value = formatReadingInputValue("previous", reading)
    querySegmentState.current = null
    renderSegmentPicker("current")
  } else {
    targetInput.value = formatReadingInputValue("next", reading)
    querySegmentState.target = null
    renderSegmentPicker("target")
  }

  runSearch({ live: true })
})

currentSegmentPicker?.addEventListener("click", (event) => {
  const target = event.target.closest("[data-segment-index]")
  if (!target) return
  querySegmentState.current = Number(target.dataset.segmentIndex)
  renderSegmentPicker("current")
  runSearch({ live: true })
})

targetSegmentPicker?.addEventListener("click", (event) => {
  const target = event.target.closest("[data-segment-index]")
  if (!target) return
  querySegmentState.target = Number(target.dataset.segmentIndex)
  renderSegmentPicker("target")
  runSearch({ live: true })
})

clearCurrentButton?.addEventListener("click", () => {
  currentInput.value = ""
  querySegmentState.current = null
  renderSegmentPicker("current")
  runSearch({ live: true })
})

clearTargetButton?.addEventListener("click", () => {
  targetInput.value = ""
  querySegmentState.target = null
  renderSegmentPicker("target")
  runSearch({ live: true })
})

currentCalendarButton?.addEventListener("click", () => {
  openCalendarModal("current")
})

targetCalendarButton?.addEventListener("click", () => {
  openCalendarModal("target")
})

timesCalendarButton?.addEventListener("click", () => {
  openCalendarModal("times")
})

calendarCloseButton?.addEventListener("click", () => {
  if (journalState.selectedDate) {
    applyJournalReading(journalState.selectedDate)
    if (!journalState.open) return
  }
  closeCalendarModal()
})

journalMonthsEl?.addEventListener("click", (event) => {
  const target = event.target.closest("[data-journal-date]")
  if (!target) return
  const dateString = target.dataset.journalDate
  setJournalDate(dateString)
  applyJournalReading(dateString)
})

journalMonthsEl?.addEventListener("mouseover", (event) => {
  const target = event.target.closest("[data-journal-date]")
  if (!target) return
  setJournalDate(target.dataset.journalDate)
})

journalMonthSelect?.addEventListener("change", () => {
  const selectedYear = journalYearSelect.value
  const selectedMonth = journalMonthSelect.value
  if (!selectedYear || !selectedMonth) return
  setJournalVisibleMonth(`${selectedYear}-${selectedMonth}`)
})

journalYearSelect?.addEventListener("change", () => {
  const year = journalYearSelect.value
  if (!year) return
  const monthsForYear = getJournalMonthKeysForYear(year)
  if (!monthsForYear.length) return
  const currentMonthKey = `${year}-${journalMonthSelect.value}`
  setJournalVisibleMonth(monthsForYear.includes(currentMonthKey) ? currentMonthKey : monthsForYear[0])
})

journalPrevMonthButton?.addEventListener("click", () => {
  const monthKeys = getJournalMonthKeys()
  const index = monthKeys.indexOf(journalState.visibleMonthKey)
  if (index > 0) setJournalVisibleMonth(monthKeys[index - 1])
})

journalNextMonthButton?.addEventListener("click", () => {
  const monthKeys = getJournalMonthKeys()
  const index = monthKeys.indexOf(journalState.visibleMonthKey)
  if (index >= 0 && index < monthKeys.length - 1) setJournalVisibleMonth(monthKeys[index + 1])
})

resultsEl?.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]")
  if (!actionTarget || !comparisonState) return

  if (actionTarget.dataset.action === "toggle-location-details") {
    const checked =
      actionTarget instanceof HTMLInputElement
        ? actionTarget.checked
        : Boolean(comparisonState.showLocationDetails)
    comparisonState.showLocationDetails = checked
    renderComparisonState()
    return
  }

  if (actionTarget.dataset.action === "toggle-source") {
    comparisonState.sourceVisible = !comparisonState.sourceVisible
    renderComparisonState()
    return
  }

  if (actionTarget.dataset.action === "select-split-segment") {
    const splitIndex = Number(actionTarget.dataset.splitIndex)
    if (!Number.isInteger(splitIndex) || splitIndex < 0) return
    comparisonState.activeSplitIndex = splitIndex
    renderComparisonState()
  }
})

previewEl?.addEventListener("click", (event) => {
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

viewerPrevButton?.addEventListener("click", () => {
  setViewerColumn(viewerState.column - 1)
})

viewerNextButton?.addEventListener("click", () => {
  setViewerColumn(viewerState.column + 1)
})

viewerCloseButton?.addEventListener("click", () => {
  closeViewer()
})

viewerSearchToggleButton?.addEventListener("click", () => {
  viewerState.searchOpen = !viewerState.searchOpen
  renderViewerSearch()
  if (viewerState.searchOpen && typeof viewerSearchInput.focus === "function") {
    viewerSearchInput.focus()
  }
})

viewerSearchInput?.addEventListener("input", () => {
  viewerState.searchQuery = normalizeSpaces(viewerSearchInput.value)
  renderViewerSearch()
  renderViewerHighlights()
})

viewerSearchResults?.addEventListener("click", (event) => {
  const target = event.target.closest("[data-column]")
  if (!target) return
  const nextColumn = Number(target.dataset.column)
  if (!nextColumn || nextColumn === viewerState.column) return
  setViewerColumn(nextColumn)
})

viewerZoomInput?.addEventListener("input", () => {
  viewerState.zoomFactor = Number(viewerZoomInput.value)
  syncViewerScale()
})

viewerColumnInput?.addEventListener("change", () => {
  const nextColumn = Number(viewerColumnInput.value)
  if (!nextColumn) return
  setViewerColumn(nextColumn)
})

viewerColumnInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return
  event.preventDefault()
  const nextColumn = Number(viewerColumnInput.value)
  if (!nextColumn) return
  setViewerColumn(nextColumn)
})

viewerModal?.addEventListener("click", (event) => {
  if (event.target === viewerModal) closeViewer()
})

calendarModal?.addEventListener("click", (event) => {
  if (event.target === calendarModal) closeCalendarModal()
})

document.addEventListener("keydown", (event) => {
  if (journalState.open && event.key === "Escape") {
    closeCalendarModal()
    return
  }
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

viewerStage?.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0]?.clientX ?? null
  touchStartY = event.changedTouches[0]?.clientY ?? null
})

viewerStage?.addEventListener("touchend", (event) => {
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

viewerImage?.addEventListener("load", () => {
  syncViewerScale()
})

if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("resize", () => {
    if (!viewerState.open) return
    syncViewerScale()
  })
}

init()
