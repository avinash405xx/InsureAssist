# Google Apps Script backend

1. Create a Google Spreadsheet for lead/claim management.
2. Open Extensions → Apps Script.
3. Paste `Code.gs`.
4. In Project Settings → Script Properties add:
   - `SHEET_ID` = your spreadsheet ID
   - `DRIVE_FOLDER_ID` = `1H4gFi2Pt1KYzfHLuB34pWOknGyKYh3yO`
5. Run `setup()` once and authorize it.
6. Deploy → New deployment → Web app.
7. Execute as: Me.
8. Access: choose the least-permissive option compatible with your Vercel backend. If using a public endpoint, add abuse controls/rate limiting at the Vercel layer before advertising.
9. Copy the Web App URL into Vercel `GOOGLE_APPS_SCRIPT_URL`.

The Drive folder is intended to remain private. The current frontend does not upload RC/Aadhaar files; it only records document availability. If file uploads are added later, use private storage and store only file IDs/status in Sheets.
