import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js'],
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
