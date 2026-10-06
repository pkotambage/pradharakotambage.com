# T09 — Loading-speed baseline

**Date:** 06 October 2026  
**Site:** https://pradharakotambage.com/  
**Method:** Lighthouse synthetic/lab testing through GitHub Actions against the live deployed site.

## Confirmed baseline

| Page | Mode | Performance | FCP | LCP | Speed Index | TBT | CLS | Transfer |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Home | Mobile | 100 | 937 ms | 937 ms | 937 ms | 0 ms | 0 | 24 KB |
| Home | Desktop | 100 | 288 ms | 288 ms | 288 ms | 0 ms | 0 | 24 KB |
| Legal Guides | Mobile | 100 | 908 ms | 908 ms | 908 ms | 0 ms | 0 | 17 KB |
| Legal Guides | Desktop | 100 | 257 ms | 257 ms | 257 ms | 0 ms | 0.003 | 18 KB |
| English article | Mobile | 100 | 833 ms | 915 ms | 833 ms | 0 ms | 0 | 18 KB |
| English article | Desktop | 100 | 224 ms | 244 ms | 224 ms | 0 ms | 0 | 18 KB |
| Sinhala article | Mobile | 100 | 866 ms | 904 ms | 866 ms | 0 ms | 0 | 19 KB |
| Sinhala article | Desktop | 100 | 240 ms | 253 ms | 240 ms | 0 ms | 0.003 | 19 KB |

## Verification note

The first run produced one anomalous Home/Mobile result (Performance 89, TBT 423 ms) caused by a single long main-thread task. A repeat run under the same workflow produced Performance 100 and TBT 0 ms for the homepage, while every other representative page also remained at 100. The outlier was therefore not treated as a reproducible bottleneck and no speculative optimization was applied.

## Field data

This is **lab data only**. No CrUX/PageSpeed field Core Web Vitals dataset was collected by this workflow. Field LCP, CLS and INP must be reported separately when sufficient real-user data becomes available.

## Decision

No measured loading, interaction or layout-shift bottleneck currently justifies changing the website. Existing lightweight guide artwork should be retained. The repository now contains a repeatable Lighthouse workflow and runner so later measurements can use the same method.
