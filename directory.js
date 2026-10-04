const DATA_URL =
  "https://script.google.com/macros/s/AKfycby2BP4KiA4I6GVrvRgY-OoCrw9JSsEmcI45Wxh91PXGOwHmI4w5y6E0hL2JekJfz7zu4Q/exec?action=data"
const FORM_URL = ""
const SAMPLE_DATA_URL = "./data/businesses-sample.json"

const HEADER_ALIASES = {
  name: ["שם העסק", "שם העוסק"],
  category: ["קטגוריה", "תחום", "מקצוע"],
  tagline: ["משפט פתיחה", "סלוגן"],
  description: ["תיאור", "מה אני מציע", "שירותים"],
  contactName: ["שם איש הקשר", "איש קשר"],
  phone: ["טלפון", "נייד"],
  area: ["אזור שירות", "אזור"],
  hours: ["שעות פעילות", "שעות"],
  price: ["טווח מחירים", "מחיר"],
  website: ["אתר"],
  instagram: ["אינסטגרם"],
  facebook: ["פייסבוק"],
  images: ["תמונה", "תמונות", "לוגו"],
  tags: ["תגיות", "מילות חיפוש"],
  approved: ["מאושר"],
}

const APPROVED_VALUES = ["כן", "מאושר", "yes", "true", "v", "✓", "1"]
const AVATAR_COLORS = ["#155c99", "#269f69", "#b0702b", "#7a4bb3", "#b03561", "#2f8a9e"]
const MAX_THUMBS = 2

const viewEl = document.getElementById("business-view")
const searchEl = document.getElementById("biz-search")
const chipsEl = document.getElementById("biz-chips")
const countEl = document.getElementById("biz-count")
const gridEl = document.getElementById("biz-grid")
const emptyEl = document.getElementById("biz-empty")
const sampleNoteEl = document.getElementById("biz-sample-note")
const addLinkEl = document.getElementById("biz-add-link")

const state = { businesses: [], category: "", query: "", loaded: false }

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"'
        i += 1
      } else if (char === '"') {
        inQuotes = false
      } else {
        cell += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ",") {
      row.push(cell)
      cell = ""
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
    } else {
      cell += char
    }
  }
  if (cell !== "" || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((value) => value.trim() !== ""))
}

function mapColumns(headers) {
  const columns = {}
  const used = new Set()
  Object.entries(HEADER_ALIASES).forEach(([field, aliases]) => {
    const index = headers.findIndex(
      (header, i) => !used.has(i) && aliases.some((alias) => header.includes(alias)),
    )
    if (index >= 0) {
      columns[field] = index
      used.add(index)
    }
  })
  return columns
}

function splitList(value) {
  return String(value || "")
    .split(/[,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function toImageUrl(raw) {
  const value = String(raw || "").trim()
  if (!/^https?:\/\//i.test(value)) return ""
  const driveId = value.match(/[?&]id=([\w-]+)/) || value.match(/\/d\/([\w-]+)/)
  if (/drive\.google\.com/i.test(value) && driveId) {
    return `https://drive.google.com/thumbnail?id=${driveId[1]}&sz=w600`
  }
  return value
}

function toWebUrl(raw) {
  const value = String(raw || "").trim()
  if (!value) return ""
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    const url = new URL(withScheme)
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : ""
  } catch {
    return ""
  }
}

function toSocialUrl(raw, base) {
  const value = String(raw || "").trim()
  if (!value) return ""
  if (/^https?:\/\//i.test(value) || value.includes(".")) return toWebUrl(value)
  return `${base}${value.replace(/^@/, "")}`
}

function toInternationalPhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "")
  if (digits.length < 7) return ""
  if (digits.startsWith("972")) return digits
  if (digits.startsWith("0")) return `972${digits.slice(1)}`
  return digits
}

function normalizeBusiness(source) {
  return {
    name: String(source.name || "").trim(),
    category: String(source.category || "").trim() || "אחר",
    tagline: String(source.tagline || "").trim(),
    description: String(source.description || "").trim(),
    contactName: String(source.contactName || "").trim(),
    phoneText: String(source.phone || "").trim(),
    phoneIntl: toInternationalPhone(source.phone),
    area: String(source.area || "").trim(),
    hours: String(source.hours || "").trim(),
    price: String(source.price || "").trim(),
    website: toWebUrl(source.website),
    instagram: toSocialUrl(source.instagram, "https://instagram.com/"),
    facebook: toSocialUrl(source.facebook, "https://facebook.com/"),
    images: (Array.isArray(source.images) ? source.images : splitList(source.images))
      .map(toImageUrl)
      .filter(Boolean),
    tags: Array.isArray(source.tags) ? source.tags : splitList(source.tags),
  }
}

function loadJsonp(url) {
  return new Promise((resolve, reject) => {
    const callback = "__bizJsonp" + Math.random().toString(36).slice(2)
    const script = document.createElement("script")
    window[callback] = (data) => {
      resolve(data)
      delete window[callback]
      script.remove()
    }
    script.onerror = () => {
      reject(new Error("jsonp failed"))
      delete window[callback]
      script.remove()
    }
    script.src = url + (url.includes("?") ? "&" : "?") + "callback=" + callback
    document.head.append(script)
  })
}

function businessesFromRows(headers, rows) {
  if (!Array.isArray(headers) || !headers.length) return []
  const columns = mapColumns(headers.map((header) => String(header).trim()))
  if (columns.name === undefined) return []
  return rows.map((row) => {
    const source = {}
    Object.entries(columns).forEach(([field, index]) => {
      source[field] = row[index]
    })
    return normalizeBusiness(source)
  })
}

function setFormUrl(url) {
  const safe = toWebUrl(url)
  if (safe && addLinkEl) {
    addLinkEl.href = safe
    addLinkEl.hidden = false
  }
}

function businessesFromCsv(text) {
  const [headerRow, ...dataRows] = parseCsv(text)
  if (!headerRow) return []
  const columns = mapColumns(headerRow.map((header) => header.trim()))
  if (columns.name === undefined) return []

  return dataRows
    .filter((row) => {
      if (columns.approved === undefined) return true
      return APPROVED_VALUES.includes(String(row[columns.approved] || "").trim().toLowerCase())
    })
    .map((row) => {
      const source = {}
      Object.entries(columns).forEach(([field, index]) => {
        source[field] = row[index]
      })
      return normalizeBusiness(source)
    })
}

function shuffle(items) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function haystack(business) {
  return [
    business.name,
    business.category,
    business.tagline,
    business.description,
    business.contactName,
    business.area,
    business.tags.join(" "),
  ]
    .join(" ")
    .toLowerCase()
}

function getVisibleBusinesses() {
  const terms = state.query.toLowerCase().split(/\s+/).filter(Boolean)
  return state.businesses.filter((business) => {
    if (state.category && business.category !== state.category) return false
    if (!terms.length) return true
    const text = haystack(business)
    return terms.every((term) => text.includes(term))
  })
}

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text) node.textContent = text
  return node
}

function actionLink(label, href, className) {
  const link = el("a", `biz-action ${className || ""}`.trim(), label)
  link.href = href
  link.target = "_blank"
  link.rel = "noopener noreferrer"
  return link
}

function avatarColor(name) {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 997
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function buildMedia(business) {
  const media = el("div", "biz-media")
  if (business.images.length) {
    const image = el("img", "biz-photo")
    image.src = business.images[0]
    image.alt = business.name
    image.loading = "lazy"
    image.referrerPolicy = "no-referrer"
    image.addEventListener("error", () => {
      image.replaceWith(buildAvatar(business))
    })
    media.append(image)
  } else {
    media.append(buildAvatar(business))
  }
  return media
}

function buildAvatar(business) {
  const avatar = el("div", "biz-avatar", [...business.name][0] || "?")
  avatar.style.background = avatarColor(business.name)
  avatar.setAttribute("aria-hidden", "true")
  return avatar
}

function buildThumbs(business) {
  const extra = business.images.slice(1, 1 + MAX_THUMBS)
  if (!extra.length) return null
  const strip = el("div", "biz-thumbs")
  extra.forEach((src) => {
    const link = el("a", "biz-thumb")
    link.href = src
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    const image = el("img")
    image.src = src
    image.alt = `${business.name} - תמונה נוספת`
    image.loading = "lazy"
    image.referrerPolicy = "no-referrer"
    link.append(image)
    strip.append(link)
  })
  return strip
}

function buildMeta(business) {
  const items = [
    ["אזור", business.area],
    ["שעות", business.hours],
    ["מחיר", business.price],
  ].filter(([, value]) => value)
  if (!items.length) return null
  const list = el("ul", "biz-meta")
  items.forEach(([label, value]) => {
    const item = el("li")
    item.append(el("strong", "", `${label}: `), document.createTextNode(value))
    list.append(item)
  })
  return list
}

function buildActions(business) {
  const actions = el("div", "biz-actions")
  if (business.phoneIntl) {
    actions.append(actionLink("התקשרו", `tel:+${business.phoneIntl}`, "is-primary"))
    actions.append(actionLink("וואטסאפ", `https://wa.me/${business.phoneIntl}`, "is-whatsapp"))
  }
  if (business.website) actions.append(actionLink("אתר", business.website))
  if (business.instagram) actions.append(actionLink("אינסטגרם", business.instagram))
  if (business.facebook) actions.append(actionLink("פייסבוק", business.facebook))
  return actions
}

function buildCard(business) {
  const card = el("article", "biz-card")
  card.append(buildMedia(business))

  const body = el("div", "biz-body")
  body.append(el("span", "biz-category", business.category))
  body.append(el("h3", "biz-name", business.name))
  if (business.tagline) body.append(el("p", "biz-tagline", business.tagline))
  if (business.description) body.append(el("p", "biz-desc", business.description))

  const meta = buildMeta(business)
  if (meta) body.append(meta)
  if (business.contactName) {
    body.append(el("p", "biz-contact", `איש קשר: ${business.contactName}`))
  }
  const thumbs = buildThumbs(business)
  if (thumbs) body.append(thumbs)
  body.append(buildActions(business))

  card.append(body)
  return card
}

function renderChips() {
  const counts = new Map()
  state.businesses.forEach((b) => counts.set(b.category, (counts.get(b.category) || 0) + 1))
  const categories = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "he"))

  chipsEl.replaceChildren()
  const makeChip = (label, value) => {
    const chip = el("button", "biz-chip", label)
    chip.type = "button"
    chip.dataset.category = value
    const active = state.category === value
    chip.classList.toggle("is-active", active)
    chip.setAttribute("aria-pressed", active ? "true" : "false")
    return chip
  }
  chipsEl.append(makeChip(`הכול (${state.businesses.length})`, ""))
  categories.forEach(([category, count]) => chipsEl.append(makeChip(`${category} (${count})`, category)))
}

function render() {
  const visible = getVisibleBusinesses()
  gridEl.replaceChildren(...visible.map(buildCard))
  emptyEl.hidden = visible.length > 0
  countEl.textContent = state.businesses.length ? `מוצגים ${visible.length} מתוך ${state.businesses.length}` : ""
  renderChips()
}

async function loadBusinesses() {
  if (DATA_URL) {
    const payload = await loadJsonp(DATA_URL)
    if (payload.formUrl) setFormUrl(payload.formUrl)
    return {
      businesses: businessesFromRows(payload.headers, payload.rows),
      isSample: false,
    }
  }
  const response = await fetch(SAMPLE_DATA_URL)
  if (!response.ok) throw new Error(`sample ${response.status}`)
  const data = await response.json()
  return { businesses: data.map(normalizeBusiness), isSample: true }
}

async function ensureLoaded() {
  if (state.loaded) return
  state.loaded = true
  gridEl.replaceChildren(el("p", "biz-empty", "טוען עסקים..."))
  try {
    const { businesses, isSample } = await loadBusinesses()
    state.businesses = shuffle(businesses.filter((b) => b.name))
    sampleNoteEl.hidden = !isSample
    viewEl.classList.toggle("is-sample", isSample)
    render()
  } catch (error) {
    console.error(error)
    state.loaded = false
    gridEl.replaceChildren(el("p", "biz-empty", "לא הצלחנו לטעון את רשימת העסקים. נסו לרענן את הדף."))
  }
}

function init() {
  if (!viewEl) return

  if (FORM_URL) setFormUrl(FORM_URL)

  searchEl?.addEventListener("input", () => {
    state.query = searchEl.value
    render()
  })
  chipsEl?.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-category]")
    if (!chip) return
    state.category = chip.dataset.category
    render()
  })

  new MutationObserver(() => {
    if (!viewEl.hidden) ensureLoaded()
  }).observe(viewEl, { attributes: true, attributeFilter: ["hidden"] })
  if (!viewEl.hidden) ensureLoaded()
}

init()
