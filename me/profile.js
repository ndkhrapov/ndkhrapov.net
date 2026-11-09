(() => {
  const languagePicker = document.querySelector("#site-language");
  const clock = document.querySelector("#irkutsk-time");
  const storageKey = "me.profile-language";
  const translations = [];
  let clockFormatter;

  for (const [source, attribute] of [
    ["data-ru", null],
    ["data-ru-label", "aria-label"],
    ["data-ru-alt", "alt"],
  ]) {
    for (const element of document.querySelectorAll(`[${source}]`)) {
      const english = attribute ? element.getAttribute(attribute) : element.textContent;
      translations.push({ element, attribute, english, russian: element.getAttribute(source) });
    }
  }

  function updateClock() {
    const now = new Date();
    clock.dateTime = now.toISOString();
    clock.textContent = clockFormatter.format(now);
  }

  function setLanguage(language) {
    const isRussian = language === "ru";
    document.documentElement.lang = language;
    languagePicker.value = language;
    for (const { element, attribute, english, russian } of translations) {
      const text = isRussian ? russian : english;
      if (attribute) {
        element.setAttribute(attribute, text);
      } else {
        element.textContent = text;
      }
    }
    clockFormatter = new Intl.DateTimeFormat(isRussian ? "ru-RU" : "en-GB", {
      timeZone: "Asia/Irkutsk",
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    updateClock();
  }

  let initialLanguage = "en";
  try {
    if (localStorage.getItem(storageKey) === "ru") initialLanguage = "ru";
  } catch {
    // The selector still works when browser storage is unavailable.
  }
  setLanguage(initialLanguage);
  languagePicker.disabled = false;
  languagePicker.addEventListener("change", () => {
    const language = languagePicker.value === "ru" ? "ru" : "en";
    setLanguage(language);
    try {
      localStorage.setItem(storageKey, language);
    } catch {
      // Keep the selection for this page even when it cannot be saved.
    }
  });
  window.setInterval(updateClock, 1000);
})();
