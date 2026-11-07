#!/usr/bin/env python3
"""Four-stage, repeatable article image normalization.

Run --stage 1, 2, 3, 4 in order. Do not rebuild guide directories here:
their existing editorial customizations are preserved. The guide registry,
builder and templates are updated together for subsequent normal builds.
"""
import argparse
import base64
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "assets/images/articles"
WEIGHTS = (640, 960, 1280, 1600)
FULL_WIDTH = (1600, 900)
DOMAIN = "https://pradharakotambage.com"
IMAGE_REF = re.compile(r"(/assets/images/articles/)([a-zA-Z0-9-]+)\.(webp|jpg|svg)")

def source_images():
    originals = {}
    for extension in ("webp", "jpg"):
        for path in sorted(IMAGES.glob("*." + extension)):
            stem = path.stem
            if re.search(r"-(?:640|960|1280|1600)$", stem):
                continue
            if stem in originals:
                raise ValueError("Duplicate master stem: " + stem)
            originals[stem] = path
    if len(originals) != 36:
        raise ValueError("Expected 36 unique underlying images, found " + str(len(originals)))
    return originals

def put(path, content):
    if not path.exists() or path.read_text(encoding="utf-8") != content:
        path.write_text(content, encoding="utf-8")
        return True
    return False

def stage1():
    """Remove blurred side strips and internal clipping from eight inheritance SVGs."""
    changes = 0
    for svg in sorted(IMAGES.glob("*-clean.svg")):
        old = svg.read_text(encoding="utf-8")
        if "feGaussianBlur" not in old or 'clipPath id="main"' not in old:
            continue
        source = IMAGES / (svg.name.removesuffix("-clean.svg") + ".jpg")
        if not source.is_file():
            raise ValueError("Missing original JPEG for " + svg.name)
        b64 = base64.b64encode(source.read_bytes()).decode("ascii")
        new = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img">'
               '<image width="1280" height="720" preserveAspectRatio="xMidYMid meet" '
               'href="data:image/jpeg;base64,' + b64 + '"/></svg>\n')
        changes += int(put(svg, new))
    if changes != 8:
        raise ValueError("Stage 1 expected eight blur treatments, changed " + str(changes))
    print("Stage 1: removed eight blur/side-strip treatments")

def stage2():
    """Restore the complete artwork to 23 older and three inheritance SVGs."""
    changes = 0
    for svg in sorted(IMAGES.glob("*-clean.svg")):
        old = svg.read_text(encoding="utf-8")
        if 'viewBox="48 27 1184 666"' in old:
            new = old.replace('viewBox="48 27 1184 666"', 'viewBox="0 0 1280 720"', 1)
        elif 'viewBox="9 5 1262 710"' in old:
            new = old.replace('viewBox="9 5 1262 710"', 'viewBox="0 0 1280 720"', 1)
        else:
            continue
        changes += int(put(svg, new))
    if changes != 26:
        raise ValueError("Stage 2 expected 26 cropped SVGs, changed " + str(changes))
    print("Stage 2: restored full-frame view for 26 SVGs")

def stage3():
    """Build consistent 16:9 WebP variants from available original assets."""
    from PIL import Image, ImageOps
    originals = source_images()
    made = 0
    for stem, path in sorted(originals.items()):
        with Image.open(path) as source:
            source = ImageOps.exif_transpose(source).convert("RGB")
            if source.size != (1280, 720):
                raise ValueError("Source size mismatch: " + str(path) + " -> " + str(source.size))
            for width in WEIGHTS:
                height = width * 9 // 16
                dest = IMAGES / (stem + "-" + str(width) + ".webp")
                image = source if width == 1280 else source.resize((width, height), Image.Resampling.LANCZOS)
                # Use the highest quality that fits mobile-friendly size guidelines.
                quality_steps = (84, 81, 78, 75, 72, 69, 66)
                goal = {640: 65_000, 960: 125_000, 1280: 200_000, 1600: 250_000}[width]
                for quality in quality_steps:
                    image.save(dest, "WEBP", quality=quality, method=6)
                    if dest.stat().st_size <= goal:
                        break
                with Image.open(dest) as final:
                    if final.size != (width, height):
                        raise AssertionError("Invalid generated dimensions for " + str(dest))
                made += 1
    if made != 144:
        raise ValueError("Expected 144 responsive variants, created " + str(made))
    print("Stage 3: generated 36 WebP masters and 108 smaller responsive variants")

def get_stem(filename):
    name = filename
    for suffix in ("-clean", "-640", "-960", "-1280", "-1600"):
        if name.endswith(suffix):
            return name[:-len(suffix)]
    return name

def image_sizes(tag):
    if 'class="article-feature-image' in tag:
        return "(max-width: 700px) calc(100vw - 24px), (max-width: 940px) calc(100vw - 40px), 900px"
    if 'class="guide-art' in tag:
        return "(max-width: 700px) min(360px, calc(100vw - 28px)), 204px"
    if 'class="resolution-card-art' in tag:
        return "(max-width: 700px) calc(100vw - 40px), (max-width: 1100px) 45vw, 30vw"
    return "(max-width: 700px) calc(100vw - 28px), (max-width: 1100px) 50vw, 900px"

def normalize_img(tag, originals, feature=False):
    match = re.search(r'\bsrc="(/assets/images/articles/)([a-zA-Z0-9-]+)\.(?:svg|webp|jpg)"', tag)
    if not match:
        return tag
    stem = get_stem(match.group(2))
    if stem not in originals:
        raise ValueError("Unknown article image: " + stem)
    imagebase = "/assets/images/articles/" + stem
    tag = tag[:match.start()] + 'src="' + imagebase + '-1600.webp"' + tag[match.end():]
    tag = re.sub(r'\s+(?:srcset|sizes)="[^"]*"', "", tag)
    tag = re.sub(r'\bwidth="\d+"', 'width="1600"', tag)
    tag = re.sub(r'\bheight="\d+"', 'height="900"', tag)
    tag = re.sub(r'object-fit:\s*cover', 'object-fit:contain', tag)
    if 'width="1600"' not in tag:
        tag = tag[:-1] + ' width="1600"' + tag[-1]
    if 'height="900"' not in tag:
        tag = tag[:-1] + ' height="900"' + tag[-1]
    srcset = ", ".join(imagebase + "-" + str(w) + ".webp " + str(w) + "w" for w in WEIGHTS)
    sizes = ("(max-width: 700px) calc(100vw - 24px), (max-width: 940px) calc(100vw - 40px), 900px"
             if feature else image_sizes(tag))
    return tag[:-1] + ' srcset="' + srcset + '" sizes="' + sizes + '">' 

def normalize_page(text, originals):
    # Fix a broken alt attribute in the manually authored Dispute Resolution index.
    text = text.replace(
        'alt="Formal Sri Lankan mediation boardroom"s New Civil and Commercial Mediation Law illustration"',
        'alt="Illustration showing a Sri Lankan mediation discussion"'
    )
    # Normalize social and structured-data image URLs. Do not alter site-wide previews.
    def ref_replacer(match):
        stem = get_stem(match.group(2))
        if stem not in originals:
            return match.group(0)
        return match.group(1) + stem + "-1600.webp"
    text = IMAGE_REF.sub(ref_replacer, text)
    is_article_image = bool(re.search(r'property="og:image" content="https://pradharakotambage.com/assets/images/articles/', text))
    if is_article_image:
        text = re.sub(r'(property="og:image:type" content=")[^"]+', r'\1image/webp', text)
        text = re.sub(r'(property="og:image:width" content=")\d+', r'\g<1>1600', text)
        text = re.sub(r'(property="og:image:height" content=")\d+', r'\g<1>900', text)
    def change_fig(match):
        block = match.group(0)
        return re.sub(r'<img\b[^>]*>', lambda m: normalize_img(m.group(0), originals, True), block)
    text = re.sub(r'<figure\b[^>]*class="[^"]*article-feature-image[^"]*"[^>]*>[\s\S]*?</figure>', change_fig, text)
    text = re.sub(r'<img\b[^>]*>', lambda m: normalize_img(m.group(0), originals), text)
    # Consistent card framing across the separately authored directory pages.
    def img_css(match):
        rule = match.group(0).replace("object-fit:cover", "object-fit:contain")
        rule = re.sub(r'object-fit:\s*cover', 'object-fit: contain', rule)
        if "resolution-card-art" in rule:
            rule = re.sub(r'height:\s*(?:150|180)px\s*;', 'height: auto; aspect-ratio: 16 / 9;', rule)
        return rule
    text = re.sub(r'\.(?:guide-art|resolution-card-art|future-card-art)[^{]*\{[^{}]*\}', img_css, text)
    return text

def stage4():
    """Use responsive WebP on article pages, directories and Android screen sizes."""
    originals = source_images()
    register_file = ROOT / "scripts/guide-register.json"
    data = json.loads(register_file.read_text(encoding="utf-8"))
    updated = 0
    for guide in data["guides"]:
        src = guide["image"]["src"]
        stem = get_stem(Path(src).stem)
        if stem not in originals:
            raise ValueError("Guide references an unrecognized article image: " + src)
        guide["image"]["src"] = "/assets/images/articles/" + stem + "-1600.webp"
        guide["image"]["width"] = 1600
        guide["image"]["height"] = 900
        updated += 1
    put(register_file, json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    builder = ROOT / "scripts/build-guides.py"
    source = builder.read_text(encoding="utf-8")
    marker = '    art = (f\'<img class="guide-art"'
    if marker not in source:
        raise ValueError("Guide builder image renderer not found")
    position = source.index("    art = (", source.index("def card("))
    end = source.index("\n", position)
    replacement = (
        '    imagebase = im["src"].removesuffix("-1600.webp")\n'
        '    srcset = ", ".join(f"{imagebase}-{w}.webp {w}w" for w in (640, 960, 1280, 1600))\n'
        '    sizes = "(max-width: 700px) min(360px, calc(100vw - 28px)), 204px"\n'
        '    art = (f\'<img class="guide-art" src="{escape(im["src"], quote=True)}" srcset="{escape(srcset, quote=True)}" sizes="{escape(sizes, quote=True)}" alt="{escape(im["alt"], quote=True)}" width="{im["width"]}" height="{im["height"]}" loading="lazy" decoding="async">\' if illustrated else \'\')'
    )
    source = source[:position] + replacement + source[end:]
    put(builder, source)
    # Generated page templates are the source of truth for future publishing.
    for template in (ROOT / "scripts/templates").glob("*.tpl"):
        old = template.read_text(encoding="utf-8")
        new = re.sub(r'(\.guide-art[^{]*\{[^{}]*object-fit:\s*)cover', r'\g<1>contain', old)
        new = new.replace(".illustrated-guide .guide-art{max-height:220px}", ".illustrated-guide .guide-art{max-height:none}")
        if new != old:
            put(template, new)
    html_count = 0
    for page in ROOT.glob("**/index.html"):
        text = page.read_text(encoding="utf-8")
        if "/assets/images/articles/" not in text:
            continue
        new = normalize_page(text, originals)
        if put(page, new):
            html_count += 1
    # Verify article pages all use a full-size master and expose Android srcset.
    articles = [p for p in ROOT.glob("**/index.html")
                if p.relative_to(ROOT).parts[0] in ("legal-guides", "dispute-resolution", "law-in-practice", "si")
                and 'class="article-feature-image"' in p.read_text(encoding="utf-8")]
    if len(articles) != 55:
        raise ValueError("Expected 55 image-bearing articles, found " + str(len(articles)))
    for page in articles:
        html = page.read_text(encoding="utf-8")
        blocks = re.findall(r'<figure\b[^>]*class="[^"]*article-feature-image[^"]*"[^>]*>[\s\S]*?</figure>', html)
        if len(blocks) != 1 or "-1600.webp" not in blocks[0] or "srcset=" not in blocks[0]:
            raise ValueError("Invalid feature image in " + str(page.relative_to(ROOT)))
    if any("-clean.svg" in p.read_text(encoding="utf-8") for p in ROOT.glob("**/index.html")):
        raise ValueError("An article or directory still references legacy cropped SVG")
    for stem in originals:
        for width in WEIGHTS:
            if not (IMAGES / (stem + "-" + str(width) + ".webp")).is_file():
                raise ValueError("Missing output variant: " + stem + "-" + str(width))
    print("Stage 4: updated", updated, "registry entries and", html_count, "HTML pages")
    print("Verified:", len(articles), "feature images, 36 source images, 144 responsive variants")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", type=int, choices=(1,2,3,4), required=True)
    stage = parser.parse_args().stage
    {1: stage1, 2: stage2, 3: stage3, 4: stage4}[stage]()

if __name__ == "__main__":
    main()
