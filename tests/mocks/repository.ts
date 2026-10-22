import type { Currency, Expense } from '../../src/expenses.ts';
import type { Repository } from '../../src/repository.ts';
import type { Rate } from '../../src/currency.ts';
import { createDemoExpenses } from '../../src/demo-data.ts';

type Operation = keyof Repository;
type Options = { expenses?: readonly Expense[]; currency?: Currency; now?: () => string; freezeLegacyOnRateCache?: boolean };

/** In-memory storage boundary for store tests. Each factory call has isolated state. */
export function createMockRepository(options: Options = {}) {
  let entries = (options.expenses ?? []).map(expense => ({ ...expense }));
  let currency = options.currency ?? 'MXN';
  const baseCurrency = currency;
  let rates: Rate[] | null = null;
  let nextId = Math.max(0, ...entries.map(expense => expense.id)) + 1;
  let unavailable = false;
  const failures = new Map<Operation, Error[]>();
  const pauses = new Map<Operation, Promise<void>[]>();
  const now = options.now ?? (() => new Date().toISOString());

  async function before(operation: Operation) {
    const queue = pauses.get(operation);
    const pause = queue?.shift();
    if (pause) await pause;
    const error = failures.get(operation)?.shift();
    if (error) throw error;
    if (unavailable) throw new Error(operation === 'initialize' ? 'Disk unavailable' : 'Disk full');
  }

  const repo: Repository = {
    async initialize() { await before('initialize'); },
    async list() {
      await before('list');
      return entries.map(expense => ({ ...expense }))
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
    },
    async loadDemoData() {
      await before('loadDemoData');
      if (entries.length) throw new Error('Your expense list must be empty before loading sample expenses.');
      const createdAt = now();
      entries = createDemoExpenses(new Date(createdAt)).map(expense => ({ ...expense, id: nextId++, createdAt, updatedAt: createdAt }));
      return entries.map(expense => ({ ...expense }));
    },
    async getBaseCurrency() { await before('getBaseCurrency'); return baseCurrency; },
    async getRateCache() { await before('getRateCache'); return rates?.map(r => ({ ...r })) ?? null; },
    async setRateCache(value) {
      await before('setRateCache');
      rates = value.map(r => ({ ...r }));
      if (options.freezeLegacyOnRateCache) entries = entries.map(expense => expense.rateSnapshot ? expense : {
        ...expense,
        originalAmountMinor: expense.originalAmountMinor ?? expense.amountMinor,
        originalCurrency: expense.originalCurrency ?? baseCurrency,
        rateSnapshot: JSON.stringify(rates),
      });
    },
    async getCurrency() { await before('getCurrency'); return currency; },
    async setCurrency(value) { await before('setCurrency'); currency = value; },
    async save(value, id) {
      await before('save');
      const original = entries.find(expense => expense.id === id);
      if (id !== undefined && !original) throw new Error('This expense no longer exists.');
      const key = id ?? nextId++;
      const timestamp = now();
      const expense: Expense = { ...value, note: value.note.trim(), id: key, createdAt: original?.createdAt ?? timestamp, updatedAt: timestamp };
      entries = [...entries.filter(item => item.id !== key), expense];
      return key;
    },
    async remove(id) { await before('remove'); entries = entries.filter(expense => expense.id !== id); },
  };

  return {
    repo,
    /** Simulate persistent storage unavailability; false restores access. */
    fail(value: boolean) { unavailable = value; },
    /** Fail only the next call to this operation, then recover automatically. */
    failNext(operation: Operation, error = new Error(`Storage operation failed: ${operation}`)) {
      failures.set(operation, [...(failures.get(operation) ?? []), error]);
    },
    /** Pause the next operation until the returned release function is called. */
    pauseNext(operation: Operation): () => void {
      let release!: () => void;
      const pause = new Promise<void>(resolve => { release = resolve; });
      pauses.set(operation, [...(pauses.get(operation) ?? []), pause]);
      return release;
    },
  };
}
