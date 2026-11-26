import { defineConfig, devices } from '@playwright/test';

// The keynote's demo path (#287, tests/demo-path/): one walk through a
// published demo app, apart from the browser suite of playwright.config.js.
// With DEMO_PATH_URL the walk is of the demo app at that address, and no server
// is started. Without it the walk is of this checkout’s own site build:
// `npm run demo-path` builds _site/ first, and a small server is started over
// it, two ports past the browser suite’s so the two can run side by side.
const port = Number(process.env.PW_PORT || 8099) + 2;
const local = `http://127.0.0.1:${port}/`;
const base = process.env.DEMO_PATH_URL || local;

export default defineConfig({
  testDir: './tests/demo-path',
  // Real R is downloaded twice on the path, once by each tab that uses it.
  timeout: 900_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: [['list']],
  ...(process.env.DEMO_PATH_URL
    ? {}
    : {
        webServer: {
          command: `python3 -m http.server ${port} --directory _site`,
          url: local,
          reuseExistingServer: false,
          timeout: 10_000
        }
      }),
  use: {
    baseURL: base.endsWith('/') ? base : `${base}/`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      // The size the keynote is shown at.
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1
      }
    }
  ]
});
