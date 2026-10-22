/**
 * Rubel Telecom Google Drive backup receiver.
 *
 * Deploy as a Google Apps Script Web App. Configure Script Properties:
 *   BACKUP_TOKEN      = long random secret (same value stored server-side in Appwrite)
 *   DRIVE_FOLDER_ID   = ID of a private Drive folder for backups
 *
 * IMPORTANT: Never put BACKUP_TOKEN in a public webpage or APK.
 */
const MAX_PAYLOAD_BYTES = 900000;

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return jsonOutput_({ ok: true, service: "Rubel Telecom backup receiver", note: "POST only; backup status does not imply a backup has run." });
}

function doPost(e) {
  const props = PropertiesService.getScriptProperties();
  const expectedToken = props.getProperty("BACKUP_TOKEN");
  const folderId = props.getProperty("DRIVE_FOLDER_ID");

  if (!expectedToken || !folderId) {
    return jsonOutput_({ ok: false, error: "Backup receiver is not configured." });
  }

  let payload;
  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : "";
    if (!raw || Utilities.newBlob(raw).getBytes().length > MAX_PAYLOAD_BYTES) {
      return jsonOutput_({ ok: false, error: "Payload is empty or too large." });
    }
    payload = JSON.parse(raw);
  } catch (err) {
    return jsonOutput_({ ok: false, error: "Invalid JSON payload." });
  }

  if (!payload || payload.token !== expectedToken) {
    return jsonOutput_({ ok: false, error: "Unauthorized." });
  }

  const backupType = String(payload.backupType || "");
  const allowedTypes = ["appwrite-export", "chat-export", "manual-test"];
  if (!allowedTypes.includes(backupType)) {
    return jsonOutput_({ ok: false, error: "Unsupported backup type." });
  }

  if (payload.data === undefined || payload.data === null) {
    return jsonOutput_({ ok: false, error: "Backup data is missing." });
  }

  try {
    const folder = DriveApp.getFolderById(folderId);
    const timestamp = Utilities.formatDate(new Date(), "UTC", "yyyy-MM-dd_HH-mm-ss");
    const safeType = backupType.replace(/[^a-z0-9-]/gi, "-");
    const fileContent = JSON.stringify({
      schemaVersion: 1,
      backupType: backupType,
      createdAt: new Date().toISOString(),
      source: "Rubel Telecom",
      data: payload.data
    }, null, 2);
    const file = folder.createFile(
      "rubel-telecom-" + safeType + "-" + timestamp + ".json",
      fileContent,
      MimeType.PLAIN_TEXT
    );
    return jsonOutput_({ ok: true, backupId: file.getId(), fileName: file.getName(), createdAt: new Date().toISOString() });
  } catch (err) {
    console.error("Drive backup failed: " + (err && err.message ? err.message : "unknown error"));
    return jsonOutput_({ ok: false, error: "Could not save backup. Check Drive folder permissions and Script authorization." });
  }
}
