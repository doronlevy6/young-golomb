const statusEl = document.getElementById("data-status")
const resultsEl = document.getElementById("results")
const formEl = document.getElementById("navigator-form")
const currentInput = document.getElementById("current-query")
const targetInput = document.getElementById("target-query")
const swapButton = document.getElementById("swap-button")
const locateButton = document.getElementById("locate-button")
const resetButton = document.getElementById("reset-button")
const suggestionsEl = document.getElementById("query-suggestions")
const previewEl = document.getElementById("column-preview")

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

function setStatus(text, mode = "") {
  statusEl.textContent = text
  statusEl.className = `status-pill${mode ? ` ${mode}` : ""}`
}

function buildSuggestions() {
  const fragment = document.createDocumentFragment()

  navigatorData.parashot.forEach((parashah) => {
    const option = document.createElement("option")
    option.value = parashah.name_display
    fragment.appendChild(option)
  })

  ;["בראשית ג", "שמות כ", "במדבר כב ב", "עמודה 44"].forEach((value) => {
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
    const key = `${verse[0]}:${verse[1]}:${verse[2]}`
    navigatorData.verseByKey.set(key, verse)
  })
}

function findDirectColumn(query) {
  const match = normalizeKey(query).match(/^(?:עמודה|עמוד|col|column|#)\s*(\d{1,3})$/u)
  if (!match) return null

  const column = Number(match[1])
  if (column < 1 || column > navigatorData.layout.columns) return null
  return column
}

function resolveParashah(query) {
  const key = parashahAliases[normalizeKey(query)] || normalizeKey(query)
  if (!key) return null

  if (/^\d+$/.test(key)) {
    return navigatorData.parashahByOrder.get(Number(key)) || null
  }

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
  if (!value) {
    throw new Error("צריך להזין ערך לחיפוש.")
  }

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
    throw new Error("לא הצלחתי להבין את החיפוש. נסה פרשה, מספר פרשה, ספר פרק פסוק או עמודה.")
  }

  const verse = navigatorData.verseByKey.get(`${reference.book}:${reference.chapter}:${reference.verse}`)
  if (!verse) {
    throw new Error("ההפניה לא נמצאה בדאטה של התורה.")
  }

  return {
    kind: "verse",
    label: `${reference.book} ${reference.chapter}:${reference.verse}`,
    columnFloat: verse[3],
    column: verse[4],
    lineFloat: verse[5],
    exact: verse[6],
    detail: `${verse[7]} | ${verse[6] ? "מדויק" : "משוער"}`,
  }
}

function formatNumber(value, digits = 1) {
  return Number(value).toLocaleString("he-IL", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
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
      <h3>יש בעיה עם החיפוש</h3>
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
  let message = "היעד כמעט באותה עמודה."
  let direction = "כמעט בלי גלילה"

  if (absDelta >= 0.25) {
    direction = delta > 0 ? "קדימה" : "אחורה"
    message = `צריך לגלול בערך ${formatNumber(absDelta, 1)} עמודות ${direction}.`
  }

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

function columnImagePath(column) {
  const padded = String(column).padStart(3, "0")
  return `./columns/Torah_Scroll_Col_${padded}_of_245.jpg`
}

function renderPreview(items = []) {
  if (!items.length) {
    previewEl.className = "column-preview empty-state"
    previewEl.innerHTML =
      "<p>אחרי חישוב יוצגו כאן עמודת המקור ועמודת היעד כפי שהן מופיעות בתיקון קוראים.</p>"
    return
  }

  previewEl.className = "column-preview"
  previewEl.innerHTML = `
    <div class="preview-grid">
      ${items
        .map(({ title, location }) => {
          const accuracy = location.exact ? "מדויק" : "משוער"
          const note =
            location.kind === "column"
              ? "זו העמודה שנבחרה ידנית."
              : `העמודה שמכילה את ${location.label}.`
          return `
            <article class="preview-card">
              <div>
                <h3>${title}</h3>
                <p>עמודה ${location.column} | ${accuracy}</p>
                <p>${note}</p>
              </div>
              <img
                class="preview-image"
                src="${columnImagePath(location.column)}"
                alt="${title} - עמודה ${location.column}"
                loading="lazy"
              />
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
  resultsEl.className = "results empty-state"
  resultsEl.innerHTML = "<p>הכלי מוכן. הזן מיקום ויעד כדי לקבל גלילה משוערת בעמודות.</p>"
  renderPreview()
}

function runSearch({ locateOnly = false } = {}) {
  try {
    const currentValue = currentInput.value
    const targetValue = targetInput.value

    if (locateOnly || !currentValue.trim()) {
      if (!targetValue.trim()) {
        throw new Error("כדי לאתר יעד בלבד צריך למלא את שדה היעד.")
      }

      renderSingle(resolveQuery(targetValue))
      return
    }

    if (!targetValue.trim()) {
      throw new Error("חסר יעד לחישוב הגלילה.")
    }

    renderComparison(resolveQuery(currentValue), resolveQuery(targetValue))
  } catch (error) {
    renderError(error.message)
  }
}

async function init() {
  try {
    setStatus("טוען נתונים...")
    const response = await fetch("./data/navigator_data.json")
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    navigatorData = await response.json()
    buildIndexes()
    buildSuggestions()
    setStatus("הנתונים מוכנים", "ready")
  } catch (error) {
    setStatus("שגיאה בטעינת הנתונים", "error")
    renderError("לא הצלחתי לטעון את קובץ הנתונים של הניווט.")
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

document.querySelectorAll(".example-chip").forEach((button) => {
  button.addEventListener("click", () => {
    currentInput.value = button.dataset.current || ""
    targetInput.value = button.dataset.target || ""
    runSearch({ locateOnly: !button.dataset.current })
  })
})

init()
