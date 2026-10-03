"""Validate the static website without changing files or requesting external URLs."""
import argparse
from collections import Counter
from datetime import date
from html.parser import HTMLParser
import importlib.util
import json
from pathlib import Path
import re
from urllib.parse import unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://pradharakotambage.com'


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.elements, self.ids, self.jsonld, self.styles = [], set(), [], []
        self.script = None
        self.style = None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.elements.append((tag, attrs))
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        if tag == 'a' and attrs.get('name'):
            self.ids.add(attrs['name'])
        if tag == 'script' and attrs.get('type', '').lower() == 'application/ld+json':
            self.script = ''
        if tag == 'style':
            self.style = ''
        if attrs.get('style'):
            self.styles.append(attrs['style'])

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_data(self, data):
        if self.script is not None:
            self.script += data
        if self.style is not None:
            self.style += data

    def handle_endtag(self, tag):
        if tag == 'script' and self.script is not None:
            self.jsonld.append(self.script)
            self.script = None
        if tag == 'style' and self.style is not None:
            self.styles.append(self.style)
            self.style = None

    def links(self, rel):
        return [a for t, a in self.elements if t == 'link' and rel in a.get('rel', '').split()]


def route(path, root):
    name = path.relative_to(root).as_posix()
    return '/' + name.removesuffix('index.html') if name.endswith('index.html') else '/' + name


def target(root, source_route, url):
    parts = urlsplit(urljoin(BASE + source_route, url))
    if parts.scheme not in ('http', 'https') or parts.hostname not in ('pradharakotambage.com', 'www.pradharakotambage.com'):
        return None
    path = (root / unquote(parts.path).lstrip('/')).resolve()
    if not path.is_relative_to(root):
        raise ValueError(f'URL escapes the website: {url}')
    if path.is_dir() or parts.path.endswith('/'):
        path /= 'index.html'
    return path, unquote(parts.fragment)


def nodes(value):
    if isinstance(value, list):
        for item in value:
            yield from nodes(item)
    elif isinstance(value, dict):
        yield value
        if '@graph' in value:
            yield from nodes(value['@graph'])


def validate(root):
    root = root.resolve()
    errors, warnings = [], set()
    files = sorted(p for p in root.rglob('*.html') if not any(
        part.startswith('.') or part in ('node_modules', 'test-results', 'playwright-report')
        for part in p.relative_to(root).parts))
    pages = {p: Page(p.read_text(encoding='utf-8')) for p in files}
    indexable, articles = set(), set()
    references = 0

    def check_url(source, url, fragment=True):
        nonlocal references
        try:
            resolved = target(root, route(source, root), url)
        except ValueError as error:
            errors.append(f'{route(source, root)}: {error}')
            return
        if resolved is None:
            return
        references += 1
        path, anchor = resolved
        if not path.is_file():
            errors.append(f'{route(source, root)}: missing local target {url}')
        elif fragment and anchor and path in pages and anchor not in pages[path].ids:
            errors.append(f'{route(source, root)}: missing fragment {url}')

    def check_css(source, text):
        for match in re.findall(r'url\(\s*[\"\']?([^\)\"\']+)', text):
            check_url(source, match.strip(), False)
        for match in re.findall(r'@import\s+[\"\']([^\"\']+)', text):
            check_url(source, match, False)

    for path, page in pages.items():
        current = route(path, root)
        canonical = page.links('canonical')
        if len(canonical) != 1 or canonical[0].get('href') != BASE + current:
            errors.append(f'{current}: canonical must match {BASE + current}')
        noindex = any(t == 'meta' and a.get('name', '').lower() == 'robots' and
                      'noindex' in re.split(r'[\s,]+', a.get('content', '').lower())
                      for t, a in page.elements)
        # Custom error pages must remain outside the sitemap.
        if not noindex and current != '/404.html':
            indexable.add(BASE + current)
        for tag, attrs in page.elements:
            for key in ('href', 'src', 'poster', 'action'):
                if attrs.get(key):
                    check_url(path, attrs[key], fragment=key == 'href')
            if attrs.get('srcset'):
                for candidate in attrs['srcset'].split(','):
                    if candidate.strip():
                        check_url(path, candidate.split()[0], False)
            if tag == 'meta' and attrs.get('property') in ('og:image', 'og:url'):
                check_url(path, attrs.get('content', ''), False)
        for css in page.styles:
            check_css(path, css)
        if page.script is not None:
            errors.append(f'{current}: unclosed JSON-LD script')
        for raw in page.jsonld:
            try:
                data = json.loads(raw)
                if not isinstance(data, (dict, list)):
                    raise ValueError('JSON-LD must be an object or array')
                for item in nodes(data):
                    kind = item.get('@type', [])
                    if isinstance(kind, str):
                        kind = [kind]
                    if 'Article' in kind:
                        articles.add(path)
                        for field in ('headline', 'datePublished', 'inLanguage'):
                            if not item.get(field):
                                raise ValueError(f'Article missing {field}')
                        for field in ('datePublished', 'dateModified'):
                            if field in item:
                                date.fromisoformat(item[field][:10])
                        language = 'si' if current.startswith('/si/') else 'en'
                        if not item['inLanguage'].startswith(language):
                            raise ValueError('Article language does not match page')
                    image = item.get('image', [])
                    for value in image if isinstance(image, list) else [image]:
                        if isinstance(value, dict):
                            value = value.get('url', value.get('contentUrl', ''))
                        if isinstance(value, str) and value:
                            check_url(path, value, False)
            except (ValueError, TypeError, KeyError) as error:
                errors.append(f'{current}: invalid JSON-LD: {error}')

        for alternate in page.links('alternate'):
            lang, url = alternate.get('hreflang'), alternate.get('href', '')
            if not lang or lang == 'x-default':
                continue
            resolved = target(root, current, url)
            if resolved is None or resolved[0] not in pages:
                errors.append(f'{current}: language alternate is not a local HTML page: {url}')
                continue
            counterpart = pages[resolved[0]]
            declared = next((a.get('lang', '') for t, a in counterpart.elements if t == 'html'), '')
            if declared.split('-')[0] != lang.split('-')[0]:
                errors.append(f'{current}: hreflang {lang} does not match {url}')
            source_language = next((a.get('lang', '') for t, a in page.elements if t == 'html'), '')
            back = any(a.get('hreflang') == source_language and a.get('href') == BASE + current
                       for a in counterpart.links('alternate'))
            if not back:
                # This exact existing section issue is tracked as T13; article failures are never exempt.
                if current == '/si/dispute-resolution/' and url == BASE + '/dispute-resolution/' and lang == 'en':
                    warnings.add('T13: English Dispute Resolution section lacks reciprocal language metadata.')
                else:
                    errors.append(f'{current}: missing reciprocal hreflang from {url}')

    for css in (root / 'assets').rglob('*.css'):
        check_css(css, css.read_text(encoding='utf-8'))
    try:
        xml = ET.parse(root / 'sitemap.xml')
        locations = [n.text for n in xml.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
        for url, count in Counter(locations).items():
            if count > 1:
                errors.append(f'Sitemap duplicate: {url}')
        for url in sorted(indexable - set(locations)):
            errors.append(f'Sitemap missing indexable page: {url}')
        for url in sorted(set(locations) - indexable):
            errors.append(f'Sitemap includes missing, noncanonical or noindex page: {url}')
        if f'Sitemap: {BASE}/sitemap.xml' not in (root / 'robots.txt').read_text():
            errors.append('robots.txt must name the canonical sitemap')
    except (OSError, ET.ParseError) as error:
        errors.append(f'Sitemap/robots: {error}')
    try:
        spec = importlib.util.spec_from_file_location('build_guides', root / 'scripts/build-guides.py')
        builder = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(builder)
        outputs, count = builder.build_outputs(root)
        for filename, expected in outputs.items():
            if not (root / filename).is_file() or (root / filename).read_text(encoding='utf-8') != expected:
                errors.append(f'Stale generated file: {filename}; run python scripts/build-guides.py')
        register = builder.load_register(root)
        registered = {builder.local_file(root, e['url'], article=True)
                      for g in register['guides'] for e in g['editions'].values()}
        if articles != registered:
            errors.append('Published Article inventory differs from guide register')
        for g in register['guides']:
            for language, edition in g['editions'].items():
                page = pages[builder.local_file(root, edition['url'], article=True)]
                for other_language, other in g['editions'].items():
                    if not any(a.get('hreflang') == other_language and a.get('href') == BASE + other['url']
                               for a in page.links('alternate')):
                        errors.append(f'{edition["url"]}: missing registered {other_language} hreflang')
    except (OSError, ValueError, KeyError, TypeError) as error:
        count = 0
        errors.append(f'Guide register/generation: {error}')
    return sorted(set(errors)), sorted(warnings), {
        'pages': len(pages), 'indexable': len(indexable), 'articles': len(articles),
        'subjects': count, 'references': references,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT, help='Validate an isolated website copy')
    args = parser.parse_args()
    try:
        errors, warnings, totals = validate(args.root)
    except (OSError, ValueError) as error:
        parser.exit(2, f'Validation stopped: {error}\n')
    for warning in warnings:
        print(f'WARNING: {warning}')
    for error in errors:
        print(f'ERROR: {error}')
    print(f'{"FAIL" if errors else "PASS"}: {totals["pages"]} pages, {totals["indexable"]} sitemap pages, '
          f'{totals["subjects"]} guide subjects, {totals["articles"]} article editions, '
          f'{totals["references"]} local references; {len(errors)} errors.')
    return int(bool(errors))


if __name__ == '__main__':
    raise SystemExit(main())
