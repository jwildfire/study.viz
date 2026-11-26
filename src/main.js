// The chart library the app carries: safety.viz's built bundle, as it is
// copied into site/vendor/safety.viz/ (scripts/vendor-safety-viz.mjs). The app
// reads the charts, the chart list and the kit from here (src/app/main.js), so
// that nothing under src/app/ names the copy. Nothing is added or changed: this
// file hands on what the bundle exports. No chart's source is in study.viz.
export * from '../site/vendor/safety.viz/safety.viz.esm.js';
export { default } from '../site/vendor/safety.viz/safety.viz.esm.js';
