"""Regression checks for preserving published directories during regeneration."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]


class DirectoryBuildTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'source'
        shutil.copytree(ROOT, self.root, ignore=shutil.ignore_patterns('.git', '__pycache__', 'node_modules', 'test-results', 'playwright-report'))

    def run_build(self, *args):
        return subprocess.run([sys.executable, str(self.root / 'scripts/build-guides.py'), *map(str, args)], capture_output=True, text=True)

    def article_hashes(self):
        return {p.relative_to(self.root): hashlib.sha256(p.read_bytes()).hexdigest() for section in ('legal-guides', 'dispute-resolution', 'si/legal-guides', 'si/dispute-resolution') for p in (self.root / section).glob('*/index.html') if '"@type": "Article"' in p.read_text() or '"@type":"Article"' in p.read_text()}

    def test_regeneration_preserves_features_and_is_repeatable(self):
        before = self.article_hashes()
        result = self.run_build()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(before, self.article_hashes())
        landing = (self.root / 'legal-guides/index.html').read_text()
        directory = (self.root / 'legal-guides/all/index.html').read_text()
        family = (self.root / 'legal-guides/topics/family-personal-law/index.html').read_text()
        self.assertIn('id="article-search"', landing)
        self.assertIn('id="guide-search-form"', directory)
        self.assertIn('id="guide-search-clear"', directory)
        self.assertIn('/assets/js/article-search.js', directory)
        register = json.loads((self.root / 'scripts/guide-register.json').read_text())
        self.assertIn(f'{len(register["guides"])} articles', directory)
        mediation_count = sum(g['category'] == 'dispute-resolution' for g in register['guides'])
        self.assertIn(f'{mediation_count} published guides', landing)
        self.assertIn('datetime="' + max(g['published'] for g in register['guides']) + '"', landing)
        for text in ('mediation-assisted-negotiation', 'divorce-without-unnecessary-conflict', 'mutual-consent-divorce-sri-lanka'):
            self.assertIn(text, directory)
        self.assertIn('/si/dispute-resolution/mediation-assisted-negotiation/', directory)
        self.assertIn('family-law-amicable-separation.svg', family)
        first = {p: p.read_bytes() for p in (self.root / 'legal-guides').rglob('index.html')}
        self.assertEqual(self.run_build().returncode, 0)
        self.assertEqual(first, {p: p.read_bytes() for p in first})
        self.assertEqual(self.run_build('--check').returncode, 0)
        path = self.root / 'legal-guides/index.html'
        path.write_text(path.read_text() + '\n<!-- stale directory -->')
        self.assertEqual(self.run_build('--check').returncode, 1)
        self.assertTrue(path.read_text().endswith('<!-- stale directory -->'))

    def test_omitted_published_article_stops_before_writing(self):
        p = self.root / 'scripts/guide-register.json'
        data = json.loads(p.read_text())
        data['guides'] = [g for g in data['guides'] if g['id'] != 'mediation-assisted-negotiation']
        p.write_text(json.dumps(data))
        output = Path(self.temp.name) / 'preview'
        result = self.run_build('--output-dir', output)
        self.assertEqual(result.returncode, 2)
        self.assertIn('missing from register', result.stderr)
        self.assertFalse(output.exists())

    def test_missing_language_counterpart_stops_before_writing(self):
        data = json.loads((self.root / 'scripts/guide-register.json').read_text())
        g = next(g for g in data['guides'] if g['id'] == 'mediation-assisted-negotiation')
        (self.root / g['editions']['si']['url'].strip('/') / 'index.html').unlink()
        output = Path(self.temp.name) / 'preview'
        result = self.run_build('--output-dir', output)
        self.assertEqual(result.returncode, 2)
        self.assertIn('Missing article or image', result.stderr)
        self.assertFalse(output.exists())


if __name__ == '__main__':
    unittest.main()
