export const CATEGORIES = [
  'Food & Drink', 'Groceries', 'Transport', 'Shopping', 'Bills',
  'Health', 'Entertainment', 'Travel', 'Other',
] as const;
export type Category = typeof CATEGORIES[number];
export const CURRENCIES = ['MXN', 'USD', 'EUR'] as const;
export type Currency = typeof CURRENCIES[number];
export type ExpenseInput = { amountMinor: number; category: Category; date: string; note: string; originalAmountMinor?: number; originalCurrency?: Currency; rateSnapshot?: string };
export type Expense = ExpenseInput & { id: number; createdAt: string; updatedAt: string };
export type Draft = { amount: string; category: string; date: string; note: string };

export function parseAmount(input: string): number {
  const value = input.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error('Enter an amount with up to two decimal places.');
  const [whole, fraction = ''] = value.split('.');
  const minor = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (minor <= 0n) throw new Error('Amount must be greater than zero.');
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('That amount is too large.');
  return Number(minor);
}

export function formatMoney(minor: number, currency: Currency): string {
  // Format the integer and fraction separately to preserve the final cent even at the safe-integer limit.
  const whole = Math.floor(minor / 100);
  const fraction = (minor % 100).toString().padStart(2, '0');
  return `${currency} ${whole.toLocaleString('en-US')}.${fraction}`;
}

export function localDate(date = new Date()): string {
  return `${date.getFullYear().toString().padStart(4, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1900 || year > 9999) return false;
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function monthKey(date = new Date()): string { return localDate(date).slice(0, 7); }
export function shiftMonth(month: string, delta: number): string {
  const [year, index] = month.split('-').map(Number);
  return monthKey(new Date(year, index - 1 + delta, 1, 12));
}
export function monthLabel(month: string): string {
  const [year, index] = month.split('-').map(Number);
  return new Date(year, index - 1, 1, 12).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function dateLabel(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function timestampLabel(value: string, locale = 'en-US', timeZone?: string): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return 'Unknown time';
  return timestamp.toLocaleString(locale, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone });
}

export function validateInput(input: ExpenseInput): ExpenseInput {
  if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor <= 0) throw new Error('Enter a valid positive amount.');
  if (!CATEGORIES.includes(input.category)) throw new Error('Choose a category.');
  if (!isValidDate(input.date)) throw new Error('Choose a valid date.');
  if (input.note.length > 500) throw new Error('Keep the note under 500 characters.');
  if (input.originalAmountMinor != null && (!Number.isSafeInteger(input.originalAmountMinor) || input.originalAmountMinor <= 0)) throw new Error('Enter a valid original amount.');
  if (input.originalCurrency != null && !CURRENCIES.includes(input.originalCurrency)) throw new Error('Choose a supported original currency.');
  if ((input.originalAmountMinor == null) !== (input.originalCurrency == null)) throw new Error('Original amount and currency must be saved together.');
  return { ...input, note: input.note.trim() };
}
export function validateDraft(draft: Draft): ExpenseInput {
  return validateInput({ amountMinor: parseAmount(draft.amount), category: draft.category as Category, date: draft.date, note: draft.note });
}

export function filterExpenses(expenses: readonly Expense[], month: string, category?: Category): Expense[] {
  return expenses.filter(e => e.date.slice(0, 7) === month && (!category || e.category === category))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
}

export function summarize(expenses: readonly Expense[]) {
  let totalMinor = 0;
  const totals = new Map<Category, number>();
  for (const expense of expenses) {
    totalMinor += expense.amountMinor;
    if (!Number.isSafeInteger(totalMinor)) throw new Error('This total is too large to display accurately.');
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amountMinor);
  }
  return { totalMinor, count: expenses.length, categories: [...totals].map(([category, amount]) => ({ category, totalMinor: amount })).sort((a, b) => b.totalMinor - a.totalMinor) };
}
export function groupByDate(expenses: readonly Expense[]): { date: string; expenses: Expense[] }[] {
  const groups = new Map<string, Expense[]>();
  for (const expense of expenses) groups.set(expense.date, [...(groups.get(expense.date) ?? []), expense]);
  return [...groups].map(([date, items]) => ({ date, expenses: items }));
}
