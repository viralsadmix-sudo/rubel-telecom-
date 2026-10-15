const APP_TITLE = "Rubel Telecom";
const PROP_SHEET_ID = "RUBEL_TELECOM_SHEET_ID";
const PROP_FOLDER_ID = "RUBEL_TELECOM_FOLDER_ID";
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function doGet(e) {
  const page = e && e.parameter ? String(e.parameter.page || "") : "";
  const file = page === "admin" ? "Admin" : "Index";
  const title = page === "admin" ? APP_TITLE + " — মালিকের অ্যাডমিন প্যানেল" : APP_TITLE + " — ছবি জমা দিন";
  return HtmlService.createHtmlOutputFromFile(file)
    .setTitle(title)
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

  let adminPin = props.getProperty("RUBEL_TELECOM_ADMIN_PIN");
  let newAdminPin = "";
  if (!adminPin) {
    adminPin = Utilities.getUuid().replace(/-/g, "").slice(0, 12);
    props.setProperty("RUBEL_TELECOM_ADMIN_PIN", adminPin);
    newAdminPin = adminPin;
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
  if (newAdminPin) Logger.log("ONE-TIME ADMIN PIN (save privately; it will not be shown again): " + newAdminPin);
  return { spreadsheetUrl: spreadsheet.getUrl(), folderName: folder.getName(), adminPin: newAdminPin || "(already set; not displayed for security)", message: "Setup complete. Keep the spreadsheet and Drive folder private." };
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


function getAdminSubmissions(pin) {
  requireAdminPin_(pin);
  const props = PropertiesService.getScriptProperties();
  const sheetId = props.getProperty(PROP_SHEET_ID);
  if (!sheetId) throw new Error("সিস্টেম সেটআপ করা হয়নি।");
  const sheet = SpreadsheetApp.openById(sheetId).getSheetByName("Customer Submissions");
  if (!sheet) throw new Error("কাস্টমার রেকর্ড শিট পাওয়া যায়নি।");
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const startRow = Math.max(2, lastRow - 199);
  const values = sheet.getRange(startRow, 1, lastRow - startRow + 1, 9).getValues();
  return values.reverse().map(function(row) {
    const fileId = String(row[6] || "");
    return {
      id: String(row[0] || ""),
      submittedAt: row[1] instanceof Date ? row[1].toISOString() : String(row[1] || ""),
      name: String(row[2] || ""),
      phone: String(row[3] || ""),
      description: String(row[4] || ""),
      fileName: String(row[5] || ""),
      mimeType: String(row[7] || ""),
      status: String(row[8] || "নতুন"),
      fileUrl: fileId ? "https://drive.google.com/file/d/" + encodeURIComponent(fileId) + "/view" : ""
    };
  });
}

function setSubmissionStatus(pin, submissionId, status) {
  requireAdminPin_(pin);
  const allowed = ["নতুন", "কাজ চলছে", "সম্পন্ন"];
  const safeId = String(submissionId || "").trim();
  const safeStatus = String(status || "").trim();
  if (!safeId || allowed.indexOf(safeStatus) === -1) throw new Error("তথ্য ঠিক নয়।");
  const sheetId = PropertiesService.getScriptProperties().getProperty(PROP_SHEET_ID);
  if (!sheetId) throw new Error("সিস্টেম সেটআপ করা হয়নি।");
  const sheet = SpreadsheetApp.openById(sheetId).getSheetByName("Customer Submissions");
  if (!sheet) throw new Error("কাস্টমার রেকর্ড শিট পাওয়া যায়নি।");
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error("কোনো জমা পাওয়া যায়নি।");
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === safeId) {
      sheet.getRange(i + 2, 9).setValue(safeStatus);
      return { ok: true, message: "স্ট্যাটাস আপডেট হয়েছে।" };
    }
  }
  throw new Error("এই জমাটি পাওয়া যায়নি।");
}

function requireAdminPin_(pin) {
  const expected = PropertiesService.getScriptProperties().getProperty("RUBEL_TELECOM_ADMIN_PIN");
  if (!expected || String(pin || "") !== expected) throw new Error("অ্যাডমিন PIN সঠিক নয়।");
}
