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
//       change nothing: fail if a file and the record disagree, or the record
//       and the script do (no network; `npm test` makes the same check)
//   node scripts/copied.mjs --check-source [--from <clone>]
//       change nothing: also read the commit's files, from GitHub or from a
//       local clone, and fail on a difference
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
  filesToCopy,
  readRecord,
  verifyAgainstSource,
  verifyCopied,
  verifyDeclared,
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
      tree: null,
      async list(folder) {
        if (!this.tree) {
          const url = `https://api.github.com/repos/${slug}/git/trees/${COPIED.commit}?recursive=1`;
          const response = await fetch(url, { headers: { accept: 'application/vnd.github+json' } });
          if (!response.ok) throw new Error(`${url} answered ${response.status}.`);
          const body = await response.json();
          if (body.truncated) throw new Error(`${url} did not list every file: use --from.`);
          this.tree = body.tree.filter((item) => item.type === 'blob').map((item) => item.path);
        }
        return this.tree.filter((file) => file.startsWith(`${folder}/`));
      },
      async read(file) {
        const url = `https://raw.githubusercontent.com/${slug}/${COPIED.commit}/${file}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`${url} answered ${response.status}.`);
        return Buffer.from(await response.arrayBuffer());
      },
      async more() {
        const pkg = JSON.parse((await this.read('package.json')).toString('utf8'));
        // Whether the commit is on safety.viz's dev branch, from GitHub's compare API.
        const url = `https://api.github.com/repos/${slug}/compare/${COPIED.commit}...dev`;
        const response = await fetch(url, { headers: { accept: 'application/vnd.github+json' } });
        if (!response.ok) throw new Error(`${url} answered ${response.status}.`);
        const { status } = await response.json();
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
    const problems = verifyCopied(rootDir);
    if (!problems.length) problems.push(...verifyDeclared(readRecord(rootDir), COPIED));
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
              `${recordedChanges(record)}).`)
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
      [...verifyCopied(rootDir), ...verifyDeclared(readRecord(rootDir), COPIED)],
      '✓ Every file matches its record.'
    );
  }
} catch (error) {
  console.error(`✗ ${error.message}`);
  process.exitCode = 1;
}
