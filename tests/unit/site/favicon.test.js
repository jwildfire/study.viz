import { describe, it, expect } from 'vitest';
import { LOGO_HREF, LOGO_SVG } from '../../../src/app/styles.js';
import { renderDemoAppPage } from '../../../scripts/site-lib.mjs';

// The demo app’s favicon (#270, obot.roadmap#402): the seven-hex mark the app’s
// header carries. That the docs site’s pages serve the same one is held in
// safety.viz, where the docs shell is.

const iconOf = (html) => /<link\s+rel="icon"\s+href="([^"]+)"/.exec(html)?.[1];

describe('the favicon', () => {
  it('APP-PAGE-039: the demo app’s page serves the hex mark as its favicon, as a data address that asks nothing of another file (#270)', () => {
    const app = renderDemoAppPage({
      bundle: 'study.viz-app.js',
      download: 'study.viz-app.html',
      repoUrl: 'https://github.com/jwildfire/study.viz'
    });
    expect(iconOf(app)).toBe(LOGO_HREF);
    // It is the mark itself: the seven hexes of the header's logo.
    expect(LOGO_HREF.startsWith('data:image/svg+xml,')).toBe(true);
    expect(decodeURIComponent(LOGO_HREF.slice('data:image/svg+xml,'.length))).toBe(LOGO_SVG);
    expect(LOGO_SVG.match(/<polygon/g)).toHaveLength(7);
  });
});
