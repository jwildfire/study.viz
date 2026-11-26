import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildSite, publishSite, siteProblems, writeSite } from '../../../scripts/site.mjs';
import { APP_BUNDLE, APP_HTML } from '../../../scripts/build-app.mjs';
import { chartsVersion } from '../../../scripts/safety-viz-lib.mjs';
import { DEMO_STUDIES } from '../../../src/app/studies.js';
import { SITE } from '../../../src/app/site.js';

// The site (obot.roadmap#440): the demo app is its root page, with everything
// the page loads beside it, and none of the docs site safety.viz keeps. The
// build fails on a broken internal link. These tests build the site into a
// temporary directory, as `npm run site` builds it into _site/.

describe('the site build', () => {
  let dir;
  let html;
  beforeAll(async () => {
    dir = path.join(mkdtempSync(path.join(tmpdir(), 'study-viz-site-')), '_site');
    await buildSite(dir);
    html = readFileSync(path.join(dir, 'index.html'), 'utf8');
  }, 120_000);

  it('SITE-001: the demo app’s page is the site’s root page, mounted on the demo studies beside it', () => {
    expect(html).toContain('<title>study.viz demo</title>');
    expect(html).toContain(`<script src="./${APP_BUNDLE}"></script>`);
    expect(html).toContain("window.__safetyVizApp = SafetyVizApp.mount('#app', {");
    expect(html).toContain("demo: { base: './' }");
    // No page of its own under demo/, where safety.viz's site served it.
    expect(existsSync(path.join(dir, 'demo'))).toBe(false);
  });

  it('SITE-002: everything the page loads is beside it: the bundle, the single file, every demo study, the typefaces, each library and what R is given', () => {
    for (const file of [
      APP_BUNDLE,
      `${APP_BUNDLE}.map`,
      APP_HTML,
      'bio.viz.js',
      'statistics.R',
      'gsm.viz.js',
      'gsm.viz.LICENSE.txt',
      'rbqm/pipeline.R',
      'study.builder/study.builder.js',
      'study.builder/study.viewer.js',
      'study.builder/presets/index.json',
      'r-wasm/SOURCE.json'
    ]) {
      expect(existsSync(path.join(dir, file)), file).toBe(true);
    }
    for (const study of DEMO_STUDIES) {
      for (const file of study.files) {
        expect(existsSync(path.join(dir, study.dir, file)), `${study.dir}${file}`).toBe(true);
      }
    }
    expect(
      readdirSync(path.join(dir, 'fonts')).filter((file) => file.endsWith('.woff2'))
    ).toHaveLength(5);
  });

  it('SITE-003: none of the docs site is written: no gallery, no page per chart, no API reference, no evidence page', () => {
    const top = readdirSync(dir);
    for (const absent of [
      'about.html',
      'architecture.html',
      'site.css',
      'status-label.js',
      'portfolio.json',
      'assets',
      'dist',
      'domains',
      'kit',
      'histogram',
      'hep-explorer'
    ]) {
      expect(top, absent).not.toContain(absent);
    }
    // The root page is the only page of the site but the single file.
    const pages = top.filter((file) => file.endsWith('.html'));
    expect(pages.sort()).toEqual([APP_HTML, 'index.html'].sort());
  });

  it('SITE-004: with no docs site beside it, the app’s links to the docs and to each chart’s pages lead to safety.viz’s published site', () => {
    // Neither link is given an address, so the app's own defaults stand.
    expect(html).not.toMatch(/\n\s+docs: /);
    expect(html).not.toMatch(/\n\s+domains: /);
    expect(html).toContain(`"evidence":"${SITE}histogram/evidence.html"`);
    expect(html).toContain(`"guide":"${SITE}hep-explorer/guide.html"`);
    expect(html).not.toContain('"../histogram/evidence.html"');
    expect(html).toContain(`download: './${APP_HTML}'`);
  });

  it('SITE-005: the app’s footer names study.viz’s own version and, beside it, the safety.viz version of the copied bundle', () => {
    const bundle = readFileSync(path.join(dir, APP_BUNDLE), 'utf8');
    const { version } = JSON.parse(
      readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')
    );
    expect(chartsVersion()).not.toBe(version);
    // Both are built into the bundle, and the footer's line is made of the two.
    expect(bundle).toContain(`"${chartsVersion()}"`);
    expect(bundle).toContain(`"${version}"`);
    expect(bundle).toMatch(/`study\.viz \$\{\w+\}`/);
    expect(bundle).toMatch(/`safety\.viz \$\{\w+\}`/);
  });

  it('SITE-008: the app is named study.viz wherever the site names it, and safety.viz only as the chart library', () => {
    expect(APP_BUNDLE).toBe('study.viz-app.js');
    expect(APP_HTML).toBe('study.viz-app.html');
    expect(html).toContain('content="The study.viz demo app: ');
    expect(html).toContain("github: 'https://github.com/jwildfire/study.viz'");
    const single = readFileSync(path.join(dir, APP_HTML), 'utf8');
    expect(single).toContain('<title>study.viz demo</title>');
    const bundle = readFileSync(path.join(dir, APP_BUNDLE), 'utf8');
    // The name the app had in safety.viz, in none of the places a reader saw it: its page
    // titles, its console warnings, its files, the mapping file it saves, its source link.
    const was = 'safety';
    for (const [name, text] of Object.entries({ page: html, single, bundle })) {
      expect(text, name).not.toContain(`${was}.viz demo`);
      expect(text, name).not.toContain(`${was}.viz app:`);
      expect(text, name).not.toContain(`${was}.viz-app`);
      expect(text, name).not.toContain(`${was}-viz-mapping`);
      expect(text, name).not.toContain(`github.com/jwildfire/${was}.viz"`);
      expect(text, name).not.toContain(`github.com/jwildfire/${was}.viz'`);
    }
    // The wordmark, and the footer's link to the charts' docs, named as safety.viz's.
    expect(bundle).toContain('"sva-wordmark","study.viz"');
    expect(bundle).toContain('"safety.viz chart docs and gallery"');
  });

  it('SITE-006: the built site passes its own check, and the check names a broken internal link and a missing root page', () => {
    expect(siteProblems(dir)).toEqual([]);
  });

  it('SITE-007: a site with a broken internal link is not published: the build fails naming the link, and the site that was there stays as it was', async () => {
    const base = mkdtempSync(path.join(tmpdir(), 'study-viz-site-'));
    const published = path.join(base, '_site');
    await buildSite(published);
    const before = readFileSync(path.join(published, 'index.html'), 'utf8');

    // The next build is written, then a link in its page is broken before the check.
    const written = await writeSite(path.join(base, '_site.build-test'));
    const page = path.join(written, 'index.html');
    writeFileSync(
      page,
      readFileSync(page, 'utf8').replace(
        '<div id="app">',
        '<a href="./gone.html">x</a><div id="app">'
      )
    );
    expect(siteProblems(written)).toEqual(['index.html: broken internal link "./gone.html"']);
    rmSync(path.join(written, APP_BUNDLE));
    expect(() => publishSite(written, published)).toThrow(
      'index.html: broken internal link "./gone.html"\n' +
        `index.html: broken internal link "./${APP_BUNDLE}"`
    );
    // The failed build is gone, and the published site is the one from before.
    expect(readdirSync(base)).toEqual(['_site']);
    expect(readFileSync(path.join(published, 'index.html'), 'utf8')).toBe(before);

    // A site with no root page is refused too.
    const empty = await writeSite(path.join(base, '_site.build-test'));
    rmSync(path.join(empty, 'index.html'));
    expect(() => publishSite(empty, published)).toThrow('the site has no root page.');
    expect(readFileSync(path.join(published, 'index.html'), 'utf8')).toBe(before);
  }, 120_000);
});
