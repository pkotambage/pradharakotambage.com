"""Confirm real publishing mistakes fail validation, using isolated site copies."""
import importlib.util
from pathlib import Path
import shutil
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('validate_site', ROOT / 'scripts/validate-site.py')
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


class SiteValidationTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name) / 'site'
        shutil.copytree(ROOT, self.root, ignore=shutil.ignore_patterns(
            '.git', '__pycache__', 'node_modules', 'test-results', 'playwright-report'))

    def append(self, name, text):
        path = self.root / name
        path.write_text(path.read_text(encoding='utf-8') + text, encoding='utf-8')

    def errors(self):
        return '\n'.join(validator.validate(self.root)[0])

    def test_current_site_passes_without_rewriting_pages(self):
        before = {p: p.read_bytes() for p in self.root.rglob('*.html')}
        errors, warnings, totals = validator.validate(self.root)
        self.assertEqual(errors, [])
        self.assertEqual(totals['pages'], len(before))
        self.assertEqual(warnings, [])
        self.assertEqual(before, {p: p.read_bytes() for p in before})

    def test_broken_links_assets_fragments_and_jsonld_fail(self):
        self.append('about/index.html', '''
          <a href="/missing-page/">Broken page</a>
          <a href="/contact/#missing-anchor">Broken anchor</a>
          <img src="/assets/missing-image.png">
          <style>body {background:url('/assets/missing-background.png')}</style>
          <script type="application/ld+json">{broken}</script>
        ''')
        errors = self.errors()
        for text in ('missing-page', 'missing-anchor', 'missing-image', 'missing-background', 'invalid JSON-LD'):
            with self.subTest(text=text):
                self.assertIn(text, errors)

    def test_sitemap_omission_duplicate_and_noindex_fail(self):
        sitemap = self.root / 'sitemap.xml'
        text = sitemap.read_text().replace('<loc>https://pradharakotambage.com/about/</loc>',
                                            '<loc>https://pradharakotambage.com/contact/</loc>')
        text = text.replace('</urlset>', '<url><loc>https://pradharakotambage.com/privacy/</loc></url></urlset>')
        sitemap.write_text(text)
        errors = self.errors()
        for text in ('Sitemap missing indexable page', 'Sitemap duplicate', 'Sitemap includes missing, noncanonical or noindex page'):
            self.assertIn(text, errors)

    def test_removed_article_language_metadata_is_not_exempt(self):
        path = self.root / 'si/legal-guides/someone-owes-you-money/index.html'
        text = path.read_text()
        text = text.replace('hreflang="en"', 'data-removed-hreflang="en"')
        path.write_text(text)
        errors = self.errors()
        self.assertIn('missing registered en hreflang', errors)
        self.assertIn('missing reciprocal hreflang', errors)

    def test_stale_directory_is_reported_without_repairing_it(self):
        self.append('legal-guides/index.html', '<!-- outdated -->')
        self.assertIn('Stale generated file: legal-guides/index.html', self.errors())
        self.assertTrue((self.root / 'legal-guides/index.html').read_text().endswith('<!-- outdated -->'))


if __name__ == '__main__':
    unittest.main()
