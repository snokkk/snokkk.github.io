document.addEventListener("DOMContentLoaded", () => {
  const supportedLanguages = new Set(["en", "ru", "es", "pt", "de", "id"]);
  const defaultLanguage = "en";
  const policyTranslations = window.PrivacyPolicyTranslations || {};
  const policy = document.querySelector(".infoCard");
  const switcher = document.querySelector("[data-privacy-language-switcher]");
  const select = document.querySelector("#privacy-language");
  const label = switcher?.querySelector("label");
  const status = switcher?.querySelector(".languageSwitcher__status");
  const backLink = document.querySelector(".center .btn");
  const footerLinks = Array.from(document.querySelectorAll(".siteFoot .foot__links a"));

  if (!policy || !switcher || !select || !label || !status || !backLink || footerLinks.length !== 4) {
    return;
  }

  const originalPolicy = policy.innerHTML;
  const originalTitle = document.title;
  const originalUi = {
    backLink: backLink.textContent,
    footerLinks: footerLinks.map((link) => link.textContent)
  };
  const uiTranslations = {
    en: {
      label: "Language",
      ariaLabel: "Privacy Policy language",
      title: originalTitle,
      loading: "Loading translation…",
      error: "Translation could not be loaded. English is shown.",
      backLink: originalUi.backLink,
      footerLinks: originalUi.footerLinks
    },
    ru: {
      label: "Язык",
      ariaLabel: "Язык политики конфиденциальности",
      title: "Политика конфиденциальности — Imposter 3D",
      loading: "Загрузка перевода…",
      error: "Не удалось загрузить перевод. Показан английский текст.",
      backLink: "На главную",
      footerLinks: ["Связаться с нами", "Политика конфиденциальности сайта", "Политика использования файлов cookie", "Политика конфиденциальности игры"]
    },
    es: {
      label: "Idioma",
      ariaLabel: "Idioma de la Política de privacidad",
      title: "Política de privacidad — Imposter 3D",
      loading: "Cargando traducción…",
      error: "No se pudo cargar la traducción. Se muestra el texto en inglés.",
      backLink: "Volver al inicio",
      footerLinks: ["Contacto", "Política de privacidad del sitio", "Política de cookies", "Política de privacidad del juego"]
    },
    pt: {
      label: "Idioma",
      ariaLabel: "Idioma da Política de Privacidade",
      title: "Política de Privacidade — Imposter 3D",
      loading: "Carregando tradução…",
      error: "Não foi possível carregar a tradução. O texto em inglês está sendo exibido.",
      backLink: "Voltar ao início",
      footerLinks: ["Fale conosco", "Política de Privacidade do site", "Política de Cookies", "Política de Privacidade do jogo"]
    },
    de: {
      label: "Sprache",
      ariaLabel: "Sprache der Datenschutzerklärung",
      title: "Datenschutzerklärung — Imposter 3D",
      loading: "Übersetzung wird geladen…",
      error: "Die Übersetzung konnte nicht geladen werden. Der englische Text wird angezeigt.",
      backLink: "Zur Startseite",
      footerLinks: ["Kontakt", "Datenschutzerklärung der Website", "Cookie-Richtlinie", "Datenschutzerklärung des Spiels"]
    },
    id: {
      label: "Bahasa",
      ariaLabel: "Bahasa Kebijakan Privasi",
      title: "Kebijakan Privasi — Imposter 3D",
      loading: "Memuat terjemahan…",
      error: "Terjemahan tidak dapat dimuat. Teks bahasa Inggris ditampilkan.",
      backLink: "Kembali ke beranda",
      footerLinks: ["Hubungi kami", "Kebijakan Privasi situs", "Kebijakan Cookie", "Kebijakan Privasi game"]
    }
  };
  const updateUi = (language) => {
    const translation = uiTranslations[language];
    label.textContent = translation.label;
    select.setAttribute("aria-label", translation.ariaLabel);
    document.title = translation.title;
    backLink.textContent = translation.backLink;
    footerLinks.forEach((link, index) => {
      link.textContent = translation.footerLinks[index];
    });
  };

  const updateUrl = (language) => {
    const url = new URL(window.location.href);

    if (language === defaultLanguage) {
      url.searchParams.delete("lang");
    } else {
      url.searchParams.set("lang", language);
    }

    window.history.replaceState({}, "", url);
  };

  const showEnglish = (message = "") => {
    policy.innerHTML = originalPolicy;
    document.documentElement.lang = defaultLanguage;
    select.value = defaultLanguage;
    updateUi(defaultLanguage);
    status.textContent = message;
  };

  const setLanguage = (language, shouldUpdateUrl = true) => {
    const nextLanguage = supportedLanguages.has(language) ? language : defaultLanguage;

    if (nextLanguage === defaultLanguage) {
      showEnglish();

      if (shouldUpdateUrl) {
        updateUrl(defaultLanguage);
      }

      return;
    }

    const translatedPolicy = policyTranslations[nextLanguage];

    if (typeof translatedPolicy === "string" && translatedPolicy.length > 0) {
      policy.innerHTML = translatedPolicy;
      document.documentElement.lang = nextLanguage;
      select.value = nextLanguage;
      updateUi(nextLanguage);
      status.textContent = "";

      if (shouldUpdateUrl) {
        updateUrl(nextLanguage);
      }
    } else {
      showEnglish(uiTranslations[nextLanguage].error);

      if (shouldUpdateUrl) {
        updateUrl(defaultLanguage);
      }
    }
  };

  select.addEventListener("change", () => {
    setLanguage(select.value);
  });

  const requestedLanguage = new URL(window.location.href).searchParams.get("lang") || defaultLanguage;
  setLanguage(requestedLanguage, false);
});
