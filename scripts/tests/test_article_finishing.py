from pathlib import Path
import json
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
REGISTER = json.loads((ROOT / "scripts/guide-register.json").read_text(encoding="utf-8"))


def article_paths():
    for guide in REGISTER["guides"]:
        for edition in guide["editions"].values():
            yield ROOT / edition["url"].lstrip("/") / "index.html"


class ArticleFinishingTests(unittest.TestCase):
    def test_every_registered_article_has_static_finishing_blocks_once(self):
        failures = []
        for path in article_paths():
            text = path.read_text(encoding="utf-8")
            author_count = len(re.findall(r'class=["\']author-note["\']', text))
            disclaimer_count = len(re.findall(r'class=["\']article-disclaimer["\']', text))
            if author_count != 1 or disclaimer_count != 1:
                failures.append(
                    f"{path.relative_to(ROOT)}: author-note={author_count}, article-disclaimer={disclaimer_count}"
                )
        self.assertEqual(failures, [], "\n".join(failures))

    def test_legacy_related_guide_runtime_patterns_are_materialized(self):
        failures = []
        for path in article_paths():
            text = path.read_text(encoding="utf-8")
            if re.search(r'<p>\s*<strong>Related guides?:?</strong>', text, re.I):
                failures.append(f"{path.relative_to(ROOT)}: legacy Related guides paragraph")
            if 'class="related-coming"' in text or "class='related-coming'" in text:
                failures.append(f"{path.relative_to(ROOT)}: legacy related-coming placeholder")
        self.assertEqual(failures, [], "\n".join(failures))

    def test_main_js_no_longer_injects_article_content(self):
        text = (ROOT / "assets/js/main.js").read_text(encoding="utf-8")
        forbidden = (
            "author-note",
            "article-disclaimer",
            "related-guides-inline",
            "related-coming",
            "articleContent",
        )
        found = [token for token in forbidden if token in text]
        self.assertEqual(found, [], f"main.js still mutates article content: {found}")

    def test_finishing_blocks_are_inside_article_html_before_javascript(self):
        failures = []
        for path in article_paths():
            text = path.read_text(encoding="utf-8")
            script_pos = text.rfind("<script")
            author_pos = text.find('class="author-note"')
            disclaimer_pos = text.find('class="article-disclaimer"')
            if author_pos < 0 or disclaimer_pos < 0:
                continue
            if script_pos >= 0 and (author_pos > script_pos or disclaimer_pos > script_pos):
                failures.append(f"{path.relative_to(ROOT)}: finishing block appears after JavaScript")
        self.assertEqual(failures, [], "\n".join(failures))


if __name__ == "__main__":
    unittest.main()
