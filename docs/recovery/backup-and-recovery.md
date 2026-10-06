# Backup and recovery — pradharakotambage.com

## What is backed up

The verified project backup contains the complete deployable repository content needed to rebuild the static site: HTML, CSS, JavaScript, images, scripts, tests, GitHub workflow files, sitemap, robots.txt, CNAME, and package metadata.

The backup intentionally excludes Git history, installed dependencies, temporary test output, and common secret-file patterns such as `.env`, private keys and PEM files. Secrets must never be added to a public/shared backup.

## Current deployment identity

- Repository: `pkotambage/pradharakotambage.com`
- Production branch: `main`
- Custom domain file: `CNAME`
- Custom domain: `pradharakotambage.com`
- Deployment: GitHub Pages
- Validation command: `npm run validate`

Each backup also includes `backup-manifest.txt` recording the exact Git commit, branch, creation time and custom domain.

## Independent backup status

A verified archive is produced by the T16 GitHub Actions workflow and then copied outside GitHub into the project's ChatGPT Library. That Library copy is the independent project backup. GitHub Actions artifacts are retained as an additional short-term copy for 90 days.

## DNS / domain recovery information

The repository preserves the intended custom domain in `CNAME`, but DNS records are controlled at the domain/DNS provider and are not secret source-code settings. If the domain configuration is ever lost:

1. Confirm that the domain registration for `pradharakotambage.com` remains active.
2. In the DNS provider, restore the records required by the current GitHub Pages custom-domain instructions.
3. In GitHub Pages settings, set the custom domain to `pradharakotambage.com` and enable HTTPS when available.
4. Confirm that `CNAME` in the restored repository contains exactly `pradharakotambage.com`.
5. Test both the root domain and any intended www redirect before considering recovery complete.

Because GitHub may change its recommended Pages DNS endpoints, do not hard-code old IP addresses into this recovery document. Use the current GitHub Pages documentation at recovery time.

## Full recovery procedure

1. Obtain the latest independent `pradharakotambage-com-backup.tar.gz` and its matching SHA-256 file.
2. Verify the archive checksum.
3. Extract the archive. The deployable site is under `project/`.
4. Create or choose a Git repository for recovery.
5. Copy the contents of `project/` into that repository.
6. Install Node dependencies with `npm ci`.
7. Install the Playwright Chromium dependency if validation is needed: `npx playwright install --with-deps chromium`.
8. Run `npm run validate`. Do not deploy if it fails.
9. Push the restored project to the production repository/branch.
10. Ensure GitHub Pages is publishing from the intended repository configuration.
11. Restore/confirm the custom domain and DNS as described above.
12. Verify the deployed homepage, Legal Guides, a Sinhala article, the custom 404 page and HTTPS.

## Tested recovery

The T16 workflow does not merely create an archive. It extracts the archive into a fresh isolated directory and runs the full website validation command against the restored copy. A backup is treated as verified only if that restore validation passes.

## Backup schedule

The workflow runs every Monday and can also be run manually. This provides a regular GitHub artifact copy. The independent Library copy should be refreshed after significant structural changes or periodically when convenient.
