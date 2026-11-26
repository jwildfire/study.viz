<!--
NEWS.md is the running release log and the draft of each release's notes.
Shape (per the obot program's developer guidelines, Releases section): newest release
first; every release section opens with its demo link, then a text-only,
functionality-first account of what a user can now do. The GitHub release publishes from
the section here when the release-candidate pull request (dev -> main) merges and is tagged.
-->

# study.viz v0.1.0 (Upcoming)

**See it move:** the [annotated v0.1.0 demo](https://jwildfire.github.io/obot.roadmap/reports/study-viz-v0.1.0-demo/) has captures, try-it steps and the detail behind everything below.

Review a clinical study in the study.viz demo app at its own address, built from its own repository. It is safety.viz's demo app, copied out with a record and named study.viz. safety.viz keeps the charts, and its own demo is unchanged. Nothing here is qualified: every result is exploratory and should be confirmed.

## What's new

- **The demo app is the front page of study.viz's own site.** [jwildfire.github.io/study.viz](https://jwildfire.github.io/study.viz/) opens on the pilot study with 18 charts ready: safety.viz's 13 and bio.viz's five biomarker charts. The RBQM tab runs gsm's site metrics with R in the browser. Files you load are read in the browser and never uploaded. [obot.roadmap#440](https://github.com/jwildfire/obot.roadmap/issues/440), [#5](https://github.com/jwildfire/study.viz/issues/5), PR [#13](https://github.com/jwildfire/study.viz/pull/13)
- **The app is named study.viz.** Its header, the browser tab's title, the mapping file it saves and its console warnings say study.viz, and the footer names its version beside the charts' safety.viz version. A mapping file saved from safety.viz's demo still loads. [#2](https://github.com/jwildfire/study.viz/issues/2), [#5](https://github.com/jwildfire/study.viz/issues/5), PR [#10](https://github.com/jwildfire/study.viz/pull/10), PR [#13](https://github.com/jwildfire/study.viz/pull/13)
- **Choose a study from the header.** The study chip lists four demo studies and three of study.builder's ready-made simulated studies. The Studies view adds your own files, and simulated studies that study.builder v0.5.0 builds in the browser from a description or a protocol. [#2](https://github.com/jwildfire/study.viz/issues/2), [#4](https://github.com/jwildfire/study.viz/issues/4), PR [#10](https://github.com/jwildfire/study.viz/pull/10), PR [#12](https://github.com/jwildfire/study.viz/pull/12)
- **A simulated study is shown in sections.** Open a ready-made simulated study and the Overview tab draws it with study.builder's own study view, with no R: Overview, Design, Data, One participant and Reporting. study.builder's RBQM and Safety views are left out, because the app's RBQM tab and safety charts show the same study. [#16](https://github.com/jwildfire/study.viz/issues/16), PR [#17](https://github.com/jwildfire/study.viz/pull/17)
- **The app runs on your own machine.** "Download as one file" in the footer saves `study.viz-app.html`, which opens from disk with no network and draws the charts on files you load; it starts no R. From a clone, `npm run demo` serves the whole demo to your machine only. [#5](https://github.com/jwildfire/study.viz/issues/5), PR [#13](https://github.com/jwildfire/study.viz/pull/13)
- **The charts are safety.viz's, and their docs stay on its site.** No chart's source is in study.viz: the app reads safety.viz's built bundle. The chart gallery and each chart's guide and evidence stay on safety.viz's site, and the app links to them there. [#3](https://github.com/jwildfire/study.viz/issues/3), [#5](https://github.com/jwildfire/study.viz/issues/5), PR [#11](https://github.com/jwildfire/study.viz/pull/11), PR [#13](https://github.com/jwildfire/study.viz/pull/13)

## Also in this release

- **Every copied file has a record and a check.** The app's source and tests, safety.viz's bundle and each library the app carries name the commit they came from, and a check fails when a copy and its record disagree. Every line of the app that differs from safety.viz's is listed with its reason. [#2](https://github.com/jwildfire/study.viz/issues/2), [#3](https://github.com/jwildfire/study.viz/issues/3), [#4](https://github.com/jwildfire/study.viz/issues/4), PR [#10](https://github.com/jwildfire/study.viz/pull/10), PR [#11](https://github.com/jwildfire/study.viz/pull/11), PR [#12](https://github.com/jwildfire/study.viz/pull/12)
- **One check runs on every pull request, and the site publishes itself.** "Build, format, and test" is the one check `dev` requires. The site workflow publishes `main` at the site's root, `dev` under `dev/` and each pull request as a preview. [#1](https://github.com/jwildfire/study.viz/issues/1), [#5](https://github.com/jwildfire/study.viz/issues/5), [#6](https://github.com/jwildfire/study.viz/issues/6), PR [#9](https://github.com/jwildfire/study.viz/pull/9), PR [#13](https://github.com/jwildfire/study.viz/pull/13), PR [#14](https://github.com/jwildfire/study.viz/pull/14)
- **`npm run demo-path` walks the demo path through this repository's site build, with real R.** Its seventh step chooses the RBQM demo study through the study chip. [#6](https://github.com/jwildfire/study.viz/issues/6), [#8](https://github.com/jwildfire/study.viz/issues/8), PR [#14](https://github.com/jwildfire/study.viz/pull/14), PR [#18](https://github.com/jwildfire/study.viz/pull/18)
- **`node scripts/compare-demos.mjs` sets safety.viz's demo and study.viz's side by side.** It writes down what each page says of a demo study and a ready-made study: charts ready and RBQM metrics R ran, with screenshots. [#7](https://github.com/jwildfire/study.viz/issues/7), PR [#15](https://github.com/jwildfire/study.viz/pull/15)
- **Not in this release: safety.viz letting go of the app, and the shared chart parts moving to study.viz.** [obot.roadmap#441](https://github.com/jwildfire/obot.roadmap/issues/441), [obot.roadmap#442](https://github.com/jwildfire/obot.roadmap/issues/442)

## Tests and provenance

565 unit tests and 131 browser tests pass. The app's source is safety.viz's at commit `b0c93851`. The chart bundle is the one safety.viz's `dev` held at commit `f94fea41`: it names itself 1.12.0, and is the v1.12.0 tag's bundle with the expanded participant profile's layout fix. Beside it: bio.viz v0.3.0, gsm.bio v0.3.0's statistics, gsm.viz v2.4.1, the workflows of gsm.mapping v1.1.6, gsm.kri v1.7.0 and gsm.reporting v1.1.7, and study.builder v0.5.0. Release preparation: [#21](https://github.com/jwildfire/study.viz/issues/21).
