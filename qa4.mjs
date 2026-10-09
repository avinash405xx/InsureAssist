import puppeteer from "puppeteer-core";
import fs from "fs";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:4173";
const out = [];
const check = (n, c, e = "") => out.push(`${c ? "PASS" : "FAIL"} | ${n}${e ? " | " + e : ""}`);
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function clickByText(page, selector, text) {
  return page.evaluate((sel, txt) => {
    const el = [...document.querySelectorAll(sel)].find(e => (e.textContent || "").includes(txt));
    if (el) { el.click(); return true; }
    return false;
  }, selector, text);
}
async function setValue(page, selector, value) {
  return page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, val);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }, selector, value);
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();
await page.setViewport({ width: 360, height: 740, isMobile: true });
const pageErrors = [];
page.on("pageerror", e => pageErrors.push(String(e.message).slice(0, 150)));
await page.setRequestInterception(true);
page.on("request", req => {
  const url = req.url();
  if (url.includes("/api/vehicle-lookup")) return req.respond({ status: 404, contentType: "application/json", body: "{}" });
  if (url.includes("/api/leads")) return req.respond({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, leadId: "INS-HI-001" }) });
  req.continue();
});

// ---------- HINDI FUNNEL SMOKE ----------
await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 45000 });
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.reload({ waitUntil: "networkidle2" });
await clickByText(page, "button", "हिंदी");
await sleep(400);
await page.type("#hero-reg", "MH12AB1234");
await clickByText(page, "button", "इंश्योरेंस विकल्प देखें");
await sleep(2200);
let panel = await page.evaluate(() => document.querySelector("#panel-buy")?.innerText || "");
check("HI-1 Hindi step 2 renders (fallback)", panel.includes("जानकारी") && !panel.includes("undefined"), panel.slice(0, 90).replace(/\n/g, " "));
await clickByText(page, "#panel-buy button", "आगे बढ़ें");
await sleep(500);
await setValue(page, "#panel-buy input[autocomplete='name']", "अमित शर्मा");
await setValue(page, "#panel-buy input[inputmode='numeric']", "9876543210");
await clickByText(page, "#panel-buy button", "आगे बढ़ें");
await sleep(500);
panel = await page.evaluate(() => document.querySelector("#panel-buy")?.innerText || "");
check("HI-2 Hindi contact step", panel.includes("संपर्क") && !panel.includes("undefined"), panel.slice(0, 90).replace(/\n/g, " "));
await clickByText(page, "#panel-buy button", "नया इंश्योरेंस चाहिए");
await clickByText(page, "#panel-buy button", "आगे बढ़ें");
await sleep(500);
panel = await page.evaluate(() => document.querySelector("#panel-buy")?.innerText || "");
check("HI-3 Hindi options step", panel.includes("उपलब्ध") && !panel.includes("undefined"), panel.slice(0, 90).replace(/\n/g, " "));
await clickByText(page, "#panel-buy button", "सहायता");
await sleep(500);
panel = await page.evaluate(() => document.querySelector("#panel-buy")?.innerText || "");
check("HI-4 Hindi review step (no undefined)", panel.includes("अपनी जानकारी") && !panel.includes("undefined"), panel.slice(0, 90).replace(/\n/g, " "));
check("HI-5 no page errors in Hindi flow", pageErrors.length === 0, pageErrors.slice(0, 2).join(" || "));

// ---------- SLOW NETWORK first load (Slow 3G emulation) ----------
const page2 = await browser.newPage();
await page2.setViewport({ width: 360, height: 740 });
const client = await page2.createCDPSession();
await client.send("Network.enable");
await client.send("Network.emulateNetworkConditions", { offline: false, latency: 400, downloadThroughput: 400 * 1024 / 8, uploadThroughput: 400 * 1024 / 8 });
const t0 = Date.now();
await page2.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
const tDcl = Date.now() - t0;
await sleep(2500);
const heroVisible = await page2.evaluate(() => !!document.querySelector("#hero-reg"));
check("S1 hero input usable on emulated Slow 3G", heroVisible, `DCL=${tDcl}ms`);

fs.writeFileSync("qa4-results.txt", out.join("\n") + "\n");
console.log(out.join("\n"));
await browser.close().catch(() => {});
process.exit(0);
