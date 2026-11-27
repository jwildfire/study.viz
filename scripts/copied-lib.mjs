// What study.viz began as: the demo app of jwildfire/safety.viz, copied out of
// one commit with a record (obot.roadmap#440). The record, SOURCE.json at the
// root of the repository, names that commit and lists every copied file with
// its checksum and size. `verifyCopied` is the check that fails when a file and
// the record no longer agree, `verifyDeclared` when the record and this script
// do not, and `verifyNothingElse` when a file under a copied folder is in
// neither. None of the three reads safety.viz: a file changed together with
// its entry in the record passes them. `verifyAgainstSource` compares each
// file with the commit itself, and is the check that catches that.
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
// were and as they are; and whole lines cut, listed by where the cut starts
// and where it stops. Both checks then hold the file to its source with those changes
// made, and to nothing else. A change cannot be passed by writing it into the
// record: it has to be listed here, where it is reviewed.
//
// Pure functions over bytes and a folder; scripts/copied.mjs is the command
// line.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
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
 *   own       files under a copied folder that are study.viz's own and were
 *             never in safety.viz at the commit, each with why: the only
 *             other files a copied folder may hold
 *   changes   file → what differs here, in the order it is done, each with why:
 *             { original, replacement, reason }   lines swapped for others; each
 *                                                 is one or more whole lines
 *             { cut: { from, to }, reason }       lines cut, from the first line
 *                                                 of `from` to the last of `to`
 *             { cut: { from, before }, reason }   lines cut, from the first line
 *                                                 of `from` to the line before
 *                                                 `before`, or to the end of the
 *                                                 file when `before` is null
 *             Each of `original`, `from`, `to` and `before` is one or more
 *             whole lines that stand in the file exactly once.
 */
export const COPIED = {
  name: 'safety.viz’s demo app, as study.viz began',
  label: 'copy',
  repository: 'https://github.com/jwildfire/safety.viz',
  // The head of safety.viz's dev branch when the copy was last made: the commit
  // that redrew safety.viz's stored pictures (safety.viz#420) after the fixes
  // the review of study.viz's v0.1.0 release candidate asked for
  // (safety.viz#411, #413, #414, #415 and #419; study.viz#26). It prepares
  // safety.viz 1.13.0, which is not released there yet.
  commit: '9e49f5f886eb85261ee24b969846415e2a28af76',
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
    'scripts/r-wasm',
    // The pictures the app's browser tests are compared with on the Linux
    // runner, and the measurements they wrote there.
    'docs/evidence/basic-app'
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
    'site/config.json',
    // The builds: the app bundle and the single file, the libraries they
    // carry, the app's directory and its page, and the demo on a reader's own
    // machine.
    'scripts/build-app.mjs',
    'scripts/app-libraries.mjs',
    'scripts/builder-lib.mjs',
    'scripts/tiers.mjs',
    'scripts/demo-app.mjs',
    'scripts/site-lib.mjs',
    'scripts/demo.mjs',
    'scripts/demo-server.mjs',
    'scripts/install-demo.mjs',
    // The browser tests of the app, their pages and their configuration.
    'tests/e2e/basic-app.spec.js',
    'tests/e2e/local-demo.spec.js',
    'tests/e2e/rbqm-pipeline.spec.js',
    'tests/e2e/smoke.spec.js',
    'tests/e2e/evidence.js',
    'tests/e2e/fixtures/basic-app.html',
    'tests/e2e/fixtures/basic-app-library.html',
    'tests/e2e/fixtures/rbqm-pipeline.html',
    'tests/e2e/fixtures/r-wasm.html',
    'tests/demo-path/demo-path.spec.js',
    'playwright.config.js',
    'playwright.demo-path.config.js',
    // The app's requirement matrix: the APP-* rows its tests are named for.
    'requirements/demo-app.md'
  ],
  left: {
    ...Object.fromEntries(
      [
        '01-opens-on-the-pilot-study',
        '02-a-chart-is-opened',
        '03-the-apps-status-label',
        '04-an-experimental-charts-label',
        '05-a-statistic-from-r',
        '06-rbqm-on-the-pilot-study',
        '07-the-rbqm-demo-study-on-the-data-tab',
        '08-rbqm-eight-metrics',
        '09-one-metrics-page'
      ].map((step) => [
        `docs/evidence/basic-app/demo-path/${step}.png`,
        'A screenshot a walk of safety.viz’s published demo wrote. The walk writes its ' +
          'screenshots here each time it runs (npm run demo-path), so a copy would change ' +
          'under the record at the first walk.'
      ])
    ),
    // The pictures the app's browser tests are compared with on the Linux
    // runner. They are study.viz's own from the start: study.viz's own run on
    // that runner draws them (the "Update evidence baselines" workflow), so a
    // copy would change under the record at the first redraw. Most show the
    // app's name, which is study.viz here; a few do not, and were the same
    // bytes as safety.viz's when the copy was made. The three files of
    // measurements beside them stay copied.
    ...Object.fromEntries(
      [
        'APP-BIO-015-trend-tiles',
        'APP-BIO-016-over-time',
        'APP-BIO-018-cross-tabulation',
        'APP-LIB-037-tab-colours',
        'APP-LOAD-004-mapping-table',
        'APP-LOAD-007-renamed-study-chart',
        'APP-LOAD-017-sidebar',
        'APP-NOTE-003-information-note',
        'APP-NOTE-003-warning-note',
        'APP-PAGE-002-demo-study',
        'APP-PAGE-040-phone-header-rbqm',
        'APP-PAGE-044-first-screen',
        'APP-R-018-r-did-not-start',
        'APP-R-051-r-control-off',
        'APP-R-051-r-control-ready-details',
        'APP-R-052-r-control-390-details',
        'APP-R-052-r-control-390-off',
        'APP-R-053-rbqm-r-host-blocked',
        'APP-R-054-rbqm-back-with-no-panel-1280',
        'APP-R-060-r-note-information-1280',
        'APP-R-060-r-note-warning-1280',
        'APP-R-060-r-note-warning-biomarker-screen-1280',
        'APP-R-061-r-note-failed-1280',
        'APP-R-061-r-note-starting-1280',
        'APP-R-062-r-note-gone-when-ready-1280',
        'APP-R-063-r-note-info-390',
        'APP-R-063-r-note-warning-390',
        'APP-R-063-rbqm-note-390',
        'APP-RBQM-019-rbqm-tab-running',
        'APP-RBQM-020-rbqm-metric',
        'APP-RBQM-020-rbqm-tab',
        'APP-RBQM-022-metric-did-not-run',
        'APP-RBQM-022-metric-did-not-run-1280',
        'APP-RBQM-023-rbqm-charts-390',
        'APP-RBQM-023-rbqm-tab-390',
        'APP-RBQM-024-rbqm-r-did-not-start',
        'APP-RBQM-036-own-files-390',
        'APP-RBQM-036-own-files-before-r',
        'APP-RBQM-036-own-files-two',
        'APP-RBQM-046-pilot-before-r',
        'APP-RBQM-046-pilot-overview',
        'APP-RBQM-046-pilot-run-details',
        'APP-RBQM-046-pilot-tab',
        'APP-RBQM-046-pilot-tab-390',
        'APP-RBQM-070-overview-fitted-pilot',
        'APP-RBQM-070-overview-fitted-rbqm',
        'APP-RBQM-071-rbqm-row-before-r',
        'APP-RBQM-071-rbqm-row-pilot',
        'APP-RBQM-071-rbqm-row-rbqm',
        'APP-RBQM-073-rbqm-after-run-1280',
        'APP-RBQM-073-rbqm-before-r-1280',
        'APP-RBQM-073-rbqm-run-details-1280',
        'APP-RBQM-075-mixed-drop-1280',
        'APP-RBQM-076-own-files-1280',
        'APP-RBQM-076-own-files-390',
        'APP-RBQM-076-pilot-study-1280',
        'APP-RBQM-076-pilot-study-390',
        'APP-RBQM-076-pilot-study-after-run',
        'APP-RBQM-076-rbqm-study-1280',
        'APP-RBQM-076-rbqm-study-390',
        'APP-RBQM-080-rbqm-footnote',
        'APP-RBQM-082-rbqm-note-starting-1280',
        'APP-RBQM-082-rbqm-note-warning-1280',
        'APP-TIER-014-app-label-panel',
        'APP-TIER-016-phone-app-label-panel',
        'APP-TIER-021-chart-label-panel',
        'APP-TIER-022-phone-chart-label-panel'
      ].map((picture) => [
        `docs/evidence/basic-app/${picture}.png`,
        'A picture the browser tests are compared with on the Linux runner. study.viz’s own ' +
          'run on that runner draws it (the “Update evidence baselines” workflow), so it is ' +
          'study.viz’s own from the start and a copy would change under the record at the ' +
          'first redraw. Most of these pictures show the app’s name, which is study.viz here.'
      ])
    )
  },
  // No file under a copied folder is study.viz's own today: its own files sit
  // beside the copied ones (scripts/, tests/unit/repo/, src/main.js and the
  // rest), not among them. A file added under a copied folder is listed here by
  // its path, with why it is study.viz's and not safety.viz's; a pattern would
  // let in a file nobody listed.
  own: {},
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
    // The app's footer names two versions: the app's own, which is study.viz's
    // from package.json, and the safety.viz version of the charts it carries. In
    // safety.viz one version was both; here the charts' is the copied bundle's.
    'scripts/build-app.mjs': [
      {
        original: "import { RBQM_TAB } from './rbqm-lib.mjs';",
        replacement:
          "import { RBQM_TAB } from './rbqm-lib.mjs';\n" +
          "import { chartsVersion } from './safety-viz-lib.mjs';",
        reason: 'The version of the copied safety.viz bundle, from its record.'
      },
      {
        original:
          "const { version } = JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf8'));",
        replacement:
          '// The app’s footer names two versions. The app’s own is study.viz’s, from package.json. The\n' +
          '// chart library’s is the copied safety.viz bundle’s, from its record\n' +
          '// (scripts/safety-viz-lib.mjs).\n' +
          'const { version: appVersion } = JSON.parse(\n' +
          "  readFileSync(path.join(rootDir, 'package.json'), 'utf8')\n" +
          ');\n' +
          'const version = chartsVersion();',
        reason:
          'The footer says "study.viz" and the app’s own version, then "safety.viz" and the ' +
          'version of the charts. package.json here is study.viz’s, so its version is the first. ' +
          'The record of the copied bundle names the safety.viz version the charts are.'
      },
      {
        original:
          "  // The version shown in the app's footer.\n" +
          '  define: { __SAFETY_VIZ_VERSION__: JSON.stringify(version) },',
        replacement:
          "  // The versions shown in the app's footer: the chart library's, and the app's own.\n" +
          '  define: {\n' +
          '    __SAFETY_VIZ_VERSION__: JSON.stringify(version),\n' +
          '    __STUDY_VIZ_VERSION__: JSON.stringify(appVersion)\n' +
          '  },',
        reason:
          'A second value built into the bundle: study.viz’s own version, for the footer. The ' +
          'first keeps its name and is still the safety.viz version of the charts.'
      }
    ],
    // The docs-site generators stay in safety.viz with the docs site: the chart
    // gallery, each chart's pages, the API reference, the evidence pages, the
    // guides, the Domains page and the shell they are written through. What is
    // kept is the demo app's page, its typefaces, the count words its
    // description uses and the check of internal links.
    'scripts/site-lib.mjs': [
      {
        original:
          '// Docs-site generators (#7): pure functions scripts/site.mjs assembles into\n' +
          '// _site/. Plain Node, no framework, per design #21 — and every internal URL\n' +
          '// relative, so one build serves the site root, /dev/, and /pr/{N}/ unchanged.',
        replacement:
          '// Site generators: pure functions scripts/site.mjs and scripts/demo-app.mjs\n' +
          '// assemble into _site/. Plain Node, no framework, and every internal URL\n' +
          '// relative, so one build serves the site root, /dev/, and /pr/{N}/ unchanged.\n' +
          '// This is the demo half of safety.viz’s scripts/site-lib.mjs: the docs-site\n' +
          '// generators stay in safety.viz (scripts/copied-lib.mjs lists what was cut).',
        reason: 'The file’s opening comment said it held the docs-site generators.'
      },
      {
        cut: {
          from: "import { tierNoteOf, tierOf } from '../src/tiers.js';",
          to: "import { TIER_MEANINGS, statusHeading, statusLabelHtml } from '../src/status-label.js';"
        },
        reason: 'Read only by the docs-site generators cut below.'
      },
      {
        cut: {
          from: '// Minimal inline-markdown renderer for the subset the coverage docs use:',
          before: '// A count as a reader would write it in a sentence: a word up to twenty, and'
        },
        reason:
          'The markdown renderer, the coverage-table reader and the evidence page: the docs ' +
          'site’s, which stays in safety.viz.'
      },
      {
        cut: {
          from: "// The home page's description, for search engines and link previews (#286).",
          before:
            '/**\n' + " * The demo app's typefaces (#165): the font files its page declares, served"
        },
        reason:
          'The chart gallery, the About and Architecture pages, the API reference, the kit page ' +
          'and each chart’s demo page: the docs site’s, which stays in safety.viz.'
      },
      {
        cut: {
          from: "// Build the guide's on-page table of contents from its ## sections and their",
          before: 'function walkHtmlFiles(dir) {'
        },
        reason:
          'The clinical guide page, the Domains page, the published manifest, the gallery ' +
          'navigation and the docs shell: the docs site’s, which stays in safety.viz.'
      },
      {
        cut: {
          from:
            '\n' + '// Build validation (#7): every screenshot evidence.json references must exist',
          before: null
        },
        reason: 'The check of evidence screenshots: the evidence pages stay in safety.viz.'
      }
    ],
    // The tests of the site build keep what is about the demo app's page and
    // the link check, and lose what is about the docs site.
    'tests/unit/site/demo-app-page.test.js': [
      {
        original:
          'import {\n' +
          '  DEMO_APP_FONTS,\n' +
          '  publishDemoAppFonts,\n' +
          '  renderDemoAppPage,\n' +
          '  renderShell\n' +
          "} from '../../../scripts/site-lib.mjs';",
        replacement:
          'import {\n' +
          '  DEMO_APP_FONTS,\n' +
          '  publishDemoAppFonts,\n' +
          '  renderDemoAppPage\n' +
          "} from '../../../scripts/site-lib.mjs';",
        reason: 'renderShell writes the docs site’s pages, and stays in safety.viz.'
      },
      {
        cut: {
          from: "// The docs site's header sets the app's link apart (#172): it is the one entry",
          before: "// Each chart's own pages (#246): the footnote under a chart in the app links"
        },
        reason:
          'Two tests, both named APP-PAGE-029, of the Demo app link in the docs site’s header: ' +
          'they read site/shell.html and site/site.css, which stay in safety.viz.'
      },
      {
        original:
          "  it('APP-PAGE-031: every address of a safety chart is a page the site build writes: its renderer is available, and its guide is a file in docs/guides/ (#246)', () => {",
        replacement:
          "  it('APP-PAGE-031: every address of a safety chart is a page safety.viz’s site build writes: its renderer is available (#246)', () => {",
        reason:
          'The chart pages and the guides in docs/guides/ are safety.viz’s. The name no longer ' +
          'claims the guide file is checked: see the next change.'
      },
      {
        original:
          '      if (links[module].guide) {\n' +
          "        expect(existsSync(path.join(rootDir, 'docs/guides', renderer(module).guide)), module).toBe(\n" +
          '          true\n' +
          '        );\n' +
          '      }',
        replacement:
          '      // That a chart’s guide is a file in docs/guides/ is held in safety.viz, where the\n' +
          '      // guides are.',
        reason:
          'One assertion, that each guide named in site/config.json is a file in docs/guides/. ' +
          'The guides stay in safety.viz, so there is no file here to look for.'
      }
    ],
    'tests/unit/site/favicon.test.js': [
      {
        cut: {
          from: "import { readFileSync } from 'node:fs';",
          to: "import { readFileSync } from 'node:fs';"
        },
        reason: 'It read site/shell.html, the docs shell, which stays in safety.viz.'
      },
      {
        original: "import { renderDemoAppPage, renderShell } from '../../../scripts/site-lib.mjs';",
        replacement: "import { renderDemoAppPage } from '../../../scripts/site-lib.mjs';",
        reason: 'renderShell writes the docs site’s pages, and stays in safety.viz.'
      },
      {
        original:
          '// One favicon for the docs site and the demo app (#270, obot.roadmap#402): the\n' +
          "// seven-hex mark the app's header carries.\n" +
          '\n' +
          "const shell = readFileSync(new URL('../../../site/shell.html', import.meta.url), 'utf8');",
        replacement:
          '// The demo app’s favicon (#270, obot.roadmap#402): the seven-hex mark the app’s\n' +
          '// header carries. That the docs site’s pages serve the same one is held in\n' +
          '// safety.viz, where the docs shell is.\n',
        reason: 'The docs shell, site/shell.html, stays in safety.viz.'
      },
      {
        original:
          "  it('APP-PAGE-039: every docs page and the demo app’s page serve the same favicon, the hex mark, as a data address that asks nothing of another file (#270)', () => {\n" +
          "    const docs = renderShell({ shell, title: 'Gallery', content: '<p>x</p>' });\n" +
          "    const deep = renderShell({ shell, title: 'Guide', content: '<p>x</p>', root: '../' });",
        replacement:
          "  it('APP-PAGE-039: the demo app’s page serves the hex mark as its favicon, as a data address that asks nothing of another file (#270)', () => {",
        reason:
          'The two docs pages are written through the docs shell, which stays in safety.viz. The ' +
          'name says what is still held.'
      },
      {
        cut: {
          from: '    expect(iconOf(docs)).toBe(LOGO_HREF);',
          to: '    expect(iconOf(deep)).toBe(LOGO_HREF);'
        },
        reason: 'Two assertions about the docs pages’ favicon.'
      },
      {
        cut: {
          from: '    // The shell names no icon of its own, and no placeholder is left unfilled.',
          to: "    expect(docs).not.toContain('f97316');"
        },
        reason: 'Four assertions about the docs shell’s icon placeholder.'
      }
    ],
    'tests/unit/site/validate.test.js': [
      {
        original:
          "import { validateSiteLinks, validateEvidenceScreenshots } from '../../../scripts/site-lib.mjs';",
        replacement: "import { validateSiteLinks } from '../../../scripts/site-lib.mjs';",
        reason: 'The check of evidence screenshots stays in safety.viz with the evidence pages.'
      },
      {
        original:
          '// Built-in validation (#7): the site build must fail on broken internal\n' +
          '// links and on screenshots referenced in evidence.json but missing on disk.',
        replacement:
          '// Built-in validation (#7): the site build must fail on broken internal links.',
        reason: 'The comment named the check that is cut below.'
      },
      {
        cut: {
          from: "\ndescribe('site validation: evidence screenshots', () => {",
          before: null
        },
        reason:
          'One test of validateEvidenceScreenshots, which stays in safety.viz with the evidence pages.'
      }
    ],
    // The smoke test opened safety.viz's scaffold page, a placeholder from
    // before there were charts. Here it opens the site as `npm run site` builds
    // it, whose root page is the demo app.
    'tests/e2e/smoke.spec.js': [
      {
        original:
          "import { test, expect } from '@playwright/test';\n" +
          '\n' +
          "test.describe('safety.viz scaffold', () => {\n" +
          "  test('demo page loads with no console errors (#1)', async ({ page }) => {\n" +
          '    const errors = [];\n' +
          "    page.on('pageerror', (error) => errors.push(error.message));\n" +
          "    page.on('console', (msg) => {\n" +
          "      if (msg.type() === 'error') errors.push(msg.text());\n" +
          '    });\n' +
          '\n' +
          "    await page.goto('/tests/e2e/fixtures/');\n" +
          '\n' +
          "    await expect(page.locator('#scaffold-heading')).toHaveText('safety.viz scaffold');\n" +
          '    expect(errors).toEqual([]);\n' +
          '  });\n' +
          '});',
        replacement:
          "import { execSync } from 'node:child_process';\n" +
          "import { test, expect } from '@playwright/test';\n" +
          "import { SITE } from '../../src/app/site.js';\n" +
          '\n' +
          '// Site smoke: the site `npm run site` builds is the demo app, as its root\n' +
          '// page, and it must mount with no console errors and no failed request,\n' +
          '// served straight out of _site/. The build runs here so every context that\n' +
          '// runs the browser suite exercises the current tree. It is the test\n' +
          '// safety.viz’s site suite makes of the page it serves at demo/ (APP-PAGE-013),\n' +
          '// for a page with no docs site beside it.\n' +
          "test.describe('the built site', () => {\n" +
          '  test.beforeAll(() => {\n' +
          "    execSync('npm run site', { stdio: 'inherit', cwd: new URL('../..', import.meta.url) });\n" +
          '  });\n' +
          '\n' +
          "  test('the site’s root page is the demo app, mounted on the demo study with every chart of both libraries, no console errors and no failed request (#1)', async ({\n" +
          '    page\n' +
          '  }) => {\n' +
          '    const errors = [];\n' +
          "    page.on('pageerror', (error) => errors.push(error.message));\n" +
          "    page.on('console', (msg) => {\n" +
          "      if (msg.type() === 'error') errors.push(msg.text());\n" +
          '    });\n' +
          '    const failed = [];\n' +
          "    page.on('response', (response) => {\n" +
          '      if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`);\n' +
          '    });\n' +
          '\n' +
          "    await page.goto('/_site/');\n" +
          "    await page.evaluate('window.__safetyVizApp.ready');\n" +
          '\n' +
          '    // The title names the chart the app opens on.\n' +
          "    await expect(page).toHaveTitle('Histogram · study.viz demo');\n" +
          "    await expect(page.locator('.sva-count')).toHaveText(\n" +
          "      '18 of 18 charts supported by the loaded data'\n" +
          '    );\n' +
          "    await expect(page.locator('.sva-chart canvas:visible').first()).toBeVisible();\n" +
          "    await expect(page.locator('.sva-tab[data-domain=\"biomarkers\"] .sva-tab-count')).toHaveText('5');\n" +
          "    await expect(page.locator('.sva-header .sva-wordmark')).toHaveText('study.viz');\n" +
          '    // With no docs site beside it, its link to the charts’ docs leads to safety.viz’s\n' +
          '    // published site, and its source link to study.viz’s own repository; the single\n' +
          '    // file is beside it, as a download.\n' +
          "    await expect(page.locator('.sva-links a[data-link=\"docs\"]')).toHaveAttribute('href', SITE);\n" +
          '    await expect(page.locator(\'.sva-links a[data-link="github"]\')).toHaveAttribute(\n' +
          "      'href',\n" +
          "      'https://github.com/jwildfire/study.viz'\n" +
          '    );\n' +
          '    const download = page.locator(\'.sva-links a[data-link="download"]\');\n' +
          "    await expect(download).toHaveAttribute('href', './study.viz-app.html');\n" +
          "    const response = await page.request.get('/_site/study.viz-app.html');\n" +
          '    expect(response.ok()).toBe(true);\n' +
          "    expect(await response.text()).toContain('<title>study.viz demo</title>');\n" +
          '    expect(failed).toEqual([]);\n' +
          '    expect(errors).toEqual([]);\n' +
          '  });\n' +
          '});',
        reason:
          'safety.viz’s smoke test opens tests/e2e/fixtures/index.html, a placeholder page of ' +
          'the chart library’s scaffold, which is not copied. The task asks for the smoke test ' +
          'pointed at study.viz’s own site build, so it builds the site and opens its root page.'
      },
      {
        original:
          '    expect(failed).toEqual([]);\n' +
          '    expect(errors).toEqual([]);\n' +
          '  });\n' +
          '});',
        replacement:
          '    expect(failed).toEqual([]);\n' +
          '    expect(errors).toEqual([]);\n' +
          '  });\n' +
          '\n' +
          '  // The test safety.viz makes of its demo page in tests/e2e/site.spec.js, which is\n' +
          '  // not copied: here the demo app is the site’s root page, so it is made beside\n' +
          '  // the smoke test, on the one site build.\n' +
          "  test('on the site’s root page a ready-made simulated study opens from the Studies view with no R, and the Overview tab draws it with study.builder’s study view in sections: Overview, Design, Data, One participant and Reporting, with no RBQM view and no Safety view, since the app has tabs of its own for both; a view is reached through its section; at 1,400 pixels nothing of the overview runs past the page', async ({\n" +
          '    page\n' +
          '  }) => {\n' +
          '    const errors = [];\n' +
          "    page.on('pageerror', (error) => errors.push(error.message));\n" +
          "    page.on('console', (msg) => {\n" +
          "      if (msg.type() === 'error') errors.push(msg.text());\n" +
          '    });\n' +
          '    await page.setViewportSize({ width: 1400, height: 900 });\n' +
          "    await page.goto('/_site/#studies');\n" +
          "    await page.evaluate('window.__safetyVizApp.ready');\n" +
          '    // The study built on the CDISC pilot protocol: it has a protocol, snapshots\n' +
          '    // and an efficacy score, so every section study.builder has is there.\n' +
          '    const row = page.locator(\'.sva-studies-row[data-study="preset:cdisc-pilot-protocol"]\');\n' +
          '    await row.locator(\'[data-action="open"]\').click();\n' +
          "    await expect(row).toHaveAttribute('data-current', 'true');\n" +
          "    await expect(page.locator('.sva-chip-name')).toHaveText('PILOT-PROTOCOL');\n" +
          '    // No R was started: the study came whole from its file.\n' +
          "    await expect(page.locator('.sva-chip.sva-r-ready')).toHaveCount(0);\n" +
          '    await page.locator(\'.sva-item[data-view="data"]\').click();\n' +
          "    const view = page.locator('.sva-explore-body');\n" +
          "    const sections = view.locator('.sv-views [data-section]');\n" +
          "    const within = view.locator('.sv-subviews [data-view]');\n" +
          "    // Operations is One participant alone: RBQM and Safety are the app's own tabs.\n" +
          '    await expect(sections).toHaveText([\n' +
          "      'Overview',\n" +
          "      'Design',\n" +
          "      'Data',\n" +
          "      'One participant',\n" +
          "      'Reporting'\n" +
          '    ]);\n' +
          '    await expect(view.locator(\'[data-section="overview"]\')).toHaveAttribute(\n' +
          "      'aria-selected',\n" +
          "      'true'\n" +
          '    );\n' +
          '    // On the overview at 1,400 pixels, the table of how the study grew is\n' +
          '    // inside the page with the rest.\n' +
          "    const grew = view.getByText('How the study grew, snapshot by snapshot');\n" +
          '    await expect(grew).toBeVisible();\n' +
          '    expect(\n' +
          '      await page.evaluate(() => {\n' +
          '        const width = document.documentElement.clientWidth;\n' +
          '        return {\n' +
          '          wider: document.documentElement.scrollWidth - width,\n' +
          "          past: [...document.querySelectorAll('.sva-explore-body *')].filter(\n" +
          '            (element) =>\n' +
          '              element.getClientRects().length > 0 &&\n' +
          '              element.getBoundingClientRect().right > width + 0.5\n' +
          '          ).length\n' +
          '        };\n' +
          '      })\n' +
          '    ).toEqual({ wider: 0, past: 0 });\n' +
          "    // A view's tab is on the page only while its section is open.\n" +
          "    await expect(view.locator('[data-view]')).toHaveCount(0);\n" +
          '    const inside = {};\n' +
          "    for (const section of ['design', 'data', 'operations', 'reporting']) {\n" +
          '      await view.locator(`[data-section="${section}"]`).click();\n' +
          '      await expect(view.locator(`[data-section="${section}"]`)).toHaveAttribute(\n' +
          "        'aria-selected',\n" +
          "        'true'\n" +
          '      );\n' +
          '      inside[section] = await within.allTextContents();\n' +
          '    }\n' +
          '    expect(inside).toEqual({\n' +
          "      design: ['Protocol', 'Schedule'],\n" +
          "      data: ['Pipeline', 'Tables', 'Columns'],\n" +
          '      operations: [],\n' +
          "      reporting: ['Efficacy', 'Adverse events']\n" +
          '    });\n' +
          '    await view.locator(\'[data-section="data"]\').click();\n' +
          '    await view.locator(\'[data-view="tables"]\').click();\n' +
          "    await expect(view.locator('[data-view=\"tables\"]')).toHaveAttribute('aria-selected', 'true');\n" +
          '    // Where the reader was is kept when the page draws the tab again.\n' +
          '    await page.locator(\'.sva-tab[data-domain="ae"]\').click();\n' +
          '    await page.locator(\'.sva-item[data-view="data"]\').click();\n' +
          "    await expect(view.locator('[data-view=\"tables\"]')).toHaveAttribute('aria-selected', 'true');\n" +
          '    expect(errors).toEqual([]);\n' +
          '  });\n' +
          '});',
        reason:
          'safety.viz’s move of study.builder to v0.5.0 adds a browser test of the study ' +
          'view’s sections to its tests/e2e/site.spec.js, the docs site’s suite, which is ' +
          'not copied. study.viz makes the same test here, beside the smoke test and on its one ' +
          'site build: the demo app is the site’s root page, so it opens /_site/ where ' +
          'safety.viz’s opens /_site/demo/index.html. Nothing else of the test differs ' +
          '(study.viz#16).'
      }
    ],
    // The demo-path walk went to safety.viz's published dev demo unless told
    // another address. Here, told none, it walks this checkout's own site
    // build, served by a small server the configuration starts.
    'playwright.demo-path.config.js': [
      {
        original:
          "// No server is started: the address is the dev demo's, or DEMO_PATH_URL's.\n" +
          "const base = process.env.DEMO_PATH_URL || 'https://jwildfire.github.io/safety.viz/dev/demo/';",
        replacement:
          '// With DEMO_PATH_URL the walk is of the demo app at that address, and no server\n' +
          '// is started. Without it the walk is of this checkout’s own site build:\n' +
          '// `npm run demo-path` builds _site/ first, and a small server is started over\n' +
          '// it, two ports past the browser suite’s so the two can run side by side.\n' +
          'const port = Number(process.env.PW_PORT || 8099) + 2;\n' +
          'const local = `http://127.0.0.1:${port}/`;\n' +
          'const base = process.env.DEMO_PATH_URL || local;',
        reason:
          'The task asks for the demo-path test pointed at study.viz’s own site build. ' +
          'study.viz has no published site yet, and safety.viz’s dev demo is not this code.'
      },
      {
        original: "  reporter: [['list']],",
        replacement:
          "  reporter: [['list']],\n" +
          '  ...(process.env.DEMO_PATH_URL\n' +
          '    ? {}\n' +
          '    : {\n' +
          '        webServer: {\n' +
          '          command: `python3 -m http.server ${port} --directory _site`,\n' +
          '          url: local,\n' +
          '          reuseExistingServer: false,\n' +
          '          timeout: 10_000\n' +
          '        }\n' +
          '      }),',
        reason: 'The server over _site/ for a walk of this checkout’s own site build.'
      }
    ],
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
    'and are the same; desktop R’s answers are the ones it gave, untouched.',
  matrix:
    'The requirement rows say what the app does here: it is named study.viz, its wordmark ' +
    'is not a link to safety.viz’s docs, its footer names both versions, and its ' +
    'installer installs into ./study.viz. An amended row says so in its last column.',
  leak:
    'The test asks that the server never hands out package.json, by looking for the ' +
    'package’s name in the answer. The package here is study.viz, so that is the name to ' +
    'look for.'
};
const why = (...keys) => keys.map((key) => WHY[key]).join(' ');

const RENAMED = {
  'requirements/demo-app.md': [
    {
      original:
        "| APP-PAGE-018 | PAGE | The app's own parts on every view are a header and a footer; the data view alone adds a sidebar (APP-LOAD-021). The header carries the safety.viz wordmark and hex mark and says it is the demo app; the footer says what the page that mounts it does with a study, and carries the version: by default that everything runs in the browser and nothing is sent anywhere; on the hosted page that the study's data never leaves the browser and no request leaves the page unless the reader starts R; in the single file that it loads nothing. The view's name is the page's one heading, kept for screen readers and not shown. | safety.viz src/app/page.js::mountApp | unit | tests/unit/app/page.test.js | ai-reviewed | OK for human review. | A header and a footer, not a sidebar (@jwildfire, 2026-10-02): beside the chart's own controls and the participant profile, a sidebar left the chart a fifth of the screen. Amended at @jwildfire's word (#183): his choice of 2026-10-02, \"R on request\", changes what this row promised that day, and the row now says what is true. |\n" +
        '| APP-PAGE-019 | PAGE | The footer links to the docs site, the Domains page, the single file and the repository, each only where it was given an address; the single file is offered as a download. | safety.viz src/app/page.js::mountApp | unit | tests/unit/app/page.test.js | ai-reviewed | OK for human review. |  |',
      replacement:
        "| APP-PAGE-018 | PAGE | The app's own parts on every view are a header and a footer; the data view alone adds a sidebar (APP-LOAD-021). The header carries the study.viz wordmark and hex mark and says it is the demo app; the footer says what the page that mounts it does with a study, and carries the app's own version and, beside it, the safety.viz version of the charts it carries: by default that everything runs in the browser and nothing is sent anywhere; on the hosted page that the study's data never leaves the browser and no request leaves the page unless the reader starts R; in the single file that it loads nothing. The view's name is the page's one heading, kept for screen readers and not shown. | safety.viz src/app/page.js::mountApp | unit | tests/unit/app/page.test.js | ai-reviewed | OK for human review. | A header and a footer, not a sidebar (@jwildfire, 2026-10-02): beside the chart's own controls and the participant profile, a sidebar left the chart a fifth of the screen. Amended at @jwildfire's word (#183): his choice of 2026-10-02, \"R on request\", changes what this row promised that day, and the row now says what is true. Amended for study.viz (@jwildfire, 2026-11-26, obot.roadmap#440): the wordmark reads study.viz, and the footer names study.viz's version before safety.viz's. |\n" +
        "| APP-PAGE-019 | PAGE | The footer links to the charts' docs, in words that say they are safety.viz's, the Domains page, the single file and the repository, each only where it was given an address; the single file is offered as a download. | safety.viz src/app/page.js::mountApp | unit | tests/unit/app/page.test.js | ai-reviewed | OK for human review. | Amended for study.viz (@jwildfire, 2026-11-26, obot.roadmap#440): the docs link reads \"safety.viz chart docs and gallery\", because the docs are the chart library's and the app is study.viz. |",
      reason: why('matrix')
    },
    {
      original:
        "| APP-PAGE-037 | PAGE | The wordmark is a link to the docs home, with the mark and the words \"Demo app\" inside it, where the page says where the docs are; on the site's page that is the site's own home, and the app's default is the published site. It keeps the header's ink and has no underline, and nothing else in the header moves. | safety.viz src/app/page.js::mountApp; src/app/styles.js | unit; browser | tests/unit/app/wordmark-title.test.js; tests/e2e/basic-app.spec.js; tests/e2e/site.spec.js | ai-reviewed | OK for human review. | Until release 1.11 the only way back to the docs was a link in the footer. |\n" +
        "| APP-PAGE-038 | PAGE | The browser tab's title names the open view before the app's name: a chart by the name on its chip (\"Histogram · safety.viz demo\"), a library's tab by its own (\"RBQM · safety.viz demo\"), and the Data tab. It follows the address, and a destroyed app leaves the tab the app's name. | safety.viz src/app/page.js::render, viewName | unit; browser | tests/unit/app/wordmark-title.test.js; tests/e2e/basic-app.spec.js; tests/e2e/site.spec.js; tests/e2e/local-demo.spec.js | ai-reviewed | OK for human review. | So a shared screen's tab bar says where the presenter is. |",
      replacement:
        "| APP-PAGE-037 | PAGE | The wordmark reads study.viz, with the mark and the words \"Demo app\" beside it. It is not a link to the charts' docs: it is plain words, and a link only where the page that mounts the app gives the app's own home. The charts' docs are a link in the footer, named as safety.viz's, and the app's default for it is safety.viz's published site. The wordmark keeps the header's ink and has no underline, and nothing else in the header moves. | safety.viz src/app/page.js::mountApp; src/app/styles.js | unit; browser | tests/unit/app/wordmark-title.test.js; tests/e2e/basic-app.spec.js; tests/e2e/site.spec.js | ai-reviewed | OK for human review. | Until release 1.11 the only way back to the docs was a link in the footer. Amended for study.viz (@jwildfire, 2026-11-26, obot.roadmap#440): in safety.viz the wordmark led to the docs home. Here the app is study.viz, so its wordmark does not lead to safety.viz's docs, and the footer's link does. |\n" +
        "| APP-PAGE-038 | PAGE | The browser tab's title names the open view before the app's name: a chart by the name on its chip (\"Histogram · study.viz demo\"), a library's tab by its own (\"RBQM · study.viz demo\"), and the Data tab. It follows the address, and a destroyed app leaves the tab the app's name. | safety.viz src/app/page.js::render, viewName | unit; browser | tests/unit/app/wordmark-title.test.js; tests/e2e/basic-app.spec.js; tests/e2e/site.spec.js; tests/e2e/local-demo.spec.js | ai-reviewed | OK for human review. | So a shared screen's tab bar says where the presenter is. |",
      reason: why('matrix')
    },
    {
      original:
        "| APP-LOCAL-008 | LOCAL | Run with no arguments, the installer clones the latest release alone, without its history and with its files as the repository holds them, into ./safety.viz, installs what the release's lock file names, and starts the release's own demo script with the Node that ran the installer, ending as the demo ends; `--ref` names another release, `--dir` another directory, and `--port` and `--no-open` reach the demo. Run again where a checkout already is, it uses it as it is: nothing is cloned, and nothing is installed unless an earlier install did not finish. Run again with the `--ref` it was installed with, it does the same: the release named is the one installed when it is the tag of the installed version, `v` and that version, or the branch the clone's own git record names, and nothing is asked of the network to tell. A checkout is never moved to another release: `--ref` naming any other release where one already is stops the installer, which says to name another directory and changes nothing. A release's tag named over a clone of a branch other than `main` stops it too and names the branch, because such a branch holds a version both before and after its tag. A release that does not exist stops it with git's own reason and leaves no clone behind, and a release from before the demo command says so before anything is installed for it. Stopping the installer stops the demo it started. | safety.viz scripts/install-demo.mjs::parseInstallArgs, steps, isInstalled, holdsRelease, branchIn, spawnable | unit | tests/unit/local-demo/install-demo.test.js | ai-reviewed | OK for human review. | Each case is tested by running the file itself on a made-up release, a small git repository with nothing to install, so no test installs from the network; the run against the real repository, from an empty directory to the page answering, is recorded on the pull request (#214). `main` is the release branch, so it is the latest release. The independent review (#214) found the first version ignored `--ref` once a clone existed, reinstalled on every run, and left the demo running when the installer alone was stopped; each now has a test that failed when the fix was taken out. The review of the v1.9.2 release candidate (#219) found that the installer, run again with the `--ref` it was installed with, stopped and told the reader to install the release they already had; the test of that second run failed before the fix. On Windows npm is started through a shell, as one string of its own fixed arguments; that path is tested as a function and has not been run on Windows. |",
      replacement:
        "| APP-LOCAL-008 | LOCAL | Run with no arguments, the installer clones the latest release alone, without its history and with its files as the repository holds them, into ./study.viz, installs what the release's lock file names, and starts the release's own demo script with the Node that ran the installer, ending as the demo ends; `--ref` names another release, `--dir` another directory, and `--port` and `--no-open` reach the demo. Run again where a checkout already is, it uses it as it is: nothing is cloned, and nothing is installed unless an earlier install did not finish. Run again with the `--ref` it was installed with, it does the same: the release named is the one installed when it is the tag of the installed version, `v` and that version, or the branch the clone's own git record names, and nothing is asked of the network to tell. A checkout is never moved to another release: `--ref` naming any other release where one already is stops the installer, which says to name another directory and changes nothing. A release's tag named over a clone of a branch other than `main` stops it too and names the branch, because such a branch holds a version both before and after its tag. A release that does not exist stops it with git's own reason and leaves no clone behind, and a release from before the demo command says so before anything is installed for it. Stopping the installer stops the demo it started. | safety.viz scripts/install-demo.mjs::parseInstallArgs, steps, isInstalled, holdsRelease, branchIn, spawnable | unit | tests/unit/local-demo/install-demo.test.js | ai-reviewed | OK for human review. | Each case is tested by running the file itself on a made-up release, a small git repository with nothing to install, so no test installs from the network; the run against the real repository, from an empty directory to the page answering, is recorded on the pull request (#214). `main` is the release branch, so it is the latest release. The independent review (#214) found the first version ignored `--ref` once a clone existed, reinstalled on every run, and left the demo running when the installer alone was stopped; each now has a test that failed when the fix was taken out. The review of the v1.9.2 release candidate (#219) found that the installer, run again with the `--ref` it was installed with, stopped and told the reader to install the release they already had; the test of that second run failed before the fix. On Windows npm is started through a shell, as one string of its own fixed arguments; that path is tested as a function and has not been run on Windows. |",
      reason: why('matrix')
    }
  ],
  'scripts/build-app.mjs': [
    {
      original:
        '//   safety.viz-app.js     one IIFE script with the global `SafetyVizApp`, for\n' +
        "//                         the site's demo app page and the browser tests\n" +
        '//   safety.viz-app.html   the same script inlined into one HTML file that opens',
      replacement:
        '//   study.viz-app.js      one IIFE script with the global `SafetyVizApp`, for\n' +
        "//                         the site's demo app page and the browser tests\n" +
        '//   study.viz-app.html    the same script inlined into one HTML file that opens',
      reason: why('files')
    },
    {
      original:
        "export const APP_BUNDLE = 'safety.viz-app.js';\n" +
        "export const APP_HTML = 'safety.viz-app.html';",
      replacement:
        "export const APP_BUNDLE = 'study.viz-app.js';\n" +
        "export const APP_HTML = 'study.viz-app.html';",
      reason: why('files')
    },
    {
      original:
        '<meta name="description" content="The safety.viz demo app in one file: load a study, map its columns and review it in the safety and biomarker charts. It runs in this browser with no network; nothing is sent anywhere.">\n' +
        '<title>safety.viz demo</title>',
      replacement:
        '<meta name="description" content="The study.viz demo app in one file: load a study, map its columns and review it in the safety and biomarker charts. It runs in this browser with no network; nothing is sent anywhere.">\n' +
        '<title>study.viz demo</title>',
      reason: why('title', 'name')
    },
    {
      original:
        ' * @param {string} outDir The directory to write `safety.viz-app.js` (with its source map) and `safety.viz-app.html` into.',
      replacement:
        ' * @param {string} outDir The directory to write `study.viz-app.js` (with its source map) and `study.viz-app.html` into.',
      reason: why('files')
    }
  ],
  'scripts/demo-app.mjs': [
    {
      original:
        '//   safety.viz-app.js      the app bundle, with its source map\n' +
        '//   safety.viz-app.html    the single file, offered as a download',
      replacement:
        '//   study.viz-app.js       the app bundle, with its source map\n' +
        '//   study.viz-app.html     the single file, offered as a download',
      reason: why('files')
    }
  ],
  'scripts/demo.mjs': [
    {
      original: 'Builds the safety.viz demo app and serves it on this machine.',
      replacement: 'Builds the study.viz demo app and serves it on this machine.',
      reason: why('name')
    },
    {
      original: '  console.log(`\\nThe safety.viz demo app is running at ${url}`);',
      replacement: '  console.log(`\\nThe study.viz demo app is running at ${url}`);',
      reason: why('name')
    }
  ],
  'scripts/install-demo.mjs': [
    {
      original: '// The safety.viz demo app, installed and started on your own machine (#214).',
      replacement: '// The study.viz demo app, installed and started on your own machine (#214).',
      reason: why('installer')
    },
    {
      original:
        '// It checks for Node, git and npm, clones a release of safety.viz into\n' +
        "// ./safety.viz, installs what the release's lock file names, builds the demo",
      replacement:
        '// It checks for Node, git and npm, clones a release of study.viz into\n' +
        "// ./study.viz, installs what the release's lock file names, builds the demo",
      reason: why('installer')
    },
    {
      original: '//   node install-demo.mjs --ref v1.9.2 --dir my-demo --port 5050 --no-open',
      replacement: '//   node install-demo.mjs --ref v0.1.0 --dir my-demo --port 5050 --no-open',
      reason: why('installer')
    },
    {
      original:
        '/** What is installed when nothing is said: the latest release, into ./safety.viz. */\n' +
        'export const DEFAULTS = Object.freeze({\n' +
        "  dir: 'safety.viz',\n" +
        '  // `main` is the release branch: it holds the latest release.\n' +
        "  ref: 'main',\n" +
        "  repo: 'https://github.com/jwildfire/safety.viz.git',",
      replacement:
        '/** What is installed when nothing is said: the latest release, into ./study.viz. */\n' +
        'export const DEFAULTS = Object.freeze({\n' +
        "  dir: 'study.viz',\n" +
        '  // `main` is the release branch: it holds the latest release.\n' +
        "  ref: 'main',\n" +
        "  repo: 'https://github.com/jwildfire/study.viz.git',",
      reason: why('installer')
    },
    {
      original: 'Installs the safety.viz demo app into a directory and starts it on this machine.',
      replacement:
        'Installs the study.viz demo app into a directory and starts it on this machine.',
      reason: why('installer')
    },
    {
      original:
        " * @returns {'absent'|'empty'|'checkout'|'other'} Nothing; an empty directory; a safety.viz checkout; or something else, which is left alone.",
      replacement:
        " * @returns {'absent'|'empty'|'checkout'|'other'} Nothing; an empty directory; a study.viz checkout; or something else, which is left alone.",
      reason: why('installer')
    },
    {
      original: "    return name === 'safety.viz' ? 'checkout' : 'other';",
      replacement: "    return name === 'study.viz' ? 'checkout' : 'other';",
      reason: why('installer')
    },
    {
      original: '            say: `Downloading safety.viz (${options.ref}) into ${options.dir}…`,',
      replacement:
        '            say: `Downloading study.viz (${options.ref}) into ${options.dir}…`,',
      reason: why('installer')
    },
    {
      original: '      `${options.dir} already holds something that is not safety.viz.`,',
      replacement: '      `${options.dir} already holds something that is not study.viz.`,',
      reason: why('installer')
    },
    {
      original:
        '        `${options.dir} already holds safety.viz ${held.version}${from}, and it is used as it is.`,',
      replacement:
        '        `${options.dir} already holds study.viz ${held.version}${from}, and it is used as it is.`,',
      reason: why('installer')
    },
    {
      original:
        '    console.log(`safety.viz ${held.version} is already in ${options.dir}; using it.`);',
      replacement:
        '    console.log(`study.viz ${held.version} is already in ${options.dir}; using it.`);',
      reason: why('installer')
    },
    {
      original:
        '        `safety.viz ${versionIn(options.dir)}, in ${options.dir}, has no demo command: it came in v1.9.2.`,',
      replacement:
        '        `study.viz ${versionIn(options.dir)}, in ${options.dir}, has no demo command.`,',
      reason: why('installer')
    }
  ],
  'scripts/site-lib.mjs': [
    {
      original:
        '<meta name="description" content="The safety.viz demo app: load a study, check how its columns map, and review it in ${escapeHtml(charts)}. ${libraries.length ? HOSTED_DESCRIPTION : \'It runs in your browser; nothing is uploaded.\'}">\n' +
        '<title>safety.viz demo</title>',
      replacement:
        '<meta name="description" content="The study.viz demo app: load a study, check how its columns map, and review it in ${escapeHtml(charts)}. ${libraries.length ? HOSTED_DESCRIPTION : \'It runs in your browser; nothing is uploaded.\'}">\n' +
        '<title>study.viz demo</title>',
      reason: why('title', 'name')
    },
    {
      original:
        '<noscript>The safety.viz demo app needs JavaScript: it reads and draws your data in this browser.</noscript>',
      replacement:
        '<noscript>The study.viz demo app needs JavaScript: it reads and draws your data in this browser.</noscript>',
      reason: why('name')
    }
  ],
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
  'tests/e2e/basic-app.spec.js': [
    {
      original:
        '  test(\'APP-PAGE-037: the wordmark is a link to the docs home, the mark and the words "Demo app" inside it, and nothing else in the header moves (#270)\', async ({',
      replacement:
        '  test(\'APP-PAGE-037: the wordmark reads study.viz, the mark and the words "Demo app" beside it; it is not a link to the charts’ docs, which are a link in the footer named as safety.viz’s, and nothing else in the header moves (#270)\', async ({',
      reason: why('wordmark')
    },
    {
      original:
        "    const brand = page.locator('.sva-header a.sva-brand');\n" +
        "    // The harness page gives the app no addresses, so the app's own default stands: the published site.\n" +
        "    await expect(brand).toHaveAttribute('href', 'https://jwildfire.github.io/safety.viz/');\n" +
        "    await expect(brand).toHaveAttribute('title', 'safety.viz: docs and chart gallery');\n" +
        "    await expect(brand.locator('.sva-wordmark')).toHaveText('safety.viz');\n" +
        "    await expect(brand.locator('.sva-kicker')).toHaveText('Demo app');\n" +
        '    // This page has no study chip, so the words are drawn at 1,280 pixels (#416).\n' +
        "    await expect(page.locator('.sva-chip-slot')).toHaveCount(0);\n" +
        "    await expect(brand.locator('.sva-kicker')).toBeVisible();\n" +
        "    // It reads as the wordmark it was: the header's ink, not a link's underline.",
      replacement:
        '    // The harness page gives the app no home of its own, so the wordmark is plain words.\n' +
        "    const brand = page.locator('.sva-header .sva-brand');\n" +
        "    await expect(page.locator('.sva-header a.sva-brand')).toHaveCount(0);\n" +
        "    await expect(brand.locator('.sva-wordmark')).toHaveText('study.viz');\n" +
        "    await expect(brand.locator('.sva-kicker')).toHaveText('Demo app');\n" +
        '    // This page has no study chip, so the words are drawn at 1,280 pixels (#416).\n' +
        "    await expect(page.locator('.sva-chip-slot')).toHaveCount(0);\n" +
        "    await expect(brand.locator('.sva-kicker')).toBeVisible();\n" +
        "    // The charts' docs are the footer's link. The harness page gives no address\n" +
        "    // for them, so the app's own default stands: safety.viz's published site.\n" +
        '    const docs = page.locator(\'.sva-links a[data-link="docs"]\');\n' +
        "    await expect(docs).toHaveAttribute('href', 'https://jwildfire.github.io/safety.viz/');\n" +
        "    await expect(docs).toHaveText('safety.viz chart docs and gallery');\n" +
        "    // The wordmark is in the header's ink, with no underline.",
      reason: why('wordmark')
    },
    {
      original:
        "    await expect(page).toHaveTitle('Histogram · safety.viz demo');\n" +
        "    await openChart(page, 'hep-explorer');\n" +
        "    await expect(page).toHaveTitle('Hepatic Explorer · safety.viz demo');\n" +
        "    await openChart(page, 'group-comparison');\n" +
        "    await expect(page).toHaveTitle('Group comparison · safety.viz demo');\n" +
        '    await page.locator(\'.sva-tab[data-tab="rbqm"]\').click();\n' +
        "    await expect(page).toHaveTitle('RBQM · safety.viz demo');\n" +
        "    await item(page, 'data').click();\n" +
        "    await expect(page).toHaveTitle('Overview · safety.viz demo');",
      replacement:
        "    await expect(page).toHaveTitle('Histogram · study.viz demo');\n" +
        "    await openChart(page, 'hep-explorer');\n" +
        "    await expect(page).toHaveTitle('Hepatic Explorer · study.viz demo');\n" +
        "    await openChart(page, 'group-comparison');\n" +
        "    await expect(page).toHaveTitle('Group comparison · study.viz demo');\n" +
        '    await page.locator(\'.sva-tab[data-tab="rbqm"]\').click();\n' +
        "    await expect(page).toHaveTitle('RBQM · study.viz demo');\n" +
        "    await item(page, 'data').click();\n" +
        "    await expect(page).toHaveTitle('Overview · study.viz demo');",
      reason: why('title')
    },
    {
      original: "    await expect(page).toHaveTitle('QT Explorer · safety.viz demo');",
      replacement: "    await expect(page).toHaveTitle('QT Explorer · study.viz demo');",
      reason: why('title')
    },
    {
      original:
        "    expect(download.suggestedFilename()).toBe('safety-viz-mapping.json');\n" +
        "    const saved = testInfo.outputPath('safety-viz-mapping.json');",
      replacement:
        "    expect(download.suggestedFilename()).toBe('study-viz-mapping.json');\n" +
        "    const saved = testInfo.outputPath('study-viz-mapping.json');",
      reason: why('mapping')
    },
    {
      original:
        '// `npm run build:app` also writes build/app/safety.viz-app.html: the app inlined\n' +
        '// into one HTML file. It is opened here from disk, with the browser offline.\n' +
        '\n' +
        "const SINGLE_FILE = new URL('../../build/app/safety.viz-app.html', import.meta.url);",
      replacement:
        '// `npm run build:app` also writes build/app/study.viz-app.html: the app inlined\n' +
        '// into one HTML file. It is opened here from disk, with the browser offline.\n' +
        '\n' +
        "const SINGLE_FILE = new URL('../../build/app/study.viz-app.html', import.meta.url);",
      reason: why('files')
    },
    {
      original:
        "    await expect(page).toHaveTitle('Overview · safety.viz demo');\n" +
        "    await expect(page.locator('.sva-wordmark')).toHaveText('safety.viz');\n" +
        "    await expect(page.locator('.sva-kicker')).toHaveText('Demo app');\n" +
        "    await expect(page.locator('.sva-version')).toHaveText(/^safety\\.viz \\d+\\.\\d+\\.\\d+$/);\n" +
        '    // With no site around it, its links go to the published one.',
      replacement:
        "    await expect(page).toHaveTitle('Overview · study.viz demo');\n" +
        "    await expect(page.locator('.sva-wordmark')).toHaveText('study.viz');\n" +
        "    await expect(page.locator('.sva-kicker')).toHaveText('Demo app');\n" +
        "    // The footer names the app's own version, and the chart library's beside it.\n" +
        "    await expect(page.locator('.sva-version')).toHaveText(\n" +
        '      /^study\\.viz \\d+\\.\\d+\\.\\d+ · safety\\.viz \\d+\\.\\d+\\.\\d+$/\n' +
        '    );\n' +
        "    // With no site around it, its links to the charts' docs go to safety.viz's published site.",
      reason: why('version', 'wordmark', 'title')
    }
  ],
  'tests/e2e/fixtures/basic-app-library.html': [
    {
      original: '    <title>safety.viz demo app harness page with a second library</title>',
      replacement: '    <title>study.viz demo app harness page with a second library</title>',
      reason: why('title', 'name')
    },
    {
      original: '    <script src="/build/app/safety.viz-app.js"></script>',
      replacement: '    <script src="/build/app/study.viz-app.js"></script>',
      reason: why('files')
    }
  ],
  'tests/e2e/fixtures/basic-app.html': [
    {
      original: '    <title>safety.viz demo app harness page</title>',
      replacement: '    <title>study.viz demo app harness page</title>',
      reason: why('title', 'name')
    },
    {
      original: '    <script src="/build/app/safety.viz-app.js"></script>',
      replacement: '    <script src="/build/app/study.viz-app.js"></script>',
      reason: why('files')
    }
  ],
  'tests/e2e/local-demo.spec.js': [
    {
      original: '    await expect(page).toHaveTitle(/ · safety\\.viz demo$/);',
      replacement: '    await expect(page).toHaveTitle(/ · study\\.viz demo$/);',
      reason: why('title')
    },
    {
      original:
        "    await expect(download).toHaveAttribute('href', './safety.viz-app.html');\n" +
        '    const single = await page.request.get(`${base}safety.viz-app.html`);',
      replacement:
        "    await expect(download).toHaveAttribute('href', './study.viz-app.html');\n" +
        '    const single = await page.request.get(`${base}study.viz-app.html`);',
      reason: why('files')
    },
    {
      original: '      expect(response.body, path).not.toContain(\'"name": "safety.viz"\');',
      replacement: '      expect(response.body, path).not.toContain(\'"name": "study.viz"\');',
      reason: why('leak')
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
      original: '   "sha256": "d7251922739111b8eff6c6f000641285fe87a98b53c8b2117762aa40dbb828df"',
      replacement:
        '   "sha256": "c3ea4b815e8192e7270e10303a4523c61eceb7dc179cb5b581cf924195846c6b"',
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
      original: '   "sha256": "d7251922739111b8eff6c6f000641285fe87a98b53c8b2117762aa40dbb828df"',
      replacement:
        '   "sha256": "c3ea4b815e8192e7270e10303a4523c61eceb7dc179cb5b581cf924195846c6b"',
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
  'tests/unit/app/portfolio.test.js': [
    {
      original: "    name: 'safety-viz-mapping.json',",
      replacement: "    name: 'study-viz-mapping.json',",
      reason: why('mapping')
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
      const ends = cut && ['to', 'before'].filter((end) => cut[end] !== undefined);
      const end = ends && ends.length === 1 ? cut[ends[0]] : undefined;
      if (!cut || !isText(cut.from) || !(isText(end) || (ends[0] === 'before' && end === null))) {
        throw new Error(
          'A listed cut needs where it starts, and either its last lines or the lines it stops before.'
        );
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

// One cut made: the lines from the first of `from`, which must be there once,
// to the last of `to`, or to the line before `before`, or to the end of the
// file, taken out. The file's last line feed is never taken. Returns what was
// taken, for the record.
function cutLines(lines, { from, to, before }) {
  const { at } = placeOf(lines, from, 'the lines');
  let stop;
  if (to !== undefined) {
    const last = placeOf(lines, to, 'the lines');
    stop = last.at + last.length;
  } else if (before === null) {
    stop = lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;
  } else {
    stop = placeOf(lines, before, 'the lines').at;
  }
  if (stop <= at) throw new Error(`the cut from ${JSON.stringify(from)} stops before it starts.`);
  return lines.splice(at, stop - at);
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
    if (!taken.length) throw new Error('a listed cut takes nothing.');
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
    ? changes.map((change) => {
        if (isSwap(change)) return change;
        const { lines: _lines, sha256: _sha256, ...cut } = change.cut;
        return { cut, reason: change.reason };
      })
    : changes;

/**
 * The files to copy, in the record's order: every file of each folder, then
 * the single files, less the ones left behind, each once and sorted by path.
 * @param {Object} copied What is copied: COPIED.
 * @param {(folder: string) => string[]} list Every file under a folder at the commit, as paths from the repository's root.
 * @returns {string[]} The paths.
 * @throws {Error} When a folder has no files, a file left behind or changed is not one of the folders' files, or a file listed as study.viz's own is one of them.
 */
export function filesToCopy(copied, list) {
  const all = new Set();
  for (const folder of copied.folders) {
    const found = list(folder);
    if (!found.length) throw new Error(`${folder}: the commit has no files under it.`);
    found.forEach((file) => all.add(file));
  }
  for (const file of Object.keys(copied.own || {})) {
    if (all.has(file) || copied.files.includes(file)) {
      throw new Error(`${file}: listed as study.viz’s own, but the commit holds it.`);
    }
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

// Every file under a folder on disk, as paths from the root.
const walk = (rootDir, folder) =>
  existsSync(path.join(rootDir, folder))
    ? readdirSync(path.join(rootDir, folder), { withFileTypes: true }).flatMap((item) =>
        item.isDirectory() ? walk(rootDir, `${folder}/${item.name}`) : [`${folder}/${item.name}`]
      )
    : [];

/**
 * The files that are there under the given folders: every file git tracks,
 * and every file it does not track and does not ignore, that is on disk. A
 * file git ignores is one a tool wrote (.gitignore), and is not counted. Where
 * the root is not in a git checkout, or git cannot be run, every file on disk
 * under the folders is counted, since nothing says which a tool wrote.
 * @param {string} rootDir The repository's root.
 * @param {string[]} folders The folders, as paths from the root.
 * @returns {string[]} The paths from the root, sorted.
 */
export function filesPresent(rootDir, folders) {
  let listed;
  try {
    listed = execFileSync(
      'git',
      ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', ...folders],
      { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 2 ** 26 }
    )
      .split('\0')
      .filter((file) => file && existsSync(path.join(rootDir, file)));
  } catch {
    listed = folders.flatMap((folder) => walk(rootDir, folder));
  }
  return [...new Set(listed)].sort();
}

/**
 * The check that a copied folder holds nothing nobody listed: every file there
 * is in the record, or listed in the script as left behind, or listed in it as
 * study.viz's own. So a file safety.viz later deletes cannot stay here
 * unnoticed, and a file whose entry is taken out of the record is named. A
 * file listed as study.viz's own must be under a copied folder, be there, have
 * its reason, and be listed nowhere else.
 * @param {Object} record The record.
 * @param {Object} copied What is copied, as the script declares it: COPIED.
 * @param {string[]} present The files that are there under the copied folders, as filesPresent gives them.
 * @returns {string[]} The problems, each a sentence.
 */
export function verifyNothingElse(record, copied, present) {
  const problems = [];
  const recorded = new Set((Array.isArray(record.files) ? record.files : []).map((e) => e.file));
  const own = copied.own || {};
  const folderOf = (file) => copied.folders.find((folder) => file.startsWith(`${folder}/`));
  for (const file of present) {
    if (folderOf(file) && !recorded.has(file) && !(file in copied.left) && !(file in own)) {
      problems.push(
        `${file}: under ${folderOf(file)}/, which is copied whole, and neither in ${RECORD_FILE} ` +
          'nor listed in the script as left behind or as study.viz’s own.'
      );
    }
  }
  for (const [file, reason] of Object.entries(own)) {
    const said = `${file}: listed as study.viz’s own, `;
    if (!folderOf(file)) problems.push(`${said}but no copied folder holds it.`);
    else if (recorded.has(file)) problems.push(`${said}and ${RECORD_FILE} lists it as copied.`);
    else if (file in copied.left) problems.push(`${said}and as left behind.`);
    else if (typeof reason !== 'string' || !reason.trim()) problems.push(`${said}with no reason.`);
    else if (!present.includes(file)) problems.push(`${said}and it is not there.`);
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
