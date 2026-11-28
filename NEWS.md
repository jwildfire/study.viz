<!--
NEWS.md is the running release log and the draft of each release's notes.
Shape (per the obot program's developer guidelines, Releases section): newest release
first; every release section opens with its demo link, then a text-only,
functionality-first account of what a user can now do. The GitHub release publishes from
the section here when the release-candidate pull request (dev -> main) merges and is tagged.
-->

# study.viz v0.1.0 (Upcoming)

**See it move:** the [annotated v0.1.0 demo](https://jwildfire.github.io/obot.roadmap/reports/study-viz-v0.1.0-demo/) has captures and try-it steps, and lists what it did not check.

Review a clinical study in the study.viz demo app at its own address, built from its own repository. It is safety.viz's demo app, copied out with a record and named study.viz. safety.viz keeps the charts, and its own demo is unchanged. Nothing here is qualified: every result is exploratory and should be confirmed.

## What's new

- **The demo app is the front page of study.viz's own site.** [jwildfire.github.io/study.viz](https://jwildfire.github.io/study.viz/) opens on the pilot study with 18 charts ready, safety.viz's 13 and bio.viz's five biomarker charts, and an RBQM tab that runs gsm's site metrics with R in the browser. Files you load are read in the browser and never uploaded. [obot.roadmap#440](https://github.com/jwildfire/obot.roadmap/issues/440), [#5](https://github.com/jwildfire/study.viz/issues/5), PR [#13](https://github.com/jwildfire/study.viz/pull/13)
- **The app is named study.viz.** Its header, the browser tab's title and the mapping file it saves say study.viz, and the footer names its version beside the charts' safety.viz version. A mapping file saved from safety.viz's demo still loads. [#2](https://github.com/jwildfire/study.viz/issues/2), [#5](https://github.com/jwildfire/study.viz/issues/5), PR [#10](https://github.com/jwildfire/study.viz/pull/10), PR [#13](https://github.com/jwildfire/study.viz/pull/13)
- **Choose a study from the header.** The study chip lists four demo studies and three of study.builder's ready-made simulated studies, and marks one in use "Simulated". The Studies view adds your own files, and simulated studies that study.builder v0.5.2 builds in the browser from a description or a protocol. CDISC's attribution shows under the builder's example protocols. [#2](https://github.com/jwildfire/study.viz/issues/2), [#4](https://github.com/jwildfire/study.viz/issues/4), PR [#10](https://github.com/jwildfire/study.viz/pull/10), PR [#12](https://github.com/jwildfire/study.viz/pull/12), [#29](https://github.com/jwildfire/study.viz/issues/29), [#31](https://github.com/jwildfire/study.viz/issues/31)
- **A simulated study is shown in sections.** The Overview tab draws a ready-made simulated study with study.builder's study view, labelled Experimental like Build a study, and no R: Overview, Data, One participant and Reporting, and Design when the study followed a protocol. study.builder's RBQM and Safety views are left out: the app's RBQM tab and charts show the study. [#16](https://github.com/jwildfire/study.viz/issues/16), PR [#17](https://github.com/jwildfire/study.viz/pull/17), [#31](https://github.com/jwildfire/study.viz/issues/31)
- **The app runs on your own machine.** "Download as one file" in the footer saves `study.viz-app.html`, which opens from disk with no network and draws the charts on files you load, without R. From a clone, `npm run demo` serves the demo to your machine only. [#5](https://github.com/jwildfire/study.viz/issues/5), PR [#13](https://github.com/jwildfire/study.viz/pull/13)
- **The charts are safety.viz's.** No chart's source is in study.viz: the app reads safety.viz's built bundle. The chart gallery and each chart's guide and evidence stay on safety.viz's site, where the app links to them. [#3](https://github.com/jwildfire/study.viz/issues/3), [#5](https://github.com/jwildfire/study.viz/issues/5), PR [#11](https://github.com/jwildfire/study.viz/pull/11), PR [#13](https://github.com/jwildfire/study.viz/pull/13)

## Also in this release

- **Every copied file has a record and a check.** The app's source and tests, safety.viz's bundle and each library name their source commit, and the required check compares each copy with its record and its source. [#2](https://github.com/jwildfire/study.viz/issues/2), [#3](https://github.com/jwildfire/study.viz/issues/3), [#4](https://github.com/jwildfire/study.viz/issues/4), PR [#10](https://github.com/jwildfire/study.viz/pull/10), PR [#11](https://github.com/jwildfire/study.viz/pull/11), PR [#12](https://github.com/jwildfire/study.viz/pull/12), [#24](https://github.com/jwildfire/study.viz/issues/24)
- **One check, "Build, format, and test", runs on every pull request.** [#1](https://github.com/jwildfire/study.viz/issues/1), [#6](https://github.com/jwildfire/study.viz/issues/6), PR [#9](https://github.com/jwildfire/study.viz/pull/9), PR [#14](https://github.com/jwildfire/study.viz/pull/14)
- **The site publishes itself: `main` at its root, `dev` under `dev/` and each pull request as a preview.** [#5](https://github.com/jwildfire/study.viz/issues/5), PR [#13](https://github.com/jwildfire/study.viz/pull/13)
- **`npm run demo-path` walks the demo path through this repository's site build, with real R.** Its seventh step chooses the RBQM demo study through the study chip. [#6](https://github.com/jwildfire/study.viz/issues/6), [#8](https://github.com/jwildfire/study.viz/issues/8), PR [#14](https://github.com/jwildfire/study.viz/pull/14), PR [#18](https://github.com/jwildfire/study.viz/pull/18)
- **`node scripts/compare-demos.mjs` sets safety.viz's demo and study.viz's side by side.** For a demo study and a ready-made study it writes down each page's charts ready and RBQM metrics R ran, with screenshots. [#7](https://github.com/jwildfire/study.viz/issues/7), PR [#15](https://github.com/jwildfire/study.viz/pull/15)
- **Known and not fixed: the app's words about starting R stay after R is running, and a reload reopens the pilot study.** [#19](https://github.com/jwildfire/study.viz/issues/19), [#20](https://github.com/jwildfire/study.viz/issues/20)
- **Not in this release: safety.viz letting go of the app, and the shared chart parts moving to study.viz.** [obot.roadmap#441](https://github.com/jwildfire/obot.roadmap/issues/441), [obot.roadmap#442](https://github.com/jwildfire/obot.roadmap/issues/442)

## Tests and provenance

617 unit tests and 131 browser tests pass. The app's source and the chart bundle are safety.viz `dev`'s at commit `75b918cd`. The bundle is named 1.13.0, which safety.viz has not released: the v1.12.0 tag's bundle with the expanded participant profile's layout fix. Beside it: bio.viz v0.3.0, gsm.bio v0.3.0's statistics, gsm.viz v2.4.1, the workflows of gsm.mapping v1.1.6, gsm.kri v1.7.0 and gsm.reporting v1.1.7, and study.builder v0.5.2, whose simulator is a modified copy of gsm.datasim 2.1.0. Release preparation: [#21](https://github.com/jwildfire/study.viz/issues/21).
