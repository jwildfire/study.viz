// safety.viz's charts, as study.viz carries them (obot.roadmap#440): the
// bundle safety.viz builds and commits, copied byte for byte into
// site/vendor/safety.viz/ with a record, the way safety.viz's own
// scripts/vendor-lib.mjs copies other libraries and the way bio.viz copies
// safety.viz's bundle. No chart's source is in study.viz, and nothing of
// safety.viz is rebuilt here.
//
// Three source files are copied with the bundle, from the same commit and
// under the same record, because the bundle does not export what they hold and
// the app reads it: the status ladder (src/tiers.js), the status label
// (src/status-label.js, which the kit deliberately leaves out) and the JSON
// Schema of a library's chart list (src/data/schema/portfolio.json). None is a
// chart, and none is edited here.
//
// The app reads the charts through three files of study.viz's own, which hand
// on the copy unchanged: src/main.js, src/tiers.js and src/status-label.js.
// And the chart list the bundle exports as `portfolio` is written out as
// src/data/portfolio.json, for the builds and tests that read it as a file:
// `manifestText` is what that file must be.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import prettier from 'prettier';
import { readRecord } from './vendor-lib.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * What is copied from safety.viz. The bundle's path there carries safety.viz's
 * version, read from its own package.json at the commit; here it has one name
 * whatever the version. The source maps are left behind: a map carries the
 * source of every chart.
 */
export const SAFETY_VIZ = {
  name: 'safety.viz chart bundle, and three source files the app reads beside it',
  label: 'bundle',
  repository: 'https://github.com/jwildfire/safety.viz',
  directory: 'site/vendor/safety.viz',
  files: [
    { file: 'safety.viz.esm.js', source: 'dist/safety.viz-{version}/safety.viz.esm.js' },
    { file: 'src/tiers.js', source: 'src/tiers.js' },
    { file: 'src/status-label.js', source: 'src/status-label.js' },
    { file: 'src/data/schema/portfolio.json', source: 'src/data/schema/portfolio.json' }
  ]
};

/** The bundle, as a path from the repository's root. */
export const BUNDLE_FILE = `${SAFETY_VIZ.directory}/${SAFETY_VIZ.files[0].file}`;

/** Where the bundle's chart list is written out: written here, never by hand. */
export const MANIFEST_FILE = 'src/data/portfolio.json';

/**
 * The safety.viz version the copied bundle is, as its record names it: what
 * the app's footer names beside study.viz's own version.
 * @returns {string} The version, as `1.12.0`.
 */
export const chartsVersion = () => readRecord(path.join(rootDir, SAFETY_VIZ.directory)).version;

/**
 * The text of src/data/portfolio.json for the bundle as it is copied: the
 * chart list the bundle exports as `portfolio`, formatted as the repository
 * formats its JSON.
 * @returns {Promise<string>} The file's text.
 */
export async function manifestText() {
  const file = path.join(rootDir, MANIFEST_FILE);
  const { portfolio } = await import(pathToFileURL(path.join(rootDir, BUNDLE_FILE)).href);
  return prettier.format(JSON.stringify(portfolio), {
    ...(await prettier.resolveConfig(file)),
    filepath: file
  });
}

/**
 * What is wrong with src/data/portfolio.json; an empty list means it is the
 * chart list the copied bundle exports.
 * @returns {Promise<string[]>} The problems, each a sentence.
 */
export async function manifestProblems() {
  let onDisk = null;
  try {
    onDisk = readFileSync(path.join(rootDir, MANIFEST_FILE), 'utf8');
  } catch {
    onDisk = null;
  }
  return onDisk === (await manifestText())
    ? []
    : [
        `${MANIFEST_FILE} is not the chart list the bundle in ${SAFETY_VIZ.directory} exports. ` +
          'Run `node scripts/vendor-safety-viz.mjs --manifest` and commit the file.'
      ];
}
