// What study.viz began as: the demo app of jwildfire/safety.viz, copied out of
// one commit with a record (obot.roadmap#440). The record, SOURCE.json at the
// root of the repository, names that commit and lists every copied file with
// its checksum and size. `verifyCopied` is the check that fails when a file and
// the record no longer agree; `verifyAgainstSource` compares each file with the
// commit itself.
//
// The model is safety.viz's own scripts/vendor-lib.mjs, which keeps a record
// of the same shape beside each library it copies. Two things differ. A copied
// file keeps the path it had in safety.viz, so the record sits at the root and
// not in a folder of its own. And the files are study.viz's source from here
// on, not another library's: a file changes by a line listed below, with its
// reason, until the day the record is retired (CONTRIBUTING.md, "The record of
// the copy").
//
// A copied file may differ from its source in two ways, each listed under
// `changes` with its reason: whole lines swapped for others, listed as they
// were and as they are; and whole lines cut, listed by the first and the last
// of them. Both checks then hold the file to its source with those changes
// made, and to nothing else. A change cannot be passed by writing it into the
// record: it has to be listed here, where it is reviewed.
//
// Pure functions over bytes and a folder; scripts/copied.mjs is the command
// line.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const RECORD_FILE = 'SOURCE.json';

// The JSON Schema of a library's chart list is not in the bundle, so it is
// copied beside it (scripts/safety-viz-lib.mjs), and the two tests that hold a
// second library's chart list to it read the copy.
const SCHEMA_FROM_THE_COPY = {
  original: "import schema from '../../../src/data/schema/portfolio.json';",
  replacement:
    "import schema from '../../../site/vendor/safety.viz/src/data/schema/portfolio.json';",
  reason:
    'src/data/schema/portfolio.json is a file of the chart library. It is copied with the ' +
    'bundle into site/vendor/safety.viz/, under that folder’s record, and read from there.'
};

/**
 * What is copied from safety.viz, and from which commit.
 *
 *   folders   copied whole: every file under the folder at the commit
 *   files     single files
 *   left      files under a copied folder that stay in safety.viz, each with why
 *   changes   file → what differs here, in the order it is done, each with why:
 *             { original, replacement, reason }   lines swapped for others; each
 *                                                 is one or more whole lines
 *             { cut: { from, to }, reason }       lines cut, from the line
 *                                                 `from` to the first line `to`
 *                                                 at or after it
 */
export const COPIED = {
  name: 'safety.viz’s demo app, as study.viz began',
  label: 'copy',
  repository: 'https://github.com/jwildfire/safety.viz',
  // The head of safety.viz's dev branch when the copy was made.
  commit: 'f94fea414c888b0ad1d628598bf023b24a659038',
  folders: [
    // The app.
    'src/app',
    // Its unit tests, and the tests of the page it is served on and of the
    // local demo and the demo data.
    'tests/unit/app',
    'tests/unit/local-demo',
    'tests/unit/demo-data',
    // What those tests read: the renamed-column study, desktop R's answers
    // for the biomarker charts and for the RBQM pipeline.
    'tests/e2e/fixtures/app',
    'tests/fixtures/app-statistics',
    'tests/fixtures/rbqm',
    // The libraries the app carries, each copied from its own repository with
    // a record of its own, which is copied with it: bio.viz, gsm.bio's
    // statistics, the gsm workflows, gsm.viz, the gsm packages built for R in
    // the browser, and study.builder.
    'site/vendor/bio.viz',
    'site/vendor/gsm.bio',
    'site/vendor/gsm.kri',
    'site/vendor/gsm.mapping',
    'site/vendor/gsm.reporting',
    'site/vendor/gsm.viz',
    'site/vendor/r-wasm',
    'site/vendor/study.builder',
    // The site-level risk pipeline R is given, and what each workflow needs.
    'site/rbqm',
    // The demo studies: the pilot study's extracts, the liver cohort, and the
    // RBQM study with its record. The six pje-* extracts belong to a chart
    // page that stays in safety.viz; they come too because the generators and
    // their drift check write and compare the whole folder.
    'site/data',
    // The script that builds the gsm packages for R in the browser.
    'scripts/r-wasm'
  ],
  files: [
    // The tests of the site build that are about the demo app's page.
    'tests/unit/site/demo-app-page.test.js',
    'tests/unit/site/favicon.test.js',
    'tests/unit/site/validate.test.js',
    'tests/unit/no-absolute-paths.test.js',
    // The stand-in second chart library the app's tests hand it.
    'tests/e2e/fixtures/stand-in-library.js',
    // The copying of another library with a record, and its command line:
    // scripts/vendor-safety-viz.mjs copies safety.viz's bundle with them.
    'scripts/vendor-lib.mjs',
    'scripts/vendor-cli.mjs',
    // The scripts that copy each library and check the copy.
    'scripts/vendor-bio-viz.mjs',
    'scripts/vendor-statistics.mjs',
    'scripts/vendor-gsm-workflows.mjs',
    'scripts/vendor-gsm-viz.mjs',
    'scripts/vendor-rbqm-study.mjs',
    'scripts/vendor-study-builder.mjs',
    'scripts/r-wasm.mjs',
    'scripts/r-wasm-lib.mjs',
    // The site-level risk pipeline: what R is given, and desktop R's answers.
    'scripts/rbqm-lib.mjs',
    'scripts/rbqm-reference.mjs',
    'scripts/rbqm-reference.R',
    'scripts/rbqm-labs-check.R',
    // Desktop R's answers for the biomarker charts' statistics.
    'scripts/app-statistics-lib.mjs',
    'scripts/app-statistics.R',
    'scripts/derive-app-statistics.mjs',
    // The demo data's generators and their drift check, and where the data is from.
    'scripts/build-demo-data.mjs',
    'scripts/demo-data-lib.mjs',
    'scripts/build-hep-composite-cohort.mjs',
    'scripts/build-nep-aki-cohort.mjs',
    'scripts/build-hep-abnbl-cohort.mjs',
    'scripts/check-demo-data.mjs',
    'scripts/build-app-fixture.mjs',
    'docs/DATA_SOURCES.md',
    // The rung each chart and each tab of the app stands on.
    'site/config.json'
  ],
  left: {},
  changes: {
    // The charts are safety.viz's built bundle here, and no chart's source is
    // in study.viz: a test that read a source file of the chart library reads
    // the bundle, or the copy beside it, instead.
    'tests/unit/app/charts.test.js': [
      {
        original:
          "import { normalizeXAxis, renderXAxisControl, resolveXAxis } from '../../../src/x-axis.js';",
        replacement:
          "import { kit } from '../../../src/main.js';\n" +
          '\n' +
          '// safety.viz’s x-axis helpers, from the bundle’s kit: study.viz holds no chart’s source.\n' +
          'const { normalizeXAxis, renderXAxisControl, resolveXAxis } = kit;',
        reason:
          'src/x-axis.js is a source file of the chart library, which stays in safety.viz. The ' +
          'bundle exports the same three functions on its kit, and the test reads them there.'
      }
    ],
    'tests/unit/app/libraries.test.js': [SCHEMA_FROM_THE_COPY],
    'tests/unit/app/biomarkers.test.js': [SCHEMA_FROM_THE_COPY],
    'tests/unit/app/status-label.test.js': [
      {
        cut: {
          from: "import * as shell from '../../../src/shell.js';",
          to: "import * as shell from '../../../src/shell.js';"
        },
        reason:
          'src/shell.js is the charts’ shell, a source file of the chart library, which stays in ' +
          'safety.viz. Only the three assertions cut below read it.'
      },
      {
        cut: {
          from: "    // The shared shell hands the label on, with the rest of the charts' chrome.",
          to: '    expect(shell.wireStatusLabels).toBe(wireStatusLabels);'
        },
        reason:
          'These three assertions say that safety.viz’s shell exports the status label. The shell ' +
          'is not in study.viz, and the bundle’s kit leaves the label out, so there is nothing here ' +
          'for them to hold. They stay with src/shell.js in safety.viz’s own suite.'
      }
    ]
  }
};

// The rename (obot.roadmap#440): the app is study.viz from its first commit
// here. Every line of a copied file that named the app safety.viz, where a
// reader sees its name, is swapped for one that names it study.viz, and the
// tests that hold those lines are swapped with them. safety.viz stays wherever
// the chart library or its site is meant. Each change is listed as any other
// is, with the lines as they were and as they are, and is made after the
// file's changes above. The reasons are few, so each is written once; a change
// that does several of these things says each.
const WHY = {
  name:
    'The app is study.viz here, from its first commit: a line that names the app, where a ' +
    'reader sees it or in the comment beside it, names it study.viz.',
  title: 'The app’s name in the browser tab and in a page’s title is "study.viz demo".',
  files:
    'The bundle and the single file carry the app’s name: study.viz-app.js and ' +
    'study.viz-app.html.',
  mapping:
    'The mapping file the app saves carries the app’s name: study-viz-mapping.json. The ' +
    'safetyVizMapping key inside it, which the app reads back, keeps its name.',
  warning: 'The app’s console warnings start with its name: "study.viz app:".',
  repo: 'The app’s source link leads to study.viz’s own repository.',
  wordmark:
    'The header’s wordmark reads study.viz and is not a link to safety.viz’s docs: it is ' +
    'plain words, and a link only where the page gives the app’s own home. The docs link ' +
    'is the footer’s, and its words say the docs are safety.viz’s charts’.',
  version:
    'The footer names the app’s own version, study.viz’s, and beside it the safety.viz ' +
    'version of the charts it carries.',
  installer:
    'The installer installs study.viz: it clones study.viz’s repository into ./study.viz ' +
    'and knows a checkout by that name. Its message for a release with no demo command no ' +
    'longer names v1.9.2, which was a release of safety.viz.',
  checksums:
    'The file holds the checksums of src/app/mapping.js, libraries.js and page.js, which ' +
    'changed with the app’s name. The requests were recorded again from the renamed app ' +
    'and are the same; desktop R’s answers are the ones it gave, untouched.'
};
const why = (...keys) => keys.map((key) => WHY[key]).join(' ');

const RENAMED = {
  'site/config.json': [
    {
      original:
        '  "siteTitle": "safety.viz",\n' +
        '  "repoUrl": "https://github.com/jwildfire/safety.viz",',
      replacement:
        '  "siteTitle": "study.viz",\n' + '  "repoUrl": "https://github.com/jwildfire/study.viz",',
      reason: why('repo', 'name')
    }
  ],
  'src/app/libraries.js': [
    {
      original: '  const warn = (message) => console.warn(`safety.viz app: ${message}`);',
      replacement: '  const warn = (message) => console.warn(`study.viz app: ${message}`);',
      reason: why('warning')
    },
    {
      original:
        '          `safety.viz app: ${name} names a tab colour that is not a six-digit hex colour; the app chose one.`',
      replacement:
        '          `study.viz app: ${name} names a tab colour that is not a six-digit hex colour; the app chose one.`',
      reason: why('warning')
    },
    {
      original:
        "    console.warn('safety.viz app: a library’s control could not say its state.', error);",
      replacement:
        "    console.warn('study.viz app: a library’s control could not say its state.', error);",
      reason: why('warning')
    },
    {
      original: "    console.warn('safety.viz app: a library could not say its note.', error);",
      replacement: "    console.warn('study.viz app: a library could not say its note.', error);",
      reason: why('warning')
    },
    {
      original:
        "    console.warn('safety.viz app: a view could not say whether a file is its own.', error);",
      replacement:
        "    console.warn('study.viz app: a view could not say whether a file is its own.', error);",
      reason: why('warning')
    },
    {
      original:
        "    console.warn('safety.viz app: a view could not say what the loaded data supports.', error);",
      replacement:
        "    console.warn('study.viz app: a view could not say what the loaded data supports.', error);",
      reason: why('warning')
    }
  ],
  'src/app/main.js': [
    {
      original: '/* global __SAFETY_VIZ_VERSION__ */',
      replacement: '/* global __SAFETY_VIZ_VERSION__, __STUDY_VIZ_VERSION__ */',
      reason: why('version')
    },
    {
      original:
        " * Where the footer's links go when the host page does not say: the published\n" +
        ' * site. The single-file build keeps these, since it has no site around it.',
      replacement:
        " * Where the footer's links go when the host page does not say: the charts'\n" +
        " * docs and the Domains page on safety.viz's published site, and study.viz's\n" +
        ' * own repository. The single-file build keeps these, since it has no site\n' +
        ' * around it.',
      reason: why('name')
    },
    {
      original: "  github: 'https://github.com/jwildfire/safety.viz'",
      replacement: "  github: 'https://github.com/jwildfire/study.viz'",
      reason: why('repo')
    },
    {
      original: '    ...options,',
      replacement:
        "    appVersion: typeof __STUDY_VIZ_VERSION__ === 'string' ? __STUDY_VIZ_VERSION__ : '',\n" +
        '    ...options,',
      reason: why('version')
    }
  ],
  'src/app/mapping.js': [
    {
      original:
        "      'Provisional format, written by the safety.viz demo app. Drop this file on the app ' +",
      replacement:
        "      'Provisional format, written by the study.viz demo app. Drop this file on the app ' +",
      reason: why('name')
    }
  ],
  'src/app/page.js': [
    {
      original: "export const MAPPING_FILE_NAME = 'safety-viz-mapping.json';",
      replacement: "export const MAPPING_FILE_NAME = 'study-viz-mapping.json';",
      reason: why('mapping')
    },
    {
      original:
        " * @param {{docs?: string, domains?: string, download?: string, github?: string}} [options.links] Where the footer's links go; a link with no address is left out. The wordmark is a link to `docs` too (#270).\n" +
        " * @param {Object<string, {guide?: string, evidence?: string}>} [options.chartLinks] Each chart's own pages, keyed by module name: its clinical guide and its test evidence. A chart's view carries a footnote linking those it was given an address for (#246).\n" +
        ' * @param {Object<string, {tier: string, note?: string}>} [options.tiers] The rung of the status ladder each chart and each view stands on, keyed by module name or view id, with the sentence that says why where there is one (#272). A chart the page is told nothing of stands where its own entry says, by `tier` and `tierNote`, and on Exploratory when that names none.\n' +
        ' * @param {string} [options.version] The safety.viz version, shown in the footer.\n' +
        ' * @param {string} [options.title] The app\'s name in the browser tab\'s title, which names the open view before it: "RBQM · safety.viz demo" (#270).',
      replacement:
        " * @param {{home?: string, docs?: string, domains?: string, download?: string, github?: string}} [options.links] Where the footer's links go; a link with no address is left out. `docs` is the charts' docs, on safety.viz's site. The wordmark is a link to `home` when the page gives one, and plain words when it gives none.\n" +
        " * @param {Object<string, {guide?: string, evidence?: string}>} [options.chartLinks] Each chart's own pages, keyed by module name: its clinical guide and its test evidence. A chart's view carries a footnote linking those it was given an address for (#246).\n" +
        ' * @param {Object<string, {tier: string, note?: string}>} [options.tiers] The rung of the status ladder each chart and each view stands on, keyed by module name or view id, with the sentence that says why where there is one (#272). A chart the page is told nothing of stands where its own entry says, by `tier` and `tierNote`, and on Exploratory when that names none.\n' +
        ' * @param {string} [options.version] The version of safety.viz, the chart library the app carries, shown in the footer.\n' +
        " * @param {string} [options.appVersion] The app's own version, study.viz's, shown in the footer before the chart library's, on the same line.\n" +
        ' * @param {string} [options.title] The app\'s name in the browser tab\'s title, which names the open view before it: "RBQM · study.viz demo" (#270).',
      reason: why('version', 'wordmark', 'title')
    },
    {
      original: "    title: appName = 'safety.viz demo',",
      replacement: "    appVersion = '',\n" + "    title: appName = 'study.viz demo',",
      reason: why('version', 'title')
    },
    {
      original:
        '        `safety.viz app: a source was handed in with no id or an id already used (${id}); it was left out.`',
      replacement:
        '        `study.viz app: a source was handed in with no id or an id already used (${id}); it was left out.`',
      reason: why('warning')
    },
    {
      original:
        '        `safety.viz app: a view was handed in with no id or an id already used (${id}); it was left out.`',
      replacement:
        '        `study.viz app: a view was handed in with no id or an id already used (${id}); it was left out.`',
      reason: why('warning')
    },
    {
      original:
        '  // The wordmark leads to the docs home when the page says where that is (#270).\n' +
        "  const brand = el(links.docs ? 'a' : 'div', 'sva-brand');\n" +
        '  if (links.docs) {\n' +
        '    brand.href = links.docs;\n' +
        "    brand.title = 'safety.viz: docs and chart gallery';",
      replacement:
        '  // The wordmark is plain words, and a link only where the page says where the\n' +
        "  // app's own home is. The charts' docs, on safety.viz's site, are a link in the\n" +
        '  // footer.\n' +
        "  const brand = el(links.home ? 'a' : 'div', 'sva-brand');\n" +
        '  if (links.home) {\n' +
        '    brand.href = links.home;\n' +
        "    brand.title = 'study.viz: home';",
      reason: why('wordmark')
    },
    {
      original:
        '  brand.append(\n' +
        '    logo,\n' +
        "    el('span', 'sva-wordmark', 'safety.viz'),\n" +
        "    el('span', 'sva-kicker', 'Demo app')\n" +
        '  );',
      replacement:
        "  brand.append(logo, el('span', 'sva-wordmark', 'study.viz'), el('span', 'sva-kicker', 'Demo app'));",
      reason: why('wordmark')
    },
    {
      original: "    ['docs', 'Docs and chart gallery'],",
      replacement: "    ['docs', 'safety.viz chart docs and gallery'],",
      reason: why('wordmark')
    },
    {
      original:
        "  if (version) railLinks.append(el('li', 'sva-version', `safety.viz ${version}`));",
      replacement:
        "  // The app's own version, and beside it the version of the chart library it carries.\n" +
        '  const versions = [appVersion && `study.viz ${appVersion}`, version && `safety.viz ${version}`];\n' +
        '  if (versions.some(Boolean)) {\n' +
        "    railLinks.append(el('li', 'sva-version', versions.filter(Boolean).join(' · ')));\n" +
        '  }',
      reason: why('version')
    },
    {
      original:
        "        console.warn('safety.viz app: a chart did not tear down cleanly.', error);",
      replacement:
        "        console.warn('study.viz app: a chart did not tear down cleanly.', error);",
      reason: why('warning')
    },
    {
      original: "      console.warn('safety.viz app: a view could not list its items.', error);",
      replacement: "      console.warn('study.viz app: a view could not list its items.', error);",
      reason: why('warning')
    },
    {
      original:
        "        console.warn('safety.viz app: a view’s control could not be read.', error);",
      replacement:
        "        console.warn('study.viz app: a view’s control could not be read.', error);",
      reason: why('warning')
    },
    {
      original: "      console.warn('safety.viz app: a view could not say its tag.', error);",
      replacement: "      console.warn('study.viz app: a view could not say its tag.', error);",
      reason: why('warning')
    },
    {
      original:
        "        'safety.viz app: a chart did not take its new settings; it is drawn again.',",
      replacement:
        "        'study.viz app: a chart did not take its new settings; it is drawn again.',",
      reason: why('warning')
    },
    {
      original:
        "      console.warn('safety.viz app: a library’s control failed when pressed.', error);",
      replacement:
        "      console.warn('study.viz app: a library’s control failed when pressed.', error);",
      reason: why('warning')
    },
    {
      original:
        "          'safety.viz app: a view could not say whether it shows the load’s notes.',",
      replacement:
        "          'study.viz app: a view could not say whether it shows the load’s notes.',",
      reason: why('warning')
    },
    {
      original:
        "          console.warn('safety.viz app: a source could not list its studies.', error);",
      replacement:
        "          console.warn('study.viz app: a source could not list its studies.', error);",
      reason: why('warning')
    }
  ],
  'tests/fixtures/app-statistics/expected.json': [
    {
      original: '   "sha256": "6ace4cad4707a31da71826ffd8186bea5a1d444077b703a71e7d9e6c82a96049"',
      replacement:
        '   "sha256": "e2ed748f32c2bb0b77bdc7a35de5d3bb843a45915223bc5f38bf5225a12a3200"',
      reason: why('checksums')
    },
    {
      original: '   "sha256": "8b34bedea811cbcb262eb5074216318a7442b6449409312cbff58081110b8b42"',
      replacement:
        '   "sha256": "8bc8a4a8d6cf6b6141193658f67f62a00fc1e6200acf6d3beaefc31e1f4cce8f"',
      reason: why('checksums')
    },
    {
      original: '   "sha256": "ff84b2b314f9abd0f706356b3ecbf3637ddc329364c698d18706af5ca232c997"',
      replacement:
        '   "sha256": "02ce0ebabc3d7eb7a6cd889dba4dd5d4202bca1140fad0ae90ab5b21bd0c57b6"',
      reason: why('checksums')
    }
  ],
  'tests/fixtures/app-statistics/requests.json': [
    {
      original: '   "sha256": "6ace4cad4707a31da71826ffd8186bea5a1d444077b703a71e7d9e6c82a96049"',
      replacement:
        '   "sha256": "e2ed748f32c2bb0b77bdc7a35de5d3bb843a45915223bc5f38bf5225a12a3200"',
      reason: why('checksums')
    },
    {
      original: '   "sha256": "8b34bedea811cbcb262eb5074216318a7442b6449409312cbff58081110b8b42"',
      replacement:
        '   "sha256": "8bc8a4a8d6cf6b6141193658f67f62a00fc1e6200acf6d3beaefc31e1f4cce8f"',
      reason: why('checksums')
    },
    {
      original: '   "sha256": "ff84b2b314f9abd0f706356b3ecbf3637ddc329364c698d18706af5ca232c997"',
      replacement:
        '   "sha256": "02ce0ebabc3d7eb7a6cd889dba4dd5d4202bca1140fad0ae90ab5b21bd0c57b6"',
      reason: why('checksums')
    }
  ],
  'tests/unit/app/data-panel.test.js': [
    {
      original: "      name: 'safety-viz-mapping.json',",
      replacement: "      name: 'study-viz-mapping.json',",
      reason: why('mapping')
    },
    {
      original:
        "      'safety-viz-mapping.json is a saved mapping for: Subject-level (dm.csv), ' +",
      replacement:
        "      'study-viz-mapping.json is a saved mapping for: Subject-level (dm.csv), ' +",
      reason: why('mapping')
    }
  ],
  'tests/unit/app/page.test.js': [
    {
      original:
        "    expect(root.querySelector('.sva-header .sva-wordmark').textContent).toBe('safety.viz');",
      replacement:
        "    expect(root.querySelector('.sva-header .sva-wordmark').textContent).toBe('study.viz');",
      reason: why('wordmark')
    },
    {
      original:
        "    // The app's own parts are a header and a footer; nothing sits beside the view.",
      replacement:
        "    // Given its own version too, the footer names the app's first and the chart\n" +
        "    // library's beside it.\n" +
        "    mountApp(root, { charts, manifest, version: '1.2.3', appVersion: '0.4.5' });\n" +
        "    expect(root.querySelector('.sva-footer .sva-version').textContent).toBe(\n" +
        "      'study.viz 0.4.5 · safety.viz 1.2.3'\n" +
        '    );\n' +
        "    expect(root.querySelectorAll('.sva-footer .sva-version')).toHaveLength(1);\n" +
        "    // The app's own parts are a header and a footer; nothing sits beside the view.",
      reason: why('version')
    },
    {
      original: "      links: { docs: '../index.html', download: './safety.viz-app.html' }",
      replacement: "      links: { docs: '../index.html', download: './study.viz-app.html' }",
      reason: why('files')
    },
    {
      original:
        "      ['docs', '../index.html', 'Docs and chart gallery'],\n" +
        "      ['download', './safety.viz-app.html', 'Download as one file']",
      replacement:
        "      ['docs', '../index.html', 'safety.viz chart docs and gallery'],\n" +
        "      ['download', './study.viz-app.html', 'Download as one file']",
      reason: why('wordmark', 'files')
    }
  ],
  'tests/unit/app/r-on-request.test.js': [
    {
      original: "      'safety.viz app: a library could not say its note.',",
      replacement: "      'study.viz app: a library could not say its note.',",
      reason: why('warning')
    },
    {
      original: "      'safety.viz app: a library’s control failed when pressed.',",
      replacement: "      'study.viz app: a library’s control failed when pressed.',",
      reason: why('warning')
    }
  ],
  'tests/unit/app/r-wiring.test.js': [
    {
      original:
        "  it('APP-R-012: the hosted page hands bio.viz’s charts R on request with the statistics file beside it, and says what the app now promises (#183)', () => {\n" +
        '    const html = renderDemoAppPage({\n' +
        "      bundle: 'safety.viz-app.js',\n" +
        "      download: 'safety.viz-app.html',\n" +
        "      repoUrl: 'https://github.com/jwildfire/safety.viz',",
      replacement:
        "  it('APP-R-012: the hosted page hands bio.viz’s charts R on request with the statistics file beside it, and says what the app now promises (#183)', () => {\n" +
        '    const html = renderDemoAppPage({\n' +
        "      bundle: 'study.viz-app.js',\n" +
        "      download: 'study.viz-app.html',\n" +
        "      repoUrl: 'https://github.com/jwildfire/study.viz',",
      reason: why('files', 'repo')
    },
    {
      original:
        '    );\n' +
        '    const html = renderDemoAppPage({\n' +
        "      bundle: 'safety.viz-app.js',\n" +
        "      download: 'safety.viz-app.html',\n" +
        "      repoUrl: 'https://github.com/jwildfire/safety.viz',",
      replacement:
        '    );\n' +
        '    const html = renderDemoAppPage({\n' +
        "      bundle: 'study.viz-app.js',\n" +
        "      download: 'study.viz-app.html',\n" +
        "      repoUrl: 'https://github.com/jwildfire/study.viz',",
      reason: why('files', 'repo')
    }
  ],
  'tests/unit/app/single-file.test.js': [
    {
      original: "      script: 'var a=1;\\n//# sourceMappingURL=safety.viz-app.js.map\\n'",
      replacement: "      script: 'var a=1;\\n//# sourceMappingURL=study.viz-app.js.map\\n'",
      reason: why('files')
    },
    {
      original: "    expect(html).toContain('<title>safety.viz demo</title>');",
      replacement: "    expect(html).toContain('<title>study.viz demo</title>');",
      reason: why('title')
    }
  ],
  'tests/unit/app/view-items.test.js': [
    {
      original:
        "    expect(warn.mock.calls[0][0]).toBe('safety.viz app: a view could not list its items.');",
      replacement:
        "    expect(warn.mock.calls[0][0]).toBe('study.viz app: a view could not list its items.');",
      reason: why('warning')
    },
    {
      original: "      'safety.viz app: a view’s control could not be read.'",
      replacement: "      'study.viz app: a view’s control could not be read.'",
      reason: why('warning')
    },
    {
      original: "      'safety.viz app: a view could not say its tag.'",
      replacement: "      'study.viz app: a view could not say its tag.'",
      reason: why('warning')
    },
    {
      original: "      'safety.viz app: a view could not say whether it shows the load’s notes.'",
      replacement: "      'study.viz app: a view could not say whether it shows the load’s notes.'",
      reason: why('warning')
    }
  ],
  'tests/unit/app/wordmark-title.test.js': [
    {
      original:
        '// The header leads back to the docs, and the browser tab says where the reader\n' +
        '// is (#270, obot.roadmap#402).',
      replacement:
        '// The header names the app, study.viz, and the browser tab says where the\n' +
        "// reader is (#270, obot.roadmap#402). The charts' docs, on safety.viz's site,\n" +
        '// are a link in the footer.',
      reason: why('wordmark')
    },
    {
      original:
        "    document.title = 'safety.viz demo';\n" +
        '  });\n' +
        '\n' +
        '  it(\'APP-PAGE-037: the wordmark is a link to the docs home, with the mark and the words "Demo app" inside it; a page given no docs address has no link (#270)\', () => {\n' +
        "    const app = mountApp(root, { charts, manifest, links: { docs: '../index.html' } });\n" +
        "    const brand = root.querySelector('.sva-brand');\n" +
        "    expect(brand.tagName).toBe('A');\n" +
        "    expect(brand.getAttribute('href')).toBe('../index.html');\n" +
        "    expect(brand.title).toBe('safety.viz: docs and chart gallery');\n" +
        "    expect(brand.querySelector('.sva-logo svg')).not.toBeNull();\n" +
        "    expect(brand.querySelector('.sva-wordmark').textContent).toBe('safety.viz');\n" +
        "    expect(brand.querySelector('.sva-kicker').textContent).toBe('Demo app');\n" +
        "    // The footer's link is as before.\n" +
        "    expect(root.querySelector('.sva-links a[data-link=\"docs\"]').getAttribute('href')).toBe(\n" +
        "      '../index.html'\n" +
        '    );\n' +
        '    app.destroy();\n' +
        "    // The app's own default is the published site, which the single file keeps.\n" +
        "    expect(DEFAULT_LINKS.docs).toBe('https://jwildfire.github.io/safety.viz/');\n" +
        '    const plain = mountApp(root, { charts, manifest });\n' +
        "    expect(root.querySelector('.sva-brand').tagName).toBe('DIV');\n" +
        "    expect(root.querySelector('a.sva-brand')).toBeNull();\n" +
        '    plain.destroy();',
      replacement:
        "    document.title = 'study.viz demo';\n" +
        '  });\n' +
        '\n' +
        '  it(\'APP-PAGE-037: the wordmark reads study.viz, with the mark and the words "Demo app" beside it, and is not a link to the charts’ docs: it is a link only where the page gives the app’s own home, and the docs link is in the footer, named as safety.viz’s (#270)\', () => {\n' +
        "    // A page that gives the docs' address and no home: plain words in the header.\n" +
        "    const app = mountApp(root, { charts, manifest, links: { docs: '../index.html' } });\n" +
        "    const brand = root.querySelector('.sva-brand');\n" +
        "    expect(brand.tagName).toBe('DIV');\n" +
        "    expect(root.querySelector('a.sva-brand')).toBeNull();\n" +
        "    expect(brand.querySelector('.sva-logo svg')).not.toBeNull();\n" +
        "    expect(brand.querySelector('.sva-wordmark').textContent).toBe('study.viz');\n" +
        "    expect(brand.querySelector('.sva-kicker').textContent).toBe('Demo app');\n" +
        "    // The docs link is the footer's, and its words say whose docs they are.\n" +
        '    const docs = root.querySelector(\'.sva-links a[data-link="docs"]\');\n' +
        "    expect(docs.getAttribute('href')).toBe('../index.html');\n" +
        "    expect(docs.textContent).toBe('safety.viz chart docs and gallery');\n" +
        '    app.destroy();\n' +
        "    // The app's own defaults: the charts' docs on safety.viz's published site,\n" +
        "    // which the single file keeps, study.viz's own repository, and no home.\n" +
        "    expect(DEFAULT_LINKS.docs).toBe('https://jwildfire.github.io/safety.viz/');\n" +
        "    expect(DEFAULT_LINKS.github).toBe('https://github.com/jwildfire/study.viz');\n" +
        '    expect(DEFAULT_LINKS.home).toBeUndefined();\n' +
        "    // A page that gives the app's own home: the wordmark leads there.\n" +
        "    const linked = mountApp(root, { charts, manifest, links: { home: './index.html' } });\n" +
        "    const home = root.querySelector('.sva-brand');\n" +
        "    expect(home.tagName).toBe('A');\n" +
        "    expect(home.getAttribute('href')).toBe('./index.html');\n" +
        "    expect(home.title).toBe('study.viz: home');\n" +
        "    expect(home.querySelector('.sva-wordmark').textContent).toBe('study.viz');\n" +
        '    linked.destroy();',
      reason: why('wordmark', 'repo', 'title')
    },
    {
      original:
        "    expect(document.title).toBe('Overview · safety.viz demo');\n" +
        "    app.select('histogram');\n" +
        "    expect(document.title).toBe('Histogram · safety.viz demo');\n" +
        "    app.select('ae-explorer');\n" +
        "    expect(document.title).toBe('Adverse Event Explorer · safety.viz demo');\n" +
        "    app.select('rbqm');\n" +
        "    expect(document.title).toBe('RBQM · safety.viz demo');\n" +
        '    // An address that names no view opens the Overview tab, and the title says so.\n' +
        "    app.select('constructor');\n" +
        "    expect(document.title).toBe('Overview · safety.viz demo');\n" +
        '    // A page may name the app itself; a destroyed app leaves the tab its name.\n' +
        '    app.destroy();\n' +
        "    expect(document.title).toBe('safety.viz demo');",
      replacement:
        "    expect(document.title).toBe('Overview · study.viz demo');\n" +
        "    app.select('histogram');\n" +
        "    expect(document.title).toBe('Histogram · study.viz demo');\n" +
        "    app.select('ae-explorer');\n" +
        "    expect(document.title).toBe('Adverse Event Explorer · study.viz demo');\n" +
        "    app.select('rbqm');\n" +
        "    expect(document.title).toBe('RBQM · study.viz demo');\n" +
        '    // An address that names no view opens the Overview tab, and the title says so.\n' +
        "    app.select('constructor');\n" +
        "    expect(document.title).toBe('Overview · study.viz demo');\n" +
        '    // A page may name the app itself; a destroyed app leaves the tab its name.\n' +
        '    app.destroy();\n' +
        "    expect(document.title).toBe('study.viz demo');",
      reason: why('title')
    }
  ],
  'tests/unit/local-demo/demo-app-dir.test.js': [
    {
      original:
        "        'safety.viz-app.js',\n" +
        "        'safety.viz-app.js.map',\n" +
        "        'safety.viz-app.html'",
      replacement:
        "        'study.viz-app.js',\n" +
        "        'study.viz-app.js.map',\n" +
        "        'study.viz-app.html'",
      reason: why('files')
    },
    {
      original:
        "    const single = readFileSync(path.join(hosted, 'safety.viz-app.html'), 'utf8');",
      replacement:
        "    const single = readFileSync(path.join(hosted, 'study.viz-app.html'), 'utf8');",
      reason: why('files')
    },
    {
      original:
        '    expect(localPage).toContain("download: \'./safety.viz-app.html\'");\n' +
        '    expect(localPage).toContain("github: \'https://github.com/jwildfire/safety.viz\'");',
      replacement:
        '    expect(localPage).toContain("download: \'./study.viz-app.html\'");\n' +
        '    expect(localPage).toContain("github: \'https://github.com/jwildfire/study.viz\'");',
      reason: why('files', 'repo')
    },
    {
      original: "      const single = readFileSync(path.join(dir, 'safety.viz-app.html'), 'utf8');",
      replacement:
        "      const single = readFileSync(path.join(dir, 'study.viz-app.html'), 'utf8');",
      reason: why('files')
    },
    {
      original:
        "    bundle: 'safety.viz-app.js',\n" +
        "    download: 'safety.viz-app.html',\n" +
        "    repoUrl: 'https://github.com/jwildfire/safety.viz'",
      replacement:
        "    bundle: 'study.viz-app.js',\n" +
        "    download: 'study.viz-app.html',\n" +
        "    repoUrl: 'https://github.com/jwildfire/study.viz'",
      reason: why('files', 'repo')
    }
  ],
  'tests/unit/local-demo/demo-server.test.js': [
    {
      original:
        "    writeFileSync(path.join(served, 'safety.viz-app.js'), 'var SafetyVizApp = {};');",
      replacement:
        "    writeFileSync(path.join(served, 'study.viz-app.js'), 'var SafetyVizApp = {};');",
      reason: why('files')
    },
    {
      original: "      '/safety.viz-app.js': 'text/javascript; charset=utf-8',",
      replacement: "      '/study.viz-app.js': 'text/javascript; charset=utf-8',",
      reason: why('files')
    },
    {
      original: "    const response = await raw(port, '/safety.viz-app.js');",
      replacement: "    const response = await raw(port, '/study.viz-app.js');",
      reason: why('files')
    },
    {
      original:
        "    expect(contentType('safety.viz-app.js.map')).toBe('application/json; charset=utf-8');",
      replacement:
        "    expect(contentType('study.viz-app.js.map')).toBe('application/json; charset=utf-8');",
      reason: why('files')
    }
  ],
  'tests/unit/local-demo/install-demo.test.js': [
    {
      original:
        '  writeFileSync(path.join(dir, \'package.json\'), \'{"name":"safety.viz","version":"9.9.9"}\');',
      replacement:
        '  writeFileSync(path.join(dir, \'package.json\'), \'{"name":"study.viz","version":"9.9.9"}\');',
      reason: why('installer')
    },
    {
      original: "  const pkg = { name: 'safety.viz', version: '9.9.9' };",
      replacement: "  const pkg = { name: 'study.viz', version: '9.9.9' };",
      reason: why('installer')
    },
    {
      original:
        "  it('APP-LOCAL-008: with no arguments it installs the latest release into ./safety.viz (#214)', () => {\n" +
        '    expect(parseInstallArgs([])).toEqual({ ...DEFAULTS, refGiven: false, help: false });\n' +
        '    expect(DEFAULTS).toEqual({\n' +
        "      dir: 'safety.viz',\n" +
        "      ref: 'main',\n" +
        "      repo: 'https://github.com/jwildfire/safety.viz.git',",
      replacement:
        "  it('APP-LOCAL-008: with no arguments it installs the latest release into ./study.viz (#214)', () => {\n" +
        '    expect(parseInstallArgs([])).toEqual({ ...DEFAULTS, refGiven: false, help: false });\n' +
        '    expect(DEFAULTS).toEqual({\n' +
        "      dir: 'study.viz',\n" +
        "      ref: 'main',\n" +
        "      repo: 'https://github.com/jwildfire/study.viz.git',",
      reason: why('installer')
    },
    {
      original:
        "    expect(parseInstallArgs(['--repo', 'elsewhere/safety.viz']).repo).toBe('elsewhere/safety.viz');",
      replacement:
        "    expect(parseInstallArgs(['--repo', 'elsewhere/study.viz']).repo).toBe('elsewhere/study.viz');",
      reason: why('installer')
    },
    {
      original:
        "  it('APP-LOCAL-007: tells a directory that is not there, an empty one, a safety.viz checkout and anything else apart (#214)', () => {",
      replacement:
        "  it('APP-LOCAL-007: tells a directory that is not there, an empty one, a study.viz checkout and anything else apart (#214)', () => {",
      reason: why('installer')
    },
    {
      original:
        "    mkdirSync(path.join(cwd, 'safety.viz'));\n" +
        "    writeFileSync(path.join(cwd, 'safety.viz', 'notes.txt'), 'mine');\n" +
        '    const result = run([], { cwd });\n' +
        '    expect(result.status).toBe(1);\n' +
        "    expect(result.stderr).toContain(path.join(cwd, 'safety.viz'));\n" +
        "    expect(result.stderr).toContain('--dir');\n" +
        "    expect(result.stderr).toContain('Nothing was changed');\n" +
        "    expect(readdirSync(path.join(cwd, 'safety.viz'))).toEqual(['notes.txt']);\n" +
        "    expect(readFileSync(path.join(cwd, 'safety.viz', 'notes.txt'), 'utf8')).toBe('mine');",
      replacement:
        "    mkdirSync(path.join(cwd, 'study.viz'));\n" +
        "    writeFileSync(path.join(cwd, 'study.viz', 'notes.txt'), 'mine');\n" +
        '    const result = run([], { cwd });\n' +
        '    expect(result.status).toBe(1);\n' +
        "    expect(result.stderr).toContain(path.join(cwd, 'study.viz'));\n" +
        "    expect(result.stderr).toContain('--dir');\n" +
        "    expect(result.stderr).toContain('Nothing was changed');\n" +
        "    expect(readdirSync(path.join(cwd, 'study.viz'))).toEqual(['notes.txt']);\n" +
        "    expect(readFileSync(path.join(cwd, 'study.viz', 'notes.txt'), 'utf8')).toBe('mine');",
      reason: why('installer')
    },
    {
      original: "    expect(result.stdout).toContain('Downloading safety.viz (main)');",
      replacement: "    expect(result.stdout).toContain('Downloading study.viz (main)');",
      reason: why('installer')
    },
    {
      original: "    const clone = path.join(cwd, 'safety.viz');",
      replacement: "    const clone = path.join(cwd, 'study.viz');",
      reason: why('installer')
    },
    {
      original: "    expect(existsSync(path.join(cwd, 'safety.viz'))).toBe(false);",
      replacement: "    expect(existsSync(path.join(cwd, 'study.viz'))).toBe(false);",
      reason: why('installer')
    },
    {
      original: "    expect(result.stderr).toContain('safety.viz 9.9.9');",
      replacement: "    expect(result.stderr).toContain('study.viz 9.9.9');",
      reason: why('installer')
    },
    {
      original: "    expect(existsSync(path.join(cwd, 'safety.viz', 'node_modules'))).toBe(false);",
      replacement:
        "    expect(existsSync(path.join(cwd, 'study.viz', 'node_modules'))).toBe(false);",
      reason: why('installer')
    },
    {
      original:
        "    checkout(path.join(cwd, 'safety.viz'));\n" +
        "    const before = readdirSync(path.join(cwd, 'safety.viz', 'node_modules'));\n" +
        "    const result = run(['--no-open'], { cwd });\n" +
        "    expect(result.stdout).toContain('safety.viz 9.9.9 is already in');",
      replacement:
        "    checkout(path.join(cwd, 'study.viz'));\n" +
        "    const before = readdirSync(path.join(cwd, 'study.viz', 'node_modules'));\n" +
        "    const result = run(['--no-open'], { cwd });\n" +
        "    expect(result.stdout).toContain('study.viz 9.9.9 is already in');",
      reason: why('installer')
    },
    {
      original:
        "    expect(readdirSync(path.join(cwd, 'safety.viz', 'node_modules'))).toEqual(before);",
      replacement:
        "    expect(readdirSync(path.join(cwd, 'study.viz', 'node_modules'))).toEqual(before);",
      reason: why('installer')
    },
    {
      original:
        "    checkout(path.join(cwd, 'safety.viz'));\n" +
        "    const before = readdirSync(path.join(cwd, 'safety.viz'));",
      replacement:
        "    checkout(path.join(cwd, 'study.viz'));\n" +
        "    const before = readdirSync(path.join(cwd, 'study.viz'));",
      reason: why('installer')
    },
    {
      original:
        "      `${path.join(realpathSync(cwd), 'safety.viz')} already holds safety.viz 9.9.9, and it is used as it is.\\n` +",
      replacement:
        "      `${path.join(realpathSync(cwd), 'study.viz')} already holds study.viz 9.9.9, and it is used as it is.\\n` +",
      reason: why('installer')
    },
    {
      original:
        "    expect(branch.stderr).toContain('already holds safety.viz 9.9.9, and it is used as it is.');\n" +
        "    expect(branch.stderr).toContain('To install dev, name another directory with --dir');\n" +
        "    expect(branch.stdout).not.toContain('demo started');\n" +
        "    expect(readdirSync(path.join(cwd, 'safety.viz'))).toEqual(before);",
      replacement:
        "    expect(branch.stderr).toContain('already holds study.viz 9.9.9, and it is used as it is.');\n" +
        "    expect(branch.stderr).toContain('To install dev, name another directory with --dir');\n" +
        "    expect(branch.stdout).not.toContain('demo started');\n" +
        "    expect(readdirSync(path.join(cwd, 'study.viz'))).toEqual(before);",
      reason: why('installer')
    },
    {
      original: '      expect(first.stdout).toContain(`Downloading safety.viz (${ref})`);',
      replacement: '      expect(first.stdout).toContain(`Downloading study.viz (${ref})`);',
      reason: why('installer')
    },
    {
      original: "      expect(again.stdout).toContain('safety.viz 9.9.9 is already in');",
      replacement: "      expect(again.stdout).toContain('study.viz 9.9.9 is already in');",
      reason: why('installer')
    },
    {
      original:
        "      expect(branchIn(path.join(cwd, 'safety.viz'))).toBe(ref === 'dev' ? 'dev' : null);",
      replacement:
        "      expect(branchIn(path.join(cwd, 'study.viz'))).toBe(ref === 'dev' ? 'dev' : null);",
      reason: why('installer')
    },
    {
      original:
        "    expect(result.stderr).toContain('already holds safety.viz 9.9.9 from the dev branch');",
      replacement:
        "    expect(result.stderr).toContain('already holds study.viz 9.9.9 from the dev branch');",
      reason: why('installer')
    },
    {
      original:
        "    expect(branchIn(checkout(path.join(scratch('norecord'), 'safety.viz')))).toBe(null);",
      replacement:
        "    expect(branchIn(checkout(path.join(scratch('norecord'), 'study.viz')))).toBe(null);",
      reason: why('installer')
    },
    {
      original: "      checkout(path.join(cwd, 'safety.viz'), {",
      replacement: "      checkout(path.join(cwd, 'study.viz'), {",
      reason: why('installer')
    }
  ],
  'tests/unit/site/demo-app-page.test.js': [
    {
      original:
        "    bundle: 'safety.viz-app.js',\n" +
        "    download: 'safety.viz-app.html',\n" +
        "    repoUrl: 'https://github.com/jwildfire/safety.viz'",
      replacement:
        "    bundle: 'study.viz-app.js',\n" +
        "    download: 'study.viz-app.html',\n" +
        "    repoUrl: 'https://github.com/jwildfire/study.viz'",
      reason: why('files', 'repo')
    },
    {
      original: "    expect(html).toContain('<title>safety.viz demo</title>');",
      replacement: "    expect(html).toContain('<title>study.viz demo</title>');",
      reason: why('title')
    },
    {
      original:
        '    expect(html).toContain(\'<script src="./safety.viz-app.js"></script>\');\n' +
        '    expect(html).toContain("demo: { base: \'./\' }");\n' +
        "    expect(html.indexOf('safety.viz-app.js')).toBeLessThan(html.indexOf('SafetyVizApp.mount'));",
      replacement:
        '    expect(html).toContain(\'<script src="./study.viz-app.js"></script>\');\n' +
        '    expect(html).toContain("demo: { base: \'./\' }");\n' +
        "    expect(html.indexOf('study.viz-app.js')).toBeLessThan(html.indexOf('SafetyVizApp.mount'));",
      reason: why('files')
    },
    {
      original:
        '    expect(html).toContain("github: \'https://github.com/jwildfire/safety.viz\'");',
      replacement:
        '    expect(html).toContain("github: \'https://github.com/jwildfire/study.viz\'");',
      reason: why('repo')
    },
    {
      original: "      'https://github.com/jwildfire/safety.viz'",
      replacement: "      'https://github.com/jwildfire/study.viz'",
      reason: why('repo')
    },
    {
      original:
        "      bundle: 'safety.viz-app.js',\n" +
        "      download: 'safety.viz-app.html',\n" +
        "      repoUrl: 'https://github.com/jwildfire/safety.viz',\n" +
        '      libraries: APP_LIBRARIES,',
      replacement:
        "      bundle: 'study.viz-app.js',\n" +
        "      download: 'study.viz-app.html',\n" +
        "      repoUrl: 'https://github.com/jwildfire/study.viz',\n" +
        '      libraries: APP_LIBRARIES,',
      reason: why('files', 'repo')
    },
    {
      original:
        "      bundle: 'safety.viz-app.js',\n" +
        "      download: 'safety.viz-app.html',\n" +
        "      repoUrl: 'https://github.com/jwildfire/safety.viz',\n" +
        "      libraries: [{ name: 'bio.viz', global: 'BioViz', file: 'bio.viz.js' }],",
      replacement:
        "      bundle: 'study.viz-app.js',\n" +
        "      download: 'study.viz-app.html',\n" +
        "      repoUrl: 'https://github.com/jwildfire/study.viz',\n" +
        "      libraries: [{ name: 'bio.viz', global: 'BioViz', file: 'bio.viz.js' }],",
      reason: why('files', 'repo')
    },
    {
      original: '    const app = page.indexOf(\'<script src="./safety.viz-app.js"></script>\');',
      replacement: '    const app = page.indexOf(\'<script src="./study.viz-app.js"></script>\');',
      reason: why('files')
    },
    {
      original: '    expect(html).toContain("download: \'./safety.viz-app.html\'");',
      replacement: '    expect(html).toContain("download: \'./study.viz-app.html\'");',
      reason: why('files')
    },
    {
      original:
        "      bundle: 'safety.viz-app.js',\n" +
        "      download: 'safety.viz-app.html',\n" +
        "      repoUrl: 'https://github.com/jwildfire/safety.viz'",
      replacement:
        "      bundle: 'study.viz-app.js',\n" +
        "      download: 'study.viz-app.html',\n" +
        "      repoUrl: 'https://github.com/jwildfire/study.viz'",
      reason: why('files', 'repo')
    }
  ],
  'tests/unit/site/favicon.test.js': [
    {
      original:
        "      bundle: 'safety.viz-app.js',\n" +
        "      download: 'safety.viz-app.html',\n" +
        "      repoUrl: 'https://github.com/jwildfire/safety.viz'",
      replacement:
        "      bundle: 'study.viz-app.js',\n" +
        "      download: 'study.viz-app.html',\n" +
        "      repoUrl: 'https://github.com/jwildfire/study.viz'",
      reason: why('files', 'repo')
    }
  ]
};
for (const [file, changes] of Object.entries(RENAMED)) {
  COPIED.changes[file] = [...(COPIED.changes[file] || []), ...changes];
}
// The end of the rename.

/**
 * A file's checksum.
 * @param {Uint8Array} bytes The file's bytes.
 * @returns {string} Its SHA-256, in hex.
 */
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

// A file as its lines, and back: the file is cut at its line feeds and read
// one byte to a character, so a carriage return, or a byte that is not text,
// comes back as it went in.
const byteText = (text) => Buffer.from(text, 'utf8').toString('latin1');
const linesOf = (bytes) => Buffer.from(bytes).toString('latin1').split('\n');
const bytesOf = (lines) => Buffer.from(lines.join('\n'), 'latin1');

// Where a run of whole lines stands in a file: it must be there exactly once.
function placeOf(lines, block, said) {
  const wanted = byteText(block).split('\n');
  const found = [];
  for (let index = 0; index + wanted.length <= lines.length; index += 1) {
    if (wanted.every((line, offset) => lines[index + offset] === line)) found.push(index);
  }
  if (found.length !== 1) {
    throw new Error(
      `${said} ${JSON.stringify(block)} ${found.length === 1 ? 'is' : 'are'} there ` +
        `${found.length} times, and must be there once.`
    );
  }
  return { at: found[0], length: wanted.length };
}

const isText = (value) => typeof value === 'string' && value !== '' && !/\r/.test(value);
const isLine = (value) => isText(value) && !/\n/.test(value);
const isSwap = (change) => change && change.cut === undefined;

// A file's listed changes, each checked to be a change that can be held to:
// whole lines for others, or whole lines cut, with the reason said.
function listedChanges(changes) {
  if (!Array.isArray(changes) || !changes.length) {
    throw new Error('no changes are listed where the file is said to be changed.');
  }
  for (const change of changes) {
    const { original, replacement, cut, reason } = change || {};
    if (cut !== undefined) {
      if (!cut || !isLine(cut.from) || !isLine(cut.to)) {
        throw new Error('A listed cut needs its first line and its last, each one whole line.');
      }
    } else if (!isText(original) || !isText(replacement) || original === replacement) {
      throw new Error('A listed change needs the lines as they were, and others as they are.');
    }
    if (typeof reason !== 'string' || !reason.trim()) {
      throw new Error('A listed change needs its reason.');
    }
  }
  return changes;
}

// One cut made: the lines from `from`, which must be there once, to the first
// `to` at or after it, taken out. Returns what was taken, for the record.
function cutLines(lines, { from, to }) {
  const { at } = placeOf(lines, from, 'the line');
  const end = lines.indexOf(byteText(to), at);
  if (end === -1)
    throw new Error(`the line ${JSON.stringify(to)} does not follow its cut's first.`);
  return lines.splice(at, end - at + 1);
}

/**
 * A source file with its listed changes made, in order. A swap's `original`
 * lines, which must be in the file exactly once, become its `replacement`; a
 * cut's lines are taken out. Every other byte is kept. With no changes to
 * make, the bytes as they are.
 * @param {Uint8Array} bytes The file as safety.viz holds it.
 * @param {Array<Object>} [changes] The changes, as COPIED lists them.
 * @returns {{bytes: Buffer, changes: ?Array<Object>}} The file as it is kept here, and the changes as the record lists them: a cut with how many lines it took and their checksum.
 * @throws {Error} When a change is not one this can hold to, or its lines are not there once.
 */
export function applyChanges(bytes, changes) {
  if (changes === undefined) return { bytes: Buffer.from(bytes), changes: undefined };
  const lines = linesOf(bytes);
  const recorded = listedChanges(changes).map((change) => {
    if (isSwap(change)) {
      const { at, length } = placeOf(lines, change.original, 'the lines');
      lines.splice(at, length, ...byteText(change.replacement).split('\n'));
      return change;
    }
    const taken = cutLines(lines, change.cut);
    return {
      cut: { ...change.cut, lines: taken.length, sha256: sha256(bytesOf(taken)) },
      reason: change.reason
    };
  });
  return { bytes: bytesOf(lines), changes: recorded };
}

/**
 * The other way, for a file whose changes are all swaps: the file kept here
 * with them undone, last first, which is the file safety.viz holds if nothing
 * else was changed. A cut cannot be undone from the file alone, so a file with
 * one is held by its checksum here and compared with the source itself by
 * verifyAgainstSource.
 * @param {Uint8Array} bytes The file as it is kept here.
 * @param {Array<Object>} changes The changes, as the record lists them.
 * @returns {?Buffer} The file as safety.viz holds it, or null when a change is a cut.
 * @throws {Error} When a change is not one this can hold to, or its lines are not there once.
 */
export function undoChanges(bytes, changes) {
  if (!listedChanges(changes).every(isSwap)) return null;
  const lines = linesOf(bytes);
  for (const change of [...changes].reverse()) {
    const { at, length } = placeOf(lines, change.replacement, 'the lines');
    lines.splice(at, length, ...byteText(change.original).split('\n'));
  }
  return bytesOf(lines);
}

/**
 * A record's changes as the script lists them: a cut without what was worked
 * out when it was made.
 * @param {?Array<Object>} changes The changes, as a record lists them.
 * @returns {?Array<Object>} The same, as COPIED would list them.
 */
export const asListed = (changes) =>
  Array.isArray(changes)
    ? changes.map((change) =>
        isSwap(change)
          ? change
          : { cut: { from: change.cut.from, to: change.cut.to }, reason: change.reason }
      )
    : changes;

/**
 * The files to copy, in the record's order: every file of each folder, then
 * the single files, less the ones left behind, each once and sorted by path.
 * @param {Object} copied What is copied: COPIED.
 * @param {(folder: string) => string[]} list Every file under a folder at the commit, as paths from the repository's root.
 * @returns {string[]} The paths.
 * @throws {Error} When a folder has no files, or a file left behind or changed is not one of the folders' files.
 */
export function filesToCopy(copied, list) {
  const all = new Set();
  for (const folder of copied.folders) {
    const found = list(folder);
    if (!found.length) throw new Error(`${folder}: the commit has no files under it.`);
    found.forEach((file) => all.add(file));
  }
  for (const file of Object.keys(copied.left)) {
    if (!all.delete(file)) throw new Error(`${file}: left behind, but no copied folder holds it.`);
  }
  copied.files.forEach((file) => all.add(file));
  for (const file of Object.keys(copied.changes)) {
    if (!all.has(file))
      throw new Error(`${file}: a change is listed for it, but it is not copied.`);
  }
  return [...all].sort();
}

/**
 * The record for files as they were read from the commit.
 * @param {Object} options
 * @param {Object} options.copied What is copied: COPIED.
 * @param {string[]} options.files The paths to copy, as filesToCopy gives them.
 * @param {(file: string) => Uint8Array} options.read The bytes of one path at the commit.
 * @param {Object} [options.more] What else to record, after the commit: safety.viz's version, whether the commit is on its dev branch.
 * @returns {{record: Object, contents: Array<{file: string, bytes: Buffer}>}} The record, and the bytes to write.
 * @throws {Error} When a file's change cannot be made: its lines are not in the source exactly once.
 */
export function buildRecord({ copied, files, read, more = {} }) {
  if (!/^[0-9a-f]{40}$/.test(copied.commit || '')) {
    throw new Error(`A source record needs the full 40-character commit, not "${copied.commit}".`);
  }
  const contents = files.map((file) => {
    const theirs = Buffer.from(read(file));
    try {
      return { file, theirs, ...applyChanges(theirs, copied.changes[file]) };
    } catch (error) {
      throw new Error(`${file}: ${error.message}`);
    }
  });
  return {
    record: {
      [copied.label]: copied.name,
      repository: copied.repository,
      commit: copied.commit,
      ...more,
      left: Object.entries(copied.left).map(([file, reason]) => ({ file, reason })),
      files: contents.map(({ file, theirs, changes, bytes }) => ({
        file,
        sha256: sha256(bytes),
        bytes: bytes.length,
        ...(changes === undefined
          ? {}
          : { source_sha256: sha256(theirs), source_bytes: theirs.length, changes })
      }))
    },
    contents
  };
}

/**
 * Write the files exactly as given, each at its path under the repository's
 * root, and the record at the root.
 * @param {string} rootDir The repository's root.
 * @param {{record: Object, contents: Array}} copy What buildRecord returned.
 * @returns {void}
 */
export function writeCopied(rootDir, { record, contents }) {
  for (const { file, bytes } of contents) {
    mkdirSync(path.dirname(path.join(rootDir, file)), { recursive: true });
    writeFileSync(path.join(rootDir, file), bytes);
  }
  writeFileSync(path.join(rootDir, RECORD_FILE), `${JSON.stringify(record, null, 2)}\n`);
}

/**
 * Read the record.
 * @param {string} rootDir The repository's root.
 * @returns {Object} The record.
 */
export function readRecord(rootDir) {
  return JSON.parse(readFileSync(path.join(rootDir, RECORD_FILE), 'utf8'));
}

// What is wrong with a changed file's own record, the file being the one its
// checksum names: its swaps, undone, must give the source file the record
// names. An empty list means the file is that source with those changes alone.
// A file with a cut is not asked: see undoChanges.
function changeProblems(entry, bytes) {
  let theirs;
  try {
    theirs = undoChanges(bytes, entry.changes);
  } catch (error) {
    return [`${entry.file}: its recorded change cannot be undone: ${error.message}`];
  }
  if (!/^[0-9a-f]{64}$/.test(entry.source_sha256 || '') || !Number.isInteger(entry.source_bytes)) {
    return [`${entry.file}: the record does not name the source file it was changed from.`];
  }
  if (theirs === null) return [];
  if (sha256(theirs) === entry.source_sha256 && theirs.length === entry.source_bytes) return [];
  return [
    `${entry.file}: with its recorded change undone, it is not the source file the record names ` +
      `(recorded ${String(entry.source_sha256).slice(0, 12)}…, found ${sha256(theirs).slice(0, 12)}…).`
  ];
}

/**
 * Every way the copied files and the record disagree; an empty list means
 * every recorded file is present and unchanged. A file the record says is
 * changed from its source must also be that source with the recorded changes
 * and no other. It never passes by comparing nothing.
 * @param {string} rootDir The repository's root.
 * @returns {string[]} The problems, each a sentence.
 */
export function verifyCopied(rootDir) {
  if (!existsSync(path.join(rootDir, RECORD_FILE))) {
    return [`${RECORD_FILE} is missing: the copied files have no source record.`];
  }
  let record;
  try {
    record = readRecord(rootDir);
  } catch (error) {
    return [`${RECORD_FILE} cannot be read: ${error.message}`];
  }
  const problems = [];
  if (!/^[0-9a-f]{40}$/.test(record.commit || '')) {
    problems.push(`${RECORD_FILE} does not name the full commit the files were copied from.`);
  }
  if (typeof record.repository !== 'string' || !record.repository) {
    problems.push(`${RECORD_FILE} does not name the repository the files were copied from.`);
  }
  const files = Array.isArray(record.files) ? record.files : [];
  if (!files.length) problems.push(`${RECORD_FILE} records no files.`);
  const seen = new Set();
  for (const entry of files) {
    const name = String(entry.file);
    if (seen.has(name)) problems.push(`${name}: recorded twice.`);
    seen.add(name);
    // A record names files inside the repository, and nowhere else.
    if (path.isAbsolute(name) || name.split('/').includes('..')) {
      problems.push(`${name}: not a path inside the repository.`);
      continue;
    }
    const file = path.join(rootDir, name);
    if (!existsSync(file)) {
      problems.push(`${name}: recorded, but the file is missing.`);
      continue;
    }
    const bytes = readFileSync(file);
    if (sha256(bytes) !== entry.sha256) {
      problems.push(
        `${name}: the file no longer matches its recorded checksum ` +
          `(recorded ${String(entry.sha256).slice(0, 12)}…, found ${sha256(bytes).slice(0, 12)}…).`
      );
    } else if (bytes.length !== entry.bytes) {
      problems.push(`${name}: ${bytes.length} bytes, and the record says ${entry.bytes}.`);
    } else if (entry.changes !== undefined) {
      problems.push(...changeProblems(entry, bytes));
    }
  }
  return problems;
}

/**
 * The check of what a record may say: its commit and repository must be the
 * ones the script names, the files it lists must be the files the script
 * copies, and the changes it lists for a file must be the ones the script
 * lists for it, word for word. So a line changed in a copied file cannot be
 * passed by writing it into the record.
 * @param {Object} record The record.
 * @param {Object} copied What is copied, as the script declares it: COPIED.
 * @returns {string[]} The problems, each a sentence.
 */
export function verifyDeclared(record, copied) {
  const problems = [];
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (record.commit !== copied.commit) {
    problems.push(
      `${RECORD_FILE} names the commit ${record.commit}, and the script copies from ${copied.commit}.`
    );
  }
  if (record.repository !== copied.repository) {
    problems.push(
      `${RECORD_FILE} names ${record.repository}, and the script copies from ${copied.repository}.`
    );
  }
  const files = Array.isArray(record.files) ? record.files : [];
  const under = (file) =>
    copied.files.includes(file) ||
    (copied.folders.some((folder) => file.startsWith(`${folder}/`)) && !(file in copied.left));
  for (const entry of files) {
    if (!under(entry.file)) {
      problems.push(`${entry.file}: ${RECORD_FILE} lists it, and the script does not copy it.`);
    } else if (!same(asListed(entry.changes), copied.changes[entry.file])) {
      problems.push(
        copied.changes[entry.file] === undefined
          ? `${entry.file}: ${RECORD_FILE} lists a change to it, and the script lists none.`
          : `${entry.file}: ${RECORD_FILE} does not list the change the script lists for it, as it lists it.`
      );
    }
  }
  const recorded = new Set(files.map((entry) => entry.file));
  for (const file of [...copied.files, ...Object.keys(copied.changes)]) {
    if (!recorded.has(file)) {
      problems.push(`${file}: the script copies it, and ${RECORD_FILE} does not list it.`);
    }
  }
  for (const folder of copied.folders) {
    if (!files.some((entry) => entry.file.startsWith(`${folder}/`))) {
      problems.push(`${folder}: the script copies it, and ${RECORD_FILE} lists no file of it.`);
    }
  }
  const left = Object.entries(copied.left).map(([file, reason]) => ({ file, reason }));
  if (!same(record.left || [], left)) {
    problems.push(`${RECORD_FILE} does not list the files left behind as the script lists them.`);
  }
  return problems;
}

/**
 * The second check, against the source itself: the recorded files are exactly
 * the files the script copies from the commit, and each equals the bytes
 * safety.viz holds there, with the file's recorded changes made to them if it
 * has any.
 * @param {string} rootDir The repository's root.
 * @param {Object} copied What is copied: COPIED.
 * @param {Object} source How to read the commit.
 * @param {(folder: string) => Promise<string[]>|string[]} source.list Every file under a folder at the commit.
 * @param {(file: string) => Promise<Uint8Array>|Uint8Array} source.read The bytes of one path at the commit.
 * @returns {Promise<string[]>} The problems, each a sentence.
 */
export async function verifyAgainstSource(rootDir, copied, { list, read }) {
  const record = readRecord(rootDir);
  const at = `at ${record.commit.slice(0, 7)} of ${record.repository}`;
  const problems = [];
  const listed = new Map();
  for (const folder of copied.folders) listed.set(folder, await list(folder));
  let wanted;
  try {
    wanted = filesToCopy(copied, (folder) => listed.get(folder));
  } catch (error) {
    return [error.message];
  }
  const recorded = new Set((record.files || []).map((entry) => entry.file));
  for (const file of wanted) {
    if (!recorded.has(file)) problems.push(`${file}: ${at}, and not in ${RECORD_FILE}.`);
  }
  for (const entry of record.files || []) {
    if (!wanted.includes(entry.file)) {
      problems.push(`${entry.file}: in ${RECORD_FILE}, and not among the files copied ${at}.`);
      continue;
    }
    let theirs = Buffer.from(await read(entry.file));
    try {
      theirs = applyChanges(theirs, asListed(entry.changes)).bytes;
    } catch (error) {
      problems.push(`${entry.file}: ${at} does not take its recorded change: ${error.message}`);
      continue;
    }
    const file = path.join(rootDir, entry.file);
    const ours = existsSync(file) ? readFileSync(file) : null;
    if (!ours || !ours.equals(theirs)) {
      problems.push(
        `${entry.file}: differs from the file ${at}` +
          `${entry.changes === undefined ? '' : ', with its recorded changes made'}.`
      );
    }
  }
  if (!(record.files || []).length) problems.push(`${RECORD_FILE} records no files.`);
  return problems;
}
