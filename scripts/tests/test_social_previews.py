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
            match = re.search(r'<meta property="og:image" content="([^"]+)">', head)
            if not match:
                continue
            image_url = match.group(1)
            if image_url.endswith("/assets/images/social-preview.jpg"):
                image_type, width, height = "image/jpeg", "1200", "630"
            elif image_url.endswith(".webp"):
                image_type = "image/webp"
                width, height = ("1600", "900") if image_url.endswith("-1600.webp") else ("1280", "720")
                image_path = ROOT / "assets/images" / image_url.split("/assets/images/", 1)[-1]
                if not image_path.is_file():
                    offenders.append(f"{path.relative_to(ROOT)}: missing social image {image_url}")
            else:
                continue
            for required in (
                f'<meta property="og:image:type" content="{image_type}">',
                f'<meta property="og:image:width" content="{width}">',
                f'<meta property="og:image:height" content="{height}">',
            ):
                if required not in head:
                    offenders.append(f"{path.relative_to(ROOT)}: missing {required}")
        self.assertEqual(offenders, [], "\\n".join(offenders))

    def test_generator_templates_use_new_shared_card(self):
        offenders = []
        for path in (ROOT / "scripts/templates").glob("*.tpl"):
            text = path.read_text(encoding="utf-8")
            if "assets/images/social-preview.png" in text:
                offenders.append(str(path.relative_to(ROOT)))
        self.assertEqual(offenders, [], "\n".join(offenders))


if __name__ == "__main__":
    unittest.main()
