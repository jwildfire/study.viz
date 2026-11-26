# Contributing

## Setup

```sh
npm ci
```

## Commands

| Command                                      | Purpose                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run site`                               | Build the site into `_site/` (gitignored): the demo app as the site's root page, with everything it loads beside it; fails on a broken internal link                                                                                                                                                                                                |
| `npm run build:app`                          | Bundle the demo app (`src/app/`) into `build/app/` (gitignored): `study.viz-app.js` for the browser tests and `study.viz-app.html`, the single file that runs offline; the site build writes its own copies into `_site/`                                                                                                                           |
| `npm run demo`                               | Build the demo app's directory into `build/demo/` (gitignored), serve it to this machine only and open it                                                                                                                                                                                                                                           |
| `npm test`                                   | Vitest unit tests (`tests/unit/`)                                                                                                                                                                                                                                                                                                                   |
| `npm run test:e2e`                           | Playwright browser tests (`tests/e2e/`): the app on its test pages, the single file with the network off, `npm run demo`, and the built site's root page. The tests tagged `@real-r` start real R and need the network                                                                                                                              |
| `npm run demo-path`                          | Build the site and walk the demo path through it with real R, keeping a screenshot of each step in `docs/evidence/basic-app/demo-path/`; with `DEMO_PATH_URL` set, walk the demo app at that address instead. Apart from the browser suite                                                                                                          |
| `node scripts/compare-demos.mjs`             | Open two served copies of the demo app, safety.viz's at `demo/` and study.viz's at its root, and write down for the demo study and a ready-made study what each says: charts ready, RBQM metrics R ran, with a screenshot of each view. Asserts nothing; see the file's header for its arguments                                                    |
| `npm run format` / `npm run format:check`    | Prettier write / check                                                                                                                                                                                                                                                                                                                              |
| `npm run copied:check` / `:check-source`     | Fail if a file copied from safety.viz differs from the record, `SOURCE.json`, or a copied folder holds a file nobody listed / also if a file differs from the safety.viz commit the record names (`-- --from <clone>` reads a local clone); "The record of the copy" says what each catches. `node scripts/copied.mjs --from <clone>` copies again  |
| `npm run safety-viz:check` / `:check-source` | Fail if `site/vendor/safety.viz/`, safety.viz's built bundle and the three source files copied beside it, differs from its record / from the safety.viz commit the record names, or if `src/data/portfolio.json` is not the chart list the bundle exports; `node scripts/vendor-safety-viz.mjs` copies them again from safety.viz `dev`, or `--tag` |
| `npm run bio-viz:check` / `:check-source`    | Fail if `site/vendor/bio.viz/`, bio.viz's bundle, differs from its record / from the bio.viz commit the record names; `node scripts/vendor-bio-viz.mjs` copies it again from bio.viz `dev`, or `--tag`                                                                                                                                              |
| `npm run statistics:check`                   | Same for `site/vendor/gsm.bio/statistics.R`, the file R on request gives R; `node scripts/vendor-statistics.mjs` copies it again                                                                                                                                                                                                                    |
| `npm run gsm-workflows:check`                | Same for the gsm workflow files under `site/vendor/gsm.mapping/`, `gsm.kri/` and `gsm.reporting/`; `node scripts/vendor-gsm-workflows.mjs` copies them again                                                                                                                                                                                        |
| `npm run gsm-viz:check`                      | Same for gsm.viz's built bundle and licence in `site/vendor/gsm.viz/`, for the RBQM tab; `node scripts/vendor-gsm-viz.mjs` copies them again                                                                                                                                                                                                        |
| `npm run rbqm-study:check`                   | Same for the RBQM demo study's raw files in `site/data/rbqm/`; after copying them again, `node scripts/rbqm-reference.mjs` writes desktop R's rows again                                                                                                                                                                                            |
| `npm run study-builder:check`                | Same for study.builder's bundle and the files its R reads, in `site/vendor/study.builder/`; `node scripts/vendor-study-builder.mjs` copies them again from the tag `scripts/vendor-lib.mjs` names                                                                                                                                                   |
| `npm run r-wasm:check` / `:check-source`     | Fail if the gsm packages built for R in the browser (`site/vendor/r-wasm/`), their record and their pins disagree / if a pin's tag no longer names its commit                                                                                                                                                                                       |
| `npm run demo-data:check`                    | Rerun the demo-data generators to a temp dir and fail if `site/data/` has drifted; downloads about 200 MB of public source data, so it is not part of the check                                                                                                                                                                                     |
| `node scripts/derive-app-statistics.mjs`     | Record what the app's biomarker charts ask R for, then `Rscript scripts/app-statistics.R` answers it in desktop R (`tests/fixtures/app-statistics/`)                                                                                                                                                                                                |
| `node scripts/build-app-fixture.mjs`         | Regenerate the renamed-column study under `tests/e2e/fixtures/app/` that the app's tests load                                                                                                                                                                                                                                                       |

Every `:check` above but `demo-data:check` has a `:check-source` beside it, which also reads the source repository. A `:check` compares a copy with its record and needs no network; `npm test` makes the same checks. A `:check-source` needs the network and is not part of `npm test`. The required check runs both ("How the check is laid out").

## The charts are safety.viz's bundle

No chart's source is in study.viz. safety.viz builds and commits its bundle, and `node scripts/vendor-safety-viz.mjs` copies `dist/safety.viz-{version}/safety.viz.esm.js` into `site/vendor/safety.viz/`, byte for byte, with `SOURCE.json` beside it naming the commit and the version. The source maps are not copied: a map carries every chart's source.

- Three source files are copied with the bundle, from the same commit and under the same record, because the bundle does not export what they hold and the app reads it: `src/tiers.js`, `src/status-label.js` (safety.viz's kit leaves the status label out) and `src/data/schema/portfolio.json`. None is a chart.
- The app reads the charts through `src/main.js`, `src/tiers.js` and `src/status-label.js`, which hand on the copy and hold no code of their own. Nothing under `src/app/` names the copy.
- `src/data/portfolio.json` is the chart list the bundle exports as `portfolio`, written out by the same script for the builds and tests that read it as a file. Never edit it.
- Never edit anything under `site/vendor/`. To change a chart, change it in safety.viz and copy its bundle again.

## The site is the demo app

`npm run site` writes the demo app's page as the site's root page (`scripts/site.mjs`), from the one recipe `npm run demo` also uses (`scripts/demo-app.mjs`). safety.viz served the same page at `demo/` of its docs site. The docs site itself stays in safety.viz: the chart gallery, each chart's demo, API reference, evidence and guide pages, and the About, Architecture, Domains and kit pages. With no docs site beside it, the app's links to the docs, to the Domains page and to each chart's guide and evidence lead to safety.viz's published site.

## The app's name

The app calls itself study.viz wherever a reader sees its name. Each line that differs from safety.viz's for it is listed in `scripts/copied-lib.mjs`.

- study.viz: the header's wordmark, the page titles (`study.viz demo`), the bundle `study.viz-app.js`, the single file `study.viz-app.html`, the mapping file the app saves (`study-viz-mapping.json`), the prefix of its console warnings (`study.viz app:`) and its GitHub link, which is `repoUrl` in `site/config.json`. `scripts/install-demo.mjs` installs a release of study.viz into `./study.viz`.
- safety.viz: wherever the chart library or its site is meant. The footer's link to the charts' docs reads "safety.viz chart docs and gallery", and each chart's guide and evidence and the Domains page are on safety.viz's site.
- The footer reads `study.viz <version> · safety.viz <version>`: the app's own version from `package.json`, then the copied bundle's (`scripts/safety-viz-lib.mjs`).
- The wordmark is not a link. A page that mounts the app may pass `links.home`, and the wordmark then leads there.
- Not renamed: the names inside the code, which are the global `SafetyVizApp`, `window.__safetyVizApp`, the `sva-` class prefix and the build define `__SAFETY_VIZ_VERSION__`; and the `safetyVizMapping` key that marks a saved mapping file, which the app reads back, so a mapping saved from safety.viz's demo still loads here.

## Browser tests

`npm run test:e2e` serves the repository root on port 8099 (`PW_PORT` changes it) and builds what it opens: `npm run build:app` for the test pages under `tests/e2e/fixtures/`, `npm run site` for the smoke test of the built site.

- On the Linux CI runner every captured screenshot is compared with its baseline in `docs/evidence/basic-app/`, which came from safety.viz with the tests. Anywhere else a capture is a preview under `test-results/` and is compared with nothing. Never commit a capture from another system as a baseline.
- The baselines came from safety.viz and are study.viz's own from the start: the `Update evidence baselines` workflow draws them again here (see "How the check is laid out"). Most show the app's name; a few do not, and were the same bytes as safety.viz's when the copy was made. They are listed under `left` in `scripts/copied-lib.mjs` and are not in the record of the copy, so redrawing one does not fail `npm run copied:check`, and no check compares them with safety.viz's. The three files of measurements beside them are still copied files.
- The tests tagged `@real-r` download R from `webr.r-wasm.org` and its packages from `repo.r-wasm.org`. They fail when those are unreachable; do not make them skip or retry.
- A test is named for the row of [`requirements/demo-app.md`](requirements/demo-app.md) it evidences, as `APP-PAGE-001`. The matrix came from safety.viz with the app; the evidence pages built from it stay on safety.viz's site.
- safety.viz's tests of the built demo page are in its `tests/e2e/site.spec.js`, with the docs site's, and that file is not copied. One of them is made here, in `tests/e2e/smoke.spec.js` beside the smoke test and on the same site build: a ready-made simulated study opened from the Studies view, drawn in study.builder's study view. It is listed in `scripts/copied-lib.mjs` as a change to the smoke test's file. The others are not carried yet.

## The record of the copy

study.viz began as the demo app of safety.viz. The app (`src/app/`), its tests and what they read were copied from one commit of safety.viz to the same paths here. `SOURCE.json`, at the root, names that commit and lists every copied file with its checksum and size, and `scripts/copied-lib.mjs` lists what is copied.

- A copied file is changed only by a change listed in `scripts/copied-lib.mjs`, with its reason: whole lines swapped for others, or whole lines cut. Never edit `SOURCE.json` by hand: `node scripts/copied.mjs --from <clone>` writes it.
- Two checks hold the copy, and they catch different things. `npm run copied:check` reads the record and the script and never safety.viz. `npm run copied:check-source` makes that check and then reads the commit itself, from GitHub or from a local clone. The required check runs both.
- `npm run copied:check` needs no network, and `npm test` makes the same check. It fails when:
  - a recorded file is missing, or its bytes are not the ones its checksum and size in the record name;
  - the record and the script disagree: on the commit, on the files left behind, on a file one lists and the other does not copy, or on a file's listed changes. So a change written into the `changes` of `SOURCE.json` alone fails;
  - a file whose listed changes are all swaps, with the swaps undone, is not the source file its entry names;
  - a copied folder holds a file that is neither in the record nor listed in the script under `left` or `own`, the file being tracked, or untracked and not ignored by git. The file is named.
- `npm run copied:check` has only the record to compare a file with, so it passes a copied file edited together with its entry in `SOURCE.json`: the entry's `sha256` and `bytes`, and for a file with listed changes its `source_sha256` and `source_bytes` too. It also passes a file deleted together with its entry when the file is in the record only because its folder is copied whole: the list of a folder's files is in the commit and not in the script.
- `npm run copied:check-source` catches both. It fails when a recorded file is not safety.viz's file at the commit with the file's listed changes made, byte for byte, or when the recorded files are not exactly the files the script copies from the commit. It needs the network, or `-- --from <clone>`, and is not part of `npm test`.
- Neither check compares a file listed under `left` with anything: the stored pictures and the walk's screenshots are study.viz's own. And both accept a change that is listed in `scripts/copied-lib.mjs`: that list is what a reviewer reads.
- A file of study.viz's own under a copied folder is listed under `own` in `scripts/copied-lib.mjs`, by its path and with its reason. None is today. A file the commit holds cannot be listed there.
- Each library under `site/vendor/` and the RBQM study in `site/data/rbqm/` has the same two checks against its own record: its `:check` reads the record alone, and passes a file changed together with its entry; its `:check-source` reads the source repository at the commit the record names, and whether a tag or a `dev` branch the record names still holds that commit. `r-wasm:check-source` is narrower: it holds each pin's tag and version to the source, and the built packages to nothing but their record.
- To take a later commit of safety.viz, set `COPIED.commit` in `scripts/copied-lib.mjs` and run `node scripts/copied.mjs --from <clone>`. The copy stops if a listed change's lines no longer stand in the new source exactly once; change that entry deliberately, then copy again. Copying never removes a file: a file safety.viz no longer holds stays here, out of the record, and the check that follows the copy names it to be removed. `site/vendor/study.builder/` and the script that copies it come from safety.viz this way, so safety.viz moves its copy of study.builder first.
- The record is the proof of the copy, not a lock on the app. When safety.viz no longer carries the app and study.viz is its only home, the record is retired in one pull request: `SOURCE.json`, `scripts/copied.mjs`, `scripts/copied-lib.mjs`, their tests, the two npm scripts and the two CI steps. Until then a change to a copied file is listed.

## How a pull request merges

Branch rulesets run the merge. An increment pull request targets `dev`, opens non-draft with auto-merge enabled, and GitHub lands it once CI is green: nobody is asked to review it. A release candidate targets `main` and merges only on @jwildfire's approving review, which `main`'s ruleset requires. The rules themselves are the obot program's GitHub-flows standard, applied from the hub's `scripts/github-flows.sh`.

## How the check is laid out

`dev` requires one check, "Build, format, and test". It is the one job in `.github/workflows/ci.yml`, and every step of it must pass. `tests/unit/repo/ci-workflow.test.js` reads the workflow file and fails unless the job keeps its name, runs on pull requests and pushes with a read-only token, has a time limit and a named runner image, and still runs every command the check rests on. Change that test with the workflow.

The job checks every copy twice. First each `:check`, against the copy's record, with no network. Then each `:check-source`, against the source repository itself: the record of the copy from safety.viz (`copied:check-source`) and each library's. The source checks are what catch a copied file changed together with its record, and they need the network: every source is a public repository, and a step that may ask GitHub's API is given the job's own read-only token and no secret. The test fails if a `:check-source` script in `package.json` is not a step of the job.

A second workflow, `.github/workflows/evidence-update.yml` ("Update evidence baselines"), is not part of the check. It runs the browser tests on the same runner image with `--update-snapshots` and commits the pictures that changed to the branch it was started for. It refuses `dev`, `main` and `stable`: baselines reach them through a pull request. Start it from the Actions tab on a feature branch, or with a `repository_dispatch` event of type `evidence-update` whose payload names the branch as `ref`, and optionally a Playwright `--grep` pattern as `refresh` to rewrite the matching tests' baselines whatever the difference:

```sh
gh api repos/jwildfire/study.viz/dispatches -f event_type=evidence-update \
  -f 'client_payload[ref]=<branch>' -f 'client_payload[refresh]=APP-PAGE-037'
```

A `repository_dispatch` run uses the workflow file on the repository's default branch. Three tests in `tests/unit/repo/ci-workflow.test.js` hold this workflow's shape.

## Standards

The obot program's standards are mandatory here: the [issue contract](https://github.com/jwildfire/obot.roadmap/blob/main/docs/issue-contract.md), [ways of working](https://github.com/jwildfire/obot.roadmap/blob/main/docs/ways-of-working.md) and [developer guidelines](https://github.com/jwildfire/obot.roadmap/blob/main/docs/developer-guidelines.md).
