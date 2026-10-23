import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import ts from 'typescript';

const projectRoot = new URL('..', import.meta.url).pathname;
const componentRoot = join(projectRoot, 'src/presentation/components');
const featureComponents = {
  'expense-form': [
    'amount-field',
    'transaction-currency-field',
    'category-field',
    'date-field',
    'note-field',
    'expense-audit',
    'expense-form-layout',
    'expense-form-header',
    'expense-form-actions',
    'missing-expense',
  ],
  settings: [
    'currency-settings-panel',
    'sample-data-panel',
    'privacy-panel',
    'panel-heading',
    'panel-alert',
  ],
  overview: ['monthly-total-card', 'category-breakdown', 'recent-expenses', 'device-privacy-note'],
  history: ['category-filter', 'daily-expense-group'],
};

/** Keeps independently reusable screen components in directly importable, single-purpose modules. */
test('feature components have dedicated modules rather than grouped UI files', () => {
  for (const [feature, components] of Object.entries(featureComponents)) {
    for (const component of components) {
      const filename = join(componentRoot, feature, `${component}.tsx`);
      assert.ok(existsSync(filename), `${feature}/${component}.tsx must exist`);
      const source = ts.createSourceFile(
        filename,
        readFileSync(filename, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      const exportedFunctions = source.statements.filter(
        (statement) =>
          ts.isFunctionDeclaration(statement) &&
          statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword),
      );
      assert.equal(exportedFunctions.length, 1, `${filename} must expose one focused component`);
    }
  }
});

/** Prevents obsolete aggregate files or compatibility imports from keeping two UI structures alive. */
test('routes and components no longer depend on grouped screen UI modules', () => {
  const legacyModules = ['expense-fields', 'settings-panels', 'overview-summary', 'expense-list'];
  for (const legacyModule of legacyModules) {
    assert.equal(existsSync(join(componentRoot, `${legacyModule}.tsx`)), false);
  }
  for (const directory of ['app', 'src/presentation']) {
    const root = join(projectRoot, directory);
    for (const filename of readdirSync(root, { recursive: true, encoding: 'utf8' })) {
      if (!/\.tsx?$/.test(filename)) continue;
      const source = readFileSync(join(root, filename), 'utf8');
      for (const legacyModule of legacyModules) {
        assert.doesNotMatch(source, new RegExp(`from ['"][^'"]*/${legacyModule}['"]`));
      }
    }
  }
});

/** Prevents styles replaced by Tailwind from remaining in the shared native stylesheet. */
test('shared native stylesheet contains no unreferenced entries', () => {
  const theme = readFileSync(join(componentRoot, 'theme.ts'), 'utf8');
  const definitions = [...theme.split('StyleSheet.create({')[1].matchAll(/^  (\w+):/gm)]
    .map((match) => match[1])
    .sort();
  const consumers = ['app', 'src'].flatMap((directory) => {
    const root = join(projectRoot, directory);
    return readdirSync(root, { recursive: true, encoding: 'utf8' })
      .filter((filename) => /\.tsx?$/.test(filename))
      .flatMap((filename) => [
        ...readFileSync(join(root, filename), 'utf8').matchAll(/\bstyles\.(\w+)/g),
      ])
      .map((match) => match[1]);
  });
  assert.deepEqual(definitions, [...new Set(consumers)].sort());
});
