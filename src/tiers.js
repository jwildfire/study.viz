// The status ladder, as safety.viz writes it: its src/tiers.js, copied into
// site/vendor/safety.viz/src/ beside the bundle (scripts/vendor-safety-viz.mjs)
// because the bundle does not export it. The app (src/app/page.js) and the
// builds read the rungs from here. Nothing is added or changed.
export * from '../site/vendor/safety.viz/src/tiers.js';
