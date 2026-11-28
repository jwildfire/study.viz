// Compares two served copies of the demo app (obot.roadmap#440, task 7): the
// one safety.viz's site serves at demo/, and the one study.viz's site serves
// as its root page. For the demo study each opens on, and for a ready-made
// study chosen from the study chip, it writes down what each page says: how
// many charts the loaded data supports, and how many site-level risk (RBQM)
// metrics R ran. It keeps a screenshot of each view.
//
//   node scripts/compare-demos.mjs \
//     --site safety.viz=http://127.0.0.1:8201/demo/ \
//     --site study.viz=http://127.0.0.1:8202/ \
//     --out <folder> [--study PILOT-PROTOCOL] [--no-r]
//
// Nothing is asserted: the numbers are written exactly as each page shows
// them, to <folder>/counts.json, and the two sites are set side by side in
// <folder>/table.md. The RBQM metrics are run by real R in the browser,
// which each page downloads from R's public hosts when its Start R is pressed;
// --no-r leaves that out and writes down only what needs no R.
//
// The browser is an installed Playwright Chromium if there is one, or the
// installed Google Chrome with --chrome. It downloads no browser.

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const values = (name) =>
  args.flatMap((arg, index) => (arg === name && args[index + 1] ? [args[index + 1]] : []));
const sites = values('--site').map((value) => {
  const at = value.indexOf('=');
  return { name: value.slice(0, at), url: value.slice(at + 1) };
});
const outDir = values('--out')[0];
const second = values('--study')[0] || 'PILOT-PROTOCOL';
const withR = !args.includes('--no-r');
if (sites.length < 1 || sites.some((site) => !site.name || !/^https?:/.test(site.url)) || !outDir) {
  console.error(
    'Usage: node scripts/compare-demos.mjs --site <name>=<url> [--site <name>=<url>] --out <folder> [--study <name>] [--no-r] [--chrome]'
  );
  process.exit(2);
}

// Starting R is a 13 MB download, and an RBQM run a larger one: gsm's packages.
const RBQM_RUNS = 600_000;
const APP = 'window.__safetyVizApp';
const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** What the page says of the charts, for the study it has loaded. */
async function chartsSaid(page) {
  return page.evaluate((app) => {
    const handle = Function(`return ${app}`)();
    const states = Object.entries(handle.status()).map(([module, entry]) => [module, entry.state]);
    const tally = {};
    for (const [, state] of states) tally[state] = (tally[state] || 0) + 1;
    const text = (selector) => {
      const found = document.querySelector(selector);
      return found ? found.textContent.trim() : null;
    };
    return {
      study: text('.sva-chip-name'),
      count: text('.sva-count'),
      ready: tally.ready || 0,
      charts: states.length,
      states: tally,
      notReady: states.filter(([, state]) => state !== 'ready').map((pair) => pair.join(': ')),
      tabs: [...document.querySelectorAll('.sva-tab')].map((tab) => ({
        tab: tab.textContent.replace(/\s+/g, ' ').trim(),
        title: tab.title || null
      })),
      footer: text('.sva-version')
    };
  }, APP);
}

/** What the RBQM tab says once R has run, or why nothing was run. */
async function rbqmSaid(page, { started, before }) {
  await page.locator('.sva-tab[data-tab="rbqm"]').click();
  // What the tab says the loaded files support, before R is asked anything.
  const supports = page.locator('.sva-rbqm-supports');
  const supported = (await supports.count())
    ? (await supports.first().textContent()).replace(/\s+/g, ' ').trim()
    : null;
  if (!withR) return { supported, ran: null, why: 'R was not started (--no-r).' };
  if (!started) {
    // R is started from the tab's own note, as a reader starts it.
    await page.locator('.sva-rbqm .sva-callout .sva-note-start').first().click();
  }
  const status = page.locator('.sva-rbqm-status');
  // The line of this run, not the last one's: a second study is run with no press.
  await page.waitForFunction(
    (was) => {
      const said = document.querySelector('.sva-rbqm-status');
      const text = said ? said.textContent.trim() : '';
      return /^R ran \d+ of \d+ metrics? /.test(text) && text !== was;
    },
    before || '',
    { timeout: RBQM_RUNS }
  );
  const said = (await status.first().textContent()).trim();
  const [, ran, of] = said.match(/^R ran (\d+) of (\d+) /);
  return {
    supported,
    said,
    ran: Number(ran),
    of: Number(of),
    pages: await page.locator('.sva-view-items .sva-view-item').count(),
    rows: await page.locator('.sva-rbqm-table table.group-overview tbody tr').count(),
    // The site overview as the tab draws it, a row to a line: each site, its
    // enrolment and its flags as text, and each metric's cell, which is a
    // drawn mark, as a short checksum of its markup.
    table: (
      await page.locator('.sva-rbqm-table table.group-overview').evaluate((table) =>
        [...table.querySelectorAll('tr')].map((row) =>
          [...row.querySelectorAll('th, td')].map((cell) => ({
            text: cell.textContent.replace(/\s+/g, ' ').trim(),
            markup: cell.innerHTML.trim()
          }))
        )
      )
    ).map((row) =>
      row
        .map(({ text, markup }) =>
          text || !markup
            ? text
            : `mark:${createHash('sha256').update(markup).digest('hex').slice(0, 8)}`
        )
        .join(' | ')
    )
  };
}

async function walk(browser, site) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  const failed = [];
  page.on('response', (response) => {
    if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`);
  });
  const shot = async (name) => {
    const file = `${slug(site.name)}-${name}.png`;
    await page.screenshot({ path: path.join(outDir, file) });
    return file;
  };
  const views = [];

  // The demo study the page opens on.
  await page.goto(site.url);
  await page.evaluate(`${APP}.ready`);
  await page.locator('.sva-chart canvas:visible').first().waitFor();
  const first = { view: 'demo study', charts: await chartsSaid(page) };
  first.screenshot = await shot('demo-study');
  first.rbqm = await rbqmSaid(page, { started: false });
  first.rbqmScreenshot = await shot('demo-study-rbqm');
  views.push(first);
  console.log(
    `${site.name}: ${first.charts.study}: ${first.charts.count}; ${first.rbqm.said || first.rbqm.why}`
  );

  // The ready-made study, chosen from the study chip.
  await page.locator('.sva-studychip').click();
  await page.locator('.sva-chip-item', { hasText: second }).click();
  await page.waitForFunction(
    (name) => (document.querySelector('.sva-chip-name') || {}).textContent === name,
    second
  );
  await page.evaluate(`${APP}.ready`);
  const next = { view: second };
  // Choosing a study leaves the reader on the tab they were on: the RBQM tab,
  // which runs the new study with no press, R being started already.
  next.rbqm = await rbqmSaid(page, { started: true, before: first.rbqm.said });
  next.rbqmScreenshot = await shot(`${slug(second)}-rbqm`);
  next.charts = await chartsSaid(page);
  // Then a chart of it: the first the study's data supports.
  await page.evaluate(`${APP}.select(${APP}.firstReady())`);
  await page.locator('.sva-chart canvas:visible, .sva-chart table:visible').first().waitFor();
  next.opened = await page.title();
  next.screenshot = await shot(slug(second));
  views.push(next);
  console.log(
    `${site.name}: ${next.charts.study}: ${next.charts.count}; ${next.rbqm.said || next.rbqm.why}`
  );

  await context.close();
  return { ...site, views, errors, failed };
}

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch(args.includes('--chrome') ? { channel: 'chrome' } : {});
const results = [];
try {
  // One after the other: each downloads R, and two at once would only be slower.
  for (const site of sites) results.push(await walk(browser, site));
} finally {
  await browser.close();
}

writeFileSync(
  path.join(outDir, 'counts.json'),
  `${JSON.stringify({ browser: browser.version(), study: second, sites: results }, null, 2)}\n`
);

const cell = (text) => String(text ?? '').replace(/\|/g, '\\|');
const same = (pick) => new Set(results.map((site) => JSON.stringify(pick(site)))).size === 1;
const rows = [];
for (const index of [0, 1]) {
  const label = index === 0 ? 'Demo study' : second;
  rows.push(
    `| ${label}: study named on the chip | ${results.map((site) => cell(site.views[index].charts.study)).join(' | ')} |`,
    `| ${label}: charts ready | ${results.map((site) => `${site.views[index].charts.ready} of ${site.views[index].charts.charts}`).join(' | ')} |`,
    `| ${label}: what the page says | ${results.map((site) => cell(site.views[index].charts.count)).join(' | ')} |`,
    `| ${label}: what the RBQM tab says the files support, before R | ${results.map((site) => cell(site.views[index].rbqm.supported)).join(' | ')} |`,
    `| ${label}: RBQM metrics R ran | ${results.map((site) => (site.views[index].rbqm.ran === null ? 'not run' : `${site.views[index].rbqm.ran} of ${site.views[index].rbqm.of}`)).join(' | ')} |`,
    `| ${label}: what the RBQM tab says | ${results.map((site) => cell(site.views[index].rbqm.said || site.views[index].rbqm.why)).join(' | ')} |`,
    `| ${label}: sites in the RBQM overview table | ${results.map((site) => site.views[index].rbqm.rows ?? '').join(' | ')} |`,
    `| ${label}: the RBQM overview table, cell for cell (each site, its enrolment, its flags and each metric’s mark) | ${
      results.every((site) => site.views[index].rbqm.table)
        ? same((site) => site.views[index].rbqm.table)
          ? results.map(() => 'the same at every site').join(' | ')
          : results.map(() => 'differs between the sites').join(' | ')
        : results.map(() => 'not run').join(' | ')
    } |`
  );
}
rows.push(
  `| Footer version | ${results.map((site) => cell(site.views[0].charts.footer)).join(' | ')} |`,
  `| Console and page errors | ${results.map((site) => site.errors.length).join(' | ')} |`,
  `| Answers of 400 or more | ${results.map((site) => site.failed.length).join(' | ')} |`
);
const counted = (site) =>
  site.views.map((view) => [view.charts.ready, view.charts.charts, view.rbqm.ran, view.rbqm.of]);
writeFileSync(
  path.join(outDir, 'table.md'),
  [
    `| | ${results.map((site) => `${site.name} (${site.url})`).join(' | ')} |`,
    `|---|${results.map(() => '---').join('|')}|`,
    ...rows,
    '',
    results.length > 1
      ? same(counted)
        ? 'The counts are the same at every site.'
        : 'The counts differ between the sites.'
      : '',
    ''
  ].join('\n')
);
console.log(`Wrote counts.json, table.md and the screenshots to ${outDir}`);
