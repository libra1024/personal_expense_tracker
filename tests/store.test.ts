import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ExpenseStore } from '../src/store.ts';
import { createMockRepository } from './mocks/repository.ts';
import { sampleExpenses } from './fixtures/expenses.ts';

test('startup refresh converts existing stored expenses without delaying offline CRUD', async () => {
  const disk = storage({ expenses: sampleExpenses });
  let release!: (response: Response) => void;
  const store = new ExpenseStore(disk.repo, { request: async () => new Promise(resolve => { release = resolve; }) });
  await store.initialize();
  assert.equal(store.getSnapshot().ready, true);
  assert.equal(store.getSnapshot().baseCurrency, 'MXN');
  assert.equal(store.getSnapshot().refreshingRates, true);
  await store.save(input);
  const original = store.getSnapshot().expenses.map(e => ({ ...e }));
  release(new Response(JSON.stringify(rateRows)));
  await store.refreshRates();
  assert.deepEqual(store.getSnapshot().rates, rateRows);
  await store.setCurrency('USD');
  assert.deepEqual(store.getSnapshot().expenses.map(expense => expense.id).sort((a, b) => a - b), original.map(expense => expense.id).sort((a, b) => a - b));
  assert.deepEqual(await disk.repo.getRateCache(), rateRows);
});

test('refresh exposes frozen legacy snapshots without requiring an app restart', async () => {
  const disk = storage({ expenses: sampleExpenses, freezeLegacyOnRateCache: true });
  const store = new ExpenseStore(disk.repo, { request: async () => new Response(JSON.stringify(rateRows)) });
  await store.initialize();
  await store.refreshRates();
  const frozen = store.getSnapshot().expenses;
  assert.ok(frozen.every(expense => expense.originalCurrency === 'MXN'));
  assert.ok(frozen.every(expense => expense.rateSnapshot === JSON.stringify(rateRows)));
});

test('automatic refresh is throttled on currency changes and foreground, manual refresh bypasses it', async () => {
  const disk = storage(); let now = 0; let calls = 0;
  const store = new ExpenseStore(disk.repo, { now: () => now, request: async () => { calls++; return new Response(JSON.stringify(rateRows)); } });
  await store.initialize(); await store.refreshRates();
  assert.equal(calls, 1);
  await store.setCurrency('USD'); await store.refreshRates();
  assert.equal(calls, 1);
  now = 300001;
  await store.setCurrency('EUR'); await store.refreshRates();
  assert.equal(calls, 2);
  await store.refreshRates(true); assert.equal(calls, 3);
});

test('cache read failure never prevents startup or offline expense changes', async () => {
  const disk = storage(); disk.failNext('getRateCache');
  const store = new ExpenseStore(disk.repo, { request: offline });
  await store.initialize(); await store.refreshRates();
  assert.equal(store.getSnapshot().ready, true);
  assert.equal(store.getSnapshot().rates, null);
  assert.match(store.getSnapshot().rateWarning ?? '', /could not/i);
  assert.equal(await store.save(input), true);
});

const rateRows = [{ date: '2026-10-21', base: 'MXN', quote: 'USD', rate: 0.05407 }, { date: '2026-10-22', base: 'MXN', quote: 'EUR', rate: 0.04815 }] as const;
const offline: typeof fetch = async () => { throw new Error('Offline'); };
const input = { amountMinor: 4500, category: 'Food & Drink', date: '2026-10-21', note: 'Lunch' } as const;

const storage = createMockRepository;

test('successful mutations refresh visible history and retain currency selection', async () => {
  const disk = storage(); const store = new ExpenseStore(disk.repo, { request: offline });
  await store.initialize();
  assert.equal(store.getSnapshot().ready, true);
  await store.save(input);
  const id = store.getSnapshot().expenses[0].id;
  await store.save({ ...input, amountMinor: 5000 }, id);
  assert.equal(store.getSnapshot().expenses.length, 1);
  assert.equal(store.getSnapshot().expenses[0].amountMinor, 5000);
  await store.setCurrency('USD');
  assert.equal(store.getSnapshot().currency, 'USD');
  assert.equal(store.getSnapshot().expenses[0].amountMinor, 5000);
  await store.remove(id);
  assert.deepEqual(store.getSnapshot().expenses, []);
});

test('failed saves preserve history and allow retry with the same draft', async () => {
  const disk = storage(); const store = new ExpenseStore(disk.repo, { request: offline }); await store.initialize();
  disk.fail(true);
  await assert.rejects(store.save(input), /Disk full/);
  assert.equal(store.getSnapshot().busy, false);
  assert.deepEqual(store.getSnapshot().expenses, []);
  disk.fail(false);
  assert.equal(await store.save(input), true);
  assert.equal(store.getSnapshot().expenses.length, 1);
});

test('in-flight submissions cannot create duplicate expenses', async () => {
  const disk = storage(); const store = new ExpenseStore(disk.repo, { request: offline }); await store.initialize();
  const release = disk.pauseNext('save');
  const first = store.save(input);
  assert.equal(store.getSnapshot().busy, true);
  assert.equal(await store.save(input), false);
  release(); await first;
  assert.equal(store.getSnapshot().expenses.length, 1);
  assert.equal((await disk.repo.list()).length, 1);
});

test('failed deletion and currency changes leave visible data unchanged', async () => {
  const disk = storage(); const store = new ExpenseStore(disk.repo, { request: offline }); await store.initialize(); await store.save(input);
  disk.fail(true);
  await assert.rejects(store.remove(store.getSnapshot().expenses[0].id));
  await assert.rejects(store.setCurrency('EUR'));
  assert.equal(store.getSnapshot().expenses.length, 1);
  assert.equal(store.getSnapshot().currency, 'MXN');
});

test('initialization errors can be retried without clearing storage', async () => {
  const disk = storage(); disk.fail(true); const store = new ExpenseStore(disk.repo, { request: offline });
  await store.initialize();
  assert.equal(store.getSnapshot().ready, false);
  assert.match(store.getSnapshot().error ?? '', /Disk unavailable/);
  disk.fail(false); await store.initialize();
  assert.equal(store.getSnapshot().ready, true);
  assert.equal(store.getSnapshot().error, null);
});

test('loads seeded expenses and currency without exposing mutable storage records', async () => {
  const disk = storage({ expenses: sampleExpenses, currency: 'EUR' });
  const store = new ExpenseStore(disk.repo, { request: offline }); await store.initialize();
  assert.equal(store.getSnapshot().currency, 'EUR');
  assert.equal(store.getSnapshot().expenses.length, 3);
  assert.equal(store.getSnapshot().expenses[0].note, 'Weekly groceries');
  store.getSnapshot().expenses[0].note = 'Changed outside storage';
  const reopened = new ExpenseStore(disk.repo, { request: offline }); await reopened.initialize();
  assert.equal(reopened.getSnapshot().expenses[0].note, 'Weekly groceries');
});

test('a one-time history read failure is recoverable and retains seeded expenses', async () => {
  const disk = storage({ expenses: sampleExpenses });
  disk.failNext('list', new Error('Storage is temporarily locked'));
  const store = new ExpenseStore(disk.repo, { request: offline }); await store.initialize();
  assert.equal(store.getSnapshot().ready, false);
  assert.match(store.getSnapshot().error ?? '', /temporarily locked/);
  await store.initialize();
  assert.equal(store.getSnapshot().ready, true);
  assert.equal(store.getSnapshot().expenses.length, 3);
});

test('a failed currency read does not mark partially loaded data as ready', async () => {
  const disk = storage({ expenses: sampleExpenses, currency: 'USD' });
  disk.failNext('getCurrency', new Error('Cannot read settings'));
  const store = new ExpenseStore(disk.repo, { request: offline }); await store.initialize();
  assert.equal(store.getSnapshot().ready, false);
  assert.deepEqual(store.getSnapshot().expenses, []);
  await store.initialize();
  assert.equal(store.getSnapshot().currency, 'USD');
  assert.equal(store.getSnapshot().expenses.length, 3);
});

test('adding after deletion preserves remaining expenses with distinct identities', async () => {
  const disk = storage({ expenses: sampleExpenses });
  const store = new ExpenseStore(disk.repo, { request: offline }); await store.initialize();
  await store.remove(2);
  await store.save(input);
  assert.deepEqual(store.getSnapshot().expenses.map(e => e.id).sort((a, b) => a - b), [1, 3, 4]);
  assert.equal(store.getSnapshot().expenses.find(e => e.id === 3)?.note, 'Coffee');
});

test('a delayed save keeps history unchanged until storage confirms success', async () => {
  const disk = storage(); const store = new ExpenseStore(disk.repo, { request: offline }); await store.initialize();
  const resume = disk.pauseNext('save');
  const saving = store.save(input);
  assert.deepEqual(store.getSnapshot().expenses, []);
  assert.equal(store.getSnapshot().busy, true);
  resume(); await saving;
  assert.equal(store.getSnapshot().expenses[0].note, 'Lunch');
  assert.equal(store.getSnapshot().busy, false);
});

test('loading sample expenses updates visible data immediately', async () => {
  const disk = storage(); const store = new ExpenseStore(disk.repo, { request: offline }); await store.initialize();
  assert.equal(await store.loadDemoData(), true);
  assert.equal(store.getSnapshot().expenses.length, 5);
  assert.equal(store.getSnapshot().expenses.reduce((sum, entry) => sum + entry.amountMinor, 0), 44450);
  await assert.rejects(store.loadDemoData(), /empty/i);
  assert.equal(store.getSnapshot().expenses.length, 5);
});

test('failed explicit sample loading leaves the list empty and can be retried', async () => {
  const disk = storage(); const store = new ExpenseStore(disk.repo, { request: offline }); await store.initialize();
  disk.failNext('loadDemoData', new Error('Disk full'));
  await assert.rejects(store.loadDemoData(), /Disk full/);
  assert.deepEqual(store.getSnapshot().expenses, []);
  assert.equal(store.getSnapshot().busy, false);
  await store.loadDemoData();
  assert.equal(store.getSnapshot().expenses.length, 5);
});
