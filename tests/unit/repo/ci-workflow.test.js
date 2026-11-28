import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { parse } from 'yaml';

// The required check is one job (CONTRIBUTING.md, "How the check is laid
// out"), and a ruleset requires it by its name. These tests read the workflow
// file and fail unless the job has the shape that makes it safe to require:
// its name, what starts it, a read-only token, a time limit, a named runner
// image, and every command the check rests on, each the whole of one step that
// cannot be skipped or allowed to fail. Adding a check adds a line to REQUIRED.
//
// The checks of a copy come in two kinds, and the job runs both (#24). A
// `:check` compares the copy with its record and reads no network; a file
// changed together with its record passes it. A `:check-source` reads the
// source repository, and is the one that catches that.

const read = (file) =>
  parse(readFileSync(new URL(`../../../.github/workflows/${file}`, import.meta.url), 'utf8'));

const CHECK_NAME = 'Build, format, and test';
const COPIES = [
  'copied',
  'safety-viz',
  'bio-viz',
  'statistics',
  'r-wasm',
  'gsm-workflows',
  'gsm-viz',
  'rbqm-study',
  'study-builder'
];
const SOURCE_CHECKS = COPIES.map((copy) => `npm run ${copy}:check-source`);
const REQUIRED = [
  'npm ci',
  'npm run format:check',
  ...COPIES.map((copy) => `npm run ${copy}:check`),
  ...SOURCE_CHECKS,
  'npm test',
  'npm run site',
  'npm run build:app',
  'npx playwright install --with-deps chromium',
  'npm run test:e2e -- --project=chromium'
];

const workflow = read('ci.yml');
const jobs = Object.values(workflow.jobs);

describe('the required check', () => {
  it('REPO-CI-001: is one job, named as the ruleset names it', () => {
    expect(jobs).toHaveLength(1);
    expect(jobs[0].name).toBe(CHECK_NAME);
    expect(jobs[0].if).toBeUndefined();
    expect(jobs[0].needs).toBeUndefined();
  });

  it('REPO-CI-002: runs on pull requests and on pushes to dev and main, and on nothing that lends a token', () => {
    expect(Object.keys(workflow.on).sort()).toEqual(['pull_request', 'push']);
    expect(workflow.on.pull_request.types).toEqual([
      'opened',
      'synchronize',
      'reopened',
      'ready_for_review'
    ]);
    expect(workflow.on.push.branches).toEqual(['main', 'dev']);
  });

  it('REPO-CI-003: has a read-only token, a time limit and a named runner image', () => {
    expect(workflow.permissions).toEqual({ contents: 'read' });
    expect(jobs[0].permissions).toBeUndefined();
    expect(jobs[0]['timeout-minutes']).toBeGreaterThan(0);
    expect(jobs[0]['runs-on']).toMatch(/^ubuntu-\d+\.\d+$/);
  });

  it('REPO-CI-004: runs every command the check rests on, each as the whole of one step', () => {
    const commands = jobs[0].steps.filter((step) => step.run).map((step) => step.run.trim());
    for (const command of REQUIRED) {
      expect(commands, `no step runs exactly: ${command}`).toContain(command);
    }
    // In the order listed: nothing is tested before it is installed or built.
    const places = REQUIRED.map((command) => commands.indexOf(command));
    expect(places).toEqual([...places].sort((a, b) => a - b));
  });

  it('REPO-CI-005: no step may be skipped or fail without failing the check', () => {
    expect(jobs[0]['continue-on-error']).toBeUndefined();
    for (const step of jobs[0].steps) {
      expect(step['continue-on-error'], step.name).toBeUndefined();
      expect(step.if, step.name).toBeUndefined();
    }
  });

  it('REPO-CI-009: runs the source check of every copy that has one, and gives a step no token but the job’s own read-only one', () => {
    // Every `:check-source` script in package.json is a step: a copy added with one cannot be left out.
    const scripts = JSON.parse(
      readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')
    ).scripts;
    const sourceScripts = Object.keys(scripts).filter((name) => name.endsWith(':check-source'));
    expect(sourceScripts.map((name) => `npm run ${name}`).sort()).toEqual(
      [...SOURCE_CHECKS].sort()
    );
    const commands = jobs[0].steps.filter((step) => step.run).map((step) => step.run.trim());
    for (const command of SOURCE_CHECKS) expect(commands).toContain(command);
    // The sources are public. The one thing a step may be handed is the job's
    // own token, which `permissions` makes read-only, and only a source check
    // is handed it; the workflow names no secret anywhere.
    const text = readFileSync(
      new URL('../../../.github/workflows/ci.yml', import.meta.url),
      'utf8'
    );
    expect(text).not.toMatch(/\bsecrets\s*\./);
    expect(workflow.env).toBeUndefined();
    expect(jobs[0].env).toBeUndefined();
    for (const step of jobs[0].steps) {
      if (step.env === undefined) continue;
      expect(step.env, step.name).toEqual({ GITHUB_TOKEN: '${{ github.token }}' });
      expect(SOURCE_CHECKS, step.name).toContain(String(step.run).trim());
    }
    // The checks that ask GitHub's API for safety.viz are handed it: unauthenticated, the API's limit is per address.
    for (const copy of ['copied', 'safety-viz']) {
      const step = jobs[0].steps.find(
        (one) => String(one.run).trim() === `npm run ${copy}:check-source`
      );
      expect(step.env, step.name).toEqual({ GITHUB_TOKEN: '${{ github.token }}' });
    }
  });
});

// The evidence refresh (.github/workflows/evidence-update.yml) is not part of
// the check. It makes the pictures the browser tests are compared with again,
// and commits them to a branch, so these tests hold what makes that safe: the
// same runner image as the check, a start only by hand or by its own event, a
// refusal of the branches a pull request guards, and a commit that stages
// nothing outside docs/evidence, where the pictures are.
describe('the evidence refresh', () => {
  const refresh = read('evidence-update.yml');
  const refreshJobs = Object.values(refresh.jobs);
  const steps = refreshJobs[0].steps;
  const commands = steps.filter((step) => step.run).map((step) => step.run.trim());

  it('REPO-CI-006: is one job on the runner image the check compares screenshots on, with a time limit', () => {
    expect(refreshJobs).toHaveLength(1);
    expect(refreshJobs[0]['runs-on']).toBe(jobs[0]['runs-on']);
    expect(refreshJobs[0]['timeout-minutes']).toBeGreaterThan(0);
  });

  it('REPO-CI-007: starts only by hand or by an evidence-update event, and checks its branch before anything is checked out', () => {
    expect(Object.keys(refresh.on).sort()).toEqual(['repository_dispatch', 'workflow_dispatch']);
    expect(refresh.on.repository_dispatch.types).toEqual(['evidence-update']);
    // The first step refuses the integration and release branches and anything that is not a branch.
    expect(steps[0].run).toContain("''|main|stable|dev|refs/*)");
    expect(steps[0].run).toContain('git check-ref-format --branch "$TARGET_REF"');
    expect(steps.findIndex((step) => String(step.uses).startsWith('actions/checkout@'))).toBe(1);
    // The branch and the pattern reach the scripts through the environment, never as script text.
    for (const command of commands) expect(command).not.toContain('${{');
  });

  it('REPO-CI-008: runs the browser tests as the check runs them, with --update-snapshots, and stages nothing but docs/evidence for its commit', () => {
    expect(commands).toContain('npm ci');
    expect(commands).toContain('npx playwright install --with-deps chromium');
    expect(commands).toContain('npm run test:e2e -- --project=chromium --update-snapshots');
    const commit = commands[commands.length - 1];
    expect(commit).toContain('git add docs/evidence\n');
    expect(commit).not.toMatch(/git add (-A|--all|\.)/);
    expect(commit).toContain('git push origin "HEAD:refs/heads/${TARGET_REF}"');
    expect(refresh.permissions).toEqual({ contents: 'write' });
  });
});
