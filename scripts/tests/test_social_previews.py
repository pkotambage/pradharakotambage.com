from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
SHARED_JPG = ROOT / "assets/images/social-preview.jpg"


class SocialPreviewTests(unittest.TestCase):
    def test_shared_preview_is_small_raster_asset(self):
        self.assertTrue(SHARED_JPG.exists(), "shared social preview JPEG is missing")
        self.assertLess(
            SHARED_JPG.stat().st_size,
            200_000,
            "shared social preview should stay below 200 KB",
        )

    def test_social_metadata_does_not_use_svg_or_old_png(self):
        offenders = []
        for path in ROOT.rglob("*.html"):
            text = path.read_text(encoding="utf-8")
            head = text.split("</head>", 1)[0]
            if "assets/images/social-preview.png" in head:
                offenders.append(f"{path.relative_to(ROOT)}: old social-preview.png")
            if re.search(r'(?:og:image|twitter:image)[^>]+\.svg', head, re.I):
                offenders.append(f"{path.relative_to(ROOT)}: SVG social meta")
            if re.search(r'"image"\s*:\s*"[^"]+\.svg"', head, re.I):
                offenders.append(f"{path.relative_to(ROOT)}: SVG JSON-LD image")
        self.assertEqual(offenders, [], "\n".join(offenders))

    def test_shared_card_declares_dimensions_and_type(self):
        offenders = []
        for path in ROOT.rglob("*.html"):
            text = path.read_text(encoding="utf-8")
            head = text.split("</head>", 1)[0]
            if "assets/images/social-preview.jpg" not in head:
                continue
            for required in (
                '<meta property="og:image:type" content="image/jpeg">',
                '<meta property="og:image:width" content="1200">',
                '<meta property="og:image:height" content="630">',
            ):
                if required not in head:
                    offenders.append(f"{path.relative_to(ROOT)}: missing {required}")
        self.assertEqual(offenders, [], "\n".join(offenders))

    def test_generator_templates_use_new_shared_card(self):
        offenders = []
        for path in (ROOT / "scripts/templates").glob("*.tpl"):
            text = path.read_text(encoding="utf-8")
            if "assets/images/social-preview.png" in text:
                offenders.append(str(path.relative_to(ROOT)))
        self.assertEqual(offenders, [], "\n".join(offenders))


if __name__ == "__main__":
    unittest.main()
