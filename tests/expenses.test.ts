import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseAmount, formatMoney, monthKey, shiftMonth, localDate, isValidDate,
  filterExpenses, summarize, groupByDate, validateDraft,
} from '../src/expenses.ts';

test('decimal amounts become exact integer cents', () => {
  assert.equal(parseAmount('0.10'), 10);
  assert.equal(parseAmount('12,34'), 1234);
  assert.equal(parseAmount(' 0012.5 '), 1250);
  assert.equal(parseAmount('90071992547409.91'), Number.MAX_SAFE_INTEGER);
});

test('rejects invalid, zero, negative, and unsafe amounts', () => {
  for (const input of ['', '0', '0.00', '-1', '1.001', '1e3', '12abc', '1,000.00', 'Infinity', '90071992547409.92']) {
    assert.throws(() => parseAmount(input), Error, input);
  }
});

test('currency codes make pesos and dollars unambiguous', () => {
  assert.match(formatMoney(1234, 'MXN'), /MXN\s*12\.34/);
  assert.match(formatMoney(1234, 'USD'), /USD\s*12\.34/);
  assert.match(formatMoney(1234, 'EUR'), /EUR\s*12\.34/);
});

test('calendar dates and month navigation do not use UTC or overflow at month end', () => {
  assert.equal(localDate(new Date(2026, 0, 31, 23, 55)), '2026-01-31');
  assert.equal(monthKey(new Date(2026, 0, 31)), '2026-01');
  assert.equal(shiftMonth('2026-01', 1), '2026-02');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(isValidDate('2024-02-29'), true);
  assert.equal(isValidDate('2026-02-29'), false);
  assert.equal(isValidDate('2026-04-31'), false);
});

const expenses = [
  { id: 1, amountMinor: 10, category: 'Groceries', date: '2026-02-28', note: '', createdAt: '2026-02-28T00:00:00Z' },
  { id: 2, amountMinor: 20, category: 'Groceries', date: '2026-03-01', note: '', createdAt: '2026-03-01T00:00:00Z' },
  { id: 3, amountMinor: 30, category: 'Transport', date: '2026-03-01', note: '', createdAt: '2026-03-01T00:01:00Z' },
] as const;

test('filters by calendar month and category and orders newest first', () => {
  assert.deepEqual(filterExpenses(expenses, '2026-03').map(e => e.id), [3, 2]);
  assert.deepEqual(filterExpenses(expenses, '2026-03', 'Groceries').map(e => e.id), [2]);
  assert.deepEqual(groupByDate(filterExpenses(expenses, '2026-03')).map(g => [g.date, g.expenses.length]), [['2026-03-01', 2]]);
  assert.equal(expenses[0].id, 1);
});

test('summaries use exact cents, sort categories, and handle no expenses', () => {
  const result = summarize(filterExpenses(expenses, '2026-03'));
  assert.equal(result.totalMinor, 50);
  assert.equal(result.count, 2);
  assert.deepEqual(result.categories, [{ category: 'Transport', totalMinor: 30 }, { category: 'Groceries', totalMinor: 20 }]);
  assert.deepEqual(summarize([]), { totalMinor: 0, count: 0, categories: [] });
  assert.throws(() => summarize([{ ...expenses[0], amountMinor: Number.MAX_SAFE_INTEGER }, expenses[1]]), /large/i);
});

test('draft validation requires a known category and a real date, trims notes', () => {
  assert.deepEqual(validateDraft({ amount: '12.34', category: 'Groceries', date: '2026-10-21', note: ' bread ' }), {
    amountMinor: 1234, category: 'Groceries', date: '2026-10-21', note: 'bread',
  });
  assert.throws(() => validateDraft({ amount: '1', category: '', date: '2026-10-21', note: '' }), /category/i);
  assert.throws(() => validateDraft({ amount: '1', category: 'Other', date: '2026-02-30', note: '' }), /date/i);
});
