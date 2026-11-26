// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import manifest from '../../../src/data/portfolio.json';
import { mountApp } from '../../../src/app/page.js';
import { DEFAULT_LINKS } from '../../../src/app/main.js';

// The header names the app, study.viz, and the browser tab says where the
// reader is (#270, obot.roadmap#402). The charts' docs, on safety.viz's site,
// are a link in the footer.

const charts = Object.fromEntries(
  Object.values(manifest.modules).map((entry) => [
    entry.export,
    (element) => ({
      init() {
        element.innerHTML = '<canvas></canvas>';
      },
      destroy() {}
    })
  ])
);
const view = { id: 'rbqm', title: 'RBQM', tag: () => 'not run', render: () => null };

describe('the wordmark and the browser tab’s title', () => {
  let root;
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    root = document.querySelector('#app');
    window.location.hash = '';
    document.title = 'study.viz demo';
  });

  it('APP-PAGE-037: the wordmark reads study.viz, with the mark and the words "Demo app" beside it, and is not a link to the charts’ docs: it is a link only where the page gives the app’s own home, and the docs link is in the footer, named as safety.viz’s (#270)', () => {
    // A page that gives the docs' address and no home: plain words in the header.
    const app = mountApp(root, { charts, manifest, links: { docs: '../index.html' } });
    const brand = root.querySelector('.sva-brand');
    expect(brand.tagName).toBe('DIV');
    expect(root.querySelector('a.sva-brand')).toBeNull();
    expect(brand.querySelector('.sva-logo svg')).not.toBeNull();
    expect(brand.querySelector('.sva-wordmark').textContent).toBe('study.viz');
    expect(brand.querySelector('.sva-kicker').textContent).toBe('Demo app');
    // The docs link is the footer's, and its words say whose docs they are.
    const docs = root.querySelector('.sva-links a[data-link="docs"]');
    expect(docs.getAttribute('href')).toBe('../index.html');
    expect(docs.textContent).toBe('safety.viz chart docs and gallery');
    app.destroy();
    // The app's own defaults: the charts' docs on safety.viz's published site,
    // which the single file keeps, study.viz's own repository, and no home.
    expect(DEFAULT_LINKS.docs).toBe('https://jwildfire.github.io/safety.viz/');
    expect(DEFAULT_LINKS.github).toBe('https://github.com/jwildfire/study.viz');
    expect(DEFAULT_LINKS.home).toBeUndefined();
    // A page that gives the app's own home: the wordmark leads there.
    const linked = mountApp(root, { charts, manifest, links: { home: './index.html' } });
    const home = root.querySelector('.sva-brand');
    expect(home.tagName).toBe('A');
    expect(home.getAttribute('href')).toBe('./index.html');
    expect(home.title).toBe('study.viz: home');
    expect(home.querySelector('.sva-wordmark').textContent).toBe('study.viz');
    linked.destroy();
  });

  it('APP-PAGE-038: the browser tab’s title names the open view before the app’s name: the Overview tab, a chart by the name on its chip, and a library’s tab by its own (#270)', () => {
    const app = mountApp(root, {
      charts,
      manifest,
      libraries: [{ name: 'gsm.viz', view }]
    });
    expect(document.title).toBe('Overview · study.viz demo');
    app.select('histogram');
    expect(document.title).toBe('Histogram · study.viz demo');
    app.select('ae-explorer');
    expect(document.title).toBe('Adverse Event Explorer · study.viz demo');
    app.select('rbqm');
    expect(document.title).toBe('RBQM · study.viz demo');
    // An address that names no view opens the Overview tab, and the title says so.
    app.select('constructor');
    expect(document.title).toBe('Overview · study.viz demo');
    // A page may name the app itself; a destroyed app leaves the tab its name.
    app.destroy();
    expect(document.title).toBe('study.viz demo');
    const named = mountApp(root, { charts, manifest, title: 'My study review' });
    named.select('histogram');
    expect(document.title).toBe('Histogram · My study review');
    named.destroy();
    expect(document.title).toBe('My study review');
  });
});
