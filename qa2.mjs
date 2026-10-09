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
async function setValue(page, selector, value) {
  return page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, val);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }, selector, value);
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();
await page.setViewport({ width: 360, height: 740, isMobile: true, hasTouch: true });
const consoleErrors = [];
page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 180)); });
page.on("pageerror", e => consoleErrors.push("pageerror: " + String(e.message).slice(0, 180)));
await page.setRequestInterception(true);
page.on("request", req => {
  const url = req.url();
  if (url.includes("/api/vehicle-lookup")) return req.respond({ status: 404, contentType: "application/json", body: "{}" });
  if (url.includes("/api/leads")) return req.respond({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, leadId: "INS-TEST-001" }) });
  if (url.includes("/api/claims")) return req.respond({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, claimId: "CLM-TEST-001" }) });
  req.continue();
});

// ---------- BUY FUNNEL with lookup FAILURE ----------
await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 45000 });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle2" });
await page.type("#hero-reg", "MH12AB1234");
await clickByText(page, "button", "Check Insurance Options");
await sleep(2500);
let panel = await page.evaluate(() => document.querySelector("#panel-buy")?.innerText || "");
check("F1 lookup failure shows manual fallback (no API error)", panel.includes("couldn't find the vehicle details") || panel.includes("continue manually"), panel.slice(0, 100).replace(/\n/g, " "));
check("F2 manual entry offered", (await page.evaluate(() => !!document.querySelector('input[placeholder="e.g. Maruti / Honda"]'))));
await clickByText(page, "#panel-buy button", "Continue");
await sleep(600);
panel = await page.evaluate(() => document.querySelector("#panel-buy")?.innerText || "");
check("F3 reached contact step (name + mobile only)", panel.includes("How can we contact you?"), panel.slice(0, 80).replace(/\n/g, " "));
await setValue(page, "#panel-buy input[autocomplete='name']", "Ramesh Kumar");
await setValue(page, "#panel-buy input[inputmode='numeric']", "9876543210");
await clickByText(page, "#panel-buy button", "Continue");
await sleep(600);
panel = await page.evaluate(() => document.querySelector("#panel-buy")?.innerText || "");
check("F4 reached requirement step", panel.includes("What help do you need?"), panel.slice(0, 80).replace(/\n/g, " "));
await clickByText(page, "#panel-buy button", "Renew my insurance");
await clickByText(page, "#panel-buy button", "Continue");
await sleep(600);
panel = await page.evaluate(() => document.querySelector("#panel-buy")?.innerText || "");
check("F5 reached options step", panel.includes("Available options"), panel.slice(0, 80).replace(/\n/g, " "));
check("F6 provider availability disclaimer shown", panel.includes("Availability depends on vehicle, location, product and eligibility"));
await clickByText(page, "#panel-buy button", "Get Insurance Assistance");
await sleep(600);
panel = await page.evaluate(() => document.querySelector("#panel-buy")?.innerText || "");
check("F7 reached review step", panel.includes("Review your details"), panel.slice(0, 80).replace(/\n/g, " "));
await page.click("#panel-buy input[type='checkbox']");
await clickByText(page, "#panel-buy button", "Submit Request");
await sleep(1500);
let bodyTxt = await page.evaluate(() => document.body.innerText);
check("F8 lead submission success screen", bodyTxt.includes("Request received."), bodyTxt.slice(0, 100).replace(/\n/g, " "));
// ---------- CLAIM FLOW ----------
await page.goto(BASE + "/?tab=claim", { waitUntil: "networkidle2", timeout: 45000 });
await sleep(800);
panel = await page.evaluate(() => document.querySelector("#panel-claim")?.innerText || "");
check("C1 claim tab opens claim form", panel.includes("Need help with an insurance claim?"), panel.slice(0, 80).replace(/\n/g, " "));
await setValue(page, "#panel-claim input[autocomplete='name']", "Suresh Patil");
await setValue(page, "#panel-claim input[inputmode='numeric']", "9876543210");
await setValue(page, "#panel-claim input[placeholder='MH12AB1234']", "MH12AB1234");
await setValue(page, "#panel-claim input[type='date']", "2026-10-01");
await setValue(page, "#panel-claim textarea[placeholder='Briefly describe what happened']", "Minor bumper damage in parking");
await page.click("#panel-claim input[type='checkbox']");
await clickByText(page, "#panel-claim button", "Submit Claim Request");
await sleep(1500);
bodyTxt = await page.evaluate(() => document.body.innerText);
check("C2 claim submission success screen", bodyTxt.includes("Request received."), bodyTxt.slice(0, 100).replace(/\n/g, " "));

// ---------- CATEGORIES + IMAGES ----------
await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 45000 });
await sleep(1000);
await page.evaluate(() => document.querySelector("#insurance")?.scrollIntoView());
await sleep(1500);
const cats = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll("#insurance img")].map(i => ({ src: i.getAttribute("src"), ok: i.complete && i.naturalWidth > 0 }));
  const txt = document.querySelector("#insurance")?.innerText || "";
  return { imgs, txt };
});
check("K1 all category images load", cats.imgs.length >= 4 && cats.imgs.every(i => i.ok), JSON.stringify(cats.imgs.map(i => i.ok)));
check("K2 truck represented in commercial category", cats.txt.includes("trucks"));
check("K3 tractor category present", cats.txt.includes("Tractor Insurance"));
check("K4 construction machinery NOT falsely offered", !cats.txt.toLowerCase().includes("excavator"));

// deep route
await page.goto(BASE + "/insurance/tractor", { waitUntil: "networkidle2", timeout: 45000 });
await sleep(800);
const chip = await page.evaluate(() => document.querySelector("main section")?.innerText.slice(0, 140) || "");
check("R1 /insurance/tractor deep link sets tractor context", chip.includes("Tractor Insurance"), chip.replace(/\n/g, " "));

// ---------- SCREENSHOTS ----------
await page.setViewport({ width: 390, height: 844 });
await page.goto(BASE + "/", { waitUntil: "networkidle2" });
await sleep(800);
await page.screenshot({ path: "qa-390.png" });
await page.setViewport({ width: 1280, height: 900 });
await page.goto(BASE + "/", { waitUntil: "networkidle2" });
await sleep(800);
await page.screenshot({ path: "qa-desktop.png" });

const relevantErrors = consoleErrors.filter(e => !e.includes("favicon") && !e.includes("net::ERR") && !e.includes("404"));
check("X1 no console/page errors", relevantErrors.length === 0, relevantErrors.slice(0, 3).join(" || "));

out.push("SCREENSHOTS: qa-360.png qa-390.png qa-desktop.png");
fs.writeFileSync("qa-results2.txt", out.join("\n") + "\n");
console.log(out.join("\n"));
await browser.close().catch(() => {});
process.exit(0);

