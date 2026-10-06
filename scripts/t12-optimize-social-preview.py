from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
THIS_SCRIPT = Path(__file__).resolve()
src = ROOT / "assets/images/social-preview.png"
dst = ROOT / "assets/images/social-preview.jpg"

with Image.open(src) as im:
    im = im.convert("RGB")
    im = ImageOps.fit(im, (1200, 630), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
    im.save(dst, "JPEG", quality=86, optimize=True, progressive=True, subsampling="4:2:0")

replacements = {
    "https://pradharakotambage.com/assets/images/social-preview.png":
        "https://pradharakotambage.com/assets/images/social-preview.jpg",
    "https://pradharakotambage.com/assets/images/family-law-amicable-separation.svg":
        "https://pradharakotambage.com/assets/images/social-preview.jpg",
    "https://pradharakotambage.com/assets/images/family-law-uncontested-divorce.svg":
        "https://pradharakotambage.com/assets/images/social-preview.jpg",
}

text_suffixes = {".html", ".tpl", ".json"}
changed = []
for path in ROOT.rglob("*"):
    if not path.is_file() or path.suffix.lower() not in text_suffixes:
        continue
    if ".git" in path.parts or path.resolve() == THIS_SCRIPT:
        continue
    text = path.read_text(encoding="utf-8")
    new = text
    for old, replacement in replacements.items():
        new = new.replace(old, replacement)

    if path.suffix.lower() == ".html" and "property=\"og:image\"" in new and "assets/images/social-preview.jpg" in new:
        if 'property="og:image:width"' not in new:
            marker = '<meta property="og:image" content="https://pradharakotambage.com/assets/images/social-preview.jpg">'
            extra = marker + '\n  <meta property="og:image:type" content="image/jpeg">\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">'
            new = new.replace(marker, extra)

    if new != text:
        path.write_text(new, encoding="utf-8")
        changed.append(str(path.relative_to(ROOT)))

print(f"Created {dst.relative_to(ROOT)}: {dst.stat().st_size} bytes, 1200x630")
print(f"Updated {len(changed)} text files")
for item in changed:
    print(item)
