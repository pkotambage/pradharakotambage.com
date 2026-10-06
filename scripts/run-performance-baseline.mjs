import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const pages = [
  ['home', 'https://pradharakotambage.com/'],
  ['legal-guides', 'https://pradharakotambage.com/legal-guides/'],
  ['english-article', 'https://pradharakotambage.com/legal-guides/divorce-without-unnecessary-conflict/'],
  ['sinhala-article', 'https://pradharakotambage.com/si/legal-guides/divorce-without-unnecessary-conflict/']
];

const modes = ['mobile', 'desktop'];
const dir = 'performance-baseline';
mkdirSync(dir, { recursive: true });

function fmtMs(v) { return Number.isFinite(v) ? Math.round(v) : null; }
function fmtCls(v) { return Number.isFinite(v) ? Number(v.toFixed(3)) : null; }

const rows = [];
for (const [name, url] of pages) {
  for (const mode of modes) {
    const out = `${dir}/${name}-${mode}.json`;
    const args = [
      '--yes', 'lighthouse', url,
      '--quiet',
      '--chrome-flags=--headless --no-sandbox',
      '--only-categories=performance',
      '--output=json',
      `--output-path=${out}`
    ];
    if (mode === 'desktop') args.push('--preset=desktop');

    console.log(`Running Lighthouse: ${name} (${mode})`);
    execFileSync('npx', args, { stdio: 'inherit' });

    const report = JSON.parse(readFileSync(out, 'utf8'));
    const a = report.audits;
    rows.push({
      page: name,
      mode,
      url,
      performance: Math.round((report.categories.performance.score ?? 0) * 100),
      fcp_ms: fmtMs(a['first-contentful-paint']?.numericValue),
      lcp_ms: fmtMs(a['largest-contentful-paint']?.numericValue),
      speed_index_ms: fmtMs(a['speed-index']?.numericValue),
      tbt_ms: fmtMs(a['total-blocking-time']?.numericValue),
      cls: fmtCls(a['cumulative-layout-shift']?.numericValue),
      transfer_bytes: Math.round(a['total-byte-weight']?.numericValue ?? 0)
    });
  }
}

const header = '| Page | Mode | Perf | FCP | LCP | Speed Index | TBT | CLS | Transfer |';
const divider = '|---|---:|---:|---:|---:|---:|---:|---:|---:|';
const lines = rows.map(r =>
  `| ${r.page} | ${r.mode} | ${r.performance} | ${r.fcp_ms} ms | ${r.lcp_ms} ms | ${r.speed_index_ms} ms | ${r.tbt_ms} ms | ${r.cls} | ${Math.round(r.transfer_bytes/1024)} KB |`
);

const note = [
  '# T09 Loading-speed baseline',
  '',
  'Lab data only: Lighthouse synthetic measurements. These figures must not be presented as field Core Web Vitals.',
  '',
  header,
  divider,
  ...lines,
  '',
  '## Field data',
  '',
  'Not collected by this workflow. CrUX/PageSpeed field data should be reported separately when available; do not infer field INP/LCP/CLS from Lighthouse lab results.',
  '',
  '## Method',
  '',
  '- One Lighthouse run per representative page and device profile.',
  '- Mobile uses Lighthouse default simulated mobile conditions; desktop uses the Lighthouse desktop preset.',
  '- Raw Lighthouse JSON files are saved with this summary so later runs are directly comparable.',
  ''
].join('\n');

writeFileSync(`${dir}/summary.md`, note);
writeFileSync(`${dir}/summary.json`, JSON.stringify({ generated_at: new Date().toISOString(), rows }, null, 2));
console.log(note);
