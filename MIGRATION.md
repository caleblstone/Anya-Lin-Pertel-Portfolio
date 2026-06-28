# Image migration: Uploadcare → local repo

This moves all artwork images off the Uploadcare CDN (which was burning through
the free 1,000-operations/month limit) and into a committed `/images` folder.
After this, the site serves images statically from Netlify — zero Uploadcare
operations, ever.

**The CMS config change is already done** (`admin/config.yml`). The image
download has to run on your machine because it fetches the files from the CDN.

## Steps

Run everything from the repository root (the folder containing `_posts/` and `admin/`).

1. **Start from a clean git state** so you have an easy rollback:
   ```
   git status        # commit or stash anything in progress first
   ```

2. **Run the migration** (downloads 114 images into `images/`, rewrites every
   post's front matter, and backs up `_posts/` to `_migration_backup_<timestamp>/`):
   ```
   python3 migrate_images.py
   ```
   It self-verifies at the end and prints `OK: all posts now use local /images
   paths and every file exists.` If any download fails, those posts are left
   pointing at Uploadcare (so nothing breaks) — just re-run to finish them.

3. **Preview locally** to be 100% sure before pushing:
   ```
   bundle exec jekyll serve
   ```
   Open http://localhost:4000 and confirm the work images all load.

4. **Commit and push:**
   ```
   git add images _posts admin/config.yml
   git commit -m "Host images locally; switch Decap to git-based media"
   git push
   ```
   Watch the Netlify deploy finish, then check the live site.

5. **Once the live site looks right**, you can delete `migrate_images.py`,
   `MIGRATION.md`, and the `_migration_backup_*` folder. Keep the Uploadcare
   account around for a few days as a safety net before removing anything there.

## Rollback

Nothing is destructive — `_posts/` is backed up and git has the rest.

- Undo the post rewrites: restore from `_migration_backup_<timestamp>/_posts/`,
  or if you haven't committed yet, `git checkout -- _posts admin/config.yml`.
- If you already pushed: `git revert <commit>` and push.

## What changes for Anya

Her workflow in `/admin` is unchanged. The only difference is that when she adds
a work and uploads an image, the image is now saved straight into the site's
repo (the `images/` folder) instead of Uploadcare. Add, edit, reorder, delete —
all exactly the same as before.
