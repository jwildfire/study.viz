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

## Also in this release

- `dev` is the integration branch and `main` the release branch, as in safety.viz and bio.viz.
- The `Update evidence baselines` workflow makes the pictures the browser tests are compared with again, on the Linux runner the check runs on, and commits them to the branch it is started for.
