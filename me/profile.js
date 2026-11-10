const clock = document.getElementById("clock");
const clockFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Irkutsk",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function tick() {
  const time = clockFormat.format(new Date());
  clock.dateTime = time;
  clock.textContent = time;
}

tick();
setInterval(tick, 1000);

const links = document.getElementById("links");
const fallback = links.querySelector("a");
const profilePath = "/landing/en";
const linksPath = "/landing/links/en";

links.addEventListener("toggle", async () => {
  if (links.open !== isLinksRoute()) updateDirectoryRoute(links.open);
  if (!links.open || !fallback.isConnected || links.hasAttribute("aria-busy")) return;
  links.setAttribute("aria-busy", "true");

  try {
    const response = await fetch(fallback.href);
    if (!response.ok) return;

    const page = new DOMParser().parseFromString(await response.text(), "text/html");
    const directory = page.querySelector("main.link-directory");
    if (!directory) return;

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

function isLinksRoute() {
  return location.pathname === linksPath || location.hash === "#links";
}

function syncDirectory() {
  links.open = isLinksRoute();
}

function updateDirectoryRoute(showLinks) {
  const url = new URL(location.href);
  url.pathname = showLinks ? linksPath : profilePath;
  if (url.hash === "#links") url.hash = "";
  if (url.href !== location.href) history.pushState(null, "", url);
  syncDirectory();
}

window.addEventListener("popstate", syncDirectory);
window.addEventListener("hashchange", syncDirectory);
syncDirectory();
