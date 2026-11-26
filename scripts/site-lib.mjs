// Site generators: pure functions scripts/site.mjs and scripts/demo-app.mjs
// assemble into _site/. Plain Node, no framework, and every internal URL
// relative, so one build serves the site root, /dev/, and /pr/{N}/ unchanged.
// This is the demo half of safety.viz’s scripts/site-lib.mjs: the docs-site
// generators stay in safety.viz (scripts/copied-lib.mjs lists what was cut).

import { LOGO_HREF } from '../src/app/styles.js';
import {
  HOSTED_DESCRIPTION,
  HOSTED_PITCH,
  inlineJson,
  librariesExpression,
  rbqmTabExpression
} from './app-libraries.mjs';
import { builderSourceExpression, portfolioOptionsExpression } from './builder-lib.mjs';

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

export function escapeHtml(text) {
  return String(text).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
}

// A count as a reader would write it in a sentence: a word up to twenty, and
// digits past that.
const COUNT_WORDS = [
  'no',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
  'twenty'
];
export const countWord = (count) => COUNT_WORDS[count] || String(count);

/**
 * The demo app's typefaces (#165): the font files its page declares, served
 * from the site itself so the page asks no other host for anything. Each is
 * the Latin subset of one face, from an npm package that carries the family
 * under the SIL Open Font License; other scripts fall back to system fonts.
 *
 *   family   the name the app's stylesheet asks for (src/app/styles.js)
 *   weight   the weight the file covers; a range for a variable font
 *   file     the file's name, in the package's files/ and beside the app
 *   package  the devDependency the site build copies it from
 *
 * One file per face and no unicode-range: a face split into subsets fetches
 * each subset when a character in it first appears, which for a user's own
 * file and column names is after a file is chosen (APP-LOAD-014).
 */
export const DEMO_APP_FONTS = [
  {
    family: 'Instrument Sans',
    weight: '400 700',
    file: 'instrument-sans-latin-wght-normal.woff2',
    package: '@fontsource-variable/instrument-sans'
  },
  {
    family: 'Instrument Serif',
    weight: '400',
    file: 'instrument-serif-latin-400-normal.woff2',
    package: '@fontsource/instrument-serif'
  },
  ...['400', '500', '600'].map((weight) => ({
    family: 'IBM Plex Mono',
    weight,
    file: `ibm-plex-mono-latin-${weight}-normal.woff2`,
    package: '@fontsource/ibm-plex-mono'
  }))
];

/**
 * Where the demo app's page points the app's links to the docs site and the
 * Domains page when it is a page of that site (APP-PAGE-016).
 */
export const DEMO_APP_SITE_LINKS = Object.freeze({
  docs: '../index.html',
  domains: '../domains/index.html'
});

/** The directory beside the app's page that its font files are served from. */
const DEMO_APP_FONT_DIR = 'fonts';

/**
 * Copy the demo app's font files beside it, each family's licence with them.
 * @param {string} rootDir The repository root, whose node_modules holds the font packages.
 * @param {string} demoDir The app's directory in the site output.
 * @returns {string[]} Paths of the copied files: the fonts, then one licence per package.
 */
export function publishDemoAppFonts(rootDir, demoDir) {
  const fontDir = path.join(demoDir, DEMO_APP_FONT_DIR);
  mkdirSync(fontDir, { recursive: true });
  const packageDir = (name) => path.join(rootDir, 'node_modules', name);
  const copied = DEMO_APP_FONTS.map((font) => {
    const served = path.join(fontDir, font.file);
    copyFileSync(path.join(packageDir(font.package), 'files', font.file), served);
    return served;
  });
  for (const name of new Set(DEMO_APP_FONTS.map((font) => font.package))) {
    const served = path.join(fontDir, `LICENSE-${name.split('/').pop()}.txt`);
    copyFileSync(path.join(packageDir(name), 'LICENSE'), served);
    copied.push(served);
  }
  return copied;
}

/**
 * The demo app's page (#150, #152, obot.roadmap#352): a full-page web app with
 * its own header, so a standalone document and not a page in the docs shell.
 * The app bundle the site build writes beside it (scripts/build-app.mjs) draws
 * everything; this document loads it, the site's three type families and the
 * hex mark, and tells the app where the demo extracts and its links are.
 *
 * The typefaces are the site's own files (#165), fetched as the page opens:
 * each is preloaded, and every declared face is loaded at once rather than
 * when a weight is first used, so no request follows a user choosing a file.
 * @param {Object} options Page options.
 * @param {string} options.bundle File name of the app bundle beside the page.
 * @param {string} options.download File name of the single-file build beside the page.
 * @param {string} options.repoUrl The repository URL, for the app's source link.
 * @param {Array<{name: string, global: string, file: string}>} [options.libraries] Further chart libraries (#182): each bundle is loaded from beside the page after the app's and handed to the app when it mounts.
 * @param {string} [options.charts] What the app reviews a study in, for the page's description: its charts, counted.
 * @param {Object<string, {guide?: string, evidence?: string}>} [options.chartLinks] Each chart's own pages (#246), as scripts/app-libraries.mjs::chartLinks gives them: handed to the app for the footnote under each chart. Given none, the app is told of none.
 * @param {Object<string, {tier: string, note?: string}>} [options.tiers] Each chart's and each tab's rung of the status ladder (#272), as scripts/app-libraries.mjs::chartTiers gives them: handed to the app. Given none, the app is told of none.
 * @param {{docs?: ?string, domains?: ?string}} [options.links] Where the app's links to the docs site and the Domains page lead: by default into the site the page is part of. One given no address is left out, and the app's own default, the published site, stands (#214): the page `npm run demo` serves has no site beside it.
 * @returns {string} The complete HTML document.
 */
export function renderDemoAppPage({
  bundle,
  download,
  repoUrl,
  libraries = [],
  charts = 'thirteen clinical safety charts',
  links = {},
  chartLinks = {},
  tiers = {}
}) {
  const siteLinks = { ...DEMO_APP_SITE_LINKS, ...links };
  const js = (value) => `'${String(value).replace(/[\\']/g, '\\$&')}'`;
  const fontUrl = (font) => `./${DEMO_APP_FONT_DIR}/${font.file}`;
  const preloads = DEMO_APP_FONTS.map(
    (font) => `<link rel="preload" href="${fontUrl(font)}" as="font" type="font/woff2" crossorigin>`
  ).join('\n');
  const faces = DEMO_APP_FONTS.map(
    (font) =>
      `@font-face{font-family:"${font.family}";font-style:normal;font-weight:${font.weight};` +
      `font-display:swap;src:url(${fontUrl(font)}) format("woff2")}`
  ).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="The study.viz demo app: load a study, check how its columns map, and review it in ${escapeHtml(charts)}. ${libraries.length ? HOSTED_DESCRIPTION : 'It runs in your browser; nothing is uploaded.'}">
<title>study.viz demo</title>
<link rel="icon" href="${LOGO_HREF}">
${preloads}
<style>
${faces}
body{margin:0;background:#fafaf8}
</style>
<script>if (document.fonts) document.fonts.forEach(function (face) { face.load(); });</script>
</head>
<body>
<div id="app"></div>
<noscript>The study.viz demo app needs JavaScript: it reads and draws your data in this browser.</noscript>
<script src="./${escapeHtml(bundle)}"></script>
${libraries.map((library) => `<script src="./${escapeHtml(library.file)}"></script>\n`).join('')}<script>
window.__safetyVizApp = SafetyVizApp.mount('#app', {
  demo: { base: './' },${libraries.length ? `\n  ${portfolioOptionsExpression()}\n  libraries: ${librariesExpression(libraries, { r: 'request', more: [rbqmTabExpression(), builderSourceExpression()] })},\n  pitch: ${js(HOSTED_PITCH)},` : ''}${Object.keys(chartLinks).length ? `\n  chartLinks: ${inlineJson(chartLinks)},` : ''}${Object.keys(tiers).length ? `\n  tiers: ${inlineJson(tiers)},` : ''}
  links: {${Object.keys(DEMO_APP_SITE_LINKS)
    .filter((name) => siteLinks[name])
    .map((name) => `\n    ${name}: ${js(siteLinks[name])},`)
    .join('')}
    download: ${js(`./${download}`)},
    github: ${js(repoUrl)}
  }
});
</script>
</body>
</html>
`;
}

function walkHtmlFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const file = path.join(dir, entry);
    if (statSync(file).isDirectory()) return walkHtmlFiles(file);
    return entry.endsWith('.html') ? [file] : [];
  });
}

// Build validation (#7): every internal href/src in the emitted site must
// resolve to an emitted file. External, mailto, data, and fragment-only
// targets are ignored.
export function validateSiteLinks(siteDir) {
  const errors = [];
  for (const file of walkHtmlFiles(siteDir)) {
    const html = readFileSync(file, 'utf8');
    for (const [, target] of html.matchAll(/(?:href|src)="([^"]*)"/g)) {
      if (/^(https?:|mailto:|data:|#|\/\/)/.test(target)) continue;
      const cleaned = decodeURI(target.split(/[?#]/)[0]);
      if (!cleaned) continue;
      const resolved = path.resolve(path.dirname(file), cleaned);
      if (!existsSync(resolved)) {
        errors.push(`${path.relative(siteDir, file)}: broken internal link "${target}"`);
      }
    }
  }
  return errors;
}
