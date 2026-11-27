import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COPIED,
  RECORD_FILE,
  applyChanges,
  buildRecord,
  filesPresent,
  filesToCopy,
  readRecord,
  sha256,
  undoChanges,
  verifyAgainstSource,
  verifyCopied,
  verifyDeclared,
  verifyNothingElse,
  writeCopied
} from '../../../scripts/copied-lib.mjs';

// The copy study.viz began as (obot.roadmap#440): the files copied from one
// commit of safety.viz, and the record that names the commit and each file's
// checksum. These tests hold the record to the files in this checkout, and
// hold the check itself: it must fail when a file and the record disagree, and
// when a copied folder holds a file nobody listed. No test here reads
// safety.viz: a file changed together with its entry in the record is caught
// by `npm run copied:check-source`, which CI runs (COPY-010 holds how it
// compares, on a made-up source).

const rootDir = fileURLToPath(new URL('../../../', import.meta.url));

// A small copy in a temporary folder, made the way the command makes the real one.
const SOURCE = {
  'a/one.js': "import x from './x.js';\nconst a = 1;\nexport default a;\n",
  'a/two.js': 'line one\nline two\nline three\nline four\n',
  'a/stays.js': 'left behind\n',
  'b.txt': 'b\n'
};
const copied = (more = {}) => ({
  name: 'a test copy',
  label: 'copy',
  repository: 'https://github.com/jwildfire/safety.viz',
  commit: 'a'.repeat(40),
  folders: ['a'],
  files: ['b.txt'],
  left: { 'a/stays.js': 'It is not needed here.' },
  changes: {},
  ...more
});
const list = (folder) => Object.keys(SOURCE).filter((file) => file.startsWith(`${folder}/`));
const read = (file) => Buffer.from(SOURCE[file]);
function made(what = copied()) {
  const dir = mkdtempSync(path.join(tmpdir(), 'study-viz-copied-'));
  const copy = buildRecord({ copied: what, files: filesToCopy(what, list), read });
  writeCopied(dir, copy);
  return dir;
}
// What is there under the small copy's folders, and what the check says of it.
const nothingElse = (dir, what = copied()) =>
  verifyNothingElse(readRecord(dir), what, filesPresent(dir, what.folders));
const write = (dir, file, text = 'x\n') => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
const SWAP = {
  original: "import x from './x.js';",
  replacement: "import x from '../vendor/x.js';\nimport y from './y.js';",
  reason: 'x is read from its copy.'
};
const CUT = { cut: { from: 'line two', to: 'line three' }, reason: 'Those lines stay behind.' };

describe('the record of the copy from safety.viz', () => {
  it('COPY-001: every copied file in this checkout matches the record, the record is the one the script declares, and the copied folders hold no other file', () => {
    expect(verifyCopied(rootDir)).toEqual([]);
    const record = readRecord(rootDir);
    expect(verifyDeclared(record, COPIED)).toEqual([]);
    expect(verifyNothingElse(record, COPIED, filesPresent(rootDir, COPIED.folders))).toEqual([]);
    expect(record.repository).toBe('https://github.com/jwildfire/safety.viz');
    expect(record.commit).toBe(COPIED.commit);
    expect(record.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(record.files.length).toBeGreaterThan(0);
    for (const entry of record.files) {
      expect(entry.sha256, entry.file).toMatch(/^[0-9a-f]{64}$/);
      expect(Number.isInteger(entry.bytes), entry.file).toBe(true);
    }
  });

  it('COPY-002: the demo app’s source is in the record: every file under src/app/', () => {
    const recorded = readRecord(rootDir).files.map((entry) => entry.file);
    expect(COPIED.folders).toContain('src/app');
    expect(recorded.filter((file) => file.startsWith('src/app/')).length).toBeGreaterThan(20);
    expect(recorded).toContain('src/app/main.js');
    expect(recorded).toContain('src/app/page.js');
  });

  it('COPY-003: a copy is every file of each folder and each single file, less the ones left behind', () => {
    expect(filesToCopy(copied(), list)).toEqual(['a/one.js', 'a/two.js', 'b.txt']);
    expect(() => filesToCopy(copied({ folders: ['a', 'none'] }), list)).toThrow(/none: the commit/);
    expect(() => filesToCopy(copied({ left: { 'c.js': 'x' } }), list)).toThrow(
      /c\.js: left behind/
    );
    expect(() => filesToCopy(copied({ changes: { 'a/stays.js': [SWAP] } }), list)).toThrow(
      /a\/stays\.js: a change is listed for it, but it is not copied/
    );
  });

  it('COPY-004: the check passes on a fresh copy, and fails when a file is changed, missing or the record is', () => {
    const dir = made();
    expect(verifyCopied(dir)).toEqual([]);
    expect(verifyDeclared(readRecord(dir), copied())).toEqual([]);

    writeFileSync(path.join(dir, 'a/one.js'), `${SOURCE['a/one.js']}// edited\n`);
    expect(verifyCopied(dir)).toEqual([
      expect.stringMatching(/^a\/one\.js: the file no longer matches its recorded checksum/)
    ]);

    const gone = made();
    writeFileSync(path.join(gone, RECORD_FILE), '{ not json');
    expect(verifyCopied(gone)[0]).toMatch(/SOURCE\.json cannot be read/);
    expect(verifyCopied(mkdtempSync(path.join(tmpdir(), 'study-viz-copied-')))).toEqual([
      'SOURCE.json is missing: the copied files have no source record.'
    ]);

    const missing = made();
    const record = readRecord(missing);
    record.files.push({ file: 'a/never.js', sha256: 'x', bytes: 1 });
    record.commit = 'abc1234';
    writeFileSync(path.join(missing, RECORD_FILE), JSON.stringify(record));
    expect(verifyCopied(missing)).toEqual([
      'SOURCE.json does not name the full commit the files were copied from.',
      'a/never.js: recorded, but the file is missing.'
    ]);
  });

  it('COPY-005: a record names files inside the repository and nowhere else', () => {
    const dir = made();
    const record = readRecord(dir);
    record.files.push({ file: '../outside.js', sha256: 'x', bytes: 1 });
    writeFileSync(path.join(dir, RECORD_FILE), JSON.stringify(record));
    expect(verifyCopied(dir)).toEqual(['../outside.js: not a path inside the repository.']);
  });

  it('COPY-006: lines are swapped for others where they stand once, and the swap can be undone', () => {
    const { bytes, changes } = applyChanges(read('a/one.js'), [SWAP]);
    expect(bytes.toString()).toBe(
      "import x from '../vendor/x.js';\nimport y from './y.js';\nconst a = 1;\nexport default a;\n"
    );
    expect(changes).toEqual([SWAP]);
    expect(undoChanges(bytes, changes).equals(read('a/one.js'))).toBe(true);
    expect(applyChanges(read('b.txt'), undefined).bytes.equals(read('b.txt'))).toBe(true);
    // Not there, or there twice: refused, never guessed at.
    expect(() => applyChanges(read('a/two.js'), [SWAP])).toThrow(/there 0 times/);
    expect(() =>
      applyChanges(Buffer.from('x\nx\n'), [{ original: 'x', replacement: 'y', reason: 'r' }])
    ).toThrow(/there 2 times/);
    expect(() => applyChanges(read('a/one.js'), [{ ...SWAP, reason: ' ' }])).toThrow(/its reason/);
    expect(() => applyChanges(read('a/one.js'), [])).toThrow(/no changes are listed/);
    expect(() =>
      applyChanges(read('a/one.js'), [{ original: 'a', replacement: 'a', reason: 'r' }])
    ).toThrow(/as they were, and others as they are/);
  });

  it('COPY-007: lines are cut from a first line to a last, and the record says how many and their checksum', () => {
    const { bytes, changes } = applyChanges(read('a/two.js'), [CUT]);
    expect(bytes.toString()).toBe('line one\nline four\n');
    expect(changes).toEqual([
      {
        cut: {
          from: 'line two',
          to: 'line three',
          lines: 2,
          sha256: sha256(Buffer.from('line two\nline three'))
        },
        reason: CUT.reason
      }
    ]);
    // A cut cannot be undone from the file alone.
    expect(undoChanges(bytes, changes)).toBeNull();
    // A cut may also stop before a line, or run to the end of the file, whose
    // last line feed is kept; and its ends may each be several lines.
    const before = [{ cut: { from: 'line two', before: 'line four' }, reason: 'r' }];
    expect(applyChanges(read('a/two.js'), before).bytes.toString()).toBe('line one\nline four\n');
    const toEnd = [{ cut: { from: 'line two\nline three', before: null }, reason: 'r' }];
    expect(applyChanges(read('a/two.js'), toEnd).bytes.toString()).toBe('line one\n');
    expect(applyChanges(read('a/two.js'), toEnd).changes[0].cut).toMatchObject({ lines: 3 });
    expect(() =>
      applyChanges(read('a/two.js'), [{ cut: { from: 'line three', to: 'line two' }, reason: 'r' }])
    ).toThrow(/stops before it starts/);
    expect(() =>
      applyChanges(read('a/two.js'), [{ cut: { from: 'line two' }, reason: 'r' }])
    ).toThrow(/where it starts, and either its last lines or the lines it stops before/);
    expect(() =>
      applyChanges(read('a/two.js'), [
        { cut: { from: 'line two', to: 'line three', before: 'line four' }, reason: 'r' }
      ])
    ).toThrow(/where it starts/);
    expect(() =>
      applyChanges(read('a/two.js'), [{ cut: { from: 'line two', to: 'line 9' }, reason: 'r' }])
    ).toThrow(/there 0 times/);
  });

  it('COPY-008: a changed file is held to its source with the listed changes and no other', () => {
    const what = copied({ changes: { 'a/one.js': [SWAP], 'a/two.js': [CUT] } });
    const dir = made(what);
    expect(verifyCopied(dir)).toEqual([]);
    expect(verifyDeclared(readRecord(dir), what)).toEqual([]);
    const entry = readRecord(dir).files.find((file) => file.file === 'a/one.js');
    expect(entry.source_sha256).toBe(sha256(read('a/one.js')));
    expect(entry.source_bytes).toBe(read('a/one.js').length);

    // A second line changed, with the record's checksum rewritten to pass it:
    // undone, the file is no longer the source the record names.
    const edited = readFileSync(path.join(dir, 'a/one.js'), 'utf8').replace('a = 1', 'a = 2');
    writeFileSync(path.join(dir, 'a/one.js'), edited);
    const record = readRecord(dir);
    const forged = record.files.find((file) => file.file === 'a/one.js');
    forged.sha256 = sha256(Buffer.from(edited));
    writeFileSync(path.join(dir, RECORD_FILE), JSON.stringify(record));
    expect(verifyCopied(dir)).toEqual([
      expect.stringMatching(
        /^a\/one\.js: with its recorded change undone, it is not the source file/
      )
    ]);
  });

  it('COPY-009: a change written into the record alone is refused: it must be listed in the script', () => {
    const what = copied({ changes: { 'a/one.js': [SWAP] } });
    const dir = made(what);
    expect(verifyDeclared(readRecord(dir), copied())).toEqual([
      'a/one.js: SOURCE.json lists a change to it, and the script lists none.'
    ]);
    expect(verifyDeclared(readRecord(made()), what)).toEqual([
      'a/one.js: SOURCE.json does not list the change the script lists for it, as it lists it.'
    ]);
    // Nor may the record name another commit, a file the script does not copy,
    // or fewer files than it copies.
    const record = readRecord(made());
    record.commit = 'b'.repeat(40);
    record.files.push({ file: 'c/extra.js', sha256: 'x', bytes: 1 });
    record.files = record.files.filter((entry) => entry.file !== 'b.txt');
    record.left = [];
    expect(verifyDeclared(record, copied())).toEqual([
      expect.stringMatching(/^SOURCE\.json names the commit b+, and the script copies from a+\.$/),
      'c/extra.js: SOURCE.json lists it, and the script does not copy it.',
      'b.txt: the script copies it, and SOURCE.json does not list it.',
      'SOURCE.json does not list the files left behind as the script lists them.'
    ]);
  });

  it('COPY-010: against the source itself, a file that differs, is missing from the record or was never copied is named', async () => {
    const what = copied({ changes: { 'a/one.js': [SWAP], 'a/two.js': [CUT] } });
    const dir = made(what);
    expect(await verifyAgainstSource(dir, what, { list, read })).toEqual([]);

    // The source moved: one file's bytes, and a file the record never had.
    const moved = {
      ...SOURCE,
      'a/two.js': 'line one\nline two\nline three\nline 4\n',
      'a/new.js': 'n\n'
    };
    const problems = await verifyAgainstSource(dir, what, {
      list: (folder) => Object.keys(moved).filter((file) => file.startsWith(`${folder}/`)),
      read: (file) => Buffer.from(moved[file])
    });
    expect(problems).toEqual([
      expect.stringMatching(/^a\/new\.js: at aaaaaaa of .*, and not in SOURCE\.json\.$/),
      expect.stringMatching(
        /^a\/two\.js: differs from the file at aaaaaaa .* with its recorded changes made\.$/
      )
    ]);

    // A file kept here that the source does not hold where the script says.
    mkdirSync(path.join(dir, 'c'), { recursive: true });
    const record = readRecord(dir);
    record.files.push({ file: 'c/extra.js', sha256: 'x', bytes: 1 });
    writeFileSync(path.join(dir, RECORD_FILE), JSON.stringify(record));
    expect(await verifyAgainstSource(dir, what, { list, read })).toEqual([
      expect.stringMatching(/^c\/extra\.js: in SOURCE\.json, and not among the files copied/)
    ]);
  });

  it('COPY-011: a file under a copied folder that is in neither the record nor the script’s lists is named', () => {
    const dir = made();
    expect(nothingElse(dir)).toEqual([]);

    // A file nobody listed, in the folder and in a folder under it.
    write(dir, 'a/zzz-unrecorded.js');
    write(dir, 'a/deeper/zzz.csv');
    expect(nothingElse(dir)).toEqual([
      'a/deeper/zzz.csv: under a/, which is copied whole, and neither in SOURCE.json nor listed in the script as left behind or as study.viz’s own.',
      'a/zzz-unrecorded.js: under a/, which is copied whole, and neither in SOURCE.json nor listed in the script as left behind or as study.viz’s own.'
    ]);
    // The other two checks do not see it, and a file outside the copied folders is not asked about.
    write(dir, 'elsewhere/own.js');
    expect(verifyCopied(dir)).toEqual([]);
    expect(verifyDeclared(readRecord(dir), copied())).toEqual([]);
    expect(nothingElse(dir)).toHaveLength(2);

    // A file whose entry is taken out of the record, the file staying where it was.
    const cut = made();
    const record = readRecord(cut);
    record.files = record.files.filter((entry) => entry.file !== 'a/two.js');
    writeFileSync(path.join(cut, RECORD_FILE), JSON.stringify(record));
    expect(verifyCopied(cut)).toEqual([]);
    expect(verifyDeclared(readRecord(cut), copied())).toEqual([]);
    expect(nothingElse(cut)).toEqual([
      expect.stringMatching(/^a\/two\.js: under a\/, which is copied whole, and neither in/)
    ]);
  });

  it('COPY-012: a copied folder may also hold a file left behind, and a file listed as study.viz’s own with its reason', () => {
    // A file left behind may be there, as the stored pictures are, or not, as the walk’s screenshots are not.
    const dir = made();
    write(dir, 'a/stays.js', SOURCE['a/stays.js']);
    expect(nothingElse(dir)).toEqual([]);

    // study.viz’s own file is listed by its path, with why.
    write(dir, 'a/ours.js');
    expect(nothingElse(dir)).toHaveLength(1);
    const ours = copied({ own: { 'a/ours.js': 'A test study.viz added.' } });
    expect(nothingElse(dir, ours)).toEqual([]);
    expect(filesToCopy(ours, list)).toEqual(['a/one.js', 'a/two.js', 'b.txt']);

    // The list is held too: each entry is under a copied folder, there, with its reason, and listed nowhere else.
    const said = (own) => nothingElse(dir, copied({ own }));
    expect(said({ 'a/ours.js': ' ' })).toEqual([
      'a/ours.js: listed as study.viz’s own, with no reason.'
    ]);
    expect(said({ 'a/ours.js': 'r', 'a/gone.js': 'r' })).toEqual([
      'a/gone.js: listed as study.viz’s own, and it is not there.'
    ]);
    expect(said({ 'a/ours.js': 'r', 'c/ours.js': 'r' })).toEqual([
      'c/ours.js: listed as study.viz’s own, but no copied folder holds it.'
    ]);
    expect(said({ 'a/ours.js': 'r', 'a/one.js': 'r' })).toEqual([
      'a/one.js: listed as study.viz’s own, and SOURCE.json lists it as copied.'
    ]);
    expect(said({ 'a/ours.js': 'r', 'a/stays.js': 'r' })).toEqual([
      'a/stays.js: listed as study.viz’s own, and as left behind.'
    ]);
    // A file the commit holds is safety.viz’s, and is copied or left behind: never listed as study.viz’s own.
    expect(() => filesToCopy(copied({ own: { 'a/one.js': 'r' } }), list)).toThrow(
      /a\/one\.js: listed as study\.viz’s own, but the commit holds it/
    );
    expect(() => filesToCopy(copied({ own: { 'b.txt': 'r' } }), list)).toThrow(
      /b\.txt: listed as study\.viz’s own, but the commit holds it/
    );
  });

  it('COPY-013: what is there is every file git tracks or does not ignore; a file a tool wrote and git ignores is not counted', () => {
    // Outside a git checkout, every file on disk under the folders.
    const dir = made();
    write(dir, 'a/build/out.js');
    write(dir, 'elsewhere/own.js');
    expect(filesPresent(dir, ['a'])).toEqual(['a/build/out.js', 'a/one.js', 'a/two.js']);
    expect(filesPresent(dir, ['none'])).toEqual([]);

    // In one: an ignored file is not counted unless it is tracked, and a file
    // that is tracked or untracked is, while it is on disk.
    const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'pipe' });
    git('init', '--quiet');
    write(dir, '.gitignore', 'build/\nscreenshots/\n');
    write(dir, 'a/screenshots/kept.png');
    write(dir, 'a/screenshots/loose.png');
    git('add', 'a/one.js');
    git('add', '--force', 'a/screenshots/kept.png');
    expect(filesPresent(dir, ['a'])).toEqual(['a/one.js', 'a/screenshots/kept.png', 'a/two.js']);
    expect(nothingElse(dir)).toEqual([
      expect.stringMatching(/^a\/screenshots\/kept\.png: under a\/, which is copied whole/)
    ]);
    rmSync(path.join(dir, 'a/one.js'));
    expect(filesPresent(dir, ['a'])).toEqual(['a/screenshots/kept.png', 'a/two.js']);
  });
});
