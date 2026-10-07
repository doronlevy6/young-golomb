const EXEC_URL =
  "https://script.google.com/macros/s/AKfycby2BP4KiA4I6GVrvRgY-OoCrw9JSsEmcI45Wxh91PXGOwHmI4w5y6E0hL2JekJfz7zu4Q/exec"
const DATA_URL = `${EXEC_URL}?action=data`
const FORM_URL = ""
const STATIC_DATA_URL = "./data/businesses.json"
const SAMPLE_DATA_URL = "./data/businesses-sample.json"

const HEADER_ALIASES = {
  name: ["שם העסק", "שם העוסק"],
  category: ["קטגוריה", "תחום", "מקצוע"],
  tagline: ["משפט פתיחה", "סלוגן"],
  description: ["מה אתם מציעים", "תיאור", "מה אני מציע", "שירותים"],
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
}

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
const adminToggleEl = document.getElementById("biz-admin-toggle")
const adminHintEl = document.getElementById("biz-admin-hint")

const state = {
  businesses: [],
  category: "",
  query: "",
  loaded: false,
  adminCode: sessionStorage.getItem("bizAdminCode") || "",
  drag: null,
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
    id: source.id || null,
    stamp: source.stamp || "",
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

function loadJsonp(url, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const callback = "__bizJsonp" + Math.random().toString(36).slice(2)
    const script = document.createElement("script")
    let settled = false
    const cleanup = () => {
      delete window[callback]
      script.remove()
      clearTimeout(timer)
    }
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      cleanup()
      reject(new Error("jsonp timeout"))
    }, timeoutMs)
    window[callback] = (data) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(data)
    }
    script.onerror = () => {
      if (settled) return
      settled = true
      cleanup()
      reject(new Error("jsonp failed"))
    }
    script.src = url + (url.includes("?") ? "&" : "?") + "callback=" + callback
    document.head.append(script)
  })
}

function businessesFromRows(headers, rows, ids = []) {
  if (!Array.isArray(headers) || !headers.length) return []
  const columns = mapColumns(headers.map((header) => String(header).trim()))
  if (columns.name === undefined) return []
  return rows.map((row, i) => {
    const source = { id: ids[i], stamp: row[0] }
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

function buildDragHandle() {
  const handle = el("span", "biz-drag-handle", "⋮⋮")
  handle.title = "גררו לשינוי סדר"
  handle.setAttribute("aria-hidden", "true")
  return handle
}

function buildDeleteButton(business) {
  const button = el("button", "biz-delete", "×")
  button.type = "button"
  button.title = "מחיקה"
  button.setAttribute("aria-label", `מחיקת ${business.name}`)
  button.addEventListener("click", () =>
    runAdmin({ action: "remove", stamp: business.stamp }, business),
  )
  return button
}

function buildCard(business) {
  const card = el("article", "biz-card")
  if (state.adminCode && business.id) {
    card.append(buildDeleteButton(business))
    if (canReorder()) card.append(buildDragHandle())
  }
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

function applyData(businesses, isSample) {
  state.businesses = businesses.filter((b) => b.name)
  sampleNoteEl.hidden = !isSample
  viewEl.classList.toggle("is-sample", isSample)
  render()
}

async function loadLive() {
  const payload = await loadJsonp(DATA_URL)
  if (payload.formUrl) setFormUrl(payload.formUrl)
  return businessesFromRows(payload.headers, payload.rows, payload.ids)
}

async function loadLiveWithRetry(attempts = 3) {
  let lastError
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await loadLive()
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 1200 * (i + 1)))
    }
  }
  throw lastError
}

function showLoadError() {
  const message = el("p", "biz-empty", "לא הצלחנו לטעון את רשימת העסקים.")
  const retry = el("button", "biz-chip", "נסו שוב")
  retry.type = "button"
  retry.addEventListener("click", () => {
    state.loaded = false
    ensureLoaded()
  })
  gridEl.replaceChildren(message, retry)
}

async function loadBaked() {
  const response = await fetch(STATIC_DATA_URL, { cache: "no-store" })
  if (!response.ok) throw new Error(`baked snapshot ${response.status}`)
  const payload = await response.json()
  if (payload.formUrl) setFormUrl(payload.formUrl)
  return businessesFromRows(payload.headers, payload.rows, payload.ids)
}

async function ensureLoaded() {
  if (state.loaded) return
  state.loaded = true
  viewEl.classList.remove("is-sample")
  sampleNoteEl.hidden = true

  if (!DATA_URL) {
    try {
      const response = await fetch(SAMPLE_DATA_URL)
      const data = await response.json()
      applyData(data.map(normalizeBusiness), true)
    } catch {
      showLoadError()
    }
    return
  }

  gridEl.replaceChildren(el("p", "biz-empty", "טוען עסקים..."))

  // The baked snapshot is same-origin and refreshed every ~15 min by a
  // GitHub Action, so it works even when a visitor's network blocks Google.
  try {
    const businesses = await loadBaked()
    if (businesses.length) applyData(businesses, false)
  } catch {}

  try {
    const businesses = await loadLiveWithRetry()
    applyData(businesses, false)
  } catch (error) {
    console.error("live directory refresh failed, keeping the baked snapshot:", error)
    if (!state.businesses.length) {
      state.loaded = false
      showLoadError()
    }
  }
}

function cardUnderPointer(x, y, exclude) {
  for (const node of document.elementsFromPoint(x, y)) {
    const card = node.closest(".biz-card")
    if (card && card !== exclude && gridEl.contains(card)) return card
  }
  return null
}

function beginDrag(event, card) {
  event.preventDefault()
  const rect = card.getBoundingClientRect()
  const ghost = card.cloneNode(true)
  ghost.classList.add("is-ghost")
  Object.assign(ghost.style, {
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    left: `${rect.left}px`,
    top: `${rect.top}px`,
  })
  document.body.append(ghost)
  card.classList.add("is-dragging")

  const drag = {
    card,
    ghost,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    pointerY: event.clientY,
    target: null,
    scroller: null,
  }
  drag.scroller = setInterval(() => {
    if (drag.pointerY < 70) window.scrollBy(0, -14)
    else if (drag.pointerY > window.innerHeight - 70) window.scrollBy(0, 14)
  }, 16)
  state.drag = drag
}

function moveDrag(event) {
  const drag = state.drag
  if (!drag) return
  drag.pointerY = event.clientY
  drag.ghost.style.left = `${event.clientX - drag.offsetX}px`
  drag.ghost.style.top = `${event.clientY - drag.offsetY}px`
  const target = cardUnderPointer(event.clientX, event.clientY, drag.card)
  if (target !== drag.target) {
    drag.target?.classList.remove("is-drop-target")
    target?.classList.add("is-drop-target")
    drag.target = target
  }
}

function endDrag(commit) {
  const drag = state.drag
  if (!drag) return
  state.drag = null
  clearInterval(drag.scroller)
  drag.ghost.remove()
  drag.card.classList.remove("is-dragging")
  drag.target?.classList.remove("is-drop-target")
  if (!commit || !drag.target) return

  const cards = [...gridEl.querySelectorAll(".biz-card")]
  const from = cards.indexOf(drag.card)
  const to = cards.indexOf(drag.target)
  const business = state.businesses[from]
  if (business && from !== to) runAdmin({ action: "move", position: to + 1 }, business)
}

function adminCall(params) {
  const query = new URLSearchParams({ ...params, code: state.adminCode })
  return loadJsonp(`${EXEC_URL}?${query}`)
}

async function refreshLive() {
  const businesses = await loadLiveWithRetry()
  applyData(businesses, false)
}

const ADMIN_HINT = "מצב ניהול: גררו כרטיסים לשינוי סדר, ולחצו על הכפתור האדום למחיקה"
let adminQueue = Promise.resolve()
let pendingAdmin = 0

function setSaving(delta) {
  pendingAdmin += delta
  if (adminHintEl) adminHintEl.textContent = pendingAdmin ? "שומר שינויים..." : ADMIN_HINT
}

function runAdmin(params, business) {
  if (
    params.action === "remove" &&
    !confirm(`למחוק לצמיתות את "${business.name}"? זה יסיר אותו גם מהגליון.`)
  ) {
    return
  }

  const payload = { ...params, id: business.id, name: business.name, stamp: business.stamp }

  if (params.action === "remove") {
    state.businesses = state.businesses.filter((item) => item !== business)
    state.businesses.forEach((item) => {
      if (item.id > business.id) item.id -= 1
    })
  } else if (params.action === "move") {
    const from = state.businesses.indexOf(business)
    const [moved] = state.businesses.splice(from, 1)
    state.businesses.splice(Math.max(params.position - 1, 0), 0, moved)
  }
  render()

  adminQueue = adminQueue.then(async () => {
    setSaving(1)
    try {
      const result = await adminCall(payload)
      if (!result.ok) throw new Error(result.error)
    } catch {
      alert("הפעולה לא נשמרה. הרשימה תתרענן.")
      await refreshLive().catch(() => {})
    } finally {
      setSaving(-1)
      if (pendingAdmin === 0) refreshLive().catch(() => {})
    }
  })
}

function canReorder() {
  return Boolean(state.adminCode) && !state.category && !state.query.trim()
}

function updateAdminToggle() {
  const active = Boolean(state.adminCode)
  viewEl.classList.toggle("is-admin", active)
  if (adminHintEl) adminHintEl.hidden = !active
  if (adminToggleEl) adminToggleEl.textContent = active ? "יציאה ממצב ניהול" : "ניהול"
}

async function toggleAdmin() {
  if (state.adminCode) {
    state.adminCode = ""
    sessionStorage.removeItem("bizAdminCode")
  } else {
    const code = (prompt("קוד ניהול:") || "").trim()
    if (!code) return
    state.adminCode = code
    try {
      const result = await adminCall({ action: "check" })
      if (!result.ok) throw new Error("bad code")
      sessionStorage.setItem("bizAdminCode", code)
    } catch {
      state.adminCode = ""
      alert("קוד שגוי.")
    }
  }
  updateAdminToggle()
  render()
}

function init() {
  if (!viewEl) return

  updateAdminToggle()
  adminToggleEl?.addEventListener("click", toggleAdmin)

  gridEl.addEventListener("pointerdown", (event) => {
    if (!canReorder() || event.button > 0 || event.target.closest("a, button")) return
    const card = event.target.closest(".biz-card")
    if (!card) return
    const onHandle = Boolean(event.target.closest(".biz-drag-handle"))
    if (!onHandle && event.pointerType !== "mouse") return
    beginDrag(event, card)
  })
  document.addEventListener("pointermove", moveDrag)
  document.addEventListener("pointerup", () => endDrag(true))
  document.addEventListener("pointercancel", () => endDrag(false))

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
