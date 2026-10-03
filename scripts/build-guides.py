"""Build guide directories from guide-register.json and preserved page templates.

Use --output-dir PATH for an isolated review build, --check for stale-file checks,
or no flags to regenerate directories. Article files are never rewritten.
Only the Python standard library is required.
"""
import argparse
from datetime import date
from html import escape
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://pradharakotambage.com'


def article_metadata(path):
    text = path.read_text(encoding='utf-8')
    for raw in re.findall(r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', text, re.S):
        data = json.loads(raw)
        for item in data.get('@graph', [data]):
            if item.get('@type') == 'Article':
                return item
    return None


def local_file(root, url, article=False):
    parts = urlsplit(url)
    if parts.scheme or parts.netloc or parts.query or parts.fragment or not url.startswith('/'):
        raise ValueError(f'Expected a local URL: {url}')
    path = (root / parts.path.lstrip('/')).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError(f'URL escapes the project: {url}')
    if article:
        if not url.endswith('/'):
            raise ValueError(f'Article URL must end in /: {url}')
        path /= 'index.html'
    if not path.is_file():
        raise ValueError(f'Missing article or image: {url}')
    return path


def load_register(root):
    data = json.loads((root / 'scripts/guide-register.json').read_text(encoding='utf-8'))
    if data.get('schema_version') != 1:
        raise ValueError('Unsupported register schema')
    categories = [c['id'] for c in data['categories']]
    if len(set(categories)) != len(categories):
        raise ValueError('Duplicate category IDs')
    if not isinstance(data['recent_limit'], int) or data['recent_limit'] < 1:
        raise ValueError('recent_limit must be positive')
    ids, urls, english = set(), set(), set()
    for g in data['guides']:
        if g['id'] in ids or g['category'] not in categories:
            raise ValueError(f'Duplicate ID or unknown category: {g["id"]}')
        ids.add(g['id'])
        date.fromisoformat(g['published'])
        if not g['title'] or not g['description']:
            raise ValueError(f'Empty title or description: {g["id"]}')
        if 'en' not in g['editions'] or set(g['editions']) - {'en', 'si'}:
            raise ValueError(f'Invalid language editions: {g["id"]}')
        for language, e in g['editions'].items():
            if e['url'] in urls:
                raise ValueError(f'Duplicate URL: {e["url"]}')
            urls.add(e['url'])
            metadata = article_metadata(local_file(root, e['url'], article=True))
            if not metadata or not e['title'] or not e['description']:
                raise ValueError(f'Missing Article or search metadata: {e["url"]}')
            if language == 'en':
                english.add(e['url'])
                if metadata.get('datePublished') != g['published']:
                    raise ValueError(f'Publication date mismatch: {e["url"]}')
        if not isinstance(g['keywords'], list) or not all(isinstance(k, str) for k in g['keywords']):
            raise ValueError(f'Invalid keywords: {g["id"]}')
        local_file(root, g['image']['src'])
        if min(int(g['image']['width']), int(g['image']['height'])) < 1:
            raise ValueError(f'Invalid image dimensions: {g["id"]}')
    for section in ('legal-guides', 'dispute-resolution', 'si/legal-guides', 'si/dispute-resolution'):
        for path in (root / section).glob('*/index.html'):
            if article_metadata(path):
                url = '/' + path.parent.relative_to(root).as_posix() + '/'
                if url not in urls:
                    raise ValueError(f'Published article missing from register: {url}')
    return data


def render(root, name, values):
    text = (root / 'scripts/templates' / name).read_text(encoding='utf-8')
    def substitute(match):
        if match[1] not in values:
            raise ValueError(f'Missing template value {match[1]} in {name}')
        return str(values[match[1]])
    return re.sub(r'\{\{([^{}]+)\}\}', substitute, text)


def card(g, context):
    texts = [g['title'], g['description'], *g['keywords']]
    for e in g['editions'].values():
        texts += [e['title'], e['description']]
    search = escape(' '.join(texts).lower(), quote=True)
    illustrated = context in g['illustrated_in']
    im = g['image']
    art = (f'<img class="guide-art" src="{escape(im["src"], quote=True)}" alt="{escape(im["alt"], quote=True)}" width="{im["width"]}" height="{im["height"]}" loading="lazy" decoding="async">' if illustrated else '')
    url = escape(g['editions']['en']['url'], quote=True)
    label = (g.get('recent_sinhala_label') if context == 'recent' else None) or g.get('sinhala_label')
    si = f'<span class="topic-sinhala" lang="si">{escape(label)}</span>' if label else ''
    description = g.get('topic_description', g['description']) if context == 'topic' else g['description']
    languages = f'<a href="{url}">English</a>'
    if 'si' in g['editions']:
        languages += f'<a href="{escape(g["editions"]["si"]["url"], quote=True)}" lang="si">සිංහල</a>'
    published = ''
    if context == 'recent':
        d = date.fromisoformat(g['published'])
        published = f'<p class="guide-published">Published <time datetime="{d.isoformat()}">{d.day} {d.strftime("%B %Y")}</time></p>'
    cls = 'library-guide illustrated-guide' if illustrated else 'library-guide'
    return f'<article class="{cls}" data-search="{search}">{art}<div class="guide-copy"><h3><a href="{url}">{escape(g["title"])}</a></h3>{si}<p>{escape(description)}</p>{published}<div class="language-links">{languages}</div></div></article>'


def build_outputs(root):
    data = load_register(root)
    guides, categories = data['guides'], data['categories']
    outputs = {}
    def page(route, title, description, body, directory=False):
        outputs[route.strip('/') + '/index.html'] = render(root, 'guides-page.html.tpl', {
            'TITLE': escape(title), 'DESCRIPTION': escape(description, quote=True),
            'CANONICAL': BASE + route, 'BODY': body,
            'EXTRA_SCRIPTS': '<script src="/assets/js/article-search.js" defer></script>' if directory else '',
        })
    recent = sorted(guides, key=lambda g: g['published'], reverse=True)[:data['recent_limit']]
    values = {'RECENT_CARDS': ''.join(card(g, 'recent') for g in recent)}
    for c in categories:
        count = sum(g['category'] == c['id'] for g in guides)
        values['COUNT_' + c['id']] = f'{count} published {"guide" if count == 1 else "guides"}'
    page('/legal-guides/', 'Legal Guides | Pradhara Kotambage', 'Browse Sri Lankan legal guides by topic, in English and Sinhala.', render(root, 'guides-landing.html.tpl', values))
    body = render(root, 'guides-directory.html.tpl', {'ALL_CARDS': ''.join(card(g, 'directory') for g in guides), 'ARTICLE_COUNT': len(guides)})
    page('/legal-guides/all/', 'All Legal Guides | Pradhara Kotambage', 'Search all published Sri Lankan legal guides in English and Sinhala.', body, True)
    for c in categories:
        group = sorted((g for g in guides if g['category'] == c['id']), key=lambda g: g['topic_order'])
        cards = ''.join(card(g, 'topic') for g in group) or '<p>Guides on this topic are being prepared. <a href="/legal-guides/all/">Browse the published guides</a>.</p>'
        body = render(root, c.get('topic_template', 'guides-topic.html.tpl'), {
            'TOPIC_NAME': escape(c['name']), 'TOPIC_DESCRIPTION': escape(c['description']), 'TOPIC_CARDS': cards,
            'TOPIC_NOTE': '<p class="library-note">Explore the <a href="/dispute-resolution/">Dispute Resolution section</a> for more context on these approaches.</p>' if c['id'] == 'dispute-resolution' else '',
        })
        page(f'/legal-guides/topics/{c["id"]}/', f'{c["name"]} Guides | Pradhara Kotambage', c['description'] + ' Practical guides to Sri Lankan law.', body)
    xml = (root / 'sitemap.xml').read_text(encoding='utf-8')
    routes = ['/' + p.removesuffix('index.html') for p in outputs]
    routes += [e['url'] for g in guides for e in g['editions'].values()]
    for route in routes:
        loc = escape(BASE + route)
        if f'<loc>{loc}</loc>' not in xml:
            xml = xml.replace('</urlset>', f'  <url><loc>{loc}</loc></url>\n</urlset>')
    outputs['sitemap.xml'] = xml
    return outputs, len(guides)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--check', action='store_true', help='Report stale files without writing')
    mode.add_argument('--output-dir', type=Path, help='Build an isolated review copy')
    args = parser.parse_args()
    try:
        outputs, count = build_outputs(ROOT)
    except (KeyError, ValueError, OSError) as error:
        parser.exit(2, f'Build stopped before writing: {error}\n')
    destination = args.output_dir.resolve() if args.output_dir else ROOT
    changed = [p for p, text in outputs.items() if not (destination / p).is_file() or (destination / p).read_text(encoding='utf-8') != text]
    if args.check:
        print('Stale generated files:\n' + '\n'.join(changed) if changed else f'Generated directories are current: {count} articles.')
        return int(bool(changed))
    for p in changed:
        target = destination / p
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(outputs[p], encoding='utf-8')
    print(f'Built {count} articles in 6 topic directories; {len(changed)} files updated.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
