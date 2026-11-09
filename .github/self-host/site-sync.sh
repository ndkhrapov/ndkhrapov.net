#!/bin/sh
# Mirror GitHub into Caddy's /srv and refresh the Gravatar cache separately.
REPO=ndkhrapov/ndkhrapov.net
BRANCH=main
INTERVAL=300
DEST=/srv
last=""

while true; do
  python3 /sync-gravatar.py "$DEST/.gravatar" || :

  sha=$(wget -qO- -T 15 --header "Accept: application/vnd.github.sha" "https://api.github.com/repos/$REPO/commits/$BRANCH" 2>/dev/null)
  if [ ${#sha} -eq 40 ] && [ "$sha" != "$last" ]; then
    rm -rf /tmp/new && mkdir -p /tmp/new
    if wget -qO- -T 30 "https://codeload.github.com/$REPO/tar.gz/$sha" | tar -xzf - -C /tmp/new; then
      src=$(find /tmp/new -mindepth 1 -maxdepth 1 -type d | head -n 1)
      if [ -n "$src" ] && [ -f "$src/index.html" ]; then
        rm -rf "$src"/.git "$src"/.github "$src"/.gitignore "$src"/.gravatar
        if find "$DEST" -mindepth 1 -maxdepth 1 ! -name .gravatar -exec rm -rf -- {} + &&
            cp -a "$src"/. "$DEST"/; then
          last=$sha
          echo "site-sync: deployed $REPO@$sha"
        else
          echo "site-sync: could not deploy $sha"
        fi
      else
        echo "site-sync: tarball for $sha has no index.html, skipped"
      fi
    else
      echo "site-sync: download of $sha failed"
    fi
    rm -rf /tmp/new
  elif [ ${#sha} -ne 40 ]; then
    echo "site-sync: could not read head of $BRANCH"
  fi
  sleep "$INTERVAL"
done
