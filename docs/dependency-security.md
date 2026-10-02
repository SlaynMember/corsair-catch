# Dependency security

Corsair Catch has two dependency trees. `npm audit` at the repository root checks
the game and its development tools. Netlify installs the site's `prerender` and
`neon` extensions into `.netlify/plugins`; the root audit does not check them.

`.netlify/` is generated local state, including site linkage, resolved build
configuration, and extension dependencies. It is intentionally ignored. Removing
these files from Git does **not** remove the installed extensions or resolve all
of their advisories. Netlify continues to install and run both extensions.

## Reproduce the checks

Use existing authorized Netlify authentication and link this existing project:

```text
npm ci
netlify link --id 6e750e57-0a34-4285-9785-6bdcbfa5911f
netlify build --dry --context production
npm run audit:all
npm audit --omit=dev
```

To reproduce a fresh plugin resolution when a local plugin tree already exists,
move `.netlify/plugins` to a backup outside the repository before running the dry
build. Preserve `.netlify/state.json` so the existing site remains linked. The dry
build installs current extension sources but does not deploy or execute build
hooks. `npm run audit:all` checks both trees, attempts both audits even if one
fails, and returns failure for advisories or a missing plugin lockfile.

Before releasing, run `npm run build`, `npm run smoke` (headless), and
`netlify build --context production`. Production deploys use GitHub `master` for
`SlaynMember/corsair-catch` and the existing `corsair-catch-demo` project.

Netlify's CLI guidance recommends ignoring generated `.netlify` state:
https://docs.netlify.com/cli/get-started/
Extension/plugin installation and version management:
https://docs.netlify.com/extend/install-and-use/build-plugins/

## Findings on 2026-10-02

The audited application base is `a5750c31024a065b9aa82f84d513e055637bddf9`.
Both full root and production-only root audits report zero vulnerabilities.
The old committed extension lockfile reports 29 affected packages (17 high,
10 moderate, 2 low). A fresh Netlify-generated tree reports 10 (9 high, 1 low).
Compatible `npm audit fix --package-lock-only --ignore-scripts` does not eliminate
the remaining findings. No forced overrides or advisory exclusions are applied.

| Package | Old committed version | Fresh Netlify resolution |
| --- | --- | --- |
| neon-buildhooks | 0.0.0-dsfwq | 0.0.0-ikysz |
| prerender-buildhooks | 0.0.0-sqa2h | 0.0.0-eimh7 |
| basic-ftp | 5.2.0 | 5.3.1 |
| get-uri | 6.0.5 | 6.0.5 |
| puppeteer | 24.35.0 | 24.35.0 |
| extract-zip | 2.0.1 | 2.0.1 |
| ws | 8.19.0 | 8.22.0 |
| js-yaml | 4.1.1 | 4.3.2 |
| ip-address | 10.1.0 | 10.7.3 |
| esbuild (extension tree) | 0.27.3 | 0.27.7 |

Remaining high findings originate in the prerender/Puppeteer build-tool tree:

- `basic-ftp`: https://github.com/advisories/GHSA-c475-qrg2-pj4r
- `extract-zip`: https://github.com/advisories/GHSA-jmr9-qjv8-65gv and
  https://github.com/advisories/GHSA-7pqw-9j4j-h8q3
- The other seven high entries describe affected parents: `get-uri`,
  `pac-proxy-agent`, `proxy-agent`, `@puppeteer/browsers`, `puppeteer`,
  `puppeteer-core`, and `prerender-buildhooks`.

The low finding is the extension SDK's esbuild Windows development-server file
read advisory: https://github.com/advisories/GHSA-g7r4-m6w7-qqqr.
The extension SDK requires `esbuild ^0.27.0`; the reported fix requires 0.28.1.
The prerender buildhook pins Puppeteer 24.35.0, whose proxy chain retains
`get-uri 6.0.5` and `basic-ftp ^5`. Fixing the remaining tree requires updates from
the extension owners. Do not force a major transitive override into this chain.

These are build-tool risks, not dependencies shipped in the browser game. A
remote game-runtime exploit was not demonstrated. They still matter on build
machines handling downloaded archives and proxy/FTP data. Keep auditing the
generated tree after extension changes; absence from Git is not a clean audit.

The repository's `npm test` command currently has no matching unit-test files and
exits 1. Gameplay validation uses the existing 42 headless Playwright smoke tests.
