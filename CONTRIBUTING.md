# Contributing

## Setup

```sh
npm ci
```

## Commands

| Command                                   | Purpose                                                                                                                                                                                                                             |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                                | Vitest unit tests (`tests/unit/`)                                                                                                                                                                                                   |
| `npm run format` / `npm run format:check` | Prettier write / check                                                                                                                                                                                                              |
| `npm run copied:check` / `:check-source`  | Fail if a file copied from safety.viz differs from the record, `SOURCE.json` / from the safety.viz commit the record names (`-- --from <clone>` reads a local clone); `node scripts/copied.mjs --from <clone>` makes the copy again |

## The record of the copy

study.viz began as the demo app of safety.viz. The app (`src/app/`), its tests and what they read were copied from one commit of safety.viz to the same paths here. `SOURCE.json`, at the root, names that commit and lists every copied file with its checksum and size, and `scripts/copied-lib.mjs` lists what is copied.

- A copied file is changed only by a change listed in `scripts/copied-lib.mjs`, with its reason: whole lines swapped for others, or whole lines cut. `npm run copied:check` then holds the file to its source with those changes and no other. A change written into `SOURCE.json` alone fails the check.
- `npm run copied:check-source` reads the commit itself, from GitHub or from a local clone, and fails on any difference.
- The record is the proof of the copy, not a lock on the app. When safety.viz no longer carries the app and study.viz is its only home, the record is retired in one pull request: `SOURCE.json`, `scripts/copied.mjs`, `scripts/copied-lib.mjs`, their tests, the two npm scripts and the CI step. Until then a change to a copied file is listed.

## How a pull request merges

Branch rulesets run the merge. An increment pull request targets `dev`, opens non-draft with auto-merge enabled, and GitHub lands it once CI is green: nobody is asked to review it. A release candidate targets `main` and merges only on @jwildfire's approving review, which `main`'s ruleset requires. The rules themselves are the obot program's GitHub-flows standard, applied from the hub's `scripts/github-flows.sh`.

## How the check is laid out

`dev` requires one check, "Build, format, and test". It is the one job in `.github/workflows/ci.yml`, and every step of it must pass. `tests/unit/repo/ci-workflow.test.js` reads the workflow file and fails unless the job keeps its name, runs on pull requests and pushes with a read-only token, has a time limit and a named runner image, and still runs every command the check rests on. Change that test with the workflow.

A second workflow, `.github/workflows/evidence-update.yml` ("Update evidence baselines"), is not part of the check. It runs the browser tests on the same runner image with `--update-snapshots` and commits the pictures that changed to the branch it was started for. It refuses `dev`, `main` and `stable`: baselines reach them through a pull request. Start it from the Actions tab on a feature branch, or with a `repository_dispatch` event of type `evidence-update` whose payload names the branch as `ref`, and optionally a Playwright `--grep` pattern as `refresh` to rewrite the matching tests' baselines whatever the difference:

```sh
gh api repos/jwildfire/study.viz/dispatches -f event_type=evidence-update \
  -f 'client_payload[ref]=<branch>' -f 'client_payload[refresh]=APP-PAGE-037'
```

A `repository_dispatch` run uses the workflow file on the repository's default branch. Three tests in `tests/unit/repo/ci-workflow.test.js` hold this workflow's shape.

## Standards

The obot program's standards are mandatory here: the [issue contract](https://github.com/jwildfire/obot.roadmap/blob/main/docs/issue-contract.md), [ways of working](https://github.com/jwildfire/obot.roadmap/blob/main/docs/ways-of-working.md) and [developer guidelines](https://github.com/jwildfire/obot.roadmap/blob/main/docs/developer-guidelines.md).
