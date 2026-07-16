const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");
const { buildPrivacyTranslationBundle } = require("./build-privacy-translation-bundle.cjs");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "privacy.html");
const outputDirectory = path.join(root, "privacy-i18n");
const targetLanguages = (process.env.PRIVACY_LANGUAGES || "ru,es,pt,de,id")
  .split(",")
  .filter(Boolean);
const maxBatchLength = 2200;
const protectedTerms = [
  "Imposter 3D: Online Horror",
  "Imposter 3D: Online horror",
  "Imposter 3D: online horror",
  "ABC Lore 3D: zombie online",
  "IP Demkin Danila (Snow Bat)",
  "IP Demkin Danila",
  "Snow Bat backend services",
  "Snow Bat",
  "Firebase Authentication",
  "Google Firebase",
  "Photon PUN 2",
  "NCMEC CyberTipline",
  "Google Play",
  "Google LLC",
  "YANDEX LLC",
  "AppLovin Corporation",
  "Chartboost, Inc.",
  "ironSource Ltd",
  "AdColony, Inc.",
  "Unity Software, Inc.",
  "Vungle, Inc.",
  "Bytedance Pte. Ltd",
  "MGL MY.COM (CYPRUS) LIMITED",
  "Mintegral International Limited",
  "Tapjoy, Inc.",
  "Start.io Inc.",
  "Apple Inc.",
  "Appodeal, Inc.",
  "Cloudflare Worker",
  "Cloudflare",
  "Discord",
  "Firebase",
  "Admob",
  "AppLovin",
  "Chartboost",
  "ironSource",
  "AdColony",
  "Unity Software",
  "Vungle",
  "Bytedance",
  "Mintegral",
  "TapJoy",
  "Start.io",
  "Appodeal",
  "BigoAds",
  "NCMEC",
  "GDPR",
  "LGPD",
  "CCPA",
  "PII",
  "PlayerID",
  "Firebase UID"
].sort((left, right) => right.length - left.length);

const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

const protectText = (text, placeholders) => {
  let protectedText = text;
  const protect = (value) => {
    const token = `⟦PH${String(placeholders.length).padStart(6, "0")}⟧`;
    placeholders.push({ token, value });
    return token;
  };

  protectedText = protectedText.replace(/<[^>]+>|&(?:[A-Za-z0-9]+|#[0-9]+|#x[0-9A-Fa-f]+);/g, protect);
  protectedText = protectedText.replace(/https?:\/\/[^\s)]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, protect);

  protectedTerms.forEach((term) => {
    if (protectedText.includes(term)) {
      protectedText = protectedText.split(term).join(protect(term));
    }
  });

  return protectedText;
};

const restoreText = (text, placeholders) => {
  let restoredText = text.trim();

  placeholders.slice().reverse().forEach(({ token, value }) => {
    restoredText = restoredText.split(token).join(value);
  });

  return restoredText;
};

const createBatches = (items) => {
  const batches = [];
  let batch = [];
  let length = 0;

  items.forEach((item) => {
    const itemLength = item.protectedText.length + 24;

    if (batch.length > 0 && length + itemLength > maxBatchLength) {
      batches.push(batch);
      batch = [];
      length = 0;
    }

    batch.push(item);
    length += itemLength;
  });

  if (batch.length > 0) {
    batches.push(batch);
  }

  return batches;
};

const requestTranslation = async (batch, language) => {
  const query = batch
    .map((item) => `⟦SEG${String(item.id).padStart(4, "0")}⟧\n${item.protectedText}`)
    .join("\n");
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "en");
  url.searchParams.set("tl", language);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", query);

  let lastError;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 privacy-localization-generator"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const translatedText = payload[0].map((part) => part[0]).join("");
      const matches = Array.from(translatedText.matchAll(/⟦SEG(\d{4})⟧/g));

      if (matches.length !== batch.length) {
        throw new Error(`Expected ${batch.length} segment markers, received ${matches.length}`);
      }

      return matches.map((match, index) => ({
        id: Number(match[1]),
        text: translatedText.slice(match.index + match[0].length, matches[index + 1]?.index ?? translatedText.length)
      }));
    } catch (error) {
      lastError = error;

      if (attempt < 4) {
        await wait(attempt * 1200);
      }
    }
  }

  throw new Error(`Translation request failed for ${language}: ${lastError.message}`);
};

const translateItems = async (items, language) => {
  const batches = createBatches(items);
  const translations = new Map();

  for (let index = 0; index < batches.length; index += 1) {
    const translatedBatch = await requestTranslation(batches[index], language);

    translatedBatch.forEach(({ id, text }) => {
      const item = items[id];
      translations.set(item.core, restoreText(text, item.placeholders));
    });

    process.stdout.write(`\r${language}: ${index + 1}/${batches.length} batches`);
    await wait(250);
  }

  process.stdout.write("\n");
  return translations;
};

const main = async () => {
  const source = await fs.readFile(sourcePath, "utf8");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.setContent(source);
    const sourceBlocks = await page.locator(".infoCard").evaluate((policy) => {
      return Array.from(policy.querySelectorAll("h1, h2, h3, h4, h5, h6, p, li"))
        .map((element) => element.innerHTML.trim())
        .filter((html) => html.length > 0);
    });
    const uniqueBlocks = Array.from(new Set(sourceBlocks));
    const items = uniqueBlocks.map((core, id) => {
      const placeholders = [];
      return {
        id,
        core,
        placeholders,
        protectedText: protectText(core, placeholders)
      };
    });

    await fs.mkdir(outputDirectory, { recursive: true });

    for (const language of targetLanguages) {
      const translations = await translateItems(items, language);
      await page.setContent(source);
      await page.locator(".infoCard").evaluate((policy, replacements) => {
        const replacementMap = new Map(replacements);
        const blocks = Array.from(policy.querySelectorAll("h1, h2, h3, h4, h5, h6, p, li"));

        blocks.forEach((block) => {
          const translatedBlock = replacementMap.get(block.innerHTML.trim());

          if (translatedBlock) {
            block.innerHTML = translatedBlock;
          }
        });
      }, Array.from(translations.entries()));

      const translatedPolicy = await page.locator(".infoCard").evaluate((policy) => policy.innerHTML);
      const output = `<!-- Static ${language} translation of the English text in privacy.html. -->\n${translatedPolicy.trim()}\n`;
      await fs.writeFile(path.join(outputDirectory, `${language}.html`), output, "utf8");
    }

    await buildPrivacyTranslationBundle();
  } finally {
    await browser.close();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
