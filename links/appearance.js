const accent = document.querySelector("#accent");
const root = document.documentElement;
const storageKey = "links-accent";

function applyAccent(value) {
  if (value === "device") {
    delete root.dataset.accent;
  } else {
    root.dataset.accent = value;
  }
}

try {
  const savedAccent = localStorage.getItem(storageKey);
  if ([...accent.options].some((option) => option.value === savedAccent)) {
    accent.value = savedAccent;
  }
} catch {
  // The selector still works when browser storage is disabled.
}

applyAccent(accent.value);
accent.closest("label").hidden = false;

accent.addEventListener("change", () => {
  applyAccent(accent.value);
  try {
    localStorage.setItem(storageKey, accent.value);
  } catch {
    // Keep the current selection for this page.
  }
});
