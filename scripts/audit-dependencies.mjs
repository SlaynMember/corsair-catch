import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// Netlify extensions are installed outside the application's npm dependency tree.
// Audit both trees even when one fails; never treat a missing plugin tree as clean.
const npmCli = process.env.npm_execpath;
if (!npmCli) {
  console.error('Run this check with npm run audit:all.');
  process.exit(1);
}

let failed = false;
for (const directory of ['.', '.netlify/plugins']) {
  console.log(`\nAuditing ${directory}`);
  if (!existsSync(`${directory}/package-lock.json`)) {
    console.error(`Missing ${directory}/package-lock.json. Link the existing site and run netlify build --dry --context production before auditing.`);
    failed = true;
    continue;
  }
  const result = spawnSync(process.execPath, [npmCli, 'audit', '--prefix', directory], {
    stdio: 'inherit',
  });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) failed = true;
}
process.exitCode = failed ? 1 : 0;
