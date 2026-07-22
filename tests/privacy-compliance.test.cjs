const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const normalize = (value) => value.replace(/\s+/g, " ").trim();
const languages = ["ru", "es", "pt", "de", "id"];

const tagSignature = (html) => Array.from(
  html.matchAll(/<([a-z][a-z0-9-]*)\b[^>]*>/gi),
  (match) => match[1].toLowerCase()
);

test("English privacy policy separates age, consent, contract capacity and Guest data", () => {
  const html = normalize(read("privacy.html"));

  assert.ok(html.includes("Article 8 GDPR is not a universal account age"));
  assert.ok(html.includes("contractual capacity is governed separately by national law"));
  assert.ok(html.includes("Guest mode is therefore not represented as anonymous"));
  assert.ok(html.includes("IP addresses, advertising identifiers and persistent Device identifiers"));
  assert.ok(html.includes("separate verifiable parental consent required by COPPA"));
  assert.ok(html.includes("Email-plus or text-plus consent is not used"));

  assert.equal(html.includes("minimum age of digital consent applicable in their country"), false);
  assert.equal(html.includes("In many countries this is <strong>14</strong>"), false);
  assert.equal(html.includes("only with verifiable parental consent"), false);
});

test("EEA optional Device access requires prior consent and records the Article 27 gap", () => {
  const html = normalize(read("privacy.html"));

  assert.ok(html.includes("EU/EEA Device access and optional SDKs"));
  assert.ok(html.includes("Until valid consent has been obtained"));
  assert.ok(html.includes("must remain disabled"));
  assert.ok(html.includes("does not begin merely because an opt-out is offered later"));
  assert.ok(html.includes("10.3. EU/EEA Representative Status (Article 27 GDPR)"));
  assert.ok(html.includes("does not currently identify or assert the appointment"));
});

test("Apple provider protection and deletion duties are explicit", () => {
  const html = normalize(read("privacy.html"));

  assert.ok(html.includes("same or equivalent protection"));
  assert.ok(html.includes("required by applicable law and App Store rules"));
  assert.ok(html.includes("Account deletion also causes us to delete, return, or notify and instruct our processors"));
  assert.ok(html.includes("an app store or platform collected directly from you"));

  assert.equal(html.includes("rather than representing that every independent provider uses identical practices"), false);
  assert.equal(html.includes("does not necessarily delete provider-controlled advertising"), false);
});

test("July policy supplements the April policy without reviving inaccurate legacy clauses", () => {
  const html = normalize(read("privacy.html"));
  const preservedPersonalizedAdvertisingChoice = "Where prior consent is required, optional advertising processing does not begin merely because an opt-out is offered later. The in-Product consent or privacy-options interface must allow you to accept or reject optional purposes and revisit or withdraw your choice. Operating-system settings and provider controls may provide additional choices but do not replace prior consent where the law requires it. Rejecting or withdrawing optional advertising consent does not prevent contextual advertising that can be delivered without non-essential Device access, or technical processing that is strictly necessary to transmit, secure, or provide an expressly requested service. You may also contact support for assistance with Data controlled by us.";

  assert.ok(html.includes("Continuity with the prior Policy"));
  assert.ok(html.includes("intended to supplement and clarify, not reduce"));
  assert.ok(html.includes("rights, choices, protections, retention commitments, or Product practices"));
  assert.ok(html.includes("April 15, 2026 version"));
  assert.ok(html.includes("Nothing in this paragraph revives an inaccurate statement"));

  assert.ok(html.includes("registered accounts of citizens of the Russian Federation"));
  assert.ok(html.includes("initial account creation and the primary recording, systematization, accumulation, storage, clarification, and retrieval"));
  assert.ok(html.includes("Yandex Cloud servers in Russia"));
  assert.ok(html.includes("Only after that primary processing"));
  assert.ok(html.includes("mirrored or transferred to Google Firebase in the United States"));

  assert.ok(html.includes("We use the operational services listed above only"));
  assert.ok(html.includes("Advertising and analytics providers are used only for the disclosed"));
  assert.ok(html.includes("For optional marketing sharing of Data controlled by us"));
  assert.ok(html.includes("a request to the Privacy Policy Coordinator is an effective opt-out request"));
  assert.ok(html.includes("Marketing messages sent by an independent provider"));

  assert.ok(html.includes("https://optout.aboutads.info/"));
  assert.ok(html.includes("https://optout.networkadvertising.org/"));
  assert.ok(html.includes("https://www.youronlinechoices.com/"));
  assert.ok(html.includes("&ldquo;Ad Choices&rdquo; icon"));
  assert.ok(html.includes("https://allaboutdnt.com/"));
  assert.ok(html.includes(preservedPersonalizedAdvertisingChoice));

  assert.ok(html.includes("must receive appropriate handling guidance and be bound to preserve its confidentiality and security"));
  assert.ok(html.includes("committed to carrying out appropriate privacy and data-protection impact assessments"));
  assert.ok(html.includes("this Section controls to the extent necessary to preserve the protections required by the LGPD"));
  assert.ok(html.includes("to opt out of any future disclosure by us"));
  assert.ok(html.includes("creates a new internal account identifier"));
  assert.ok(html.includes("retained history remains attributed to the deleted account&apos;s former internal identifier"));

  assert.equal(html.includes("Your consent to this Privacy Policy followed by"), false);
  assert.equal(html.includes("you agree to assume all risk in connection with your Data"), false);
  assert.equal(html.includes("we are a service provider for the California Consumer Privacy Act"), false);
});

test("chat history remains attributable for six months after account deletion", () => {
  const html = normalize(read("privacy.html"));

  assert.ok(html.includes("Six-month chat retention"));
  assert.ok(html.includes("for six months from the receipt or processing of each message"));
  assert.ok(html.includes("including when the sender or another participant deletes an account"));
  assert.ok(html.includes("sender account or Player identifier"));
  assert.ok(html.includes("investigate abuse or possible crimes"));
  assert.ok(html.includes("Account deletion does not delete this history early"));
  assert.ok(html.includes("are not used for advertising or personalization"));
  assert.ok(html.includes("securely deleted or irreversibly anonymized after six months"));

  assert.equal(html.includes("Mandatory Russian communications retention"), false);
  assert.equal(html.includes("Specified records about message events and users are retained for three years"), false);
});

test("related account-consent documents no longer accept checkbox or ordinary email as parental verification", () => {
  const english = normalize(read("personal_data_new.html"));
  const russian = normalize(read("personal_data_ru_new.html"));
  const rules = normalize(read("gamerules.html"));
  const deletion = normalize(read("imp3d_account.html"));

  assert.ok(english.includes("An ordinary email does not by itself authorize account creation"));
  assert.ok(english.includes("6 months from each message, including after account deletion"));
  assert.ok(english.includes("investigation of abuse or suspected crimes"));
  assert.ok(russian.includes("Обычное письмо само по себе не разрешает создание аккаунта"));
  assert.ok(russian.includes("6 месяцев с момента каждого сообщения, в том числе после удаления аккаунта"));
  assert.ok(russian.includes("расследование злоупотреблений или возможных преступлений"));
  assert.ok(rules.includes("not universal account eligibility or contractual capacity"));
  assert.ok(rules.includes("не является универсальным возрастом аккаунта"));
  assert.ok(rules.includes("договороспособности"));
  assert.ok(deletion.includes("active account record, profile, progress, friends, and other associated user-generated content"));
  assert.ok(deletion.includes("within 30 days"));
  assert.ok(deletion.includes("retained for 6 months from each message, including after account deletion"));
  assert.ok(deletion.includes("investigation of abuse or suspected crimes"));

  assert.equal(english.includes("with subject “Parental Consent”"), false);
  assert.equal(english.includes("I am 14 years or older / I have verified parental consent"), false);
  assert.equal(russian.includes("с темой «Согласие родителя»"), false);
  assert.equal(russian.includes("у меня есть согласие родителя, подтверждённое"), false);
  assert.equal(deletion.includes("can take up to 5 business days"), false);
  assert.equal(english.includes("3 years"), false);
  assert.equal(russian.includes("3 года"), false);
  assert.equal(deletion.includes("3 years"), false);
});

test("all localized policies preserve the complete English HTML structure and compliance concepts", () => {
  const englishPage = read("privacy.html");
  const match = englishPage.match(/<article class="infoCard">([\s\S]*?)<\/article>/);
  assert.ok(match, "English infoCard was not found");
  const englishSignature = tagSignature(match[1]);

  for (const language of languages) {
    const localized = read(`privacy-i18n/${language}.html`);
    assert.deepEqual(tagSignature(localized), englishSignature, `${language} HTML structure differs from English`);
    assert.ok(localized.includes("COPPA"), `${language} is missing COPPA`);
    assert.ok(localized.includes("Article 27") || localized.includes("статьи 27") || localized.includes("artículo 27") || localized.includes("artigo 27") || localized.includes("Artikel 27") || localized.includes("Pasal 27"), `${language} is missing Article 27 status`);
    assert.match(localized, /App(?: |-)Store/, `${language} is missing same/equivalent App Store protection`);
    assert.ok(localized.includes("6"), `${language} is missing the six-month retention period`);
    assert.equal(/(?:^|[^0-9])3 (?:years|anos|Jahre|tahun|года)(?:[^0-9]|$)/i.test(localized), false, `${language} incorrectly restores a three-year retention claim`);
  }
});

test("generated translation bundle exactly matches localized sources", () => {
  const context = { window: {} };
  vm.runInNewContext(read("privacy-translations.js"), context, { filename: "privacy-translations.js" });

  for (const language of languages) {
    assert.equal(
      context.window.PrivacyPolicyTranslations[language],
      read(`privacy-i18n/${language}.html`),
      `${language} bundle is stale`
    );
  }
});
