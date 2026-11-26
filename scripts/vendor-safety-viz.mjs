// Copies safety.viz's charts into study.viz (obot.roadmap#440): the bundle
// dist/safety.viz-{version}/safety.viz.esm.js and the three source files
// scripts/safety-viz-lib.mjs lists, from one commit of safety.viz into
// site/vendor/safety.viz/, byte for byte, with SOURCE.json beside them naming
// the commit, safety.viz's version there, whether the commit is on safety.viz's
// `dev` branch, and each file's checksum and size. Then writes the chart list
// the bundle exports to src/data/portfolio.json.
//
//   node scripts/vendor-safety-viz.mjs
//       copy from the head of safety.viz's `dev` branch on GitHub
//   node scripts/vendor-safety-viz.mjs --ref <branch or commit> --unmerged "<why, and what to do later>"
//       copy from a commit not on safety.viz's `dev`, and record why
//   node scripts/vendor-safety-viz.mjs --tag v1.12.0
//       copy from one of safety.viz's release tags, and record the tag
//   node scripts/vendor-safety-viz.mjs --manifest
//       copy nothing: write src/data/portfolio.json again from the bundle
//   node scripts/vendor-safety-viz.mjs --check
//       change nothing: fail if a file and its record disagree, or
//       src/data/portfolio.json is not the bundle's chart list (no network;
//       `npm test` makes the same check)
//   node scripts/vendor-safety-viz.mjs --check-source
//       change nothing: also fetch the recorded commit's files from safety.viz
//       and fail if a copy differs
//
// Run by hand when safety.viz's charts change; the output is committed.

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runVendorCli } from './vendor-cli.mjs';
import { MANIFEST_FILE, SAFETY_VIZ, manifestProblems, manifestText } from './safety-viz-lib.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const checking = args.includes('--check') || args.includes('--check-source');

const passed =
  args.includes('--manifest') ||
  (await runVendorCli(SAFETY_VIZ, {
    // The version, and so the path of the bundle, is safety.viz's own at the commit.
    async describe({ commit, readAt }) {
      const pkg = JSON.parse((await readAt(commit, 'package.json')).toString('utf8'));
      const more = { version: pkg.version };
      if (pkg.license) more.license = pkg.license;
      return {
        more,
        files: SAFETY_VIZ.files.map((entry) => ({
          ...entry,
          source: entry.source.replace('{version}', pkg.version)
        }))
      };
    }
  }));

if (passed && checking) {
  const problems = await manifestProblems();
  if (problems.length) {
    problems.forEach((problem) => console.error(`✗ ${problem}`));
    process.exitCode = 1;
  } else {
    console.log(`✓ ${MANIFEST_FILE} is the chart list the bundle exports.`);
  }
} else if (passed) {
  writeFileSync(path.join(rootDir, MANIFEST_FILE), await manifestText());
  console.log(`✓ Wrote ${MANIFEST_FILE} from the bundle's chart list.`);
}
