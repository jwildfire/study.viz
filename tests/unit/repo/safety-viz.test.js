import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRecord, verifyDeclaredChanges, verifyVendored } from '../../../scripts/vendor-lib.mjs';
import {
  BUNDLE_FILE,
  MANIFEST_FILE,
  SAFETY_VIZ,
  chartsVersion,
  manifestProblems
} from '../../../scripts/safety-viz-lib.mjs';
import * as charts from '../../../src/main.js';
import * as tiers from '../../../src/tiers.js';
import * as statusLabel from '../../../src/status-label.js';
import * as bundle from '../../../site/vendor/safety.viz/safety.viz.esm.js';
import * as copiedTiers from '../../../site/vendor/safety.viz/src/tiers.js';
import * as copiedStatusLabel from '../../../site/vendor/safety.viz/src/status-label.js';

// safety.viz's charts in study.viz (obot.roadmap#440): the built bundle, copied
// byte for byte with a record, and read by the app through three files that
// hand it on. No chart's source is in study.viz. These tests hold the copy to
// its record and hold that rule.

const rootDir = fileURLToPath(new URL('../../../', import.meta.url));
const directory = path.join(rootDir, SAFETY_VIZ.directory);
const filesUnder = (dir, prefix = '') =>
  readdirSync(dir, { withFileTypes: true }).flatMap((item) =>
    item.isDirectory()
      ? filesUnder(path.join(dir, item.name), `${prefix}${item.name}/`)
      : [`${prefix}${item.name}`]
  );
// Every address a file imports or exports from, as it is written.
const importsOf = (file) =>
  [
    ...readFileSync(path.join(rootDir, file), 'utf8').matchAll(
      /(?:^|\n)\s*(?:import|export)\b[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/g
    )
  ].map((match) => match[1] || match[2]);

describe('safety.viz’s charts, copied as a built bundle', () => {
  it('SVZ-001: the copy matches its record, which names safety.viz, the commit and the version', () => {
    expect(verifyVendored(directory)).toEqual([]);
    const record = readRecord(directory);
    expect(verifyDeclaredChanges(record, SAFETY_VIZ)).toEqual([]);
    expect(record.repository).toBe('https://github.com/jwildfire/safety.viz');
    expect(record.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(record.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(chartsVersion()).toBe(record.version);
    expect(typeof record.merged_to_dev).toBe('boolean');
    // The bundle is read from safety.viz's dist folder of that version.
    expect(record.files[0]).toMatchObject({
      file: 'safety.viz.esm.js',
      source: `dist/safety.viz-${record.version}/safety.viz.esm.js`
    });
    // Nothing of the copy is changed from its source: no file lists a change.
    for (const entry of record.files) {
      expect(entry.patches, entry.file).toBeUndefined();
      expect(entry.columns, entry.file).toBeUndefined();
    }
  });

  it('SVZ-002: the folder holds the bundle and the three files copied beside it, and nothing else: no source map, no chart’s source', () => {
    expect(filesUnder(directory).sort()).toEqual(
      [
        'SOURCE.json',
        'safety.viz.esm.js',
        'src/data/schema/portfolio.json',
        'src/status-label.js',
        'src/tiers.js'
      ].sort()
    );
    expect(BUNDLE_FILE).toBe('site/vendor/safety.viz/safety.viz.esm.js');
  });

  it('SVZ-003: src/data/portfolio.json is the chart list the bundle exports', async () => {
    expect(await manifestProblems()).toEqual([]);
    const manifest = JSON.parse(readFileSync(path.join(rootDir, MANIFEST_FILE), 'utf8'));
    expect(manifest).toEqual(bundle.portfolio);
    expect(Object.keys(manifest.modules).length).toBeGreaterThan(0);
  });

  it('SVZ-004: the three files the app reads hand on the copy unchanged', () => {
    expect(Object.keys(charts).sort()).toEqual(Object.keys(bundle).sort());
    for (const name of Object.keys(bundle)) expect(charts[name], name).toBe(bundle[name]);
    expect(charts.default).toBe(bundle.default);
    expect(Object.keys(tiers).sort()).toEqual(Object.keys(copiedTiers).sort());
    for (const name of Object.keys(copiedTiers)) expect(tiers[name], name).toBe(copiedTiers[name]);
    expect(Object.keys(statusLabel).sort()).toEqual(Object.keys(copiedStatusLabel).sort());
    for (const name of Object.keys(copiedStatusLabel)) {
      expect(statusLabel[name], name).toBe(copiedStatusLabel[name]);
    }
  });

  it('SVZ-005: nothing under src/ but the app, the three files that hand the copy on and the chart list', () => {
    expect(
      filesUnder(path.join(rootDir, 'src')).filter((file) => !file.startsWith('app/'))
    ).toEqual(['data/portfolio.json', 'main.js', 'status-label.js', 'tiers.js']);
    // The three hold no code of their own: comments and exports from the copy.
    for (const file of ['src/main.js', 'src/tiers.js', 'src/status-label.js']) {
      const code = readFileSync(path.join(rootDir, file), 'utf8')
        .split('\n')
        .filter((line) => line.trim() && !line.trim().startsWith('//'));
      for (const line of code) {
        expect(line, file).toMatch(
          /^export (\*|\{ default \}) from '\.\.\/site\/vendor\/safety\.viz\/[\w./-]+';$/
        );
      }
    }
  });

  it('SVZ-006: no import leaves src/ for a chart’s source: the app reaches the charts only through the three files, and they only through the copy', () => {
    const app = filesUnder(path.join(rootDir, 'src/app')).map((file) => `src/app/${file}`);
    expect(app.length).toBeGreaterThan(20);
    const leaving = app.flatMap((file) =>
      importsOf(file)
        .filter((address) => address.startsWith('..'))
        .map((address) => `${file} -> ${address}`)
    );
    expect(leaving.sort()).toEqual([
      'src/app/main.js -> ../main.js',
      'src/app/main.js -> ../main.js',
      'src/app/page.js -> ../status-label.js',
      'src/app/page.js -> ../tiers.js'
    ]);
    // Nothing in the app imports a package either: it is bundled from these files alone.
    for (const file of app) {
      for (const address of importsOf(file)) expect(address, file).toMatch(/^\.\.?\//);
    }
    const handed = ['src/main.js', 'src/tiers.js', 'src/status-label.js'].flatMap(importsOf);
    for (const address of handed) expect(address).toMatch(/^\.\.\/site\/vendor\/safety\.viz\//);
    // And the copy's own files import nothing outside the copy.
    for (const file of ['src/tiers.js', 'src/status-label.js']) {
      for (const address of importsOf(`${SAFETY_VIZ.directory}/${file}`)) {
        expect(address, file).toMatch(/^\.\/[\w.-]+$/);
      }
    }
  });
});
