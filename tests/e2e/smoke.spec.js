import { execSync } from 'node:child_process';
import { test, expect } from '@playwright/test';
import { SITE } from '../../src/app/site.js';

// Site smoke: the site `npm run site` builds is the demo app, as its root
// page, and it must mount with no console errors and no failed request,
// served straight out of _site/. The build runs here so every context that
// runs the browser suite exercises the current tree. It is the test
// safety.viz’s site suite makes of the page it serves at demo/ (APP-PAGE-013),
// for a page with no docs site beside it.
test.describe('the built site', () => {
  test.beforeAll(() => {
    execSync('npm run site', { stdio: 'inherit', cwd: new URL('../..', import.meta.url) });
  });

  test('the site’s root page is the demo app, mounted on the demo study with every chart of both libraries, no console errors and no failed request (#1)', async ({
    page
  }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    const failed = [];
    page.on('response', (response) => {
      if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`);
    });

    await page.goto('/_site/');
    await page.evaluate('window.__safetyVizApp.ready');

    // The title names the chart the app opens on.
    await expect(page).toHaveTitle('Histogram · study.viz demo');
    await expect(page.locator('.sva-count')).toHaveText(
      '18 of 18 charts supported by the loaded data'
    );
    await expect(page.locator('.sva-chart canvas:visible').first()).toBeVisible();
    await expect(page.locator('.sva-tab[data-domain="biomarkers"] .sva-tab-count')).toHaveText('5');
    await expect(page.locator('.sva-header .sva-wordmark')).toHaveText('study.viz');
    // With no docs site beside it, its link to the charts’ docs leads to safety.viz’s
    // published site, and its source link to study.viz’s own repository; the single
    // file is beside it, as a download.
    await expect(page.locator('.sva-links a[data-link="docs"]')).toHaveAttribute('href', SITE);
    await expect(page.locator('.sva-links a[data-link="github"]')).toHaveAttribute(
      'href',
      'https://github.com/jwildfire/study.viz'
    );
    const download = page.locator('.sva-links a[data-link="download"]');
    await expect(download).toHaveAttribute('href', './study.viz-app.html');
    const response = await page.request.get('/_site/study.viz-app.html');
    expect(response.ok()).toBe(true);
    expect(await response.text()).toContain('<title>study.viz demo</title>');
    expect(failed).toEqual([]);
    expect(errors).toEqual([]);
  });
});
