import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
  assert.doesNotMatch(source, /infrastructure\/|expo-|react-native|react['"]|typeof fetch|\bfetch\s*\(/);
  assert.match(source, /ExchangeRateProvider/);
});
