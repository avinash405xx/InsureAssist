// MVP lead endpoint: Vercel -> Google Apps Script -> Google Sheet.
// Set GOOGLE_APPS_SCRIPT_URL in Vercel. No Google service-account credentials are required here.

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = req.body;
  if (!body?.leadId || !body?.mobile || !body?.customerName) return res.status(400).json({ error: "Name, mobile and lead ID are required." });
  const endpoint = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!endpoint) return res.status(503).json({ error: "Lead backend is not configured yet." });
  try {
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "CREATE_LEAD", data: body }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result?.ok === false) return res.status(502).json({ error: "Lead could not be saved." });
    return res.status(200).json({ ok: true, leadId: body.leadId });
  } catch (error) {
    console.error("lead_save_error", error);
    return res.status(502).json({ error: "Lead backend unavailable." });
  }
}
