# ndkhrapov.net

Personal landing page: plain static files (`index.html`, `styles.css` and the social icon SVGs). There is no build step.

The public link directory lives in `links/index.html` and is served at
[links.ndkhrapov.net](https://links.ndkhrapov.net/) and `/links/` on the personal
website.

Directory brand icons use [Simple Icons 15.0.0](https://github.com/simple-icons/simple-icons/tree/15.0.0)
(CC0) and [Font Awesome Free 6.7.2](https://github.com/FortAwesome/Font-Awesome/tree/6.7.2)
(Xbox, Yahoo, and Yandex SVG icons, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)).
The directory embeds their paths in SVG symbols so they inherit the page colors.

## Hosting and deploy

The site is self-hosted, not on GitHub Pages:

- **Domain:** registered at reg.ru, with DNS managed on Cloudflare. The `ndkhrapov.net` record points at the home router's public IP.
- **Router:** a MikroTik hAP ax³ forwards incoming HTTP (80) and HTTPS (443) traffic to a container running on the router (on the `192.168.x.x` container network).
- **Web server:** that container runs [Caddy](https://caddyserver.com/), which serves the files from this repository and handles TLS.

Deploys are automatic: a scheduled script (on the router or in the Caddy container) pulls the files from this GitHub repository about every 15 minutes. To ship a change, merge it to `main` and it goes live within roughly 15 minutes. Because nothing is built, the files in the repo are exactly what gets served.

## Gravatar images

The home `site-sync` container checks the public `ndkhrapov` Gravatar profile every five minutes. It caches the avatar, header image, and background color together in `/srv/.gravatar`. A failed check keeps the previous snapshot, and a GitHub deploy preserves that directory. Caddy serves the cached images and color stylesheet at `me.ndkhrapov.net`, with the checked-in files in `me/` as the initial fallback.

The [self-hosted sync files](.github/self-host/) run with Alpine's `python3` and `py3-pillow`. Copy `sync-gravatar.py` to `/sync-gravatar.py` and `site-sync.sh` to `/site-sync-live.sh` in the container root. The container runs `/bin/sh /site-sync-live.sh`. The `me.Caddyfile` block goes in the existing Caddyfile and uses its shared TLS, header, and error snippets.

## License

GPL-3.0, see [LICENSE](LICENSE).
