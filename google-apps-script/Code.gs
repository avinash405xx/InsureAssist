/**
 * Insurance lead/claim backend for Google Apps Script.
 *
 * Architecture:
 * Browser -> Vercel /api/leads or /api/claims -> this Web App -> Google Sheets
 *
 * Set these Script Properties before deployment:
 * SHEET_ID = Google Spreadsheet ID
 * DRIVE_FOLDER_ID = 1H4gFi2Pt1KYzfHLuB34pWOknGyKYh3yO (your private Drive folder)
 */

const LEAD_HEADERS = [
  "Lead ID","Created At","Lead Status","Lead Source","Campaign","Ad Set","Ad Creative","Customer Name","Mobile","Email",
  "Insurance Category","Vehicle Type","Vehicle Registration No","Vehicle Make","Vehicle Model","Vehicle Variant","Vehicle Year","Vehicle Fuel",
  "Vehicle Usage","Commercial/Private","Vehicle Owner Name","Previous Insurance","Previous Insurer","Policy Start Date","Policy Expiry Date",
  "Policy Expiry Bucket","Days Until Expiry","Current Insurer","Claim Last Year","NCB","Quote Required","Documents Status","RC Available",
  "Aadhaar Uploaded","Other Document Uploaded","Consent Status","Consent Timestamp","Vehicle Lookup Status","Vehicle Lookup Provider","Vehicle Lookup Timestamp",
  "Assigned Agent","Follow-up Date","Quote Status","Quote Amount","Insurer","Quote Reference","Customer Contacted","Call Status","Customer Interest",
  "Payment Status","Policy Status","Policy Number","Policy Document","Commission","Notes"
];

const CLAIM_HEADERS = [
  "Claim ID","Created At","Customer Name","Mobile","Email","Vehicle Registration No","Policy Number","Insurer","Claim Type","Incident Date",
  "Description","Preferred Contact","Documents Available","Claim Status","Consent Status","Consent Timestamp","Lead Source","Campaign","Ad Set","Ad Creative",
  "Assigned Agent","Next Follow-up Date","Last Contacted","Insurer Claim Reference","Documents Status","Notes"
];

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function props_() {
  const p = PropertiesService.getScriptProperties();
  return { sheetId: p.getProperty("SHEET_ID"), folderId: p.getProperty("DRIVE_FOLDER_ID") };
}

function getSheet_(name, headers) {
  const { sheetId } = props_();
  if (!sheetId) throw new Error("SHEET_ID is not configured.");
  const ss = SpreadsheetApp.openById(sheetId);
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sheet;
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const action = payload.action;
    const data = payload.data || {};
    if (action === "CREATE_LEAD") return createLead_(data);
    if (action === "CREATE_CLAIM") return createClaim_(data);
    return json_({ ok: false, error: "Unknown action" });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: "Server error" });
  }
}

function createLead_(d) {
  if (!d.leadId || !d.customerName || !d.mobile) return json_({ ok: false, error: "Missing required fields" });
  const sheet = getSheet_("Leads", LEAD_HEADERS);
  const row = LEAD_HEADERS.map(h => ({
    "Lead ID": d.leadId, "Created At": d.createdAt || new Date().toISOString(), "Lead Status": d.leadStatus || "NEW", "Lead Source": d.source,
    "Campaign": d.campaign, "Ad Set": d.adSet, "Ad Creative": d.adCreative, "Customer Name": d.customerName, "Mobile": d.mobile, "Email": d.email,
    "Insurance Category": d.insuranceCategory, "Vehicle Type": d.vehicleType, "Vehicle Registration No": d.registrationNo, "Vehicle Make": d.vehicleMake,
    "Vehicle Model": d.vehicleModel, "Vehicle Variant": d.vehicleVariant, "Vehicle Year": d.vehicleYear, "Vehicle Fuel": d.vehicleFuel, "Vehicle Usage": d.vehicleUsage,
    "Commercial/Private": d.commercialPrivate, "Vehicle Owner Name": d.ownerName, "Previous Insurance": d.previousInsurance, "Previous Insurer": d.previousInsurer,
    "Policy Start Date": d.policyStartDate, "Policy Expiry Date": d.policyExpiryDate, "Policy Expiry Bucket": d.policyExpiryBucket, "Days Until Expiry": d.daysUntilExpiry,
    "Current Insurer": d.currentInsurer, "Claim Last Year": d.claimLastYear, "NCB": d.ncb, "Quote Required": d.quoteRequired, "Documents Status": d.documentsStatus,
    "RC Available": d.rcUploaded, "Aadhaar Uploaded": d.aadhaarUploaded, "Other Document Uploaded": d.otherDocumentUploaded, "Consent Status": d.consentStatus,
    "Consent Timestamp": d.consentTimestamp, "Vehicle Lookup Status": d.vehicleLookupStatus, "Vehicle Lookup Provider": d.vehicleLookupProvider, "Vehicle Lookup Timestamp": d.vehicleLookupTimestamp,
  }[h] ?? ""));
  sheet.appendRow(row);
  return json_({ ok: true, leadId: d.leadId });
}

function createClaim_(d) {
  if (!d.claimId || !d.customerName || !d.mobile || !d.registrationNo) return json_({ ok: false, error: "Missing required fields" });
  const sheet = getSheet_("Claims", CLAIM_HEADERS);
  const row = CLAIM_HEADERS.map(h => ({
    "Claim ID": d.claimId, "Created At": d.createdAt || new Date().toISOString(), "Customer Name": d.customerName, "Mobile": d.mobile, "Email": d.email,
    "Vehicle Registration No": d.registrationNo, "Policy Number": d.policyNumber, "Insurer": d.insurer, "Claim Type": d.claimType, "Incident Date": d.incidentDate,
    "Description": d.description, "Preferred Contact": d.preferredContact, "Documents Available": d.documentsAvailable, "Claim Status": d.claimStatus || "NEW",
    "Consent Status": d.consentStatus, "Consent Timestamp": d.consentTimestamp, "Lead Source": d.source, "Campaign": d.campaign, "Ad Set": d.adSet, "Ad Creative": d.adCreative,
  }[h] ?? ""));
  sheet.appendRow(row);
  return json_({ ok: true, claimId: d.claimId });
}

function setup() {
  const p = PropertiesService.getScriptProperties();
  // IMPORTANT: replace SHEET_ID with your actual Google Spreadsheet ID.
  // Keep the Drive folder private.
  if (!p.getProperty("DRIVE_FOLDER_ID")) p.setProperty("DRIVE_FOLDER_ID", "1H4gFi2Pt1KYzfHLuB34pWOknGyKYh3yO");
  if (!p.getProperty("SHEET_ID")) throw new Error("Set SHEET_ID in Project Settings > Script Properties, then run setup().");
  getSheet_("Leads", LEAD_HEADERS);
  getSheet_("Claims", CLAIM_HEADERS);
}
