# Blog hero images

Hero images for `/blog/<slug>` posts live here.

> Folder named `blog/` (not `guides/`) so it doesn't collide with the tour-guide team members at `src/assets/guide-1.jpeg` / `guide-2.jpeg` / `guide-3.jpeg` and `src/assets/team/`. "Guide" in this codebase always means a person; the blog posts that read like guides live under `/blog/`.

## Naming convention

The hero image filename should match the post slug, with `.jpg` (or `.jpeg`, `.png`, `.webp`) extension:

```
src/assets/blog/<post-slug>.jpg
```

For example, the post at `/blog/enduro-holidays-no-licence-uk-riders-guide` should have its hero at:

```
src/assets/blog/enduro-holidays-no-licence-uk-riders-guide.jpg
```

The `heroImage` field in [src/app/data/blog-posts.ts](../../app/data/blog-posts.ts) then points at `assets/blog/<post-slug>.jpg`.

## After dropping new images

Run the compression pass once before committing:

```
npm run compress:images
```

The script resizes anything above 1600 × 1066 down to that, re-encodes at quality 80, and overwrites in place. Files already under 350 KB are left alone — the script is idempotent, so running it twice on the same folder does nothing the second time.
