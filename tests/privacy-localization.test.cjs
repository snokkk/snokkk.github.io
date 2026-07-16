const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const languages = {
  ru: "Политика конфиденциальности",
  es: "Política de Privacidad",
  pt: "Política de Privacidade",
  de: "Datenschutzerklärung",
  id: "Kebijakan Privasi"
};
const legalMarkers = {
  ru: ["минимальный возраст цифрового согласия", "6 месяцев", "Мы не продаем эти данные"],
  es: ["edad mínima de consentimiento digital", "6 meses", "No vendemos estos datos"],
  pt: ["idade mínima de consentimento digital", "6 meses", "Não vendemos esses dados"],
  de: ["Mindestalter für die digitale Einwilligung", "6 Monate", "Wir verkaufen diese Daten nicht"],
  id: ["usia minimum persetujuan digital", "6 bulan", "Kami tidak menjual data ini"]
};
const advertisingMarkers = [
  "InMobi",
  "zMaticoo",
  "AppMetrica",
  "Digital Turbine",
  "Liftoff",
  "MGL MY.COM (CYPRUS) LIMITED",
  "Mintegral International Limited",
  "ABC Lore 3D: zombie online"
];
const forbiddenAdvertisingMarkers = [
  "VK Ads",
  "VK LLC",
  "help.mail.ru/legal/terms/adsvk"
];
const englishRetainedRecords = "Moderation and security records are retained only for as long as reasonably necessary for these purposes and are deleted or anonymized in accordance with this Privacy Policy, unless longer retention is required for security, fraud prevention, dispute resolution, or legal obligations.";
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png"
};

let browser;
let server;
let baseUrl;

test.before(async () => {
  server = http.createServer(async (request, response) => {
    const pathname = new URL(request.url, "http://localhost").pathname;
    const relativePath = pathname === "/" ? "privacy.html" : decodeURIComponent(pathname.slice(1));
    const filePath = path.resolve(root, relativePath);

    if (!filePath.startsWith(`${root}${path.sep}`) && filePath !== path.join(root, "privacy.html")) {
      response.writeHead(403).end();
      return;
    }

    try {
      const body = await fs.readFile(filePath);
      response.writeHead(200, { "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream" });
      response.end(body);
    } catch (error) {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
});

test.after(async () => {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
});

test("the original English policy remains the fallback", async () => {
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/privacy.html`);
  const originalHtml = await page.locator(".infoCard").innerHTML();
  const originalText = await page.locator(".infoCard").innerText();

  assert.match(originalText, /Privacy Policy/);
  assert.match(originalText, /Last Revised: July 16, 2026/);
  advertisingMarkers.forEach((marker) => {
    assert.ok(originalText.includes(marker), `English policy is missing advertising provider or scope: ${marker}`);
  });
  forbiddenAdvertisingMarkers.forEach((marker) => {
    assert.equal(originalHtml.includes(marker), false, `English policy still contains forbidden provider marker: ${marker}`);
  });
  assert.equal(await page.locator("#privacy-language option").count(), 6);

  await page.selectOption("#privacy-language", "ru");
  await page.waitForFunction(() => document.documentElement.lang === "ru");
  await page.selectOption("#privacy-language", "en");
  await page.waitForFunction(() => document.documentElement.lang === "en");
  assert.equal(await page.locator(".infoCard").innerHTML(), originalHtml);

  await page.close();
});

test("every supported language loads complete static policy content", async () => {
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/privacy.html`);
  const englishNumbers = (await page.locator(".infoCard").innerText()).match(/\d+(?:\.\d+)*/g).sort();
  const englishLinks = await page.locator(".infoCard a").evaluateAll((links) => links.map((link) => link.getAttribute("href")));

  for (const [language, heading] of Object.entries(languages)) {
    await page.selectOption("#privacy-language", language);
    await page.waitForFunction((expected) => document.documentElement.lang === expected, language);
    const text = await page.locator(".infoCard").innerText();
    const numbers = text.match(/\d+(?:\.\d+)*/g).sort();
    const links = await page.locator(".infoCard a").evaluateAll((elements) => elements.map((link) => link.getAttribute("href")));

    assert.match(text, new RegExp(heading, "i"), `${language} heading is missing`);
    assert.ok(text.length > 40000, `${language} translation is unexpectedly short`);
    assert.equal(text.includes(englishRetainedRecords), false, `${language} contains an untranslated legal paragraph`);
    legalMarkers[language].forEach((marker) => {
      assert.ok(text.includes(marker), `${language} is missing legal concept: ${marker}`);
    });
    advertisingMarkers.forEach((marker) => {
      assert.ok(text.includes(marker), `${language} is missing advertising provider or scope: ${marker}`);
    });
    forbiddenAdvertisingMarkers.forEach((marker) => {
      assert.equal(text.includes(marker), false, `${language} still contains forbidden provider marker: ${marker}`);
    });
    assert.equal(text.includes("⟦PH"), false, `${language} contains an unresolved placeholder`);
    assert.deepEqual(numbers, englishNumbers, `${language} changed numeric facts`);
    assert.deepEqual(links, englishLinks, `${language} changed policy links`);
    assert.equal(new URL(page.url()).searchParams.get("lang"), language);
  }

  await page.close();
});

test("Russian legal name and key legal concepts are localized", async () => {
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/privacy.html?lang=ru`);
  await page.waitForFunction(() => document.documentElement.lang === "ru");
  const text = await page.locator(".infoCard").innerText();

  assert.ok(text.includes("ИП Данила Демкин"));
  assert.equal(text.includes("IP Demkin Danila"), false);
  assert.ok(text.includes("публичным"));
  assert.ok(text.includes("Гость"));
  assert.ok(text.includes("не могут"));

  await page.close();
});

test("direct language URLs and invalid-language fallback work", async () => {
  const page = await browser.newPage();

  await page.goto(`${baseUrl}/privacy.html?lang=de`);
  await page.waitForFunction(() => document.documentElement.lang === "de");
  assert.equal(await page.locator("#privacy-language").inputValue(), "de");

  await page.goto(`${baseUrl}/privacy.html?lang=unsupported`);
  await page.waitForFunction(() => document.documentElement.lang === "en");
  assert.equal(await page.locator("#privacy-language").inputValue(), "en");

  await page.close();
});

test("the language switcher remains usable on a phone-sized viewport", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${baseUrl}/privacy.html`);
  const switcherBox = await page.locator("[data-privacy-language-switcher]").boundingBox();
  const selectBox = await page.locator("#privacy-language").boundingBox();

  assert.ok(selectBox.width >= switcherBox.width - 1);
  assert.ok(selectBox.x >= 0 && selectBox.x + selectBox.width <= 390);

  await page.close();
});

test("translations load when privacy.html is opened directly from the filesystem", async () => {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.join(root, "privacy.html")).href);
  await page.selectOption("#privacy-language", "ru");
  await page.waitForFunction(() => document.documentElement.lang === "ru");

  assert.match(await page.locator(".infoCard").innerText(), /Политика конфиденциальности/i);
  assert.equal(await page.locator("#privacy-language").inputValue(), "ru");

  await page.close();
});
