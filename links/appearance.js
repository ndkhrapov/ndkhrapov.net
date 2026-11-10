(() => {
  const root = document.documentElement;
  const storageKey = "links-theme";

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark") {
      root.dataset.theme = saved;
    }
  } catch {
    // Follow the system when browser storage is unavailable.
  }

  function connectThemePicker() {
    const select = document.getElementById("links-theme");
    if (!select) return;
    select.value = root.dataset.theme ?? "system";
    select.closest("label").hidden = false;

    select.addEventListener("change", () => {
      const theme = select.value;
      if (theme === "system") {
        delete root.dataset.theme;
      } else {
        root.dataset.theme = theme;
      }

      try {
        if (theme === "system") {
          localStorage.removeItem(storageKey);
        } else {
          localStorage.setItem(storageKey, theme);
        }
      } catch {
        // The current choice still applies for this page visit.
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", connectThemePicker);
  } else {
    connectThemePicker();
  }
})();
