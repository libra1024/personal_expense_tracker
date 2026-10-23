import type { Expense } from '../../src/domain/expenses.ts';

/** Fictional records covering multiple days and months. Never loaded by the app. */
export const sampleExpenses: readonly Expense[] = [
  { id: 1, amountMinor: 7250, category: 'Groceries', date: '2026-10-21', note: 'Weekly groceries', createdAt: '2026-10-21T13:00:00Z', updatedAt: '2026-10-21T13:00:00Z' },
  { id: 2, amountMinor: 1800, category: 'Transport', date: '2026-10-20', note: 'Bus fare', createdAt: '2026-10-20T09:00:00Z', updatedAt: '2026-10-20T09:00:00Z' },
  { id: 3, amountMinor: 500, category: 'Food & Drink', date: '2026-09-30', note: 'Coffee', createdAt: '2026-09-30T08:00:00Z', updatedAt: '2026-09-30T08:00:00Z' },
];
