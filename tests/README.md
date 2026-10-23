# Test Mocks

Run all tests with `npm test`. They do not need Expo Go or globally installed npm packages; Node 24.3 or later is required.

`mocks/repository.ts` exports `createMockRepository()`, an in-memory repository that implements the production repository contract. Each call creates independent data and controls. `fixtures/expenses.ts` contains three fictional expenses across dates and categories; they are loaded only when a test requests them.

```ts
import assert from 'node:assert/strict';
import { ExpenseStore } from '../src/application/expense-store.ts';
import { createFrankfurterRateProvider } from '../src/infrastructure/frankfurter-rate-provider.ts';
import { createMockRepository } from './mocks/repository.ts';
import { sampleExpenses } from './fixtures/expenses.ts';

const disk = createMockRepository({ expenses: sampleExpenses, currency: 'MXN' });
const rateProvider = createFrankfurterRateProvider(async () => {
  throw new Error('Offline');
});
const store = new ExpenseStore(disk.repo, rateProvider);
await store.initialize();
const input = { amountMinor: 1500, category: 'Other', date: '2026-10-21', note: '' } as const;

// One-time failure: the next save fails, then later saves recover.
disk.failNext('save', new Error('Disk full'));
await assert.rejects(store.save(input), /Disk full/);

// Persistent failure and recovery.
disk.fail(true);
disk.fail(false);

// Control when an operation completes.
const resume = disk.pauseNext('save');
const saving = store.save(input);
resume();
await saving;
```

The `failNext` and `pauseNext` controls accept `initialize`, `list`, `getCurrency`, `setCurrency`, `save`, `remove`, and `loadDemoData`. The `now: () => '2026-10-21T12:00:00Z'` option fixes creation times for deterministic results.

The tests verify store behavior: recovery, data preservation, delayed saves, and duplicate prevention. Repository integration tests continue to use real SQLite to verify queries, migrations, and persistence.

## Presentation coverage

- `expense-editor-model.test.ts` exercises new and saved drafts, exact cents, unsaved changes, offline saves, currency conversion, and validation failures without React Native.
- `expense-editor-architecture.test.ts` keeps state orchestration in the hook, the draft adapter independent of native APIs, and calendar rendering inside the date field.
- `presentation-architecture.test.ts` checks dedicated feature component modules and rejects imports of the removed aggregate UI files.

These tests do not simulate native gestures or render a device UI. Android and iOS Expo exports verify bundling; visual and native-interaction testing still requires a device or simulator.
