import { CURRENCIES, validateInput, type Currency, type Expense, type ExpenseInput } from '../domain/expenses.ts';
import { validateRates, type Rate } from '../domain/currency.ts';
import { createDemoExpenses } from '../demo-data.ts';

type Param = string | number | null;
// Structural boundary implemented by Expo SQLite and exercised using real Node SQLite in tests.
export interface Database {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: Param[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync<T>(sql: string, ...params: Param[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, ...params: Param[]): Promise<T | null>;
}
export type Repository = ReturnType<typeof createRepository>;

export function createRepository(db: Database, options: { demoData?: boolean; now?: () => Date } = {}) {
  return {
    async initialize() {
      const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
      if ((version?.user_version ?? 0) > 2) throw new Error('This database was created by a newer app. Update the app to open it.');
      await db.execAsync('PRAGMA journal_mode = WAL;');
      if ((version?.user_version ?? 0) === 0) await db.execAsync(`
        BEGIN TRANSACTION;
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amountMinor INTEGER NOT NULL CHECK(amountMinor > 0),
          category TEXT NOT NULL,
          date TEXT NOT NULL,
          note TEXT NOT NULL DEFAULT '',
          originalAmountMinor INTEGER,
          originalCurrency TEXT,
          rateSnapshot TEXT,
          createdAt TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS expenses_date ON expenses(date DESC);
        CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        PRAGMA user_version = 2;
        COMMIT;
      `).catch(async (error: unknown) => {
        try { await db.execAsync('ROLLBACK;'); } catch { /* Preserve the initialization error. */ }
        throw error;
      });
      if (version?.user_version === 1) await db.execAsync(`
        BEGIN TRANSACTION;
        ALTER TABLE expenses ADD COLUMN originalAmountMinor INTEGER;
        ALTER TABLE expenses ADD COLUMN originalCurrency TEXT;
        ALTER TABLE expenses ADD COLUMN rateSnapshot TEXT;
        PRAGMA user_version = 2;
        COMMIT;
      `).catch(async (error: unknown) => {
        try { await db.execAsync('ROLLBACK;'); } catch { /* Preserve the initialization error. */ }
        throw error;
      });
      // One atomic, idempotent migration: never reinterpret amounts after display changes.
      await db.runAsync(`INSERT OR IGNORE INTO settings (key, value)
        SELECT 'baseCurrency', COALESCE((SELECT value FROM settings WHERE key = 'currency' AND value IN ('MXN', 'USD', 'EUR')), 'MXN')`);
      if (options.demoData) await seedDemoData(db, options.now?.() ?? new Date());
    },
    async list(): Promise<Expense[]> {
      return db.getAllAsync<Expense>('SELECT * FROM expenses ORDER BY date DESC, createdAt DESC, id DESC');
    },
    async loadDemoData(): Promise<Expense[]> {
      return seedDemoData(db, options.now?.() ?? new Date(), true);
    },
    async save(input: ExpenseInput, id?: number): Promise<number> {
      const item = validateInput(input);
      if (id !== undefined) {
        const result = await db.runAsync('UPDATE expenses SET amountMinor = ?, category = ?, date = ?, note = ?, originalAmountMinor = ?, originalCurrency = ?, rateSnapshot = ? WHERE id = ?', item.amountMinor, item.category, item.date, item.note, item.originalAmountMinor ?? null, item.originalCurrency ?? null, item.rateSnapshot ?? null, id);
        if (!result.changes) throw new Error('This expense no longer exists.');
        return id;
      }
      const result = await db.runAsync('INSERT INTO expenses (amountMinor, category, date, note, originalAmountMinor, originalCurrency, rateSnapshot, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', item.amountMinor, item.category, item.date, item.note, item.originalAmountMinor ?? null, item.originalCurrency ?? null, item.rateSnapshot ?? null, new Date().toISOString());
      return result.lastInsertRowId;
    },
    async remove(id: number) { await db.runAsync('DELETE FROM expenses WHERE id = ?', id); },
    async getBaseCurrency(): Promise<Currency> {
      const setting = await db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'baseCurrency'");
      if (!CURRENCIES.includes(setting?.value as Currency)) throw new Error('Unable to read the original currency.');
      return setting!.value as Currency;
    },
    async getRateCache(): Promise<Rate[] | null> {
      const base = await this.getBaseCurrency();
      const setting = await db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'exchangeRates'");
      if (!setting) return null;
      try { return validateRates(JSON.parse(setting.value), base); } catch { return null; }
    },
    async setRateCache(rates: Rate[]) {
      const validated = validateRates(rates, await this.getBaseCurrency());
      await db.runAsync("INSERT INTO settings (key, value) VALUES ('exchangeRates', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", JSON.stringify(validated));
    },
    async getCurrency(): Promise<Currency> {
      const setting = await db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'currency'");
      return CURRENCIES.includes(setting?.value as Currency) ? setting!.value as Currency : 'MXN';
    },
    async setCurrency(currency: Currency) {
      if (!CURRENCIES.includes(currency)) throw new Error('Choose a supported currency.');
      await db.runAsync("INSERT INTO settings (key, value) VALUES ('currency', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", currency);
    },
  };
}

async function seedDemoData(db: Database, today: Date, explicit = false): Promise<Expense[]> {
  await db.execAsync('BEGIN IMMEDIATE;');
  try {
    const marker = await db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'demo_seeded'");
    if (explicit || !marker) {
      const count = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM expenses');
      if (explicit && count?.count !== 0) throw new Error('Your expense list must be empty before loading sample expenses.');
      if (count?.count === 0) {
        for (const input of createDemoExpenses(today)) {
          await db.runAsync('INSERT INTO expenses (amountMinor, category, date, note, createdAt) VALUES (?, ?, ?, ?, ?)', input.amountMinor, input.category, input.date, input.note, today.toISOString());
        }
      }
      // Record the decision even for a populated database, so deleting user data cannot trigger samples later.
      await db.runAsync("INSERT INTO settings (key, value) VALUES ('demo_seeded', '1') ON CONFLICT(key) DO UPDATE SET value = excluded.value");
    }
    const expenses = await db.getAllAsync<Expense>('SELECT * FROM expenses ORDER BY date DESC, createdAt DESC, id DESC');
    await db.execAsync('COMMIT;');
    return expenses;
  } catch (error) {
    try { await db.execAsync('ROLLBACK;'); } catch { /* Preserve the original storage error. */ }
    throw error;
  }
}
