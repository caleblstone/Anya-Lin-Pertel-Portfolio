#!/usr/bin/env python3
"""
One-time migration: move Anya Lin Pertel portfolio images off Uploadcare and
into a local ./images folder committed to the repo.

What it does (safely, and only if every step succeeds):
  1. Scans _posts/**/*.md for Uploadcare URLs (host e8eflx6kdm.ucarecd.net).
  2. Downloads each image to ./images/<uuid>.<ext> (extension from Content-Type).
  3. Rewrites each post's front matter to point at /images/<uuid>.<ext>,
     collapsing the single-item `images:` list into a clean scalar value
     (the same shape Decap's git-based image widget writes going forward).
  4. Backs up every post to ./_migration_backup_<timestamp>/ before editing.
  5. Verifies: no Uploadcare URLs remain and every referenced file exists.

It is SAFE to re-run: already-downloaded images are skipped, and a post is only
rewritten once its image is confirmed on disk. If any download fails, that post
is left untouched (still pointing at Uploadcare) so the site never points at a
missing file. Fix connectivity and re-run.

Usage:
    python3 migrate_images.py            # do the migration
    python3 migrate_images.py --dry-run  # show what would happen; no changes
    python3 migrate_images.py --verify   # check current state only

Run it from the repository root (the folder containing _posts/ and admin/).
After a successful migration you can delete this script.
"""

import argparse
import os
import re
import shutil
import ssl
import sys
import time
import urllib.request
import urllib.error

# macOS python.org builds don't use the system keychain, which causes
# CERTIFICATE_VERIFY_FAILED. Prefer certifi's CA bundle if it's available
# (it ships with those builds); fall back to the default context otherwise.
def _make_ssl_context(insecure=False):
    if insecure:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return ctx
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()

SSL_CONTEXT = _make_ssl_context()

UPLOADCARE_HOST = "e8eflx6kdm.ucarecd.net"

# Matches any Uploadcare URL for this account and captures the file UUID.
URL_RE = re.compile(
    r"https?://" + re.escape(UPLOADCARE_HOST) + r"/([0-9a-fA-F-]{36})/[^\s\"'\)]*"
)

# Matches a front-matter block of the form:
#   images:
#     - <uploadcare url>
# so we can collapse it to a scalar:  images: /images/<uuid>.<ext>
IMAGES_BLOCK_RE = re.compile(
    r"^images:[ \t]*\n[ \t]*-[ \t]*(https?://"
    + re.escape(UPLOADCARE_HOST)
    + r"/([0-9a-fA-F-]{36})/[^\s]*?)[ \t]*$",
    re.MULTILINE,
)

CONTENT_TYPE_EXT = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/pjpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
    "image/tiff": ".tif",
}

ROOT = os.getcwd()
POSTS_DIR = os.path.join(ROOT, "_posts")
IMAGES_DIR = os.path.join(ROOT, "images")


def fail(msg):
    print("ERROR: " + msg, file=sys.stderr)
    sys.exit(1)


def find_post_files():
    files = []
    for dirpath, _dirs, names in os.walk(POSTS_DIR):
        for n in names:
            if n.endswith(".md") or n.endswith(".markdown"):
                files.append(os.path.join(dirpath, n))
    return sorted(files)


def scan_urls(files):
    """Return dict: uuid -> url (one entry per unique image)."""
    found = {}
    for f in files:
        with open(f, "r", encoding="utf-8") as fh:
            for m in URL_RE.finditer(fh.read()):
                uuid = m.group(1).lower()
                found.setdefault(uuid, m.group(0))
    return found


def existing_local_file(uuid):
    """Return filename if an images/<uuid>.<ext> already exists, else None."""
    if not os.path.isdir(IMAGES_DIR):
        return None
    for name in os.listdir(IMAGES_DIR):
        base, _ext = os.path.splitext(name)
        if base.lower() == uuid:
            return name
    return None


# Send a realistic browser request so the CDN serves the already-cached image
# (a cache HIT triggers no new operation and isn't blocked by hotlink/bot rules
# or the operations quota). The Accept header mirrors what Chrome sends, so we
# get whichever cached variant the site already has (avif/webp/jpeg).
BROWSER_HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                   "AppleWebKit/537.36 (KHTML, like Gecko) "
                   "Chrome/124.0.0.0 Safari/537.36"),
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://" + UPLOADCARE_HOST + "/",
}

DEFAULT_OPS = "-/resize/2400/-/quality/lightest/-/format/auto/"


def candidate_urls(uuid, stored_url):
    """URLs to try, in order. The stored URL (exactly what the live site loads)
    is most likely to be a cache HIT; then the canonical host; then the
    untransformed original as a last resort."""
    cands = [stored_url]
    canon_ops = "https://ucarecdn.com/%s/%s" % (uuid, DEFAULT_OPS)
    if canon_ops not in cands:
        cands.append(canon_ops)
    cands.append("https://ucarecdn.com/%s/" % uuid)              # canonical original
    cands.append("https://%s/%s/" % (UPLOADCARE_HOST, uuid))      # custom-domain original
    return cands


def _fetch(url):
    req = urllib.request.Request(url, headers=BROWSER_HEADERS)
    with urllib.request.urlopen(req, timeout=60, context=SSL_CONTEXT) as resp:
        ctype = (resp.headers.get("Content-Type") or "").split(";")[0].strip().lower()
        data = resp.read()
    if not data:
        raise ValueError("empty response body")
    return ctype, data


def download(uuid, url, retries=2):
    """Download to images/<uuid>.<ext>, trying several URL variants with
    browser-like headers. Returns filename or None on failure."""
    existing = existing_local_file(uuid)
    if existing:
        print("  skip (already downloaded): %s" % existing)
        return existing

    os.makedirs(IMAGES_DIR, exist_ok=True)
    last_err = None
    for cand in candidate_urls(uuid, url):
        for attempt in range(1, retries + 1):
            try:
                ctype, data = _fetch(cand)
                ext = CONTENT_TYPE_EXT.get(ctype)
                if ext is None:
                    print("  warning: unrecognized Content-Type %r, saving as .jpg" % ctype)
                    ext = ".jpg"
                filename = uuid + ext
                tmp = os.path.join(IMAGES_DIR, filename + ".part")
                with open(tmp, "wb") as out:
                    out.write(data)
                os.replace(tmp, os.path.join(IMAGES_DIR, filename))
                print("  downloaded %s (%d KB, %s)" % (filename, len(data) // 1024, ctype))
                return filename
            except urllib.error.HTTPError as e:
                last_err = e
                if e.code in (403, 404):
                    # Retrying the same URL won't help; move to the next variant.
                    print("  %s -> HTTP %d, trying next variant" % (cand, e.code))
                    break
                print("  attempt %d/%d on %s failed: %s" % (attempt, retries, cand, e))
                time.sleep(2 * attempt)
            except (urllib.error.URLError, ValueError, OSError) as e:
                last_err = e
                print("  attempt %d/%d on %s failed: %s" % (attempt, retries, cand, e))
                time.sleep(2 * attempt)
    print("  GIVING UP on %s: %s" % (uuid, last_err))
    return None


def rewrite_text(text, resolved):
    """Pure rewrite of one file's text. `resolved` maps uuid -> local filename.

    Only URLs whose image is in `resolved` are rewritten. Returns new text.
    """
    # 1) Collapse the `images:\n  - <url>` block to a scalar.
    def block_sub(m):
        uuid = m.group(2).lower()
        fn = resolved.get(uuid)
        if not fn:
            return m.group(0)  # leave untouched if not yet downloaded
        return "images: /images/%s" % fn

    text = IMAGES_BLOCK_RE.sub(block_sub, text)

    # 2) Replace any remaining bare URL occurrences (e.g. in body), no structural change.
    def url_sub(m):
        uuid = m.group(1).lower()
        fn = resolved.get(uuid)
        if not fn:
            return m.group(0)
        return "/images/%s" % fn

    text = URL_RE.sub(url_sub, text)
    return text


def backup_posts():
    stamp = time.strftime("%Y%m%d-%H%M%S")
    dest = os.path.join(ROOT, "_migration_backup_" + stamp)
    shutil.copytree(POSTS_DIR, os.path.join(dest, "_posts"))
    print("Backed up _posts to %s" % dest)
    return dest


def verify(files):
    """Return list of problems (empty == healthy)."""
    problems = []
    local_ref_re = re.compile(r"/images/([^\s\"'\)]+)")
    for f in files:
        with open(f, "r", encoding="utf-8") as fh:
            content = fh.read()
        if URL_RE.search(content):
            problems.append("%s still references Uploadcare" % os.path.relpath(f, ROOT))
        for m in local_ref_re.finditer(content):
            ref = m.group(1)
            if not os.path.isfile(os.path.join(IMAGES_DIR, ref)):
                problems.append("%s -> images/%s missing on disk" % (os.path.relpath(f, ROOT), ref))
    return problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="report only; no downloads or edits")
    ap.add_argument("--verify", action="store_true", help="verify current state only")
    ap.add_argument("--insecure", action="store_true",
                    help="skip TLS certificate verification (last-resort fallback "
                         "for the macOS python.org cert issue; safe here since these "
                         "are your own public image URLs)")
    args = ap.parse_args()

    global SSL_CONTEXT
    if args.insecure:
        SSL_CONTEXT = _make_ssl_context(insecure=True)
        print("WARNING: TLS certificate verification disabled (--insecure).")

    if not os.path.isdir(POSTS_DIR) or not os.path.isdir(os.path.join(ROOT, "admin")):
        fail("Run this from the repository root (the folder with _posts/ and admin/).")

    files = find_post_files()
    print("Scanning %d post files..." % len(files))
    urls = scan_urls(files)
    print("Found %d unique Uploadcare image(s)." % len(urls))

    if args.verify:
        problems = verify(files)
        if problems:
            print("\nIssues found:")
            for p in problems:
                print("  - " + p)
            sys.exit(1)
        print("OK: no Uploadcare URLs remain and every referenced image exists.")
        return

    if args.dry_run:
        for uuid, url in sorted(urls.items()):
            existing = existing_local_file(uuid)
            note = " (already local: %s)" % existing if existing else ""
            print("  would download %s -> images/%s.<ext>%s" % (url, uuid, note))
        print("\nDry run only. No files were changed.")
        return

    if not urls:
        print("Nothing to migrate. Checking integrity...")
        problems = verify(files)
        if problems:
            for p in problems:
                print("  - " + p)
            sys.exit(1)
        print("OK.")
        return

    # 1. Download everything first.
    print("\nDownloading images to ./images/ ...")
    resolved = {}
    for uuid, url in sorted(urls.items()):
        fn = download(uuid, url)
        if fn:
            resolved[uuid] = fn

    failed = [u for u in urls if u not in resolved]
    if failed:
        print("\n%d image(s) failed to download. Posts for these are left pointing" % len(failed))
        print("at Uploadcare (site stays intact). Fix connectivity and re-run.")

    if not resolved:
        fail("No images downloaded; aborting before any edits.")

    # 2. Back up posts, then rewrite only the ones we have images for.
    backup_posts()
    print("\nRewriting front matter...")
    changed = 0
    for f in files:
        with open(f, "r", encoding="utf-8") as fh:
            original = fh.read()
        updated = rewrite_text(original, resolved)
        if updated != original:
            with open(f, "w", encoding="utf-8") as fh:
                fh.write(updated)
            changed += 1
    print("Rewrote %d post(s)." % changed)

    # 3. Verify.
    print("\nVerifying...")
    problems = verify(files)
    remaining = [p for p in problems if "missing on disk" in p]
    if remaining:
        print("CRITICAL: some posts reference missing local files:")
        for p in remaining:
            print("  - " + p)
        fail("Restore from the backup folder and investigate.")
    still_uc = [p for p in problems if "Uploadcare" in p]
    if still_uc:
        print("Note: %d post(s) still on Uploadcare (failed downloads above). Re-run to finish." % len(still_uc))
    else:
        print("OK: all posts now use local /images paths and every file exists.")

    print("\nDone. Next: commit the new images/ folder and updated _posts, then push.")


if __name__ == "__main__":
    main()
