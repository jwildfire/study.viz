// Site build (obot.roadmap#440): writes the site into _site/, and the site is
// the demo app. Its page is the site's root page, with everything it loads
// beside it: the app bundle, the single file, the demo studies, the typefaces,
// each chart library's bundle and what R in the browser is given. The
// directory is the one scripts/demo-app.mjs builds for `npm run demo`, so the
// page a reader runs on their own machine is the page the site serves.
//
// This is the demo half of safety.viz's scripts/site.mjs. The chart gallery,
// each chart's demo, API reference, evidence and guide pages, and the About,
// Architecture, Domains and kit pages stay in safety.viz: the app's links to
// them lead to safety.viz's published site.
//
// The build is a pure function of the repository tree: no test execution, no
// network. It fails on a broken internal link, so a bad site can never publish
// (the same check gates CI).

import { existsSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSiteLinks } from './site-lib.mjs';
import { tierProblems } from './tiers.mjs';
import { LOCAL_LINKS, LOCAL_SITE, buildDemoAppDir } from './demo-app.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Where the site is written; gitignored. */
export const SITE_DIR = path.join(rootDir, '_site');

/**
 * What is wrong with a built site; an empty list means it has its root page
 * and every internal link and asset reference in its pages resolves to a file
 * of the site.
 * @param {string} siteDir The built site.
 * @returns {string[]} The problems, each a sentence.
 */
export function siteProblems(siteDir) {
  return [
    ...(existsSync(path.join(siteDir, 'index.html')) ? [] : ['the site has no root page.']),
    ...validateSiteLinks(siteDir)
  ];
}

/**
 * Write the site into a directory: the demo app, as the root of the site. It
 * has no docs site beside it, so its links to the docs, the Domains page and
 * each chart's own pages are the published safety.viz site's.
 * @param {string} siteDir The directory to write into; emptied first.
 * @returns {Promise<string>} The directory.
 * @throws {Error} When the configuration names a rung it may not, before a page is written.
 */
export async function writeSite(siteDir) {
  // The rungs the configuration names: one that is refused, as "qualified",
  // stops the build with its sentence before a page is written.
  const config = JSON.parse(readFileSync(path.join(rootDir, 'site/config.json'), 'utf8'));
  const refused = tierProblems(config);
  if (refused.length) throw new Error(refused.join('\n'));
  rmSync(siteDir, { recursive: true, force: true });
  mkdirSync(siteDir, { recursive: true });
  await buildDemoAppDir(siteDir, { links: LOCAL_LINKS, site: LOCAL_SITE });
  return siteDir;
}

/**
 * Check a written site and swap it into place: the old site steps aside, the
 * new one takes its name, and only then is the old one removed. A site with a
 * problem is removed and nothing is published: the site that was there stays.
 * @param {string} siteDir The written site.
 * @param {string} publishedDir Where the finished site goes.
 * @returns {string} The published directory.
 * @throws {Error} With every problem of siteProblems, one to a line.
 */
export function publishSite(siteDir, publishedDir) {
  const problems = siteProblems(siteDir);
  if (problems.length) {
    rmSync(siteDir, { recursive: true, force: true });
    throw new Error(problems.join('\n'));
  }
  const retiredDir = `${siteDir}.old`;
  if (existsSync(publishedDir)) renameSync(publishedDir, retiredDir);
  renameSync(siteDir, publishedDir);
  rmSync(retiredDir, { recursive: true, force: true });
  return publishedDir;
}

/**
 * Build the site.
 *
 * The site is written beside its destination and swapped in at the end, so a
 * reader of the directory (a browser test in another worker, a second build)
 * never sees a half-written site. The build directory is per process because
 * two builds can run at once.
 * @param {string} [publishedDir] Where the finished site goes; `_site/` by default.
 * @returns {Promise<{dir: string, page: string}>} The site's directory and its root page.
 * @throws {Error} When the configuration names a rung it may not, or the written site has a broken internal link. Nothing is published then.
 */
export async function buildSite(publishedDir = SITE_DIR) {
  const siteDir = await writeSite(`${publishedDir}.build-${process.pid}`);
  publishSite(siteDir, publishedDir);
  return { dir: publishedDir, page: path.join(publishedDir, 'index.html') };
}

// Run when this file is what Node was started on, not when it is imported.
const startedDirectly = () => {
  try {
    return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
};
if (startedDirectly()) {
  try {
    const { dir } = await buildSite();
    console.log(
      `✓ Built ${path.relative(rootDir, dir)}/ — the demo app as the site's root page, ` +
        'all internal links verified.'
    );
  } catch (error) {
    console.error('✗ Site build failed:');
    error.message.split('\n').forEach((problem) => console.error(`  - ${problem}`));
    process.exit(1);
  }
}
