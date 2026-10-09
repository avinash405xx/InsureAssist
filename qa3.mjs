import puppeteer from "puppeteer-core";
import fs from "fs";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:4173";
const out = [];
const check = (n, c, e = "") => out.push(`${c ? "PASS" : "FAIL"} | ${n}${e ? " | " + e : ""}`);
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();
await page.setViewport({ width: 360, height: 740, isMobile: true });
const statuses = {};
page.on("response", r => { const u = r.url(); if (u.includes("/vehicles/")) statuses[u.split("/").pop()] = r.status(); });
await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 45000 });
await page.evaluate(() => document.querySelector("#insurance")?.scrollIntoView());
await sleep(800);
// scroll the carousel horizontally to reveal tractor + commercial cards
await page.evaluate(() => {
  const track = document.querySelector(".no-scrollbar");
  if (track) track.scrollLeft = track.scrollWidth;
});
await sleep(1800);
const imgs = await page.evaluate(() => [...document.querySelectorAll("#insurance img")].map(i => ({ src: i.getAttribute("src"), ok: i.complete && i.naturalWidth > 0 })));
check("K1 category images load when scrolled into view", imgs.length >= 4 && imgs.every(i => i.ok), JSON.stringify(imgs.map(i => [i.src, i.ok])));
const bad = Object.entries(statuses).filter(([, s]) => s !== 200);
check("K5 all vehicle image responses 200", bad.length === 0, JSON.stringify(statuses));
// screenshot of category section
await page.screenshot({ path: "qa-categories.png" });
fs.writeFileSync("qa3-results.txt", out.join("\n") + "\n");
console.log(out.join("\n"));
await browser.close().catch(() => {});
process.exit(0);
