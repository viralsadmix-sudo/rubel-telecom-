const APP_TITLE = "Rubel Telecom";
const PROP_SHEET_ID = "RUBEL_TELECOM_SHEET_ID";
const PROP_FOLDER_ID = "RUBEL_TELECOM_FOLDER_ID";
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle(APP_TITLE + " — ছবি জমা দিন")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function setupRubelTelecom() {
  const props = PropertiesService.getScriptProperties();
  let spreadsheet;
  const savedSheetId = props.getProperty(PROP_SHEET_ID);
  if (savedSheetId) {
    try { spreadsheet = SpreadsheetApp.openById(savedSheetId); } catch (e) {}
  }
  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create("Rubel Telecom Customers");
    props.setProperty(PROP_SHEET_ID, spreadsheet.getId());
  }

  let folder;
  const savedFolderId = props.getProperty(PROP_FOLDER_ID);
  if (savedFolderId) {
    try { folder = DriveApp.getFolderById(savedFolderId); } catch (e) {}
  }
  if (!folder) {
    folder = DriveApp.createFolder("Rubel Telecom Customer Photos");
    props.setProperty(PROP_FOLDER_ID, folder.getId());
  }

  const sheet = spreadsheet.getSheets()[0];
  sheet.setName("Customer Submissions");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Submission ID", "Submitted At", "Customer Name", "Phone", "Work Description", "File Name", "Drive File ID", "MIME Type", "Status"]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 9).setFontWeight("bold");
  }
  Logger.log("Spreadsheet: " + spreadsheet.getUrl());
  Logger.log("Drive folder: " + folder.getName());
  return { spreadsheetUrl: spreadsheet.getUrl(), folderName: folder.getName(), message: "Setup complete. Keep the spreadsheet private." };
}

function submitCustomer(data) {
  if (!data || typeof data !== "object") throw new Error("ফর্মের তথ্য পাওয়া যায়নি।");
  if (String(data.website || "").trim()) throw new Error("জমা দেওয়া যায়নি।");

  const name = cleanText_(data.name, 100);
  const phone = cleanText_(data.phone, 25);
  const description = cleanText_(data.description || "", 500);
  if (!name) throw new Error("আপনার নাম লিখুন।");
  if (!phone || !/^[0-9+() .-]{7,25}$/.test(phone)) throw new Error("সঠিক মোবাইল নম্বর লিখুন।");
  if (!data.base64 || !data.fileName || !data.mimeType) throw new Error("একটি ছবি বা ডকুমেন্ট নির্বাচন করুন।");

  const mimeType = String(data.mimeType);
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (allowed.indexOf(mimeType) === -1) throw new Error("শুধু JPG, PNG, WEBP অথবা PDF ফাইল দিন।");
  const base64 = String(data.base64);
  if (base64.length > 7 * 1024 * 1024) throw new Error("ফাইলটি ৫ MB-এর বেশি। ছোট ফাইল দিন।");
  const bytes = Utilities.base64Decode(base64);
  if (bytes.length > MAX_FILE_BYTES) throw new Error("ফাইলটি ৫ MB-এর বেশি। ছোট ফাইল দিন।");

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const props = PropertiesService.getScriptProperties();
    const folderId = props.getProperty(PROP_FOLDER_ID);
    const sheetId = props.getProperty(PROP_SHEET_ID);
    if (!folderId || !sheetId) throw new Error("সিস্টেম এখনো সেটআপ করা হয়নি। দোকানদারকে জানান।");
    const folder = DriveApp.getFolderById(folderId);
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const sheet = spreadsheet.getSheetByName("Customer Submissions");
    if (!sheet) throw new Error("রেকর্ড শিট পাওয়া যায়নি।");

    const safeName = String(data.fileName).replace(/[\\/:*?"<>|#%{}^~]/g, "_").slice(0, 120) || "customer-file";
    const blob = Utilities.newBlob(bytes, mimeType, new Date().getTime() + "_" + safeName);
    const file = folder.createFile(blob);
    const submissionId = Utilities.getUuid();
    sheet.appendRow([submissionId, new Date(), name, phone, description, file.getName(), file.getId(), mimeType, "নতুন"]);
    return { ok: true, message: "আপনার তথ্য ও ফাইল সফলভাবে জমা হয়েছে।", submissionId: submissionId };
  } finally {
    lock.releaseLock();
  }
}

function cleanText_(value, maxLength) {
  return String(value == null ? "" : value).replace(/[<>]/g, "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, maxLength);
}
