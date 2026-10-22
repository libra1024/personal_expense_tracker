import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRepository, type Database } from '../src/repository.ts';

// Execute production SQL against real SQLite; only bridge async Expo methods.
function adapter(db: DatabaseSync): Database {
  return {
    async execAsync(sql) { db.exec(sql); },
    async runAsync(sql, ...params) { const r = db.prepare(sql).run(...params as SQLInputValue[]); return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) }; },
    async getAllAsync<T>(sql: string, ...params: (string | number | null)[]) { return db.prepare(sql).all(...params) as T[]; },
    async getFirstAsync<T>(sql: string, ...params: (string | number | null)[]) { return (db.prepare(sql).get(...params) as T) ?? null; },
  };
}

test('locks the existing currency as base once without changing expenses', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    const repo = createRepository(adapter(db)); await repo.initialize();
    // Reproduce a v1 installation with an existing preference and no base marker.
    db.exec("DELETE FROM settings WHERE key = 'baseCurrency'; INSERT OR REPLACE INTO settings VALUES ('currency', 'USD')");
    await repo.save(input);
    await repo.initialize();
    assert.equal(await repo.getBaseCurrency(), 'USD');
    await repo.setCurrency('EUR'); await repo.initialize();
    assert.equal(await repo.getBaseCurrency(), 'USD');
    assert.equal((await repo.list())[0].amountMinor, input.amountMinor);
  } finally { db.close(); }
});

test('validated exchange cache persists across reopening and rejects corrupt or mismatched data', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'pocket-rates-'));
  const file = join(folder, 'expenses.db'); let db = new DatabaseSync(file);
  const rates = [{ date: '2026-10-21', base: 'MXN', quote: 'USD', rate: 0.05407 }, { date: '2026-10-22', base: 'MXN', quote: 'EUR', rate: 0.04815 }] as const;
  try {
    let repo = createRepository(adapter(db)); await repo.initialize();
    assert.equal(await repo.getRateCache(), null);
    await repo.setRateCache([...rates]);
    db.close(); db = new DatabaseSync(file); repo = createRepository(adapter(db)); await repo.initialize();
    assert.deepEqual(await repo.getRateCache(), rates);
    await assert.rejects(repo.setRateCache([]), /rates/i);
    assert.deepEqual(await repo.getRateCache(), rates);
    for (const value of ['not json', '[]', JSON.stringify(rates.map(r => ({ ...r, base: 'USD' })))]) {
      db.prepare("UPDATE settings SET value = ? WHERE key = 'exchangeRates'").run(value);
      assert.equal(await repo.getRateCache(), null);
    }
  } finally { db.close(); rmSync(folder, { recursive: true }); }
});

const input = { amountMinor: 1234, category: 'Groceries', date: '2026-10-21', note: "bread's fresh" } as const;

test('freezes legacy base-currency expenses when the first rate cache is saved', async () => {
  const db = new DatabaseSync(':memory:');
  const firstRates = [{ date: '2026-10-21', base: 'MXN' as const, quote: 'USD' as const, rate: 1 / 18 }, { date: '2026-10-21', base: 'MXN' as const, quote: 'EUR' as const, rate: 0.05 }];
  const laterRates = [{ date: '2026-10-22', base: 'MXN' as const, quote: 'USD' as const, rate: 1 / 20 }, { date: '2026-10-22', base: 'MXN' as const, quote: 'EUR' as const, rate: 0.04 }];
  try {
    const repo = createRepository(adapter(db)); await repo.initialize();
    const id = await repo.save(input);
    await repo.setRateCache(firstRates);
    let saved = (await repo.list()).find(entry => entry.id === id)!;
    assert.equal(saved.originalAmountMinor, input.amountMinor);
    assert.equal(saved.originalCurrency, 'MXN');
    assert.equal(saved.rateSnapshot, JSON.stringify(firstRates));
    await repo.setRateCache(laterRates);
    saved = (await repo.list()).find(entry => entry.id === id)!;
    assert.equal(saved.rateSnapshot, JSON.stringify(firstRates));
  } finally { db.close(); }
});

test('migrates and persists an immutable original-currency rate snapshot', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    const repo = createRepository(adapter(db)); await repo.initialize();
    const snapshot = JSON.stringify([{ date: '2026-10-21', base: 'MXN', quote: 'USD', rate: 1 / 18 }, { date: '2026-10-21', base: 'MXN', quote: 'EUR', rate: 0.05 }]);
    const id = await repo.save({ ...input, amountMinor: 144000, originalAmountMinor: 8000, originalCurrency: 'USD', rateSnapshot: snapshot });
    const saved = (await repo.list()).find(entry => entry.id === id)!;
    assert.equal(saved.amountMinor, 144000);
    assert.equal(saved.originalAmountMinor, 8000);
    assert.equal(saved.originalCurrency, 'USD');
    assert.equal(saved.rateSnapshot, snapshot);
    assert.equal(db.prepare('PRAGMA user_version').get()?.user_version, 3);
  } finally { db.close(); }
});

test('persists creation and last-modified times for an expense', async () => {
  const db = new DatabaseSync(':memory:');
  let now = new Date('2026-10-22T10:15:00.000Z');
  try {
    const repo = createRepository(adapter(db), { now: () => now }); await repo.initialize();
    const id = await repo.save(input);
    now = new Date('2026-10-22T11:45:00.000Z');
    await repo.save({ ...input, note: 'Edited bread' }, id);
    const saved = (await repo.list()).find(entry => entry.id === id) as typeof input & { createdAt: string; updatedAt?: string };
    assert.equal(saved.createdAt, '2026-10-22T10:15:00.000Z');
    assert.equal(saved.updatedAt, '2026-10-22T11:45:00.000Z');
  } finally { db.close(); }
});

test('migrates version-two records with their existing creation time as last modified', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(`CREATE TABLE expenses (id INTEGER PRIMARY KEY AUTOINCREMENT, amountMinor INTEGER NOT NULL, category TEXT NOT NULL, date TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', originalAmountMinor INTEGER, originalCurrency TEXT, rateSnapshot TEXT, createdAt TEXT NOT NULL);
      CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      INSERT INTO expenses (amountMinor, category, date, note, createdAt) VALUES (1234, 'Groceries', '2026-10-21', 'Bread', '2026-10-21T10:15:00.000Z');
      PRAGMA user_version = 2;`);
    const repo = createRepository(adapter(db)); await repo.initialize();
    const [saved] = await repo.list();
    assert.equal(saved.createdAt, '2026-10-21T10:15:00.000Z');
    assert.equal(saved.updatedAt, '2026-10-21T10:15:00.000Z');
    assert.equal(db.prepare('PRAGMA user_version').get()?.user_version, 3);
  } finally { db.close(); }
});

test('migrates idempotently and persists CRUD and settings across reopening', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'pocket-test-'));
  const file = join(folder, 'expenses.db');
  let db = new DatabaseSync(file);
  try {
    const repo = createRepository(adapter(db));
    await repo.initialize();
    await repo.initialize();
    assert.deepEqual(await repo.list(), []);
    assert.equal(await repo.getCurrency(), 'MXN');
    const id = await repo.save(input);
    assert.equal((await repo.list())[0].note, "bread's fresh");
    await repo.save({ ...input, amountMinor: 2000, category: 'Transport' }, id);
    assert.equal((await repo.list()).length, 1);
    assert.equal((await repo.list())[0].amountMinor, 2000);
    await repo.setCurrency('EUR');
    db.close();
    db = new DatabaseSync(file);
    const reopened = createRepository(adapter(db));
    await reopened.initialize();
    assert.equal(await reopened.getCurrency(), 'EUR');
    assert.equal((await reopened.list())[0].category, 'Transport');
    await reopened.remove(id);
    assert.deepEqual(await reopened.list(), []);
  } finally { db.close(); rmSync(folder, { recursive: true }); }
});

test('rejects invalid records and refuses stale edits instead of adding a duplicate', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    const repo = createRepository(adapter(db)); await repo.initialize();
    await assert.rejects(repo.save({ ...input, amountMinor: 0 }));
    await assert.rejects(repo.save({ ...input, date: '2026-02-30' }));
    await assert.rejects(repo.save(input, 999), /no longer/i);
    assert.deepEqual(await repo.list(), []);
  } finally { db.close(); }
});

test('does not downgrade an unknown future database version', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('PRAGMA user_version = 99');
    await assert.rejects(createRepository(adapter(db)).initialize(), /newer/i);
    assert.equal(db.prepare('PRAGMA user_version').get()?.user_version, 99);
  } finally { db.close(); }
});

test('mobile demo data populates the current month once and is editable', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    const repo = createRepository(adapter(db), { demoData: true, now: () => new Date(2026, 0, 1, 12) });
    await repo.initialize();
    const entries = await repo.list();
    assert.equal(entries.length, 5);
    assert.equal(entries.reduce((sum, entry) => sum + entry.amountMinor, 0), 44450);
    assert.ok(entries.every(entry => entry.date === '2026-01-01' && entry.note.startsWith('Sample ·')));
    await repo.save({ ...entries[0], note: 'Edited on phone' }, entries[0].id);
    await repo.initialize();
    assert.equal((await repo.list()).length, 5);
    assert.equal((await repo.list()).find(entry => entry.id === entries[0].id)?.note, 'Edited on phone');
    for (const entry of entries) await repo.remove(entry.id);
    await repo.initialize();
    assert.deepEqual(await repo.list(), []);
  } finally { db.close(); }
});

test('demo data also loads into an existing empty database', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    await createRepository(adapter(db)).initialize();
    const mobile = createRepository(adapter(db), { demoData: true });
    await mobile.initialize();
    assert.equal((await mobile.list()).length, 5);
  } finally { db.close(); }
});

test('demo data never mixes with existing expenses or returns after their deletion', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    const repo = createRepository(adapter(db)); await repo.initialize();
    const id = await repo.save(input);
    const mobile = createRepository(adapter(db), { demoData: true }); await mobile.initialize();
    assert.equal((await mobile.list()).length, 1);
    assert.equal((await mobile.list())[0].note, "bread's fresh");
    await mobile.remove(id); await mobile.initialize();
    assert.deepEqual(await mobile.list(), []);
  } finally { db.close(); }
});

test('a failed demo import rolls back all sample records and can be retried', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    const base = adapter(db);
    let writes = 0;
    const faulty: Database = { ...base, async runAsync(sql, ...params) {
      if (sql.startsWith('INSERT INTO expenses') && ++writes === 3) throw new Error('Disk full');
      return base.runAsync(sql, ...params);
    } };
    await assert.rejects(createRepository(faulty, { demoData: true }).initialize(), /Disk full/);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM expenses').get()?.count, 0);
    const retry = createRepository(base, { demoData: true }); await retry.initialize();
    assert.equal((await retry.list()).length, 5);
  } finally { db.close(); }
});

test('explicit demo loading restores deleted examples without requiring an app restart', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    const repo = createRepository(adapter(db), { demoData: true }); await repo.initialize();
    for (const entry of await repo.list()) await repo.remove(entry.id);
    assert.deepEqual(await repo.list(), []);
    const loaded = await repo.loadDemoData();
    assert.equal(loaded.length, 5);
    assert.equal((await repo.list()).length, 5);
  } finally { db.close(); }
});

test('explicit demo loading refuses to mix with existing records', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    const repo = createRepository(adapter(db)); await repo.initialize(); await repo.save(input);
    await assert.rejects(repo.loadDemoData(), /empty/i);
    assert.equal((await repo.list()).length, 1);
    assert.equal((await repo.list())[0].note, "bread's fresh");
  } finally { db.close(); }
});
