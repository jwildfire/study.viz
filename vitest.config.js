import { configDefaults, defineConfig } from 'vitest/config';

// Unit tests that wait for a later task of the copy (obot.roadmap#440). The app comes
// across one task at a time, and each of these files reads something this commit does
// not hold yet, so it cannot pass here. Each is left out of `npm test` by name, under
// what it waits for, and the task that brings that takes its list away: by task 5 the
// list is gone and every test runs.
const WAITING = [
  // Waiting for the libraries the app carries, the demo studies and their scripts (task 4).
  'tests/unit/app/charts.test.js',
  'tests/unit/app/data-panel.test.js',
  'tests/unit/app/detect.test.js',
  'tests/unit/app/first-screen.test.js',
  'tests/unit/app/fixture.test.js',
  'tests/unit/app/gsm-workflows.test.js',
  'tests/unit/app/mapping.test.js',
  'tests/unit/app/page.test.js',
  'tests/unit/app/parse.test.js',
  'tests/unit/app/r-on-request.test.js',
  'tests/unit/app/r-wasm.test.js',
  'tests/unit/app/rbqm-files.test.js',
  'tests/unit/app/rbqm-pipeline.test.js',
  'tests/unit/app/rbqm-study.test.js',
  'tests/unit/app/rbqm-tab-run.test.js',
  'tests/unit/app/status.test.js',
  'tests/unit/app/studies.test.js',
  'tests/unit/demo-data/adsl.test.js',
  'tests/unit/demo-data/drift.test.js',
  'tests/unit/demo-data/ecg.test.js',
  'tests/unit/demo-data/visits.test.js',
  // Waiting for the build scripts, the site and its configuration’s readers (task 5).
  'tests/unit/app/biomarkers.test.js',
  'tests/unit/app/builder-view.test.js',
  'tests/unit/app/gsm-viz.test.js',
  'tests/unit/app/libraries.test.js',
  'tests/unit/app/r-wiring.test.js',
  'tests/unit/app/rbqm-view.test.js',
  'tests/unit/app/rbqm.test.js',
  'tests/unit/app/single-file.test.js',
  'tests/unit/app/tab-colours.test.js',
  'tests/unit/app/tiers.test.js',
  'tests/unit/local-demo/demo-app-dir.test.js',
  'tests/unit/local-demo/demo-cli.test.js',
  'tests/unit/local-demo/demo-server.test.js',
  'tests/unit/local-demo/install-demo.test.js',
  'tests/unit/site/demo-app-page.test.js',
  'tests/unit/site/favicon.test.js',
  'tests/unit/site/validate.test.js'
];

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js'],
    exclude: [...configDefaults.exclude, ...WAITING],
    environment: 'node',
    // Node 25 and later carry a web storage of their own, which stands in front
    // of jsdom's and is undefined without a file to keep it in: a test that
    // reads window.localStorage then fails before it tests anything
    // (APP-PAGE-044). Turned off, a test's page has jsdom's storage, as on the
    // Node 22 that CI runs.
    execArgv: ['--no-experimental-webstorage'],
    // safety.viz's bundle is loaded by Node as it stands, not passed through
    // the test runner's transform: it is one built file, and the source map
    // its last line names is deliberately not copied with it.
    server: { deps: { external: [/\/site\/vendor\/safety\.viz\/safety\.viz\.esm\.js$/] } }
  }
});
