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

  // The test safety.viz makes of its demo page in tests/e2e/site.spec.js, which is
  // not copied: here the demo app is the site’s root page, so it is made beside
  // the smoke test, on the one site build.
  test('on the site’s root page a ready-made simulated study opens from the Studies view with no R, and the Overview tab draws it with study.builder’s study view in sections: Overview, Design, Data, One participant and Reporting, with no RBQM view and no Safety view, since the app has tabs of its own for both; a view is reached through its section; at 1,400 pixels nothing of the overview runs past the page', async ({
    page
  }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/_site/#studies');
    await page.evaluate('window.__safetyVizApp.ready');
    // The study built on the CDISC pilot protocol: it has a protocol, snapshots
    // and an efficacy score, so every section study.builder has is there.
    const row = page.locator('.sva-studies-row[data-study="preset:cdisc-pilot-protocol"]');
    await row.locator('[data-action="open"]').click();
    await expect(row).toHaveAttribute('data-current', 'true');
    await expect(page.locator('.sva-chip-name')).toHaveText('PILOT-PROTOCOL');
    // No R was started: the study came whole from its file.
    await expect(page.locator('.sva-chip.sva-r-ready')).toHaveCount(0);
    await page.locator('.sva-item[data-view="data"]').click();
    const view = page.locator('.sva-explore-body');
    const sections = view.locator('.sv-views [data-section]');
    const within = view.locator('.sv-subviews [data-view]');
    // Operations is One participant alone: RBQM and Safety are the app's own tabs.
    await expect(sections).toHaveText([
      'Overview',
      'Design',
      'Data',
      'One participant',
      'Reporting'
    ]);
    await expect(view.locator('[data-section="overview"]')).toHaveAttribute(
      'aria-selected',
      'true'
    );
    // On the overview at 1,400 pixels, the table of how the study grew is
    // inside the page with the rest.
    const grew = view.getByText('How the study grew, snapshot by snapshot');
    await expect(grew).toBeVisible();
    expect(
      await page.evaluate(() => {
        const width = document.documentElement.clientWidth;
        return {
          wider: document.documentElement.scrollWidth - width,
          past: [...document.querySelectorAll('.sva-explore-body *')].filter(
            (element) =>
              element.getClientRects().length > 0 &&
              element.getBoundingClientRect().right > width + 0.5
          ).length
        };
      })
    ).toEqual({ wider: 0, past: 0 });
    // A view's tab is on the page only while its section is open.
    await expect(view.locator('[data-view]')).toHaveCount(0);
    const inside = {};
    for (const section of ['design', 'data', 'operations', 'reporting']) {
      await view.locator(`[data-section="${section}"]`).click();
      await expect(view.locator(`[data-section="${section}"]`)).toHaveAttribute(
        'aria-selected',
        'true'
      );
      inside[section] = await within.allTextContents();
    }
    expect(inside).toEqual({
      design: ['Protocol', 'Schedule'],
      data: ['Pipeline', 'Tables', 'Columns'],
      operations: [],
      reporting: ['Efficacy', 'Adverse events']
    });
    await view.locator('[data-section="data"]').click();
    await view.locator('[data-view="tables"]').click();
    await expect(view.locator('[data-view="tables"]')).toHaveAttribute('aria-selected', 'true');
    // Where the reader was is kept when the page draws the tab again.
    await page.locator('.sva-tab[data-domain="ae"]').click();
    await page.locator('.sva-item[data-view="data"]').click();
    await expect(view.locator('[data-view="tables"]')).toHaveAttribute('aria-selected', 'true');
    expect(errors).toEqual([]);
  });
});
