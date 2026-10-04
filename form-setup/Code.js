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

function setupCommunityDirectory() {
  const form = FormApp.create("עסקים בקהילה")
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
  const forms = DriveApp.getFilesByName("עסקים בקהילה")
  if (!forms.hasNext()) return null
  return completeSetup(FormApp.openById(forms.next().getId()))
}

function ensureSetup() {
  return collectConfig() || adoptExisting() || setupCommunityDirectory()
}

function doGet(event) {
  const params = (event && event.parameter) || {}
  ensureSetup()
  return dataResponse(params)
}

function readResponses() {
  const found = getResponsesSheet()
  if (!found.sheet || found.sheet.getLastRow() < 2) return { headers: [], rows: [] }
  const sheet = found.sheet
  const values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues()
  const headers = values[0].map((h) => String(h))
  return { headers, rows: values.slice(1) }
}

function approvedRowsOnly() {
  const { headers, rows } = readResponses()
  const approvedCol = headers.indexOf(APPROVED_HEADER)
  if (approvedCol < 0) return { headers, rows: [] }
  const ok = ["כן", "מאושר", "yes", "true", "v", "✓", "1"]
  return {
    headers,
    rows: rows.filter((r) => ok.includes(String(r[approvedCol]).trim().toLowerCase())),
  }
}

function dataResponse(params) {
  const config = collectConfig()
  const { headers, rows } = approvedRowsOnly()
  const payload = JSON.stringify({
    formUrl: config ? config.publicUrl : "",
    headers,
    rows,
  })
  const callback = params && params.callback
  if (callback && /^[A-Za-z_$][\w$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + "(" + payload + ");").setMimeType(
      ContentService.MimeType.JAVASCRIPT,
    )
  }
  return ContentService.createTextOutput(payload).setMimeType(ContentService.MimeType.JSON)
}

function approveAllPending() {
  const found = getResponsesSheet()
  if (!found.sheet || found.sheet.getLastRow() < 2) return 0
  const sheet = found.sheet
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  const approvedCol = headers.indexOf(APPROVED_HEADER) + 1
  if (!approvedCol) return 0
  let count = 0
  for (let r = 2; r <= sheet.getLastRow(); r += 1) {
    if (!String(sheet.getRange(r, approvedCol).getValue()).trim()) {
      sheet.getRange(r, approvedCol).setValue("כן")
      count += 1
    }
  }
  return count
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
}

function markLastRowApproved() {
  const { sheet } = getResponsesSheet()
  if (!sheet || sheet.getLastRow() < 2) throw new Error("no responses yet")
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  const approvedCol = headers.indexOf(APPROVED_HEADER) + 1
  if (!approvedCol) throw new Error(APPROVED_HEADER + " column not found")
  const lastRow = sheet.getLastRow()
  sheet.getRange(lastRow, approvedCol).setValue("כן")
  return { row: lastRow, name: sheet.getRange(lastRow, 2).getValue() }
}

function getStatus() {
  const { sheet } = getResponsesSheet()
  if (!sheet) return { responses: 0 }
  return {
    responses: sheet.getLastRow() - 1,
    headers: sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0],
  }
}
