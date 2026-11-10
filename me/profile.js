const tick=()=>document.querySelector("output").value=new Date().toLocaleTimeString("en-GB",{timeZone:"Asia/Irkutsk"})
tick()
setInterval(tick,1e3)

const links = document.getElementById("links");
const fallback = links.querySelector("a");

links.addEventListener("toggle", async () => {
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
    panel.lang = page.documentElement.lang;
    panel.append(...directory.children);
    fallback.replaceWith(panel);
    await import("/links/appearance.js?v=2");
  } catch {
    // The standalone link remains available if the directory cannot load.
  } finally {
    links.removeAttribute("aria-busy");
  }
});

function openLinkedDirectory() {
  if (location.hash === "#links") links.open = true;
}

document.querySelector('header a[href="#links"]').addEventListener("click", () => {
  links.open = true;
});
window.addEventListener("hashchange", openLinkedDirectory);
openLinkedDirectory();
