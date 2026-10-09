import { CONFIG } from "./config";
import type { Claim, Lead, VehicleData } from "./types";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

export function track(event: string, data: Record<string, unknown> = {}) {
  if (window.fbq) window.fbq("trackCustom", event, data);
  if (window.clarity) window.clarity("event", event);
}

export function getUtm() {
  const p = new URLSearchParams(window.location.search);
  return {
    source: p.get("utm_source") || "",
    campaign: p.get("utm_campaign") || "",
    adSet: p.get("utm_adset") || "",
    adCreative: p.get("utm_content") || "",
  };
}

async function postJson<T>(endpoint: string, payload: unknown): Promise<T> {
  const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data as T;
}

export async function lookupVehicle(registrationNumber: string) {
  return postJson<{ ok: boolean; status: string; provider: string; vehicle?: VehicleData; message?: string }>(CONFIG.vehicleLookupEndpoint, { registrationNumber });
}

export async function saveLead(lead: Lead): Promise<{ ok: boolean; leadId: string; fallback?: boolean }> {
  try {
    return await postJson<{ ok: boolean; leadId: string }>(CONFIG.leadEndpoint, lead);
  } catch {
    const key = "insurance_leads_dev_fallback";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push(lead);
    localStorage.setItem(key, JSON.stringify(existing));
    return { ok: false, fallback: true, leadId: lead.leadId };
  }
}

export async function saveClaim(claim: Claim): Promise<{ ok: boolean; claimId: string; fallback?: boolean }> {
  try {
    return await postJson<{ ok: boolean; claimId: string }>(CONFIG.claimEndpoint, claim);
  } catch {
    const key = "insurance_claims_dev_fallback";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push(claim);
    localStorage.setItem(key, JSON.stringify(existing));
    return { ok: false, fallback: true, claimId: claim.claimId };
  }
}

export function createId(prefix: string) {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${date}-${random}`;
}

export function normalizeRegistration(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function expiryInfo(expiry: string, lang: "en" | "hi" = "en") {
  const noInfo = lang === "hi" ? "जानकारी उपलब्ध नहीं" : "Information not available";
  const expiredLabel = lang === "hi" ? "अवधि समाप्त" : "Expired";
  const daysWord = lang === "hi" ? "दिन शेष" : "days left";
  if (!expiry) return { bucket: "UNKNOWN" as const, days: null as number | null, label: noInfo };
  const d = new Date(`${expiry}T00:00:00`);
  if (Number.isNaN(d.getTime())) return { bucket: "UNKNOWN" as const, days: null, label: noInfo };
  const days = Math.ceil((d.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
  if (days < 0) return { bucket: "EXPIRED" as const, days, label: expiredLabel };
  return { bucket: days <= 7 ? "0_7_DAYS" : days <= 30 ? "8_30_DAYS" : days <= 60 ? "31_60_DAYS" : days <= 90 ? "61_90_DAYS" : "90_PLUS", days, label: `${days} ${daysWord}` };
}

export function formatDate(value: string) {
  if (!value) return "Not available";
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function loadMetaAndClarity() {
  const load = () => {
    if (CONFIG.metaPixelId && !document.getElementById("meta-pixel")) {
      const s = document.createElement("script"); s.id = "meta-pixel";
      s.async = true;
      s.src = "https://connect.facebook.net/en_US/fbevents.js";
      s.onload = () => {
        window.fbq?.("init", CONFIG.metaPixelId);
        window.fbq?.("track", "PageView");
      };
      document.head.appendChild(s);
    }
    if (CONFIG.clarityProjectId && !document.getElementById("clarity-script")) {
      const s = document.createElement("script"); s.id = "clarity-script";
      s.async = true;
      s.src = `https://www.clarity.ms/tag/${CONFIG.clarityProjectId}`;
      document.head.appendChild(s);
    }
  };
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
  if (ric) ric(load); else window.setTimeout(load, 1200);
}

// Category route support: /insurance/car | /insurance/bike | /insurance/commercial | /insurance/tractor
export function routeCategory(): string | null {
  const m = window.location.pathname.match(/^\/insurance\/([a-z-]+)\/?$/);
  return m ? m[1] : null;
}

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.content = content;
}

// Per-category SEO now lives in src/i18n (applyLangSeo) so titles and
// descriptions follow the active language. The old Hindi-only applySeo was
// removed to keep English as the default search-engine rendering.
