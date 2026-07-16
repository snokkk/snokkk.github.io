const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const retainedRecords = {
  ru: "Записи о модерации и безопасности хранятся только столько времени, сколько разумно необходимо для этих целей, и удаляются или обезличиваются в соответствии с настоящей Политикой конфиденциальности, если только более длительное хранение не требуется для безопасности, предотвращения мошенничества, разрешения споров или соблюдения законодательства.",
  es: "Los registros de moderación y seguridad se conservan únicamente durante el tiempo razonablemente necesario para estos fines y se eliminan o anonimizan de acuerdo con esta Política de Privacidad, salvo que sea necesario conservarlos durante más tiempo por motivos de seguridad, prevención del fraude, investigación de abusos, resolución de disputas o cumplimiento legal.",
  pt: "Os registros de moderação e segurança são mantidos apenas pelo tempo razoavelmente necessário para essas finalidades e são excluídos ou anonimizados de acordo com esta Política de Privacidade, exceto quando uma retenção mais longa for necessária para segurança, prevenção de fraudes, investigação de abusos, resolução de disputas ou conformidade legal.",
  de: "Moderations- und Sicherheitsaufzeichnungen werden nur so lange aufbewahrt, wie es für diese Zwecke angemessen erforderlich ist, und gemäß dieser Datenschutzerklärung gelöscht oder anonymisiert, es sei denn, eine längere Aufbewahrung ist aus Sicherheitsgründen, zur Betrugsprävention, zur Untersuchung von Missbrauch, zur Beilegung von Streitigkeiten oder zur Einhaltung gesetzlicher Pflichten erforderlich.",
  id: "Catatan moderasi dan keamanan disimpan hanya selama diperlukan secara wajar untuk tujuan tersebut dan dihapus atau dianonimkan sesuai dengan Kebijakan Privasi ini, kecuali penyimpanan yang lebih lama diperlukan untuk keamanan, pencegahan penipuan, penyelidikan penyalahgunaan, penyelesaian sengketa, atau kepatuhan hukum."
};
const englishRetainedRecords = "Moderation and security records are retained only for as long as reasonably necessary for these purposes and are deleted or anonymized in accordance with this Privacy Policy, unless longer retention is required for security, fraud prevention, dispute resolution, or legal obligations.";

const corrections = {
  ru: [
    ["IP Demkin Danila (Snow Bat)", "ИП Данила Демкин (Snow Bat)"],
    ["<p>Внутриигровой чат — <strong>public</strong>: сообщения видны другим игрокам в той же игровой сессии.\n  Продукт не предоставляет личные/прямые сообщения между пользователями.</p>", "<p>Внутриигровой чат является <strong>публичным</strong>: сообщения видны другим игрокам в той же игровой сессии.\n  Продукт не предоставляет личные или прямые сообщения между пользователями.</p>"],
    ["<strong>Guest</strong>", "<strong>Гость</strong>"],
    ["внутриигровые роли имеют <strong>не имеют возможности</strong> применять штрафы", "внутриигровые роли <strong>не могут</strong> применять штрафы"],
    [englishRetainedRecords, retainedRecords.ru]
  ],
  es: [
    ["<strong>no</strong> la capacidad de aplicar penalizaciones", "<strong>no tienen la capacidad</strong> de aplicar penalizaciones"],
    [englishRetainedRecords, retainedRecords.es],
    ["<strong>Product</strong> son aplicaciones móviles", "<strong>Producto</strong> son aplicaciones móviles"]
  ],
  pt: [
    ["<p>O chat do jogo é <strong>public</strong>: as mensagens ficam visíveis para outros jogadores na mesma sessão de jogo.\n  O Produto não fornece mensagens privadas/diretas entre usuários.</p>", "<p>O chat do jogo é <strong>público</strong>: as mensagens ficam visíveis para outros jogadores na mesma sessão de jogo.\n  O Produto não fornece mensagens privadas ou diretas entre usuários.</p>"],
    ["as funções no jogo têm <strong>no</strong> capacidade de aplicar penalidades", "as funções no jogo <strong>não têm capacidade</strong> de aplicar penalidades"],
    [englishRetainedRecords, retainedRecords.pt]
  ],
  de: [
    [englishRetainedRecords, retainedRecords.de]
  ],
  id: [
    ["<strong>no</strong> untuk menerapkan penalti", "<strong>tidak memiliki kemampuan</strong> untuk menerapkan penalti"],
    [englishRetainedRecords, retainedRecords.id]
  ]
};

const main = async () => {
  for (const [language, replacements] of Object.entries(corrections)) {
    const filePath = path.join(root, "privacy-i18n", `${language}.html`);
    let html = await fs.readFile(filePath, "utf8");

    replacements.forEach(([from, to]) => {
      if (!html.includes(from)) {
        if (html.includes(to)) {
          return;
        }

        throw new Error(`${language}: correction source was not found: ${from.slice(0, 80)}`);
      }

      html = html.split(from).join(to);
    });

    await fs.writeFile(filePath, html, "utf8");
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
