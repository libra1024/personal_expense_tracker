import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;

/** Ensures every pushed branch and local commit runs configured formatting and ESLint checks. */
test('CI and local commits enforce Prettier and ESLint', () => {
  const workflow = readFileSync(join(root, '.github/workflows/quality.yml'), 'utf8');
  const hook = readFileSync(join(root, '.githooks/pre-commit'), 'utf8');
  const prettierConfig = JSON.parse(readFileSync(join(root, '.prettierrc'), 'utf8'));
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
    scripts: Record<string, string>;
  };

  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /push:/);
  assert.match(workflow, /npm run format:check/);
  assert.match(workflow, /npm run lint/);
  assert.match(hook, /npm run format:check/);
  assert.match(hook, /npm run lint/);
  assert.equal(packageJson.scripts.format, 'prettier --write .');
  assert.equal(packageJson.scripts['format:check'], 'prettier --check .');
  assert.deepEqual(prettierConfig, {
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    printWidth: 100,
    trailingComma: 'all',
    bracketSameLine: false,
    plugins: ['prettier-plugin-tailwindcss'],
  });
});
