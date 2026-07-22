const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const languages = {
  ru: "Политика конфиденциальности",
  es: "Política de Privacidad",
  pt: "Política de Privacidade",
  de: "Datenschutzrichtlinie",
  id: "Kebijakan Privasi"
};
const localizedConcepts = {
  ru: [
    /ИП Данила Демкин/,
    /(?:6 месяцев|шести месяцев)/i,
    /не (?:является|считается)[^.]{0,80}согласи/i,
    /Злоупотребление системой жалоб запрещено/i
  ],
  es: [
    /(?:6 meses|seis meses)/i,
    /no constituye[^.]{0,80}consentimiento/i,
    /prohibido abusar del sistema de denuncias/i
  ],
  pt: [
    /(?:6 meses|seis meses)/i,
    /não constitui[^.]{0,80}consentimento/i,
    /proibido abusar do sistema de denúncias/i
  ],
  de: [
    /(?:6 Monate|sechs Monate)/i,
    /keine?[^.]{0,80}(?:pauschale|allgemeine)[^.]{0,40}Einwilligung/i,
    /Missbrauch (?:des Melde|des Beschwerde|der Melde)/i
  ],
  id: [
    /(?:6 bulan|enam bulan)/i,
    /bukan[^.]{0,80}persetujuan/i,
    /penyalahgunaan sistem (?:laporan|pengaduan)/i
  ]
};
const forbiddenLocalizedPhrases = {
  ru: ["сообщить о злоупотреблениях запрещено", "чувственные данные", "уклоняться", "свети светом", "онлайн-стирание"],
  es: ["datos sensuales", "ayudantes de informes comunitarios", "haz brillar la luz"],
  pt: ["dados sensuais", "brilhe a luz"],
  de: ["sinnliche daten", "lass das licht erstrahlen"],
  id: ["data dan informasi sensual", "bersinar terang"]
};
const requiredEnglishSections = [
  "In-game badges",
  "Child Sexual Abuse and Exploitation (CSAE) Prohibition",
  "Employment Opportunities",
  "Transfer or Sale of Our Business or the Product",
  "Cookies and Related Technologies; Do Not Track (DNT)",
  "Online Behavioral Advertising (OBA) and How to Opt-Out of OBA",
  "Your Data protection rights under General Data Protection Regulation (GDPR)",
  "Your Data protection rights under the Brazilian General Data Protection Law (LGPD)",
  "Shine the Light",
  "Online Erasure",
  "User Data Deletion",
  "Privacy Policy Coordinator"
];
const requiredOutline = [
  "1.", "2.", "2.1.", "2.2.", "2.3.", "2.4.", "2.5.",
  "3.", "3.1.", "3.2.", "3.3.",
  "4.", "4.1.", "4.2.", "4.3.", "4.4.", "4.5.", "4.6.", "4.7.", "4.8.", "4.9.", "4.10.",
  "5.", "5.1.", "5.2.", "5.3.", "5.4.", "5.5.", "5.6.",
  "6.", "6.1.", "6.2.", "6.3.", "6.4.",
  "7.", "7.1.", "7.2.", "8.", "9.", "9.1.", "9.2.", "9.3.",
  "10.", "10.1.", "10.2.", "10.3.",
  "11.", "11.1.", "11.2.", "11.3.", "11.4.", "11.5.", "11.6.",
  "12.", "12.1.", "12.2.", "12.3.",
  "13.", "13.1", "13.2", "13.3", "13.4", "13.5",
  "14.", "14.1.", "14.2."
];
const regionalMarkers = ["CSAE", "DNT", "OBA", "GDPR", "LGPD", "CCPA"];
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
const forbiddenAdvertisingMarkers = ["VK Ads", "VK LLC", "help.mail.ru/legal/terms/adsvk"];
const uniqueProviderEntries = [
  "MGL MY.COM (CYPRUS) LIMITED",
  "Mintegral International Limited",
  "InMobi Pte. Ltd.",
  "zMaticoo, Inc."
];
const forbiddenEnglishClaims = [
  "Your consent to this Privacy Policy followed by",
  "we are a service provider for the California Consumer Privacy Act",
  "you agree to assume all risk in connection with your Data",
  "any sensual Data",
  "An advertising ID, such as the Apple IDFA"
];
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

test("the detailed English lawyer-drafted structure remains the fallback", async () => {
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/privacy.html`);
  const originalHtml = await page.locator(".infoCard").innerHTML();
  const originalText = await page.locator(".infoCard").innerText();
  const completeOriginalText = await page.locator(".infoCard").textContent();

  assert.match(originalText, /Privacy Policy/);
  assert.match(originalText, /Last Revised: July 16, 2026/);
  assert.ok(originalText.includes("six months from the receipt or processing of each message"));
  assert.ok(originalText.includes("including when the sender or another participant deletes an account"));
  assert.ok(originalText.includes("investigate abuse or possible crimes"));
  assert.equal(originalText.includes("retained for three years"), false);
  assert.ok(originalText.includes("not treated as blanket consent"));
  assert.ok(originalText.includes("intended to supplement and clarify, not reduce"));
  assert.ok(originalText.includes("registered accounts of citizens of the Russian Federation"));
  assert.ok(originalText.includes("initial account creation and the primary recording, systematization, accumulation, storage, clarification, and retrieval"));
  assert.ok(originalText.includes("Yandex Cloud servers in Russia"));
  assert.ok(originalText.includes("does not begin merely because an opt-out is offered later"));
  assert.ok(originalText.includes("https://optout.aboutads.info/") || originalHtml.includes("https://optout.aboutads.info/"));
  assert.ok(originalText.includes("do not describe ourselves as a CCPA “service provider”"));
  assert.ok(originalText.includes("do not manually enter or maintain a separate archive"));
  requiredEnglishSections.forEach((section) => {
    assert.ok(originalText.includes(section), `English policy lost detailed section: ${section}`);
  });
  requiredOutline.forEach((number) => {
    assert.ok(originalText.includes(number), `English policy lost outline item: ${number}`);
  });
  forbiddenEnglishClaims.forEach((claim) => {
    assert.equal(originalText.includes(claim), false, `English policy still contains an inaccurate legacy claim: ${claim}`);
  });
  advertisingMarkers.forEach((marker) => {
    assert.ok(completeOriginalText.includes(marker), `English policy is missing provider or scope: ${marker}`);
  });
  forbiddenAdvertisingMarkers.forEach((marker) => {
    assert.equal(originalHtml.includes(marker), false, `English policy still contains forbidden provider marker: ${marker}`);
  });
  uniqueProviderEntries.forEach((marker) => {
    assert.equal(completeOriginalText.split(marker).length - 1, 1, `English policy contains a duplicated or missing provider entry: ${marker}`);
  });
  const duplicateParagraphs = await page.locator(".infoCard p").evaluateAll((paragraphs) => {
    const counts = new Map();
    paragraphs
      .map((paragraph) => paragraph.textContent.replace(/\s+/g, " ").trim())
      .filter((paragraph) => paragraph.length > 20)
      .forEach((paragraph) => counts.set(paragraph, (counts.get(paragraph) || 0) + 1));
    return Array.from(counts.entries()).filter(([, count]) => count > 1);
  });
  assert.deepEqual(duplicateParagraphs, [], "English policy contains exact duplicated paragraphs");
  assert.equal(await page.locator("#privacy-language option").count(), 6);

  await page.selectOption("#privacy-language", "ru");
  await page.waitForFunction(() => document.documentElement.lang === "ru");
  await page.selectOption("#privacy-language", "en");
  await page.waitForFunction(() => document.documentElement.lang === "en");
  assert.equal(await page.locator(".infoCard").innerHTML(), originalHtml);

  await page.close();
});

test("every supported language loads the complete detailed policy", async () => {
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/privacy.html`);
  const englishLinks = await page.locator(".infoCard a").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  const englishTags = await page.locator(".infoCard *").evaluateAll((elements) => elements.map((element) => element.tagName));

  for (const [language, heading] of Object.entries(languages)) {
    await page.selectOption("#privacy-language", language);
    await page.waitForFunction((expected) => document.documentElement.lang === expected, language);
    const text = await page.locator(".infoCard").innerText();
    const completeText = await page.locator(".infoCard").textContent();
    const links = await page.locator(".infoCard a").evaluateAll((elements) => elements.map((link) => link.getAttribute("href")));
    const tags = await page.locator(".infoCard *").evaluateAll((elements) => elements.map((element) => element.tagName));
    const lowerText = text.toLocaleLowerCase(language);

    assert.match(text, new RegExp(heading, "i"), `${language} heading is missing`);
    assert.ok(text.length > 45000, `${language} translation is unexpectedly short and may have lost legal detail`);
    requiredOutline.forEach((number) => {
      assert.ok(text.includes(number), `${language} lost outline item: ${number}`);
    });
    regionalMarkers.forEach((marker) => {
      assert.ok(text.includes(marker), `${language} is missing regional/legal section: ${marker}`);
    });
    localizedConcepts[language].forEach((pattern) => {
      assert.match(text, pattern, `${language} is missing or mistranslates a key legal concept`);
    });
    forbiddenLocalizedPhrases[language].forEach((phrase) => {
      assert.equal(lowerText.includes(phrase), false, `${language} still contains known literal mistranslation: ${phrase}`);
    });
    advertisingMarkers.forEach((marker) => {
      assert.ok(completeText.includes(marker), `${language} is missing provider or scope: ${marker}`);
    });
    forbiddenAdvertisingMarkers.forEach((marker) => {
      assert.equal(completeText.includes(marker), false, `${language} still contains forbidden provider marker: ${marker}`);
    });
    uniqueProviderEntries.forEach((marker) => {
      assert.equal(completeText.split(marker).length - 1, 1, `${language} contains a duplicated or missing provider entry: ${marker}`);
    });
    assert.equal(text.includes("⟦PH"), false, `${language} contains an unresolved placeholder`);
    assert.equal(text.includes("Moderation and security records are retained only"), false, `${language} contains an untranslated English legal paragraph`);
    assert.deepEqual(tags, englishTags, `${language} changed the detailed HTML structure`);
    assert.deepEqual(links, englishLinks, `${language} changed policy links`);
    assert.equal(new URL(page.url()).searchParams.get("lang"), language);
  }

  await page.close();
});

test("the generated local bundle exactly matches all translation source files", async () => {
  const bundle = await fs.readFile(path.join(root, "privacy-translations.js"), "utf8");
  const context = { window: {} };
  vm.runInNewContext(bundle, context, { filename: "privacy-translations.js" });

  for (const language of Object.keys(languages)) {
    const source = await fs.readFile(path.join(root, "privacy-i18n", `${language}.html`), "utf8");
    assert.equal(context.window.PrivacyPolicyTranslations[language], source, `${language} bundle is stale`);
  }
});

test("Russian legal identity and moderation meaning are correct", async () => {
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/privacy.html?lang=ru`);
  await page.waitForFunction(() => document.documentElement.lang === "ru");
  const text = await page.locator(".infoCard").innerText();

  assert.ok(text.includes("ИП Данила Демкин"));
  assert.equal(text.includes("IP Demkin Danila"), false);
  assert.ok(text.toLowerCase().includes("публичн"));
  assert.ok(text.toLowerCase().includes("гост"));
  assert.ok(text.includes("Злоупотребление системой жалоб запрещено"));
  assert.ok(text.includes("при сборе персональных данных для зарегистрированных аккаунтов граждан Российской Федерации"));
  assert.ok(text.includes("первичные запись, систематизация, накопление, хранение, уточнение и извлечение"));
  assert.ok(text.includes("на серверах Yandex Cloud в России"));
  assert.ok(text.includes("Только после такой первичной обработки допустимая копия может быть зеркалирована или передана в Google Firebase в США"));
  assert.ok(text.includes("призвана дополнять и уточнять, а не сокращать права"));
  assert.ok(text.includes("Как отказаться от передачи данных в маркетинговых целях"));
  assert.equal(text.includes("Как отказаться от публикации в целях маркетинга"), false);
  assert.ok(text.includes("должен позволять принять или отклонить необязательные цели, а также повторно открыть и отозвать выбор"));
  assert.ok(text.includes("https://optout.aboutads.info/"));

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

test("account consent and retention documents retain approved facts", async () => {
  const page = await browser.newPage();

  await page.goto(`${baseUrl}/personal_data_new.html`);
  let text = await page.locator(".infoCard").innerText();
  assert.ok(text.includes("Last updated: 16 July 2026"));
  assert.ok(text.includes("6 months from each message"));
  assert.ok(text.includes("including after account deletion"));
  assert.ok(text.includes("investigation of abuse or suspected crimes"));
  assert.equal(text.includes("3 years"), false);
  assert.ok(text.includes("pseudonymous technical analytics"));
  assert.ok(text.includes("Liftoff Monetize (formerly Vungle)"));
  assert.ok(text.includes("Digital Turbine (formerly AdColony)"));
  assert.ok(text.includes("InMobi"));
  assert.ok(text.includes("zMaticoo"));
  assert.equal(text.includes("MyTarget (Mail.ru / VK)"), false);
  assert.equal(text.includes("Appodeal"), false, "Imposter 3D account consent must not attribute ABC Lore Appodeal use to this Product");

  await page.goto(`${baseUrl}/personal_data_ru_new.html`);
  text = await page.locator(".infoCard").innerText();
  assert.ok(text.includes("Версия: 2026-07-16"));
  assert.ok(text.includes("6 месяцев с момента каждого сообщения"));
  assert.ok(text.includes("в том числе после удаления аккаунта"));
  assert.ok(text.includes("расследование злоупотреблений или возможных преступлений"));
  assert.equal(text.includes("3 года"), false);
  assert.ok(text.includes("Первичная запись и хранение данных осуществляется в дата-центре Yandex Cloud (Россия)"));
  assert.ok(text.includes("Только после этого данные могут зеркалироваться в Google Firebase (США)"));
  assert.ok(text.includes("Компоненты Yandex AppMetrica"));

  await page.goto(`${baseUrl}/gamerules.html`);
  text = await page.locator(".infoCard").textContent();
  assert.ok(text.includes("Chat messages and related history are stored for 6 months from the time of each message, including after account deletion"));
  assert.ok(text.includes("investigation of abuse or suspected crimes"));
  assert.ok(text.includes("Сообщения чата и связанная с ними история хранятся 6 месяцев с момента отправки каждого сообщения, в том числе после удаления аккаунта"));
  assert.ok(text.includes("расследования злоупотреблений или возможных преступлений"));
  assert.equal(text.includes("3 years"), false);
  assert.equal(text.includes("3 года"), false);

  await page.close();
});
