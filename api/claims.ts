export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = req.body;
  if (!body?.claimId || !body?.mobile || !body?.customerName || !body?.registrationNo) return res.status(400).json({ error: "Name, mobile, vehicle number and claim ID are required." });
  const endpoint = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!endpoint) return res.status(503).json({ error: "Claim backend is not configured yet." });
  try {
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "CREATE_CLAIM", data: body }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result?.ok === false) return res.status(502).json({ error: "Claim request could not be saved." });
    return res.status(200).json({ ok: true, claimId: body.claimId });
  } catch (error) {
    console.error("claim_save_error", error);
    return res.status(502).json({ error: "Claim backend unavailable." });
  }
}
