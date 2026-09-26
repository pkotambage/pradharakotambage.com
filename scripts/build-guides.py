"""Build the Legal Guides landing page, topic pages, and searchable directory.

Add a published guide to GUIDES with its existing URL and language availability,
then run `python scripts/build-guides.py`. Article files are never rewritten.
"""
from pathlib import Path
from html import escape
import re

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://pradharakotambage.com"
CATEGORIES = [
    ("civil-litigation", "Civil Litigation", "Court procedure, evidence and appeals."),
    ("land-property", "Land & Property", "Ownership, agreements and land disputes."),
    ("employment-labour", "Employment & Labour", "Termination, workplace rights and Labour Tribunal proceedings."),
    ("family-personal-law", "Family & Personal Law", "Marriage, divorce, maintenance and family matters."),
    ("contracts-recovery", "Contracts & Recovery", "Agreements, debts, cheques and legal demands."),
    ("dispute-resolution", "Dispute Resolution", "Negotiation, settlement, mediation and arbitration."),
]

# Slug, title, category, description, English URL, Sinhala URL (if published).
GUIDES = [
 ("what-to-do-after-receiving-letter-of-demand", "What to Do After Receiving a Letter of Demand in Sri Lanka", "contracts-recovery", "Understand the claim, check the facts and preserve documents before responding."),
 ("how-to-respond-to-letter-of-demand", "How Should You Respond to a Letter of Demand in Sri Lanka?", "contracts-recovery", "Consider what to accept or dispute and whether to propose settlement."),
 ("someone-owes-you-money", "Someone Owes You Money: What Legal Options Are Available in Sri Lanka?", "contracts-recovery", "Evidence, demands, negotiation and court proceedings when money remains unpaid."),
 ("what-happens-after-civil-case-filed", "What Actually Happens After a Civil Case Is Filed in Sri Lanka?", "civil-litigation", "From filing and summons through pleadings, trial and judgment."),
 ("whatsapp-messages-prove-debt", "Can WhatsApp Messages Be Used to Prove a Debt?", "civil-litigation", "The context and original conversation behind a screenshot may matter."),
 ("call-recordings-admission-of-debt", "“He Admitted the Debt on the Phone” – What About Call Recordings?", "civil-litigation", "Authenticity, context and preservation of a recorded admission."),
 ("no-written-agreement-loan-recovery", "I Lent Money Without a Written Agreement. Can I Still Recover It?", "contracts-recovery", "Other evidence may matter when there is no written loan agreement."),
 ("old-cheque-still-useful", "I Have a Cheque That Is One or Two Years Old – Is It Still Useful?", "contracts-recovery", "An old cheque, the underlying debt and legal time limits."),
 ("debtor-asked-for-more-time", "The Debtor Has Asked for More Time – Should You Agree?", "contracts-recovery", "Points to consider before extending payment time."),
 ("how-long-to-recover-debt", "How Long Can You Wait Before Trying to Recover a Debt?", "contracts-recovery", "How delay may affect evidence and legal time limits."),
 ("oral-agreements-land-property", "Why Oral Agreements Can Be Dangerous When Land or Property Is Involved", "land-property", "Why informal arrangements may not meet legal formalities for land."),
 ("unfair-termination-proper-procedure", "What Can You Do If Your Employer Terminates You Unfairly or Without Proper Procedure?", "employment-labour", "Questions, procedures and remedies following termination."),
 ("labour-tribunal-reinstatement-compensation", "Reinstatement or Compensation: What Can a Labour Tribunal Order?", "employment-labour", "The main forms of relief in a Labour Tribunal application."),
 ("what-is-mediation", "What Is Mediation?", "dispute-resolution", "How mediation differs from arbitration and litigation, and when it may help.", "/dispute-resolution/what-is-mediation/", "/si/dispute-resolution/what-is-mediation/"),
 ("preparing-for-mediation", "Preparing for Mediation", "dispute-resolution", "What parties should and should not do before and during mediation.", "/dispute-resolution/preparing-for-mediation/", "/si/dispute-resolution/preparing-for-mediation/"),
 ("civil-commercial-mediation-act-sri-lanka", "Sri Lanka's New Civil and Commercial Mediation Law", "dispute-resolution", "A guide to Act No. 13 of 2026 and its practical implications.", "/dispute-resolution/civil-commercial-mediation-act-sri-lanka/", None),
]

def path_for(g): return g[4] if len(g)>4 else f"/legal-guides/{g[0]}/"
def sinhala_for(g): return g[5] if len(g)>5 else f"/si/legal-guides/{g[0]}/"
def links(g):
    si = sinhala_for(g)
    return f'<div class="language-links"><a href="{path_for(g)}">English</a>' + (f'<a href="{si}" lang="si">සිංහල</a>' if si else '') + '</div>'
def card(g):
    return f'<article class="library-guide" data-search="{escape((g[1]+" "+g[3]).lower(),quote=True)}"><h3><a href="{path_for(g)}">{escape(g[1])}</a></h3><p>{escape(g[3])}</p>{links(g)}</article>'

CSS = """
 .library-page {background:#fbf8f2; min-height:70vh; padding:52px 0 76px}
 .library-page h1 {font-size:clamp(2.4rem,5vw,4rem); margin:0 0 12px; line-height:1.08}
 .library-page h2 {font-size:clamp(1.8rem,3vw,2.5rem); margin:0 0 18px}
 .library-page p {line-height:1.65}
 .library-intro {max-width:740px; color:#43565f; margin:0 0 28px; font-size:1.1rem}
 .library-section {margin-top:54px}
 .library-grid {display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px}
 .library-topic,.library-guide {background:#fffdf9; border:1px solid #d9d4ca; padding:24px 26px}
 .library-topic {display:block; border-top:4px solid #527c77; text-decoration:none}
 .library-topic h3,.library-guide h3 {font-size:1.38rem; line-height:1.25; margin:0 0 9px}
 .library-topic p,.library-guide p {margin:0; color:#4b5c65}
 .library-topic small {display:block; margin-top:14px; color:#53636b; font-size:.88rem}
 .library-topic:hover,.library-topic:focus-visible,.library-guide:hover {border-color:#a3694d}
 .library-list {display:grid; gap:12px}
 .library-guide {border-left:4px solid #527c77}
 .language-links {display:flex; gap:18px; margin-top:16px; font-weight:700}
 .language-links a {text-decoration:underline; text-underline-offset:3px}
 .library-crumb {margin:0 0 18px; font-size:.94rem}
 .library-search {display:block; width:100%; max-width:680px; padding:14px 16px; font:inherit; border:1px solid #889da6; background:white; color:#17324d; border-radius:3px}
 .library-count {color:#53636b; margin:12px 0 22px}
 .library-note {border-left:4px solid #527c77; background:#e7f0f2; padding:16px 20px; margin-top:44px; max-width:830px}
 @media(max-width:700px){.library-page {padding:34px 0 58px}.library-grid{grid-template-columns:1fr}.library-topic,.library-guide{padding:20px}}
"""

def document(title, description, url, body):
    title, description = escape(title), escape(description, quote=True)
    return f'''<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="{description}"><meta name="robots" content="index, follow"><link rel="canonical" href="{BASE}{url}"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta property="og:type" content="website"><meta property="og:site_name" content="Pradhara Kotambage"><meta property="og:title" content="{title}"><meta property="og:description" content="{description}"><meta property="og:url" content="{BASE}{url}"><meta property="og:image" content="{BASE}/assets/images/social-preview.png"><title>{title}</title><link rel="stylesheet" href="/assets/css/style.css"><style>{CSS}</style></head><body>
<header class="site-header"><div class="container header-inner"><a class="brand" href="/" aria-label="Pradhara Kotambage home"><span class="brand-name">Pradhara Kotambage</span><span class="brand-subtitle">Legal Knowledge &amp; Dispute Resolution</span></a><button class="menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false"><span></span><span></span><span></span></button><nav class="site-nav" aria-label="Main navigation"><a href="/">Home</a><a href="/about/">About</a><a class="active" href="/legal-guides/">Legal Guides</a><a href="/law-in-practice/">Law in Practice <span lang="si">| නීතිය ප්‍රායෝගිකව</span></a><a href="/dispute-resolution/">Dispute Resolution</a><a href="/legal-resources/">Legal Resources</a><a href="/contact/">Contact</a></nav></div></header>
<main class="library-page"><div class="container">{body}</div></main>
<footer class="site-footer"><div class="container footer-grid"><div><div class="footer-name">Pradhara Kotambage</div><div class="footer-title">Attorney-at-Law | Sri Lanka</div><p class="footer-tagline">Clear law. Informed choices. Constructive resolution.</p></div><div class="disclaimer"><p><strong>General information only.</strong> Material on this website is intended for general legal information and legal literacy. It is not legal advice for any particular matter. Reading or using this website does not by itself create an Attorney-at-Law/client relationship.</p><p class="footer-links"><a href="/privacy/">Privacy</a><span>·</span><a href="/terms/">Terms</a><span>·</span><a href="/legal-resources/">Legal Resources</a></p></div></div></footer><script src="/assets/js/main.js"></script></body></html>'''

def write(route, title, description, body):
    target=ROOT/route.strip('/')/'index.html'; target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(document(title,description,route,body),encoding='utf-8')

topics=''.join(f'<a class="library-topic" href="/legal-guides/topics/{slug}/"><h3>{escape(name)}</h3><p>{escape(desc)}</p><small>{sum(g[2]==slug for g in GUIDES)} published {"guide" if sum(g[2]==slug for g in GUIDES)==1 else "guides"}</small></a>' for slug,name,desc in CATEGORIES)
def published_on(g):
    article=ROOT/path_for(g).strip('/')/'index.html'
    match=re.search(r'"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})"',article.read_text(encoding='utf-8'))
    return match.group(1) if match else ''
recent=sorted(GUIDES,key=published_on,reverse=True)[:3]
landing=f'''<p class="eyebrow">Legal Guides</p><h1>Find a guide by legal topic</h1><p class="library-intro">Practical explanations of Sri Lankan law in English and Sinhala. Choose a topic or search the complete guide directory.</p><a class="text-link" href="/legal-guides/all/">Search all guides →</a><section class="library-section" aria-labelledby="topics"><h2 id="topics">Browse by legal topic</h2><div class="library-grid">{topics}</div></section><section class="library-section" aria-labelledby="recent"><h2 id="recent">Recently published guides</h2><div class="library-list">{''.join(card(g) for g in recent)}</div><p><a class="text-link" href="/legal-guides/all/">Browse all guides →</a></p></section><aside class="library-note"><strong>General information only.</strong> Each matter depends on its own facts, documents and applicable law.</aside>'''
write('/legal-guides/', 'Legal Guides | Pradhara Kotambage','Browse Sri Lankan legal guides by topic, in English and Sinhala.',landing)

for slug,name,desc in CATEGORIES:
    group=[g for g in GUIDES if g[2]==slug]
    content=f'''<p class="library-crumb"><a href="/legal-guides/">Legal Guides</a> / {escape(name)}</p><h1>{escape(name)}</h1><p class="library-intro">{escape(desc)}</p>'''
    if group: content+=f'<section class="library-section"><h2>Guides in this topic</h2><div class="library-list">{"".join(card(g) for g in group)}</div></section>'
    else: content+='<p>Guides on this topic are being prepared. <a href="/legal-guides/all/">Browse the published guides</a>.</p>'
    if slug=='dispute-resolution': content+='<p class="library-note">Explore the <a href="/dispute-resolution/">Dispute Resolution section</a> for more context on these approaches.</p>'
    write(f'/legal-guides/topics/{slug}/',f'{name} Guides | Pradhara Kotambage',f'{desc} Practical guides to Sri Lankan law.',content)

all_cards=''.join(card(g) for g in GUIDES)
directory=f'''<p class="library-crumb"><a href="/legal-guides/">Legal Guides</a> / All guides</p><h1>All legal guides</h1><p class="library-intro">Search titles and descriptions. Each topic appears once, with links to the available language editions.</p><label for="guide-search">Search guides</label><input class="library-search" id="guide-search" type="search" placeholder="For example, debt, land or mediation" autocomplete="off"><p class="library-count" id="guide-count" role="status" aria-live="polite">{len(GUIDES)} guides</p><div class="library-list" id="guide-results">{all_cards}</div><p id="guide-empty" hidden>No guides match that search. Try another term.</p><script>const input=document.getElementById('guide-search'),cards=[...document.querySelectorAll('#guide-results .library-guide')],count=document.getElementById('guide-count'),empty=document.getElementById('guide-empty'); input.addEventListener('input',()=>{{const q=input.value.trim().toLocaleLowerCase(),visible=cards.filter(c=>{{const match=c.dataset.search.includes(q);c.hidden=!match;return match}}).length;count.textContent=visible+' '+(visible===1?'guide':'guides');empty.hidden=visible!==0}});</script>'''
write('/legal-guides/all/','All Legal Guides | Pradhara Kotambage','Search all published Sri Lankan legal guides in English and Sinhala.',directory)

sitemap=ROOT/'sitemap.xml'; xml=sitemap.read_text(encoding='utf-8')
for route in ['/legal-guides/all/']+[f'/legal-guides/topics/{c[0]}/' for c in CATEGORIES]:
    loc=f'{BASE}{route}'
    if f'<loc>{loc}</loc>' not in xml: xml=xml.replace('</urlset>',f'  <url><loc>{loc}</loc></url>\n</urlset>')
sitemap.write_text(xml,encoding='utf-8')
