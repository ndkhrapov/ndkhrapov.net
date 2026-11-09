#!/usr/bin/env python3
"""Refresh the three public Gravatar assets as a single snapshot."""

import fcntl
import io
import json
import os
import re
import shutil
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

from PIL import Image, ImageOps


PROFILE = "https://api.gravatar.com/v3/profiles/ndkhrapov"
MAX_IMAGE_BYTES = 8 * 1024 * 1024
MAX_IMAGE_PIXELS = 5_000_000
FORMATS = ("JPEG", "PNG", "WEBP", "GIF")
HEADER = re.compile(r"^url\(\s*['\"]?([^'\"\s)]+)['\"]?\s*\)(.*)$")


def gravatar_url(url):
    parts = urlsplit(url)
    host = parts.hostname or ""
    if (parts.scheme != "https" or parts.netloc != host
            or (host != "gravatar.com" and not host.endswith(".gravatar.com"))):
        raise ValueError("expected an HTTPS Gravatar URL")
    return parts


class GravatarRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        gravatar_url(newurl)
        return super().redirect_request(request, fp, code, msg, headers, newurl)


OPENER = build_opener(GravatarRedirect())


def fetch(url, limit, previous_headers=None):
    gravatar_url(url)
    headers = {"User-Agent": "ndkhrapov.net Gravatar image sync"}
    headers.update(previous_headers or {})
    try:
        with OPENER.open(Request(url, headers=headers), timeout=12) as response:
            data = response.read(limit + 1)
            if len(data) > limit:
                raise ValueError("Gravatar response exceeds the size limit")
            return data, response.headers
    except HTTPError as error:
        if error.code == 304 and previous_headers:
            return None, error.headers
        raise


def image_url(url, path, **parameters):
    parts = gravatar_url(url)
    if not parts.path.startswith(path):
        raise ValueError("unexpected Gravatar image path")
    query = dict(parse_qsl(parts.query))
    query.update(parameters)
    return urlunsplit(parts._replace(query=urlencode(query), fragment=""))


def background(value):
    if value is None or value == "":
        return "#33413c"
    if re.fullmatch(r"#[0-9a-fA-F]{6}", value):
        return value.lower()
    if re.fullmatch(r"#[0-9a-fA-F]{3}", value):
        return "#" + "".join(channel * 2 for channel in value[1:].lower())
    rgb = re.fullmatch(r"rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)", value)
    if rgb and all(int(channel) <= 255 for channel in rgb.groups()):
        return "#" + "".join(f"{int(channel):02x}" for channel in rgb.groups())
    raise ValueError("unrecognized Gravatar background color")


def header_image(value):
    if not value:
        return None, "50%"
    match = HEADER.fullmatch(value.strip())
    if not match:
        raise ValueError("unrecognized Gravatar header image")
    position = re.search(r"\b\d+(?:\.\d+)?%\s+(\d+(?:\.\d+)?%)", match[2])
    focal_point = position[1] if position and float(position[1][:-1]) <= 100 else "50%"
    return image_url(match[1], "/userimage/", size="2048"), focal_point


def webp(image):
    with io.BytesIO() as output:
        image.save(output, "WEBP", quality=85, method=3)
        return output.getvalue()


def refresh_image(url, current, name, old, size):
    previous = old.get(name, {})
    existing = current / name
    validators = {}
    if previous.get("url") == url and existing.is_file():
        for key, header in (("etag", "If-None-Match"), ("modified", "If-Modified-Since")):
            if previous.get(key):
                validators[header] = previous[key]
    data, headers = fetch(url, MAX_IMAGE_BYTES, validators)
    if data is None:
        return existing.read_bytes(), previous
    with Image.open(io.BytesIO(data), formats=FORMATS) as image:
        if image.width * image.height > MAX_IMAGE_PIXELS:
            raise ValueError("Gravatar image exceeds the pixel limit")
        # Resize before applying EXIF orientation to keep the working set small.
        image.thumbnail((size, size))
        encoded = webp(ImageOps.exif_transpose(image))
    return encoded, {"url": url, "etag": headers.get("ETag"), "modified": headers.get("Last-Modified")}


def publish(root, current, files):
    if all((current / name).is_file() and (current / name).read_bytes() == data
           for name, data in files.items()):
        return False
    previous = current.resolve()
    stage = Path(tempfile.mkdtemp(prefix="snapshot-", dir=root))
    link = stage.with_suffix(".link")
    try:
        stage.chmod(0o755)
        for name, data in files.items():
            (stage / name).write_bytes(data)
        link.symlink_to(stage.name)
        os.replace(link, current)
    except OSError:
        link.unlink(missing_ok=True)
        shutil.rmtree(stage)
        raise
    for older in root.glob("snapshot-*"):
        if older not in (stage, previous) and older.is_dir() and not older.is_symlink():
            shutil.rmtree(older, ignore_errors=True)
    return True


def sync(root):
    current = root / "current"
    metadata = current / "sources.json"
    old = json.loads(metadata.read_bytes()) if metadata.is_file() else {}
    response, _ = fetch(PROFILE, 64 * 1024)
    profile = json.loads(response)
    if profile.get("profile_url", "").rstrip("/") != "https://gravatar.com/ndkhrapov":
        raise ValueError("profile response does not match ndkhrapov")
    color = background(profile.get("background_color"))
    header_url, focal_point = header_image(profile.get("header_image"))
    avatar_url = image_url(profile["avatar_url"], "/avatar/", s="768", d="initials")
    avatar, avatar_source = refresh_image(avatar_url, current, "profile.webp", old, 768)
    if header_url:
        header, header_source = refresh_image(header_url, current, "header.webp", old, 2048)
    else:
        with Image.new("RGB", (64, 36), color) as plain:
            header = webp(plain)
        header_source = {}
    css = (f":root {{ --gravatar-background: {color}; "
           f"--gravatar-header-position: {focal_point}; }}\n").encode()
    files = {
        "profile.webp": avatar,
        "header.webp": header,
        "gravatar.css": css,
        "sources.json": json.dumps({"profile.webp": avatar_source, "header.webp": header_source}).encode(),
    }
    changed = publish(root, current, files)
    (root / "last-success").write_text(datetime.now(timezone.utc).isoformat() + "\n", encoding="ascii")
    if changed:
        print("gravatar-sync: published avatar, header, and background")


if __name__ == "__main__":
    root = Path(sys.argv[1]).resolve()
    try:
        root.mkdir(mode=0o755, parents=True, exist_ok=True)
        with (root / "lock").open("a") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            sync(root)
    except (OSError, ValueError, TypeError, KeyError, Image.DecompressionBombError) as error:
        print(f"gravatar-sync: check failed ({error}); keeping the previous snapshot", file=sys.stderr)
        sys.exit(1)
