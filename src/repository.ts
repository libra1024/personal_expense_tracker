import { CURRENCIES, validateInput, type Currency, type Expense, type ExpenseInput } from './expenses.ts';
import { createDemoExpenses } from './demo-data.ts';

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
      if ((version?.user_version ?? 0) > 1) throw new Error('This database was created by a newer app. Update the app to open it.');
      await db.execAsync('PRAGMA journal_mode = WAL;');
      if (version?.user_version !== 1) await db.execAsync(`
        BEGIN TRANSACTION;
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amountMinor INTEGER NOT NULL CHECK(amountMinor > 0),
          category TEXT NOT NULL,
          date TEXT NOT NULL,
          note TEXT NOT NULL DEFAULT '',
          createdAt TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS expenses_date ON expenses(date DESC);
        CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        PRAGMA user_version = 1;
        COMMIT;
      `).catch(async (error: unknown) => {
        try { await db.execAsync('ROLLBACK;'); } catch { /* Preserve the initialization error. */ }
        throw error;
      });
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
        const result = await db.runAsync('UPDATE expenses SET amountMinor = ?, category = ?, date = ?, note = ? WHERE id = ?', item.amountMinor, item.category, item.date, item.note, id);
        if (!result.changes) throw new Error('This expense no longer exists.');
        return id;
      }
      const result = await db.runAsync('INSERT INTO expenses (amountMinor, category, date, note, createdAt) VALUES (?, ?, ?, ?, ?)', item.amountMinor, item.category, item.date, item.note, new Date().toISOString());
      return result.lastInsertRowId;
    },
    async remove(id: number) { await db.runAsync('DELETE FROM expenses WHERE id = ?', id); },
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
