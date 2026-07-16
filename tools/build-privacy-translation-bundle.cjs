const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const languages = ["ru", "es", "pt", "de", "id"];

const buildPrivacyTranslationBundle = async () => {
  const translations = {};

  for (const language of languages) {
    translations[language] = await fs.readFile(
      path.join(root, "privacy-i18n", `${language}.html`),
      "utf8"
    );
  }

  const bundle = `window.PrivacyPolicyTranslations = Object.freeze(${JSON.stringify(translations)});\n`;
  await fs.writeFile(path.join(root, "privacy-translations.js"), bundle, "utf8");
};

module.exports = { buildPrivacyTranslationBundle };

if (require.main === module) {
  buildPrivacyTranslationBundle().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
