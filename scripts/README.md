# Publishing Legal Guides

`guide-register.json` is the single directory register for published legal and
mediation articles. It records the card title, category, description, publication
date, available English/Sinhala URLs and search metadata, aliases, images, and
display preferences. A missing Sinhala edition is omitted from `editions`; the
builder does not invent a translation URL.

For a new article:

1. Finish the article HTML and its metadata, and save the published image asset.
2. Add its entry to `guide-register.json`. Use the English Article `datePublished`
   value for `published`. Include only language editions whose files exist.
3. Build a separate review copy and inspect the changed directory pages:

   ```sh
   python scripts/build-guides.py --output-dir /tmp/guide-preview
   ```

   The output contains eight generated directory pages and sitemap.xml. Serve it
   alongside the source site's assets when checking its appearance; it is not a
   complete website backup. Article files are never rewritten.

4. After reviewing, regenerate and run the checks:

   ```sh
   python scripts/build-guides.py
   python scripts/build-guides.py --check
   python -m unittest discover -s scripts/tests
   ```

5. Review the Git diff and publish through the existing GitHub Pages setup.

The builder validates all registered article editions, dates and images before
writing anything. It also rejects a published article left out of the register.
`--check` writes nothing and returns a nonzero status when generated files differ
from the current register and templates. Repeated builds produce identical bytes.

The templates in `scripts/templates` preserve the current page layouts, bilingual
search forms, family-law illustrations, footer and navigation. When changing a
generated page's layout, edit its template and regenerate rather than making an
HTML-only change that the next build would replace. Shared search interaction
remains in `assets/js/article-search.js`; shared navigation remains in
`assets/js/main.js`. Keep their stylesheet rules when editing the shared theme.

The six fixed topics use the existing landing cards. Adding a new topic also
requires its landing-card template. Article additions within an existing topic
update counts automatically. The recent section shows the latest six register
entries ordered by publication date, retaining register order for ties.
