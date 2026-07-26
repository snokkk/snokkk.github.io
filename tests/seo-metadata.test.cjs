const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const publicOrigin = "https://snokkk.github.io";

const extractJsonLd = (html, file) => Array.from(
  html.matchAll(/<script\s+type=["']application\/ld\+json["']\s*>([\s\S]*?)<\/script>/gi),
  (match) => {
    try {
      return JSON.parse(match[1]);
    } catch (error) {
      assert.fail(`${file} contains invalid JSON-LD: ${error.message}`);
    }
  }
);

const sitemapUrls = Array.from(
  read("sitemap.xml").matchAll(/<loc>(https:\/\/snokkk\.github\.io(?:\/[^<]*)?)<\/loc>/g),
  (match) => match[1]
);

const fileForUrl = (url) => {
  const pathname = new URL(url).pathname;
  return pathname === "/" ? "index.html" : pathname.slice(1);
};

test("every sitemap HTML page declares a description and its canonical URL", () => {
  assert.ok(sitemapUrls.includes(`${publicOrigin}/in-our-midst.html`));
  assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, "sitemap contains duplicate URLs");

  for (const url of sitemapUrls) {
    const file = fileForUrl(url);
    const html = read(file);
    const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1];

    assert.match(html, /<meta\s+name=["']description["']\s+content=["'][^"']+["']/i, `${file} is missing a meta description`);
    assert.equal(canonical, url, `${file} canonical does not match its sitemap URL`);
  }
});

test("primary discovery pages expose one H1 and complete social metadata", () => {
  for (const file of ["index.html", "games.html", "changelog.html", "in-our-midst.html"]) {
    const html = read(file);

    assert.equal((html.match(/<h1\b/gi) || []).length, 1, `${file} must contain exactly one H1`);
    assert.match(html, /<meta\s+property=["']og:title["']\s+content=["'][^"']+["']/i, `${file} is missing og:title`);
    assert.match(html, /<meta\s+property=["']og:description["']\s+content=["'][^"']+["']/i, `${file} is missing og:description`);
    assert.match(html, /<meta\s+property=["']og:image["']\s+content=["']https:\/\/[^"']+["']/i, `${file} is missing an absolute og:image`);
    assert.match(html, /<meta\s+name=["']twitter:card["']\s+content=["']summary_large_image["']/i, `${file} is missing a large Twitter card`);
  }
});

test("all JSON-LD blocks parse and the primary entity graph is connected", () => {
  const files = ["index.html", "games.html", "changelog.html", "in-our-midst.html"];

  for (const file of files) {
    assert.ok(extractJsonLd(read(file), file).length > 0, `${file} is missing JSON-LD`);
  }

  const homeGraph = extractJsonLd(read("index.html"), "index.html")[0]["@graph"];
  const byId = new Map(homeGraph.map((entity) => [entity["@id"], entity]));
  const snowBat = byId.get(`${publicOrigin}/#snow-bat`);
  const danila = byId.get(`${publicOrigin}/#danila-demkin`);
  const game = byId.get(`${publicOrigin}/#imposter-3d`);
  const series = byId.get(`${publicOrigin}/in-our-midst.html#series`);

  assert.equal(snowBat.founder["@id"], danila["@id"]);
  assert.equal(danila.worksFor["@id"], snowBat["@id"]);
  assert.equal(game.creator["@id"], danila["@id"]);
  assert.equal(game.publisher["@id"], snowBat["@id"]);
  assert.equal(series.isBasedOn["@id"], game["@id"]);
  assert.equal(series.url, `${publicOrigin}/in-our-midst.html`);
});

test("the In Our Midst hub exposes verified series facts and official episode links", () => {
  const html = read("in-our-midst.html");
  const graph = extractJsonLd(html, "in-our-midst.html")[0]["@graph"];
  const series = graph.find((entity) => entity["@id"] === `${publicOrigin}/in-our-midst.html#series`);
  const episodes = series.hasPart;

  assert.equal(series.name, "In Our Midst");
  assert.equal(series.alternateName, undefined);
  assert.deepEqual(series.inLanguage, ["en", "ru"]);
  assert.equal(series.numberOfEpisodes, 10);
  assert.deepEqual(
    episodes.map((episode) => [
      episode.episodeNumber,
      episode.name,
      episode.associatedMedia.map((video) => [video.inLanguage, video.contentUrl])
    ]),
    [
      [1, "The Beginning of Deception", [["en", "https://www.youtube.com/watch?v=MnUu527KQdE"], ["ru", "https://www.youtube.com/watch?v=V4JsskFSXcA"]]],
      [2, "Welcome", [["en", "https://www.youtube.com/watch?v=p8txKnk6hKQ"], ["ru", "https://www.youtube.com/watch?v=uJGAAVldaU4"]]],
      [3, "The Game", [["en", "https://www.youtube.com/watch?v=uRTrhg-v6jI"], ["ru", "https://www.youtube.com/watch?v=Q9bhwtzAVu8"]]],
      [4, "Team", [["en", "https://www.youtube.com/watch?v=geKNo8CrVhg"], ["ru", "https://www.youtube.com/watch?v=T0TAjOemp2k"]]],
      [5, "Commotion on SS12", [["en", "https://www.youtube.com/watch?v=ZD5c_DBI968"], ["ru", "https://www.youtube.com/watch?v=D9XZ75PgmuU"]]],
      [6, "Injustice", [["en", "https://www.youtube.com/watch?v=WZQS3AsXiRM"], ["ru", "https://www.youtube.com/watch?v=2e-g5vkaSDA"]]],
      [7, "I'm Sorry", [["en", "https://www.youtube.com/watch?v=m0uKCt5_C_Y"], ["ru", "https://www.youtube.com/watch?v=jcRhmSMvN2Q"]]],
      [8, "Lies", [["en", "https://www.youtube.com/watch?v=NiFDcPAW4bM"], ["ru", "https://www.youtube.com/watch?v=KiOt-66tXbs"]]],
      [9, "There Is Someone on Board", [["en", "https://www.youtube.com/watch?v=JIX25B7CSxI"], ["ru", "https://www.youtube.com/watch?v=srACFhAGn6M"]]],
      [10, "Void", [["en", "https://www.youtube.com/watch?v=fSah_OeE-gY"], ["ru", "https://www.youtube.com/watch?v=PUCXPnanBCc"]]]
    ]
  );

  assert.match(html, /produced by the creative team Nedonime/i);
  assert.match(html, /official canonical series in the universe of <em>Imposter 3D: Online Horror<\/em>/i);
  assert.match(html, /playlist\?list=PLI4FEkqmB_3kxcMFfaJanNdM5vDV3fwjN/);
  assert.equal((html.match(/class="episodeCard"/g) || []).length, 10);
  assert.deepEqual(
    Array.from(html.matchAll(/src="media\/series\/episode-(\d{2})-preview\.webp"/g), (match) => match[1]),
    ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]
  );
  assert.equal((html.match(/class="episodeCard__preview"/g) || []).length, 10);
  assert.equal((html.match(/loading="lazy"/g) || []).length, 10);
  assert.deepEqual(
    episodes.map((episode) => episode.image),
    Array.from({ length: 10 }, (_, index) => `${publicOrigin}/media/series/episode-${String(index + 1).padStart(2, "0")}-preview.webp`)
  );
  assert.equal((html.match(/Watch in English/g) || []).length, 10);
  assert.equal((html.match(/Watch in Russian/g) || []).length, 10);
  assert.doesNotMatch(html, /[А-Яа-яЁё]/, "the English hub must not contain Russian-language text");
});

test("new internal HTML links resolve to tracked site pages", () => {
  for (const file of ["index.html", "games.html", "changelog.html", "in-our-midst.html"]) {
    const html = read(file);
    const links = Array.from(html.matchAll(/href=["']([^"'#?]+\.html)(?:#[^"']*)?["']/gi), (match) => match[1]);

    for (const link of links) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(link)) {
        continue;
      }

      assert.ok(fs.existsSync(path.join(root, link)), `${file} links to missing ${link}`);
    }
  }
});

test("public pages serve optimized WebP artwork", () => {
  const publicFiles = fs.readdirSync(root)
    .filter((file) => file.endsWith(".html"));
  const publicHtml = publicFiles
    .map((file) => read(file))
    .join("\n");
  const imagePaths = new Set(
    Array.from(publicHtml.matchAll(/(?:https:\/\/snokkk\.github\.io\/)?(media\/[^"'()\s]+\.webp)/gi), (match) => match[1])
  );

  assert.doesNotMatch(publicHtml, /media\/[^"'()\s]+\.(?:png|jpe?g|gif)/i);
  assert.match(read("in-our-midst.html"), /og:image["']\s+content=["']https:\/\/snokkk\.github\.io\/media\/series\/in-our-midst-poster\.webp/i);

  for (const imagePath of imagePaths) {
    const image = fs.readFileSync(path.join(root, imagePath));
    assert.equal(image.subarray(0, 4).toString("ascii"), "RIFF", `${imagePath} is not a WebP RIFF file`);
    assert.equal(image.subarray(8, 12).toString("ascii"), "WEBP", `${imagePath} is missing the WebP signature`);
  }

  for (const directory of ["media/branding", "media/games", "media/team"]) {
    for (const sourceName of fs.readdirSync(path.join(root, directory)).filter((file) => /\.(?:png|jpe?g)$/i.test(file))) {
      const webpName = sourceName.replace(/\.(?:png|jpe?g)$/i, ".webp");
      const webpPath = path.join(root, directory, webpName);
      assert.ok(fs.existsSync(webpPath), `${directory}/${sourceName} is missing ${webpName}`);
      const webp = fs.readFileSync(webpPath);
      assert.equal(webp.subarray(0, 4).toString("ascii"), "RIFF", `${directory}/${webpName} is not a WebP RIFF file`);
      assert.equal(webp.subarray(8, 12).toString("ascii"), "WEBP", `${directory}/${webpName} is missing the WebP signature`);
    }
  }
});

test("episode previews keep their 16:9 aspect ratio in Safari flex layouts", () => {
  const css = read("style.css");

  assert.match(css, /\.episodeCard \.episodeCard__preview\s*\{[^}]*flex:\s*0 0 auto;/s);
  assert.match(css, /\.episodeCard \.episodeCard__preview\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*9;/s);
  assert.match(css, /\.episodeCard__preview img\s*\{[^}]*height:\s*auto;/s);
  assert.doesNotMatch(css, /\.episodeCard__preview img\s*\{[^}]*height:\s*100%;/s);
});
