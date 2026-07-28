const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const normalize = (value) => value.replace(/\s+/g, " ").trim();
const visibleText = (html) => normalize(html.replace(/<[^>]+>/g, " "))
  .replace(/\s+([.,;:!?])/g, "$1");

const englishConsent = normalize(`
  CLOUD ACCOUNT DATA PROCESSING CONSENT
  Version 3 — 28 July 2026
  Operator: IP Demkin Danila (Snow Bat). Privacy contact: snowbatstudio@gmail.com.
  Purposes. Creation and protection of a pseudonymous game account; automatic sign-in on this installation; cloud synchronization and restoration of progress; authorization of player chat and player/server name changes; support, abuse prevention and security.
  Data. A random account ID; current and previous pseudonymous DeviceHash values; a random installation credential (only its SHA-256 digest is stored by the server); nickname, platform, game version and last activity; experience, game statistics, numeric bestiary IDs and reserved versioned save data; consent version, language and time; a locally stored age-category choice (under 14 or 14 or older; no date of birth); minimal request/security logs. The hosting and routing providers necessarily process IP address and network metadata while transmitting requests.
  Processing actions. Collection, recording, organization, storage, clarification/update, retrieval, use, transmission to processors, restriction and deletion for the stated purposes.
  Processors and regions. Snow Bat backend services (snowbatstudio.ru) store the account and save. Cloudflare may route and protect requests through global infrastructure. Online multiplayer independently uses Photon as described in the Privacy Policy; this cloud consent does not control access to online modes. Depending on routing, data may be processed in Russia, the EEA, the United States and other provider regions.
  Retention. Account and progress are kept while the account exists. Previous DeviceHash aliases are kept with the account for continuity and security. Backups are kept for up to 7 days. After a valid closure/deletion request, active account data is normally deleted within 30 days, except limited records that must be retained for law, security, fraud prevention or dispute resolution.
  Your choice and rights. You may request access, correction, portability, restriction or deletion and may withdraw this consent by contacting snowbatstudio@gmail.com. Withdrawal does not affect processing already performed. Refusal or withdrawal disables the cloud account, player chat and player/server name changes. Online modes remain available with the current or automatically assigned names.
  Age category and minors. Before consent, the game asks only whether the user is under 14 or aged 14 or older; it does not request or store a date of birth. Users under 14 cannot create or use a cloud account, player chat, or player/server name changes. They may use online modes with the current or automatically assigned names. Users aged 14 or older may proceed only if they have also reached the applicable digital-consent age in their country; otherwise they must play without cloud. The age category can be corrected in Settings → Gameplay; changing it invalidates the current consent receipt. Changing the category to under 14 disables these restricted features but does not itself delete previously stored account data; deletion may be requested through the privacy contact.
  This consent is only for the cloud account, player chat and name authorization. It is not required for access to online modes and is not consent to advertising, analytics, marketing or sale of data. Those purposes require separate controls where applicable.
  The complete Privacy Policy is available at https://snokkk.github.io/privacy.html.
`);

const russianConsent = normalize(`
  СОГЛАСИЕ НА ОБРАБОТКУ ДАННЫХ ОБЛАЧНОГО АККАУНТА
  Версия 3 — 28 июля 2026 года
  Оператор: ИП Демкин Данила (Snow Bat). Контакт по вопросам данных: snowbatstudio@gmail.com.
  Цели. Создание и защита псевдонимного игрового аккаунта; автоматический вход на этой установке; синхронизация и восстановление прогресса; авторизация чата игроков и смены имени игрока или сервера; поддержка, предотвращение нарушений и обеспечение безопасности.
  Данные. Случайный ID аккаунта; текущий и прежние псевдонимные DeviceHash; случайный ключ установки (сервер хранит только его SHA-256-отпечаток); никнейм, платформа, версия игры и время последней активности; опыт, игровая статистика, числовые ID открытого бестиария и зарезервированные версионированные данные сохранения; версия, язык и время согласия; минимальные журналы запросов и безопасности; локально сохранённый выбор возрастной категории («младше 14» или «14 или старше»; без даты рождения). Хостинг и маршрутизация неизбежно обрабатывают IP-адрес и сетевые метаданные при передаче запросов.
  Действия. Сбор, запись, систематизация, хранение, уточнение и обновление, извлечение, использование, передача обработчикам, блокирование и удаление для указанных целей.
  Обработчики и регионы. Сервисы Snow Bat (snowbatstudio.ru) хранят аккаунт и сохранение. Cloudflare может маршрутизировать и защищать запросы через глобальную инфраструктуру. Сетевой режим независимо использует Photon, как описано в Политике конфиденциальности; это облачное согласие не управляет доступом к online-режимам. В зависимости от маршрута данные могут обрабатываться в России, ЕЭЗ, США и иных регионах провайдеров.
  Сроки. Аккаунт и прогресс хранятся, пока существует аккаунт. Прежние DeviceHash хранятся вместе с аккаунтом для непрерывности доступа и безопасности. Резервные копии хранятся до 7 дней. После действительного запроса на закрытие или удаление данные активного аккаунта обычно удаляются в течение 30 дней, кроме ограниченных записей, которые требуется сохранить по закону, для безопасности, предотвращения мошенничества или разрешения споров.
  Ваш выбор и права. Вы можете запросить доступ, исправление, перенос, ограничение или удаление и отозвать согласие через snowbatstudio@gmail.com. Отзыв не отменяет уже выполненную обработку. Отказ или отзыв отключает облачный аккаунт, чат игроков и смену имени игрока или сервера. Online-режимы остаются доступны с текущими или автоматически назначенными именами.
  Возрастная категория и несовершеннолетние. Перед согласием игра спрашивает только, младше ли пользователь 14 лет либо ему 14 лет или больше; дата рождения не запрашивается и не сохраняется. Пользователь младше 14 лет не может создать или использовать облачный аккаунт, чат игроков и смену имени игрока или сервера. Online-режимы доступны ему с текущими или автоматически назначенными именами. Пользователь 14 лет или старше может продолжить, только если он также достиг применимого в своей стране возраста цифрового согласия; иначе он должен играть без облака. Возрастную категорию можно исправить в Настройки → Gameplay; при изменении текущая квитанция согласия аннулируется. Изменение категории на «младше 14» отключает эти ограниченные функции, но само по себе не удаляет ранее сохранённые данные аккаунта; запросить удаление можно через контакт по вопросам данных.
  Это согласие относится только к облачному аккаунту, чату игроков и авторизации имён. Оно не требуется для доступа к online-режимам и не является согласием на рекламу, аналитику, маркетинг или продажу данных. Для таких целей при необходимости используются отдельные настройки.
  Полный текст Политики конфиденциальности: https://snokkk.github.io/privacy.html.
`);

test("privacy_abc exposes the exact English and Russian consent copies", () => {
  const html = read("privacy_abc.html");
  const text = visibleText(html);

  assert.ok(text.includes(englishConsent));
  assert.ok(text.includes(russianConsent));
  assert.match(html, /<section class="info container" id="en">/);
  assert.match(html, /<section class="info container" id="ru" lang="ru">/);
});

test("privacy_abc documents the minimal age gate and under-14 restrictions", () => {
  const text = visibleText(read("privacy_abc.html"));

  assert.match(text, /does not request or store a date of birth/i);
  assert.match(text, /Users under 14 cannot create or use a cloud account, player chat, or player\/server name changes/i);
  assert.match(text, /They may use online modes with the current or automatically assigned names/i);
  assert.match(text, /corrected in Settings → Gameplay/i);
  assert.match(text, /дата рождения не запрашивается и не сохраняется/i);
  assert.match(text, /Пользователь младше 14 лет не может создать или использовать облачный аккаунт, чат игроков и смену имени игрока или сервера/i);
  assert.match(text, /Online-режимы доступны ему с текущими или автоматически назначенными именами/i);
});

test("privacy_abc is canonical, discoverable and tracker-free", () => {
  const html = read("privacy_abc.html");
  const sitemap = read("sitemap.xml");

  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/snokkk\.github\.io\/privacy_abc\.html">/
  );
  assert.match(
    html,
    /<meta name="description" content="[^"]+">/
  );
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(
    sitemap,
    /<loc>https:\/\/snokkk\.github\.io\/privacy_abc\.html<\/loc>/
  );
  assert.doesNotMatch(html, /<script\b/i);
  assert.doesNotMatch(html, /https?:\/\/[^"' ]+\.(?:js|css)(?:["'? ])/i);
});
