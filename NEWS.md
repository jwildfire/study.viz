<!--
NEWS.md is the running release log and the draft of each release's notes.
Shape (per the obot program's developer guidelines, Releases section): newest release
first; every release section opens with its demo link, then a text-only,
functionality-first account of what a user can now do. The GitHub release publishes from
the section here when the release-candidate pull request (dev -> main) merges and is tagged.
-->

# study.viz v0.1.0 (Upcoming)

study.viz starts here: the repository is set up on the obot program's standards, ready
for the demo app to be copied in from safety.viz.

## What's new

- **The repository exists and checks itself.** One check, "Build, format, and test", runs on every pull request, and the site workflow publishes the `dev` branch. [obot.roadmap#440](https://github.com/jwildfire/obot.roadmap/issues/440)

## Also in this release

- `dev` is the integration branch and `main` the release branch, as in safety.viz and bio.viz.
- The `Update evidence baselines` workflow makes the pictures the browser tests are compared with again, on the Linux runner the check runs on, and commits them to the branch it is started for.
