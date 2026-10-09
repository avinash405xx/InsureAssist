import puppeteer from "puppeteer-core";
import fs from "fs";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:4173";
const out = [];
const check = (name, cond, extra = "") => { out.push(`${cond ? "PASS" : "FAIL"} | ${name}${extra ? " | " + extra : ""}`); };

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function clickByText(page, selector, text) {
  return page.evaluate((sel, txt) => {
    const els = [...document.querySelectorAll(sel)];
    const el = els.find(e => (e.textContent || "").includes(txt));
    if (el) { el.click(); return true; }
    return false;
  }, selector, text);
}
async function textOf(page, selector) {
  return page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.textContent : ""; }, selector);
}
function devanagari(str) { return (str.match(/[\u0900-\u097F]+/g) || []).filter(x => x !== "हिंदी"); }

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--disable-gpu", "--window-size=360,740"] });
const page = await browser.newPage();
await page.setViewport({ width: 360, height: 740, isMobile: true, hasTouch: true });

const consoleErrors = [];
page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200)); });
page.on("pageerror", e => consoleErrors.push("pageerror: " + String(e.message).slice(0, 200)));

// Intercept APIs: lookup always fails (real-world worst case); lead/claim succeed.
await page.setRequestInterception(true);
page.on("request", req => {
  const url = req.url();
  if (url.includes("/api/vehicle-lookup")) return req.respond({ status: 404, contentType: "application/json", body: JSON.stringify({ ok: false, error: "not available" }) });
  if (url.includes("/api/leads")) return req.respond({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, leadId: "INS-TEST-001" }) });
  if (url.includes("/api/claims")) return req.respond({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, claimId: "CLM-TEST-001" }) });
  req.continue();
});

// ---------- 1. English first load (mobile 360) ----------
await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 45000 });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle2" });
await sleep(500);
let body = await page.evaluate(() => document.body.innerText);
let bad = devanagari(body);
check("T1 English default on first load", bad.length === 0, bad.slice(0, 6).join(" "));
check("T2 hero vehicle-number field visible", !!(await page.$("#hero-reg")));
const heroTxt = await page.evaluate(() => document.querySelector("h1")?.textContent || "");
check("T3 hero headline present", heroTxt.length > 5, heroTxt);
await page.screenshot({ path: "qa-360.png", fullPage: false });

// ---------- 2. Language switch: no reload, data kept ----------
await page.type("#hero-reg", "MH12AB1234");
await page.evaluate(() => { window.__marker = "alive"; });
const clickedHi = await clickByText(page, "button", "हिंदी");
await sleep(400);
body = await page.evaluate(() => document.body.innerText);
check("H1 Hindi appears after selecting हिंदी", body.includes("इंश्योरेंस") || body.includes("गाड़ी"), body.slice(0, 80).replace(/\n/g, " "));
const marker = await page.evaluate(() => window.__marker);
const regVal = await page.$eval("#hero-reg", el => el.value);
check("H2 no page reload on language switch", marker === "alive");
check("H3 form data preserved on language switch", regVal === "MH12AB1234", regVal);
check("H4 toggle button was clickable", clickedHi);
await clickByText(page, "button", "EN");
await sleep(400);
body = await page.evaluate(() => document.body.innerText);
bad = devanagari(body);
check("H5 back to full English after EN", bad.length === 0, bad.slice(0, 6).join(" "));
const regVal2 = await page.$eval("#hero-reg", el => el.value);
check("H6 form data still preserved", regVal2 === "MH12AB1234", regVal2);

fs.writeFileSync("qa-results.txt", out.join("\n") + "\n--STAGE1--\n");
console.log(out.join("\n"));
await browser.close().catch(() => {});
process.exit(0);
