# study.viz

The platform and demo app that reviews a clinical study in safety.viz's charts and the chart libraries beside them. It began as the demo app of jwildfire/safety.viz, copied out with a record; safety.viz keeps the charts.

## Commands

```sh
npm ci                # install
npm test              # Vitest unit tests (tests/unit/)
npm run format:check  # Prettier (npm run format to fix)
npm run copied:check  # the files copied from safety.viz match their record, SOURCE.json (:check-source reads safety.viz)
```

## Rules that are easy to break

- `src/app/`, its tests and what they read were copied from safety.viz at the commit `SOURCE.json` names. Change a copied file only by listing the change, with its reason, in `scripts/copied-lib.mjs`, then run `node scripts/copied.mjs --from <safety.viz clone>`; `npm test` fails otherwise. Never edit `SOURCE.json` by hand.
- The app's name is study.viz wherever a reader sees it: the wordmark, the page titles, the files it writes, its console warnings and its GitHub link. safety.viz names the chart library and its site. The global `SafetyVizApp`, `window.__safetyVizApp`, the `sva-` classes and the `safetyVizMapping` key of a saved mapping file are internal and keep their names.

## Branches

- `dev` is the integration branch: an increment pull request targets it and merges on a green check.
- `main` is the release branch: a release candidate targets it and merges on @jwildfire's approving review.

Code style is Prettier's (`.prettierrc.json`): single quotes, semicolons, 100 columns, no trailing commas. More in [CONTRIBUTING.md](CONTRIBUTING.md).

# Standards

The obot program's standards are mandatory here: the issue contract, ways of working and
developer guidelines in jwildfire/obot.roadmap `docs/` (on disk at ~/obot.roadmap/docs/
in a cloud environment). Work runs one requirement per session (`/requirement-session <hub requirement>`).
