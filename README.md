# ndkhrapov.net

Personal landing page: plain static files (`index.html`, `styles.css` and the social icon SVGs). There is no build step.

## Hosting and deploy

The site is self-hosted, not on GitHub Pages:

- **Domain:** registered at reg.ru, with DNS managed on Cloudflare. The `ndkhrapov.net` record points at the home router's public IP.
- **Router:** a MikroTik hAP ax³ forwards incoming HTTP (80) and HTTPS (443) traffic to a container running on the router (on the `192.168.x.x` container network).
- **Web server:** that container runs [Caddy](https://caddyserver.com/), which serves the files from this repository and handles TLS.

Deploys are automatic: a scheduled script (on the router or in the Caddy container) pulls the files from this GitHub repository about every 15 minutes. To ship a change, merge it to `main` and it goes live within roughly 15 minutes. Because nothing is built, the files in the repo are exactly what gets served.

## License

GPL-3.0, see [LICENSE](LICENSE).
