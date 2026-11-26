# study.viz

**study.viz is the platform and demo app for reviewing a clinical study in the browser.**
Load a study, check how its columns map, and review it in
[safety.viz](https://github.com/jwildfire/safety.viz)'s clinical safety charts and the chart
libraries beside them. Files are read in the browser and never uploaded.

It began as the demo app inside safety.viz. The app was copied out of safety.viz at one
commit, with a record of that commit and a checksum for every file, so that safety.viz
keeps the charts and study.viz keeps the app that hosts them. No chart's source is here:
the charts arrive as safety.viz's built bundle, copied byte for byte.

The app is named study.viz from its first commit here: its header, its page titles, the
files it writes and its GitHub link say study.viz. safety.viz is named where the chart
library or its site is meant. Every line of the app that differs from safety.viz's is
listed, with its reason, in `scripts/copied-lib.mjs`.

## Status

Version 0.1.0 is being assembled on the `dev` branch. Nothing here is qualified: every
result is exploratory and should be confirmed.

## Working on it

```sh
npm ci
npm test
npm run demo   # build the demo app and open it on this machine
npm run site   # build the site into _site/
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the commands and how a pull request merges, and
[NEWS.md](NEWS.md) for what each release holds.

## Licence

Apache-2.0. See [LICENSE](LICENSE).
