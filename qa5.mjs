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

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();
await page.setViewport({ width: 360, height: 740, isMobile: true });
const pageErrors = [];
page.on("pageerror", e => pageErrors.push(String(e.message).slice(0, 150)));
await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 45000 });
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.reload({ waitUntil: "networkidle2" });

// Step 1 select exists in panel; switch to Health (non-vehicle)
await page.select("#insurance-type", "health");
await sleep(600);
let panel = await page.evaluate(() => document.querySelector("#panel-buy")?.innerText || "");
check("N1 non-vehicle skips to contact step", panel.includes("How can we contact you?"), panel.slice(0, 80).replace(/\n/g, " "));
check("N2 no reg-number field for health", !(await page.$("#reg-no")));

// "Change category" must return to step 1 (previously dead)
await clickByText(page, "#panel-buy button", "Change category");
await sleep(600);
const hasSelect = !!(await page.$("#insurance-type"));
check("N3 change-category returns to category select", hasSelect);
// Non-vehicle step 1 shows Continue (no reg box)
const hasReg = !!(await page.$("#reg-no"));
check("N4 non-vehicle step 1 has no reg box", !hasReg);
await clickByText(page, "#panel-buy button", "Continue");
await sleep(500);
panel = await page.evaluate(() => document.querySelector("#panel-buy")?.innerText || "");
check("N5 continue reaches contact step again", panel.includes("How can we contact you?"), panel.slice(0, 60).replace(/\n/g, " "));

// back to vehicle: select car from grid button in #insurance section
await clickByText(page, "#insurance button", "Bike Insurance");
await sleep(700);
const chip = await page.evaluate(() => document.querySelector("main section")?.innerText.slice(0, 60) || "");
check("N6 category card click switches context", chip.includes("Bike Insurance"), chip.replace(/\n/g, " "));
check("N7 no page errors", pageErrors.length === 0, pageErrors.join(" || "));

fs.writeFileSync("qa5-results.txt", out.join("\n") + "\n");
console.log(out.join("\n"));
await browser.close().catch(() => {});
process.exit(0);
