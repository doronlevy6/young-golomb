const CATEGORIES = [
  "מתווכים",
  "רופאים",
  "אינסטלציה",
  "חשמלאים",
  "שיפוצים",
  "רואי חשבון",
  "עורכי דין",
  "אוכל וקייטרינג",
  "מחשבים וטכנולוגיה",
  "שיעורים פרטיים",
  "הובלות",
  "יופי וטיפוח",
  "אחר",
]

const APPROVED_HEADER = "מאושר"
const FORM_TITLE = "עסקים בקהילת גולומב"

function setupCommunityDirectory() {
  const form = FormApp.create(FORM_TITLE)
  form.setDescription(
    "מלאו את הפרטים והעסק שלכם יופיע במדריך העסקים של הקהילה. " +
      "השדות המסומנים בכוכבית הם חובה. כל השאר אופציונלי, אבל ממולץ.",
  )
  form.setCollectEmail(false)
  form.setAllowResponseEdits(true)
  form.setLimitOneResponsePerUser(false)
  form.setConfirmationMessage("הפרטים התקבלו. אחרי אישור קצר תופיעו במדריך. תודה!")

  form.addTextItem().setTitle("שם העסק").setRequired(true)
  form.addListItem().setTitle("קטגוריה").setRequired(true).setChoiceValues(CATEGORIES)
  form
    .addTextItem()
    .setTitle("משפט פתיחה")
    .setHelpText("סלוגן קצר, למשל: שיפוצים בלי כאב ראש")
  form
    .addParagraphTextItem()
    .setTitle("מה אתם מציעים?")
    .setHelpText("משפט או שניים על השירותים שלכם")
    .setRequired(true)
  form.addTextItem().setTitle("שם איש קשר").setRequired(true)
  form
    .addTextItem()
    .setTitle("טלפון")
    .setHelpText("מספר שאפשר להתקשר אליו או לשלוח וואטסאפ")
    .setRequired(true)
  form.addTextItem().setTitle("אזור שירות").setHelpText("למשל: בני ברק והסביבה, או ארצי")
  form.addTextItem().setTitle("שעות פעילות").setHelpText("למשל: א-ה 9:00-18:00")
  form.addTextItem().setTitle("טווח מחירים").setHelpText("אופציונלי, למשל: מ-150 ש\"ח")
  form.addTextItem().setTitle("אתר אינטרנט").setHelpText("אופציונלי")
  form.addTextItem().setTitle("אינסטגרם").setHelpText("שם משתמש או קישור, אופציונלי")
  form.addTextItem().setTitle("פייסבוק").setHelpText("שם עמוד או קישור, אופציונלי")
  form
    .addTextItem()
    .setTitle("תגיות")
    .setHelpText("מילות חיפוש מופרדות בפסיקים, למשל: סתימה, נזילה, ברז")

  const spreadsheet = SpreadsheetApp.create("עסקים בקהילה - תשובות")
  form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId())
  DriveApp.getFileById(spreadsheet.getId()).setSharing(
    DriveApp.Access.ANYONE_WITH_LINK,
    DriveApp.Permission.VIEW,
  )

  ScriptApp.newTrigger("onFormSubmitShare").forForm(form).onFormSubmit().create()

  const props = PropertiesService.getScriptProperties()
  props.setProperty("SHEET_ID", spreadsheet.getId())
  props.setProperty("FORM_ID", form.getId())

  return collectConfig()
}

function collectConfig() {
  const props = PropertiesService.getScriptProperties()
  const sheetId = props.getProperty("SHEET_ID")
  const formId = props.getProperty("FORM_ID")
  if (!sheetId || !formId) return null
  const form = FormApp.openById(formId)
  return {
    formId,
    editUrl: form.getEditUrl(),
    publicUrl: form.getPublishedUrl(),
    sheetId,
    sheetUrl: SpreadsheetApp.openById(sheetId).getUrl(),
    csvUrl: "https://docs.google.com/spreadsheets/d/" + sheetId + "/export?format=csv",
  }
}

function trashExtras(files, keepId) {
  while (files.hasNext()) {
    const file = files.next()
    if (file.getId() !== keepId) file.setTrashed(true)
  }
}

function completeSetup(form) {
  trashExtras(DriveApp.getFilesByName("עסקים בקהילה"), form.getId())

  let spreadsheet
  const sheets = DriveApp.getFilesByName("עסקים בקהילה - תשובות")
  if (sheets.hasNext()) {
    spreadsheet = SpreadsheetApp.openById(sheets.next().getId())
    trashExtras(DriveApp.getFilesByName("עסקים בקהילה - תשובות"), spreadsheet.getId())
  } else {
    spreadsheet = SpreadsheetApp.create("עסקים בקהילה - תשובות")
  }

  try {
    form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId())
  } catch (error) {
    console.error("setDestination: " + error)
  }
  DriveApp.getFileById(spreadsheet.getId()).setSharing(
    DriveApp.Access.ANYONE_WITH_LINK,
    DriveApp.Permission.VIEW,
  )

  const hasTrigger = ScriptApp.getProjectTriggers().some(
    (trigger) => trigger.getHandlerFunction() === "onFormSubmitShare",
  )
  if (!hasTrigger) {
    ScriptApp.newTrigger("onFormSubmitShare").forForm(form).onFormSubmit().create()
  }

  const props = PropertiesService.getScriptProperties()
  props.setProperty("SHEET_ID", spreadsheet.getId())
  props.setProperty("FORM_ID", form.getId())
  return collectConfig()
}

function adoptExisting() {
  let forms = DriveApp.getFilesByName(FORM_TITLE)
  if (!forms.hasNext()) forms = DriveApp.getFilesByName("עסקים בקהילה")
  if (!forms.hasNext()) return null
  return completeSetup(FormApp.openById(forms.next().getId()))
}

function ensureSetup() {
  return collectConfig() || adoptExisting() || setupCommunityDirectory()
}

const ADMIN_CODE = "66"
const ORDER_HEADER = "סדר"
const DELETED_MARK = "נמחק"
const APPROVED_VALUES = ["כן", "מאושר", "yes", "true", "v", "✓", "1"]

function textOutput(payload, params) {
  const callback = params && params.callback
  if (callback && /^[A-Za-z_$][\w$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + "(" + payload + ");").setMimeType(
      ContentService.MimeType.JAVASCRIPT,
    )
  }
  return ContentService.createTextOutput(payload).setMimeType(ContentService.MimeType.JSON)
}

function jsonOutput(object, params) {
  return textOutput(JSON.stringify(object), params)
}

const CACHE_KEY = "directoryData"

function clearDataCache() {
  CacheService.getScriptCache().remove(CACHE_KEY)
}

function getFormUrl() {
  const props = PropertiesService.getScriptProperties()
  let url = props.getProperty("FORM_URL")
  if (!url) {
    url = (collectConfig() || ensureSetup()).publicUrl
    props.setProperty("FORM_URL", url)
  }
  return url
}

function ensureColumn(sheet, header) {
  const lastCol = sheet.getLastColumn()
  const index = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf(header)
  if (index >= 0) return index + 1
  sheet.getRange(1, lastCol + 1).setValue(header)
  return lastCol + 1
}

function entryOrder(entry, orderCol) {
  const raw = orderCol >= 0 ? entry.values[orderCol] : ""
  return raw !== "" && !isNaN(Number(raw)) ? Number(raw) : entry.row
}

function approvedEntries() {
  const found = getResponsesSheet()
  if (!found.sheet || found.sheet.getLastRow() < 2) return { headers: [], entries: [] }
  const sheet = found.sheet
  const values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues()
  const headers = values[0].map(String)
  const approvedCol = headers.indexOf(APPROVED_HEADER)
  const orderCol = headers.indexOf(ORDER_HEADER)
  const entries = values
    .slice(1)
    .map((rowValues, i) => ({ row: i + 2, values: rowValues }))
    .filter(
      (entry) =>
        approvedCol >= 0 &&
        APPROVED_VALUES.includes(String(entry.values[approvedCol]).trim().toLowerCase()),
    )
    .sort((a, b) => entryOrder(a, orderCol) - entryOrder(b, orderCol))
  return { headers, entries }
}

function dataResponse(params) {
  const cache = CacheService.getScriptCache()
  let payload = cache.get(CACHE_KEY)
  if (!payload) {
    const { headers, entries } = approvedEntries()
    payload = JSON.stringify({
      formUrl: getFormUrl(),
      headers,
      rows: entries.map((entry) => entry.values),
      ids: entries.map((entry) => entry.row),
    })
    try {
      cache.put(CACHE_KEY, payload, 60)
    } catch (error) {
      console.error("cache put failed: " + error)
    }
  }
  return textOutput(payload, params)
}

function moveEntry(sheet, row, position) {
  const orderCol = ensureColumn(sheet, ORDER_HEADER)
  const { entries } = approvedEntries()
  const from = entries.findIndex((entry) => entry.row === row)
  if (from < 0) return

  const [moved] = entries.splice(from, 1)
  entries.splice(Math.min(Math.max(position - 1, 0), entries.length), 0, moved)

  const lastRow = sheet.getLastRow()
  const orderValues = sheet.getRange(2, orderCol, lastRow - 1, 1).getValues()
  entries.forEach((entry, i) => {
    orderValues[entry.row - 2][0] = i + 1
  })
  sheet.getRange(2, orderCol, lastRow - 1, 1).setValues(orderValues)
}

function deleteFormResponse(stamp) {
  try {
    const form = FormApp.openById(PropertiesService.getScriptProperties().getProperty("FORM_ID"))
    const time = stamp instanceof Date ? stamp.getTime() : new Date(stamp).getTime()
    form.getResponses().forEach((response) => {
      if (Math.abs(response.getTimestamp().getTime() - time) < 2000) {
        form.deleteResponse(response.getId())
      }
    })
  } catch (error) {
    console.error("deleteFormResponse: " + error)
  }
}

function purgeMarkedRows(sheet) {
  const lastRow = sheet.getLastRow()
  if (lastRow < 2) return 0
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String)
  const approvedCol = headers.indexOf(APPROVED_HEADER) + 1
  if (!approvedCol) return 0
  const marks = sheet.getRange(2, approvedCol, lastRow - 1, 1).getValues()
  let purged = 0
  for (let i = marks.length - 1; i >= 0; i -= 1) {
    if (String(marks[i][0]).trim() === DELETED_MARK) {
      deleteFormResponse(sheet.getRange(i + 2, 1).getValue())
      sheet.deleteRow(i + 2)
      purged += 1
    }
  }
  return purged
}

function adminResponse(params) {
  if (params.code !== ADMIN_CODE) return jsonOutput({ ok: false, error: "code" }, params)
  if (params.action === "check") return jsonOutput({ ok: true }, params)
  if (params.action === "purge") {
    const purged = purgeMarkedRows(getResponsesSheet().sheet)
    clearDataCache()
    return jsonOutput({ ok: true, purged }, params)
  }

  const { sheet } = getResponsesSheet()
  const row = parseInt(params.id, 10)
  if (!sheet || !(row >= 2 && row <= sheet.getLastRow())) {
    return jsonOutput({ ok: false, error: "row" }, params)
  }
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String)
  const nameCol = headers.indexOf("שם העסק") + 1
  if (!nameCol || String(sheet.getRange(row, nameCol).getValue()) !== params.name) {
    return jsonOutput({ ok: false, error: "stale" }, params)
  }

  if (params.action === "remove") {
    const stamp = sheet.getRange(row, 1).getValue()
    const stampText = stamp instanceof Date ? stamp.toISOString() : String(stamp)
    if (stampText !== params.stamp) return jsonOutput({ ok: false, error: "stale" }, params)
    deleteFormResponse(stamp)
    sheet.deleteRow(row)
    clearDataCache()
    return jsonOutput({ ok: true }, params)
  }
  if (params.action === "move") {
    const position = parseInt(params.position, 10)
    if (!(position >= 1)) return jsonOutput({ ok: false, error: "position" }, params)
    moveEntry(sheet, row, position)
    clearDataCache()
    return jsonOutput({ ok: true }, params)
  }
  return jsonOutput({ ok: false, error: "action" }, params)
}

function doGet(event) {
  const params = (event && event.parameter) || {}
  if (!PropertiesService.getScriptProperties().getProperty("SHEET_ID")) ensureSetup()
  if (params.action && params.action !== "data") return adminResponse(params)
  return dataResponse(params)
}

function getResponsesSheet() {
  const sheetId = PropertiesService.getScriptProperties().getProperty("SHEET_ID")
  if (!sheetId) throw new Error("SHEET_ID missing, run setupCommunityDirectory first")
  const spreadsheet = SpreadsheetApp.openById(sheetId)
  const sheets = spreadsheet.getSheets()
  const withRows = sheets.filter((sheet) => sheet.getLastRow() > 0)
  return { spreadsheet, sheet: withRows[0] || null, sheets }
}

function onFormSubmitShare(event) {
  if (event && event.response) {
    event.response.getItemResponses().forEach((itemResponse) => {
      if (itemResponse.getItem().getType() === FormApp.ItemType.FILE_UPLOAD) {
        const fileIds = itemResponse.getResponse() || []
        fileIds.forEach((fileId) => {
          try {
            DriveApp.getFileById(fileId).setSharing(
              DriveApp.Access.ANYONE_WITH_LINK,
              DriveApp.Permission.VIEW,
            )
          } catch (error) {
            console.error("share failed for " + fileId + ": " + error)
          }
        })
      }
    })
  }

  const { spreadsheet, sheet, sheets } = getResponsesSheet()
  if (!sheet) return

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  let approvedCol = headers.indexOf(APPROVED_HEADER) + 1
  if (!approvedCol) {
    approvedCol = sheet.getLastColumn() + 1
    sheet.getRange(1, approvedCol).setValue(APPROVED_HEADER)
  }
  sheet.getRange(sheet.getLastRow(), approvedCol).setValue("כן")

  sheets.forEach((candidate) => {
    if (candidate.getSheetId() !== sheet.getSheetId() && candidate.getLastRow() === 0) {
      spreadsheet.deleteSheet(candidate)
    }
  })
  clearDataCache()
}
