import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (path: string) => readFileSync(join(root, path), 'utf8');

test('domain rules stay independent from UI, Expo, SQLite, and network adapters', () => {
  for (const file of ['src/domain/expenses.ts', 'src/domain/currency.ts']) {
    const source = read(file);
    assert.doesNotMatch(source, /from ['"](?:expo-|react|\.\.\/presentation|\.\.\/infrastructure)/);
  }
});

test('application state depends on contracts instead of Expo UI APIs', () => {
  const source = read('src/application/expense-store.ts');
  assert.doesNotMatch(
    source,
    /infrastructure\/|expo-|react-native|react['"]|typeof fetch|\bfetch\s*\(/,
  );
  assert.match(source, /ExchangeRateProvider/);
});

/** Prevents the former root-level compatibility modules from bypassing architectural layer boundaries. */
test('source imports use explicit architectural layer modules', () => {
  for (const legacyFile of [
    'src/store.ts',
    'src/repository.ts',
    'src/currency.ts',
    'src/expenses.ts',
    'src/provider.tsx',
    'src/ui.tsx',
  ]) {
    assert.equal(existsSync(join(root, legacyFile)), false, `${legacyFile} must not exist`);
  }
});

/** Ensures reusable presentation primitives are separated into focused UI component modules. */
test('presentation UI is composed from focused component modules', () => {
  for (const componentFile of [
    'src/presentation/components/theme.ts',
    'src/presentation/components/icon.tsx',
    'src/presentation/components/layout.tsx',
    'src/presentation/components/controls.tsx',
    'src/presentation/components/expense-display.tsx',
  ]) {
    assert.equal(existsSync(join(root, componentFile)), true, `${componentFile} must exist`);
  }
  assert.equal(existsSync(join(root, 'src/presentation/ui.tsx')), false, 'ui.tsx must be split');
});
