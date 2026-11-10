const tick=()=>document.querySelector("output").value=new Date().toLocaleTimeString("en-GB",{timeZone:"Asia/Irkutsk"})
tick()
setInterval(tick,1e3)

const links = document.getElementById("links");
const fallback = links.querySelector("a");
const linksNav = document.querySelector('header a[href^="/landing/links/"]');
const languageNav = document.querySelector("header a[lang]");
const otherProfile = languageNav.pathname;

links.addEventListener("toggle", async () => {
  if (!links.open || !fallback.isConnected || links.hasAttribute("aria-busy")) return;
  links.setAttribute("aria-busy", "true");

  try {
    const response = await fetch(fallback.href);
    if (!response.ok) return;

    const page = new DOMParser().parseFromString(await response.text(), "text/html");
    const directory = page.querySelector("main.link-directory");
    if (!directory) return;

    if (document.documentElement.lang === "ru") {
      directory.querySelector("summary").textContent = "Другие ссылки";
    }
    const panel = document.createElement("div");
    panel.className = "link-directory";
    panel.append(...directory.children);
    fallback.replaceWith(panel);
  } catch {
    // The standalone link remains available if the directory cannot load.
  } finally {
    links.removeAttribute("aria-busy");
  }
});

function syncDirectory() {
  const showLinks = location.pathname === linksNav.pathname || location.hash === "#links";
  links.open = showLinks;
  languageNav.href = showLinks ? otherProfile.replace("/landing/", "/landing/links/") : otherProfile;
}

linksNav.addEventListener("click", (event) => {
  if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  event.preventDefault();
  if (location.pathname !== linksNav.pathname) history.pushState(null, "", linksNav.href);
  syncDirectory();
  links.querySelector("summary").focus();
});
window.addEventListener("popstate", syncDirectory);
window.addEventListener("hashchange", syncDirectory);
syncDirectory();
