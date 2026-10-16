const APP_TITLE = "Rubel Telecom";
const PROP_SHEET_ID = "RUBEL_TELECOM_SHEET_ID";
const PROP_FOLDER_ID = "RUBEL_TELECOM_FOLDER_ID";
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function doGet(e) {
  const page = e && e.parameter ? String(e.parameter.page || "") : "";
  const file = page === "admin" ? "Admin" : (page === "ai" ? "AI" : (page === "prompts" ? "PromptAdmin" : "Index"));
  const title = page === "admin" ? APP_TITLE + " — মালিকের অ্যাডমিন প্যানেল" : (page === "ai" ? APP_TITLE + " — AI ছবি এডিট" : (page === "prompts" ? APP_TITLE + " — প্রম্পট পরিচালনা" : APP_TITLE + " — ছবি জমা দিন"));
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


function getSavedPrompts(pin) {
  requireAdminPin_(pin);
  return getPromptRows_();
}
function getPublicPrompts() {
  return getPromptRows_().map(function(p) { return {id:p.id,title:p.title,prompt:p.prompt}; });
}
function savePrompt(pin, promptData) {
  requireAdminPin_(pin);
  const title = cleanText_(promptData && promptData.title, 120);
  const prompt = String(promptData && promptData.prompt || "").trim().slice(0, 12000);
  const id = cleanText_(promptData && promptData.id, 80) || Utilities.getUuid();
  if (!title || !prompt) throw new Error("প্রম্পটের নাম ও সম্পূর্ণ লেখা দিন।");
  const sheet = getPromptSheet_();
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === id) {
      sheet.getRange(i + 1, 2, 1, 3).setValues([[title, prompt, new Date()]]);
      return {ok:true,message:"প্রম্পট আপডেট হয়েছে।"};
    }
  }
  sheet.appendRow([id,title,prompt,new Date()]);
  return {ok:true,message:"নতুন প্রম্পট যোগ হয়েছে।"};
}
function deletePrompt(pin, id) {
  requireAdminPin_(pin);
  const sheet = getPromptSheet_(), rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) { sheet.deleteRow(i + 1); return {ok:true,message:"প্রম্পট মুছে ফেলা হয়েছে।"}; }
  }
  throw new Error("প্রম্পটটি পাওয়া যায়নি।");
}
function getPromptSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(PROP_SHEET_ID);
  if (!id) throw new Error("সিস্টেম সেটআপ করা হয়নি।");
  const ss = SpreadsheetApp.openById(id);
  let sheet = ss.getSheetByName("AI Prompts");
  if (!sheet) { sheet = ss.insertSheet("AI Prompts"); sheet.appendRow(["Prompt ID","Title","Prompt Text","Updated At"]); sheet.setFrozenRows(1); sheet.getRange(1,1,1,4).setFontWeight("bold"); }
  return sheet;
}
function getPromptRows_() {
  const sheet = getPromptSheet_(), rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  return rows.slice(1).filter(function(r){return r[0] && r[1] && r[2];}).map(function(r){return {id:String(r[0]),title:String(r[1]),prompt:String(r[2]),updatedAt:r[3] instanceof Date?r[3].toISOString():String(r[3]||"")};}).reverse();
}
