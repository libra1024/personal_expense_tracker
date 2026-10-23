import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;

/** Ensures every pushed branch and local commit runs the configured ESLint check. */
test('CI and local commits enforce ESLint', () => {
  const workflow = readFileSync(join(root, '.github/workflows/quality.yml'), 'utf8');
  const hook = readFileSync(join(root, '.githooks/pre-commit'), 'utf8');

  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /push:/);
  assert.match(workflow, /npm run lint/);
  assert.match(hook, /npm run lint/);
});
