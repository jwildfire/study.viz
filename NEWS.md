<!--
NEWS.md is the running release log and the draft of each release's notes.
Shape (per the obot program's developer guidelines, Releases section): newest release
first; every release section opens with its demo link, then a text-only,
functionality-first account of what a user can now do. The GitHub release publishes from
the section here when the release-candidate pull request (dev -> main) merges and is tagged.
-->

# study.viz v0.1.0 (Upcoming)

study.viz starts here: the repository is set up on the obot program's standards, and the
demo app is copied in from safety.viz with a record.

## What's new

- **The demo app's source is here, named study.viz.** `src/app/` and its unit tests are copied from safety.viz's `dev` branch at commit `f94fea41`, with a record of the commit and a checksum for every file. The app calls itself study.viz: in its header, in the browser tab's title, in the mapping file it saves and in its console warnings. Every line that differs from safety.viz's is listed with its reason, and `npm run copied:check` fails if a file and the record disagree. [obot.roadmap#440](https://github.com/jwildfire/obot.roadmap/issues/440)

- **The repository exists and checks itself.** One check, "Build, format, and test", runs on every pull request, and the site workflow publishes the `dev` branch. [obot.roadmap#440](https://github.com/jwildfire/obot.roadmap/issues/440)
- **The charts are safety.viz's built bundle, copied with a record.** No chart's source is in study.viz: the app reads safety.viz 1.12.0's bundle from `site/vendor/safety.viz/`, copied byte for byte from the same commit, and `npm run safety-viz:check` holds the copy to its record. [obot.roadmap#440](https://github.com/jwildfire/obot.roadmap/issues/440)
- **The libraries the app carries came with it, each with its record.** bio.viz, gsm.bio's statistics, the gsm workflows, gsm.viz, the gsm packages built for R in the browser, the site-level risk study and study.builder v0.4.0 are in `site/vendor/` and `site/data/rbqm/`, with the records they had in safety.viz and a `:check` command each. [obot.roadmap#440](https://github.com/jwildfire/obot.roadmap/issues/440)
- **The site is the demo app.** `npm run site` writes the app as the site's root page, with the demo studies and study.builder's ready-made studies beside it, and fails on a broken internal link. `npm run build:app` writes the single file that opens from disk with no network, `study.viz-app.html`. The footer names study.viz's own version and, beside it, the safety.viz version of the charts. The chart gallery and each chart's own pages stay on safety.viz's site, and the app links to them there: the header's wordmark is not a link, and the footer's link to the charts' docs says they are safety.viz's. [obot.roadmap#440](https://github.com/jwildfire/obot.roadmap/issues/440)
- **The app's browser tests run here.** The tests of the app, of the single file with the network off, of `npm run demo` and of the site-level risk pipeline in real R came with it, and a smoke test opens the built site's root page. `npm run demo-path` walks the demo path through this checkout's own site build. [obot.roadmap#440](https://github.com/jwildfire/obot.roadmap/issues/440)

## Also in this release

- `node scripts/compare-demos.mjs` sets two served copies of the demo app side by side, safety.viz's and study.viz's, and writes down what each says of a study: charts ready and site-level risk metrics run, with a screenshot of each view.

- `dev` is the integration branch and `main` the release branch, as in safety.viz and bio.viz.
- The `Update evidence baselines` workflow makes the pictures the browser tests are compared with again, on the Linux runner the check runs on, and commits them to the branch it is started for.
