import {
  CURRENCIES,
  validateInput,
  type Currency,
  type Expense,
  type ExpenseInput,
} from "../domain/expenses.ts";
import { validateRates, type Rate } from "../domain/currency.ts";
import { createDemoExpenses } from "../demo-data.ts";

type Param = string | number | null;
// Structural boundary implemented by Expo SQLite and exercised using real Node SQLite in tests.
export interface Database {
  execAsync(sql: string): Promise<void>;
  runAsync(
    sql: string,
    ...params: Param[]
  ): Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync<T>(sql: string, ...params: Param[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, ...params: Param[]): Promise<T | null>;
}
export type Repository = ReturnType<typeof createRepository>;

/** Creates the SQLite adapter that persists active expenses and retains removed records for audit history. */
export function createRepository(
  db: Database,
  options: { demoData?: boolean; now?: () => Date } = {},
) {
  return {
    /** Initializes the schema and applies each idempotent migration in order. */
    async initialize() {
      const version = await db.getFirstAsync<{ user_version: number }>(
        "PRAGMA user_version",
      );
      if ((version?.user_version ?? 0) > 4)
        throw new Error(
          "This database was created by a newer app. Update the app to open it.",
        );
      await db.execAsync("PRAGMA journal_mode = WAL;");
      if ((version?.user_version ?? 0) === 0)
        await db
          .execAsync(
            `
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
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          deletedAt TEXT
        );
        CREATE INDEX IF NOT EXISTS expenses_date ON expenses(date DESC);
        CREATE INDEX IF NOT EXISTS expenses_active_date ON expenses(date DESC, createdAt DESC, id DESC) WHERE deletedAt IS NULL;
        CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        PRAGMA user_version = 4;
        COMMIT;
      `,
          )
          .catch(async (error: unknown) => {
            try {
              await db.execAsync("ROLLBACK;");
            } catch {
              /* Preserve the initialization error. */
            }
            throw error;
          });
      if (version?.user_version === 1)
        await db
          .execAsync(
            `
        BEGIN TRANSACTION;
        ALTER TABLE expenses ADD COLUMN originalAmountMinor INTEGER;
        ALTER TABLE expenses ADD COLUMN originalCurrency TEXT;
        ALTER TABLE expenses ADD COLUMN rateSnapshot TEXT;
        PRAGMA user_version = 2;
        COMMIT;
      `,
          )
          .catch(async (error: unknown) => {
            try {
              await db.execAsync("ROLLBACK;");
            } catch {
              /* Preserve the initialization error. */
            }
            throw error;
          });
      if ((version?.user_version ?? 0) > 0 && (version?.user_version ?? 0) <= 2)
        await db
          .execAsync(
            `
        BEGIN TRANSACTION;
        ALTER TABLE expenses ADD COLUMN updatedAt TEXT;
        UPDATE expenses SET updatedAt = createdAt WHERE updatedAt IS NULL;
        PRAGMA user_version = 3;
        COMMIT;
      `,
          )
          .catch(async (error: unknown) => {
            try {
              await db.execAsync("ROLLBACK;");
            } catch {
              /* Preserve the initialization error. */
            }
            throw error;
          });
      if ((version?.user_version ?? 0) > 0 && (version?.user_version ?? 0) <= 3)
        await db
          .execAsync(
            `
        BEGIN TRANSACTION;
        ALTER TABLE expenses ADD COLUMN deletedAt TEXT;
        CREATE INDEX IF NOT EXISTS expenses_active_date ON expenses(date DESC, createdAt DESC, id DESC) WHERE deletedAt IS NULL;
        PRAGMA user_version = 4;
        COMMIT;
      `,
          )
          .catch(async (error: unknown) => {
            try {
              await db.execAsync("ROLLBACK;");
            } catch {
              /* Preserve the initialization error. */
            }
            throw error;
          });
      // One atomic, idempotent migration: never reinterpret amounts after display changes.
      await db.runAsync(`INSERT OR IGNORE INTO settings (key, value)
        SELECT 'baseCurrency', COALESCE((SELECT value FROM settings WHERE key = 'currency' AND value IN ('MXN', 'USD', 'EUR')), 'MXN')`);
      if (options.demoData)
        await seedDemoData(db, options.now?.() ?? new Date());
    },
    /** Lists only active expenses; logically deleted records remain in SQLite for audit history. */
    async list(): Promise<Expense[]> {
      return db.getAllAsync<Expense>(
        "SELECT * FROM expenses WHERE deletedAt IS NULL ORDER BY date DESC, createdAt DESC, id DESC",
      );
    },
    async loadDemoData(): Promise<Expense[]> {
      return seedDemoData(db, options.now?.() ?? new Date(), true);
    },
    /** Creates an expense or updates an active one without permitting a logical deletion to be overwritten. */
    async save(input: ExpenseInput, id?: number): Promise<number> {
      const item = validateInput(input);
      const timestamp = (options.now?.() ?? new Date()).toISOString();
      if (id !== undefined) {
        const result = await db.runAsync(
          "UPDATE expenses SET amountMinor = ?, category = ?, date = ?, note = ?, originalAmountMinor = ?, originalCurrency = ?, rateSnapshot = ?, updatedAt = ? WHERE id = ? AND deletedAt IS NULL",
          item.amountMinor,
          item.category,
          item.date,
          item.note,
          item.originalAmountMinor ?? null,
          item.originalCurrency ?? null,
          item.rateSnapshot ?? null,
          timestamp,
          id,
        );
        if (!result.changes) throw new Error("This expense no longer exists.");
        return id;
      }
      const result = await db.runAsync(
        "INSERT INTO expenses (amountMinor, category, date, note, originalAmountMinor, originalCurrency, rateSnapshot, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        item.amountMinor,
        item.category,
        item.date,
        item.note,
        item.originalAmountMinor ?? null,
        item.originalCurrency ?? null,
        item.rateSnapshot ?? null,
        timestamp,
        timestamp,
      );
      return result.lastInsertRowId;
    },
    /** Marks an active expense as deleted while retaining its persisted values and audit timestamp. */
    async remove(id: number) {
      const timestamp = (options.now?.() ?? new Date()).toISOString();
      await db.runAsync(
        "UPDATE expenses SET deletedAt = ?, updatedAt = ? WHERE id = ? AND deletedAt IS NULL",
        timestamp,
        timestamp,
        id,
      );
    },
    async getBaseCurrency(): Promise<Currency> {
      const setting = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'baseCurrency'",
      );
      if (!CURRENCIES.includes(setting?.value as Currency))
        throw new Error("Unable to read the original currency.");
      return setting!.value as Currency;
    },
    async getRateCache(): Promise<Rate[] | null> {
      const base = await this.getBaseCurrency();
      const setting = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'exchangeRates'",
      );
      if (!setting) return null;
      try {
        return validateRates(JSON.parse(setting.value), base);
      } catch {
        return null;
      }
    },
    async setRateCache(rates: Rate[]) {
      const base = await this.getBaseCurrency();
      const validated = validateRates(rates, base);
      const snapshot = JSON.stringify(validated);
      await db.execAsync("BEGIN IMMEDIATE;");
      try {
        await db.runAsync(
          "INSERT INTO settings (key, value) VALUES ('exchangeRates', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
          snapshot,
        );
        // Older records predate snapshots. Treat them as amounts in the fixed base
        // currency and freeze the first validated cache available after upgrade.
        await db.runAsync(
          "UPDATE expenses SET originalAmountMinor = COALESCE(originalAmountMinor, amountMinor), originalCurrency = COALESCE(originalCurrency, ?), rateSnapshot = ? WHERE rateSnapshot IS NULL",
          base,
          snapshot,
        );
        await db.execAsync("COMMIT;");
      } catch (error) {
        try {
          await db.execAsync("ROLLBACK;");
        } catch {
          /* Preserve the write error. */
        }
        throw error;
      }
    },
    async getCurrency(): Promise<Currency> {
      const setting = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'currency'",
      );
      return CURRENCIES.includes(setting?.value as Currency)
        ? (setting!.value as Currency)
        : "MXN";
    },
    async setCurrency(currency: Currency) {
      if (!CURRENCIES.includes(currency))
        throw new Error("Choose a supported currency.");
      await db.runAsync(
        "INSERT INTO settings (key, value) VALUES ('currency', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        currency,
      );
    },
  };
}

/** Adds sample records only when no active expenses exist, retaining logically deleted records intact. */
async function seedDemoData(
  db: Database,
  today: Date,
  explicit = false,
): Promise<Expense[]> {
  await db.execAsync("BEGIN IMMEDIATE;");
  try {
    const marker = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'demo_seeded'",
    );
    if (explicit || !marker) {
      const count = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM expenses WHERE deletedAt IS NULL",
      );
      if (explicit && count?.count !== 0)
        throw new Error(
          "Your expense list must be empty before loading sample expenses.",
        );
      if (count?.count === 0) {
        for (const input of createDemoExpenses(today)) {
          await db.runAsync(
            "INSERT INTO expenses (amountMinor, category, date, note, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
            input.amountMinor,
            input.category,
            input.date,
            input.note,
            today.toISOString(),
            today.toISOString(),
          );
        }
      }
      // Record the decision even for a populated database, so deleting user data cannot trigger samples later.
      await db.runAsync(
        "INSERT INTO settings (key, value) VALUES ('demo_seeded', '1') ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      );
    }
    const expenses = await db.getAllAsync<Expense>(
      "SELECT * FROM expenses WHERE deletedAt IS NULL ORDER BY date DESC, createdAt DESC, id DESC",
    );
    await db.execAsync("COMMIT;");
    return expenses;
  } catch (error) {
    try {
      await db.execAsync("ROLLBACK;");
    } catch {
      /* Preserve the original storage error. */
    }
    throw error;
  }
}
