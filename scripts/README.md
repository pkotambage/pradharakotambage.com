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

4. After reviewing, regenerate and run the complete publishing check:

   ```sh
   python scripts/build-guides.py
   npm run validate
   ```

5. Review the Git diff and publish through the existing GitHub Pages setup.

## Validation setup and scope

Use Python 3.10+ and Node.js 22. Once per checkout, install the pinned test tools:

```sh
npm ci
npx playwright install chromium
```

On Linux, `npx playwright install --with-deps chromium` also installs the browser's
system dependencies. After setup, `npm run validate` is the single pre-publication
command. It checks local links and anchors, image/script/style assets (including
CSS references), canonical URLs, sitemap coverage and noindex exclusions,
JSON-LD syntax and basic Article fields, language counterparts, the full guide
inventory and stale generated pages. It then runs regression tests and a real
Chromium search test against a temporary local server. It does not rewrite pages.

The browser test exercises the Legal Guides search form, initial query loading,
English and Sinhala queries, illustrated cards, an unmatched query and Clear.
It checks actual visibility and layout removal, so a CSS rule that overrides the
HTML hidden attribute fails the check. Expected results currently cover mediation
(4), මුදල් (7), දික්කසාද (2), no match (0), and Clear (the register total).
When adding relevant articles, deliberately review and update these expected
counts and titles in `scripts/browser-tests/search.spec.mjs`.

`python scripts/validate-site.py` is the fast dependency-free static check.
Use `--root PATH` to check a complete isolated site copy. External website
availability, Google indexing, accessibility and full structured-data eligibility
are separate review tasks; this validator does not claim to establish them.

The existing T13 issue on the two Dispute Resolution section pages is reported as
one narrowly scoped warning. Broken article language pairs always fail. Remove
the exception when T13 fixes the section metadata.

GitHub's **Validate website** workflow runs the same command on pull requests and
branch pushes. Check its result before merging, and run the command before a
direct push. This workflow reports failures; it does not change the existing
GitHub Pages deployment or configure branch protection, so it does not itself
block automatic deployment of a direct push to main.

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
