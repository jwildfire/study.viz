// The copy study.viz began as (obot.roadmap#440): the files listed in
// scripts/copied-lib.mjs, copied from one commit of jwildfire/safety.viz to
// the same paths here, with SOURCE.json at the root of the repository naming
// the commit and every file's checksum and size. safety.viz is public and is
// only ever read.
//
//   node scripts/copied.mjs --from <path to a safety.viz clone>
//       copy the files again from the commit the script names, read from a
//       local clone, and write the record
//   node scripts/copied.mjs
//       the same, read from GitHub
//   node scripts/copied.mjs --check
//       change nothing: fail if a file and the record disagree, if the record
//       and the script do, or if a file under a copied folder is in neither
//       (no network; `npm test` makes the same check). It reads the record
//       and never safety.viz, so a file changed together with its entry in
//       the record passes it
//   node scripts/copied.mjs --check-source [--from <clone>]
//       change nothing: also read the commit's files, from GitHub or from a
//       local clone, and fail on a difference (a CI step). This is the check
//       that catches a file and its entry changed together
//
// Read from GitHub, the list of the commit's files is asked of GitHub's API,
// with the token in GITHUB_TOKEN or GH_TOKEN if one is set: without one the
// API answers sixty requests an hour to an address, and CI's runners share
// theirs. The files themselves are read without a token.
//
// Copying never removes a file. After a copy, a file that safety.viz no
// longer holds is still here and no longer in the record, and the check that
// follows the copy names it: remove it, or list it in scripts/copied-lib.mjs.
//
// Run to copy only when the list in scripts/copied-lib.mjs changes; the
// output is committed.

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COPIED,
  RECORD_FILE,
  buildRecord,
  filesPresent,
  filesToCopy,
  readRecord,
  verifyAgainstSource,
  verifyCopied,
  verifyDeclared,
  verifyNothingElse,
  writeCopied
} from './copied-lib.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const known = ['--from', '--check', '--check-source'];
const unknown = args.filter((arg, index) => !known.includes(arg) && args[index - 1] !== '--from');
if (unknown.length || (flag('--from') && !option('--from'))) {
  console.error(
    'Usage: node scripts/copied.mjs [--check | --check-source] [--from <safety.viz clone>]'
  );
  if (unknown.length) console.error(`Not understood: ${unknown.join(' ')}`);
  process.exit(2);
}

const slug = COPIED.repository.replace('https://github.com/', '');
const from = option('--from');
const git = (gitArgs, encoding) =>
  execFileSync('git', ['-C', from, ...gitArgs], {
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 256 * 1024 * 1024,
    ...(encoding ? { encoding } : {})
  });

// GitHub's API, asked with a token if one is set, and again without it when
// GitHub refuses the token: safety.viz is public, and the token only lifts the
// limit on how often an address may ask. scripts/vendor-lib.mjs asks the same way.
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
// A request that says, when it gets no answer, what was asked and what to do.
async function reach(url, options) {
  try {
    return await fetch(url, options);
  } catch (error) {
    throw new Error(
      `${url} could not be reached (${error && error.message}). Reading safety.viz from ` +
        'GitHub needs the network; --from <clone> reads a local clone instead.'
    );
  }
}
async function askGitHub(url) {
  const headers = { accept: 'application/vnd.github+json' };
  let response = await reach(
    url,
    token ? { headers: { ...headers, authorization: `Bearer ${token}` } } : { headers }
  );
  if (response.status === 401 && token) response = await reach(url, { headers });
  if (!response.ok) {
    const spent = response.headers.get('x-ratelimit-remaining') === '0';
    throw new Error(
      `${url} answered ${response.status}` +
        (spent
          ? ': GitHub’s API rate limit is used up. Set GITHUB_TOKEN to ask with a token, or read a local clone with --from.'
          : '.')
    );
  }
  return response;
}

// The commit, read from GitHub: the list of its files once, and each file as it is asked for.
let tree = null;
async function listOnGitHub(folder) {
  if (!tree) {
    const url = `https://api.github.com/repos/${slug}/git/trees/${COPIED.commit}?recursive=1`;
    const response = await askGitHub(url);
    const body = await response.json();
    if (body.truncated) throw new Error(`${url} did not list every file: use --from.`);
    tree = body.tree.filter((item) => item.type === 'blob').map((item) => item.path);
  }
  return tree.filter((file) => file.startsWith(`${folder}/`));
}
async function readOnGitHub(file) {
  const url = `https://raw.githubusercontent.com/${slug}/${COPIED.commit}/${file}`;
  const response = await reach(url);
  if (!response.ok) throw new Error(`${url} answered ${response.status}.`);
  return Buffer.from(await response.arrayBuffer());
}

// The commit, read from a local clone or from GitHub. Both are read-only.
const source = from
  ? {
      list: (folder) =>
        git(['ls-tree', '-r', '--name-only', '-z', COPIED.commit, '--', folder], 'utf8')
          .split('\0')
          .filter(Boolean),
      read: (file) => git(['show', `${COPIED.commit}:${file}`]),
      more() {
        const pkg = JSON.parse(git(['show', `${COPIED.commit}:package.json`], 'utf8'));
        // Whether the commit is on safety.viz's dev branch, as the clone last fetched it.
        let onDev = true;
        try {
          git(['merge-base', '--is-ancestor', COPIED.commit, 'origin/dev']);
        } catch {
          onDev = false;
        }
        return { version: pkg.version, merged_to_dev: onDev };
      }
    }
  : {
      list: listOnGitHub,
      read: readOnGitHub,
      async more() {
        const pkg = JSON.parse((await readOnGitHub('package.json')).toString('utf8'));
        // Whether the commit is on safety.viz's dev branch, from GitHub's compare API.
        const url = `https://api.github.com/repos/${slug}/compare/${COPIED.commit}...dev`;
        const { status } = await (await askGitHub(url)).json();
        return {
          version: pkg.version,
          merged_to_dev: status === 'ahead' || status === 'identical'
        };
      }
    };

function report(problems, passed) {
  if (problems.length) {
    console.error(`✗ The files copied from ${slug} do not match their source record:`);
    problems.forEach((problem) => console.error(`  - ${problem}`));
    process.exitCode = 1;
    return false;
  }
  console.log(passed);
  return true;
}

// The three checks that read no network: the files against the record, the
// record against the script, and the copied folders against both.
function recordProblems() {
  const problems = verifyCopied(rootDir);
  if (problems.length) return problems;
  const record = readRecord(rootDir);
  return [
    ...verifyDeclared(record, COPIED),
    ...verifyNothingElse(record, COPIED, filesPresent(rootDir, COPIED.folders))
  ];
}

// How many of a record's files differ from the source by a recorded change, in words.
function recordedChanges(record) {
  const changed = record.files.filter((entry) => entry.changes !== undefined);
  const count = changed.reduce((sum, entry) => sum + entry.changes.length, 0);
  return changed.length
    ? `, ${changed.length} of them changed by the ${count === 1 ? 'one change' : `${count} changes`} the record lists`
    : '';
}

try {
  if (flag('--check') || flag('--check-source')) {
    const problems = recordProblems();
    if (!problems.length && flag('--check-source')) {
      problems.push(...(await verifyAgainstSource(rootDir, COPIED, source)));
    }
    const record = problems.length ? null : readRecord(rootDir);
    report(
      problems,
      record &&
        `✓ ${RECORD_FILE}: ${record.files.length} files ` +
          (flag('--check-source')
            ? `equal ${slug} at ${record.commit.slice(0, 7)}, byte for byte${recordedChanges(record)}.`
            : `match their recorded checksums (copied from ${slug} at ${record.commit.slice(0, 7)}` +
              `${recordedChanges(record)}), and the copied folders hold no other file. ` +
              'Compared with the record alone: --check-source reads safety.viz.')
    );
  } else {
    // Everything is read before anything is written, so a failed read leaves the files as they were.
    const listed = new Map();
    for (const folder of COPIED.folders) listed.set(folder, await source.list(folder));
    const files = filesToCopy(COPIED, (folder) => listed.get(folder));
    const bytes = new Map();
    for (const file of files) bytes.set(file, await source.read(file));
    const copy = buildRecord({
      copied: COPIED,
      files,
      read: (file) => bytes.get(file),
      more: await source.more()
    });
    writeCopied(rootDir, copy);
    console.log(
      `✓ Wrote ${copy.record.files.length} files and ${RECORD_FILE} — ${slug} at ${COPIED.commit}`
    );
    report(
      recordProblems(),
      '✓ Every file matches its record, and the copied folders hold no other file.'
    );
  }
} catch (error) {
  console.error(`✗ ${error.message}`);
  process.exitCode = 1;
}
