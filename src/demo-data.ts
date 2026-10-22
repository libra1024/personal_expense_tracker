import { localDate, type ExpenseInput } from './expenses.ts';

/** Fictional starter records, dated within the current local month for a visible overview. */
export function createDemoExpenses(today = new Date()): ExpenseInput[] {
  const items: Omit<ExpenseInput, 'date'>[] = [
    { amountMinor: 500, category: 'Food & Drink', note: 'Sample · Coffee' },
    { amountMinor: 7250, category: 'Groceries', note: 'Sample · Weekly groceries' },
    { amountMinor: 1800, category: 'Transport', note: 'Sample · Bus fare' },
    { amountMinor: 12900, category: 'Entertainment', note: 'Sample · Movie night' },
    { amountMinor: 22000, category: 'Bills', note: 'Sample · Internet bill' },
  ];
  return items.map((item, index) => ({ ...item, date: localDate(new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - index), 12)) }));
}
