"""T14: materialize article finishing blocks in published HTML.

This is an idempotent migration/publishing helper. It:
- adds the standard author note and disclaimer only when an article lacks them;
- converts legacy inline Related guide(s) paragraphs into static callouts;
- materializes the small set of related-guide links formerly added by main.js.

It never rewrites article prose beyond those finishing/related-guide patterns.
"""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
REGISTER = ROOT / "scripts/guide-register.json"

AUTHOR_EN = '''<section class="author-note">
          <h2>About the author</h2>
          <p><strong>Pradhara Kotambage</strong> is an Attorney-at-Law in Sri Lanka. This Legal Guides project focuses on practical legal literacy and clear explanations of the questions people encounter in everyday disputes.</p>
        </section>'''
AUTHOR_SI = '''<section class="author-note">
          <h2>කතුවරයා ගැන</h2>
          <p><strong>ප්‍රධාර කොටඹගේ</strong> නීතිඥවරයෙකි. මෙම Legal Guides ව්‍යාපෘතිය ප්‍රායෝගික නීති දැනුවත්භාවය සහ දෛනික ගැටලු වලදී මිනිසුන් මුහුණ දෙන ප්‍රශ්න පැහැදිලිව විස්තර කිරීම කෙරෙහි අවධානය යොමු කරයි.</p>
        </section>'''
DISCLAIMER_EN = '''<div class="article-disclaimer">
          <p><strong>General information only.</strong> This article provides general legal information. The appropriate legal remedy depends on the facts and documents relating to each individual matter. Reading this guide does not by itself create an Attorney-at-Law/client relationship.</p>
        </div>'''
DISCLAIMER_SI = '''<div class="article-disclaimer">
          <p><strong>සාමාන්‍ය තොරතුරු පමණි.</strong> මෙම ලිපිය සාමාන්‍ය නීතිමය තොරතුරු සපයයි. සුදුසු නීතිමය සහනය එක් එක් කරුණට අදාළ කරුණු සහ ලේඛන මත රඳා පවතී. මෙම මාර්ගෝපදේශය කියවීමෙන් පමණක් Attorney-at-Law/client relationship එකක් ඇති නොවේ.</p>
        </div>'''

PUBLISHED = {
    "The Debtor Has Asked for More Time – Should You Agree?": "../debtor-asked-for-more-time/",
    "How Long Can You Wait Before Taking Legal Action to Recover a Debt?": "../how-long-to-recover-debt/",
    "Why Oral Agreements Can Be Dangerous When Land or Property Is Involved": "../oral-agreements-land-property/",
    "If a Labour Tribunal Finds Your Termination Unfair, Will You Automatically Get Your Job Back — and How Is Compensation Decided?": "../labour-tribunal-reinstatement-compensation/",
}
LABOUR_SI = "කම්කරු විනිශ්චය සභාව ඔබගේ සේවා අවසන් කිරීම අසාධාරණ බව තීරණය කළොත්, ඔබට අනිවාර්යයෙන්ම රැකියාව නැවත ලැබෙනවාද — වන්දි තීරණය කරන්නේ කොහොමද?"


def article_paths():
    data = json.loads(REGISTER.read_text(encoding="utf-8"))
    for guide in data["guides"]:
        for edition in guide["editions"].values():
            yield ROOT / edition["url"].lstrip("/") / "index.html"


def materialize_related(text):
    # Repair an over-broad early migration artifact if encountered.
    text = re.sub(
        r'<div class="article-callout related-guides-inline"><p><strong>Related guides</strong></p><p></p></div>\s*',
        '',
        text,
        flags=re.I,
    )

    # Materialize links that were previously added at runtime.
    for title, href in PUBLISHED.items():
        escaped = re.escape(title)
        # Coming-soon span form.
        text = re.sub(
            rf'<span>\s*[“"]?{escaped}[”"]?\s*(?:<em>\(coming soon\)</em>|\(coming soon\))?\s*</span>',
            f'<a href="{href}">{title}</a>',
            text,
            flags=re.I,
        )
        # Plain related paragraph form, if it has no link yet.
        text = re.sub(
            rf'<p>\s*{escaped}\s*(?:—\s*published)?\s*</p>',
            f'<p><a href="{href}">{title}</a> — published</p>',
            text,
            flags=re.I,
        )

    # Existing related-coming item for the debt limitation article.
    debt = "How Long Can You Wait Before Taking Legal Action to Recover a Debt?"
    text = re.sub(
        rf'<[^>]+class=["\'][^"\']*related-coming[^"\']*["\'][^>]*>\s*{re.escape(debt)}\s*(?:Coming soon)?\s*</[^>]+>',
        f'<a class="related-link" href="../how-long-to-recover-debt/">{debt}</a>',
        text,
        flags=re.I,
    )

    if LABOUR_SI in text and f'>{LABOUR_SI}</a>' not in text:
        text = text.replace(
            f'<p>{LABOUR_SI}</p>',
            f'<p><a href="../labour-tribunal-reinstatement-compensation/">{LABOUR_SI}</a> — පළ කර ඇත</p>',
        )

    call_si = '“Call එකේදී එයා ණය පිළිගත්තා” — Call Recordings වලින් මොකද වෙන්නේ?'
    text = re.sub(
        rf'<span class=["\']related-coming["\']>\s*<strong>{re.escape(call_si)}</strong>\s*</span>',
        f'<a class="related-link" href="../call-recordings-admission-of-debt/">{call_si}</a>',
        text,
    )
    return text


def insert_finishing(text, is_si):
    author = AUTHOR_SI if is_si else AUTHOR_EN
    disclaimer = DISCLAIMER_SI if is_si else DISCLAIMER_EN
    additions = []
    if 'class="author-note"' not in text and "class='author-note'" not in text:
        additions.append(author)
    if 'class="article-disclaimer"' not in text and "class='article-disclaimer'" not in text:
        additions.append(disclaimer)
    if not additions:
        return text

    block = "\n        " + "\n        ".join(additions) + "\n        "
    back = re.search(r'<p\s+class=["\']article-back["\']', text)
    if back:
        return text[:back.start()] + block + text[back.start():]

    # Fallback: insert before the closing tag of the article-content article.
    matches = list(re.finditer(r'</article>', text, re.I))
    if not matches:
        raise ValueError("article has no closing </article>")
    end = matches[-1]
    return text[:end.start()] + block + text[end.start():]


def main():
    changed = []
    for path in article_paths():
        if not path.is_file():
            raise FileNotFoundError(path)
        original = path.read_text(encoding="utf-8")
        is_si = bool(re.search(r'<html\s+lang=["\']si(?:-|["\'])', original, re.I))
        new = materialize_related(original)
        new = insert_finishing(new, is_si)
        if new != original:
            path.write_text(new, encoding="utf-8")
            changed.append(path.relative_to(ROOT).as_posix())
    print(f"Updated {len(changed)} article files.")
    for path in changed:
        print(path)


if __name__ == "__main__":
    main()
