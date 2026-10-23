import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Expense } from '../src/domain/expenses.ts';

import {
  createExpenseEditorDraft,
  hasExpenseDraftChanges,
  buildExpenseInput,
} from '../src/presentation/expense-editor-model.ts';

/** Builds a minimal saved expense with explicit overrides for editor characterization. */
function savedExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 7,
    amountMinor: 12345,
    category: 'Groceries',
    date: '2026-01-15',
    note: 'Weekly groceries',
    createdAt: '2026-01-15T12:00:00.000Z',
    updatedAt: '2026-01-16T12:00:00.000Z',
    ...overrides,
  };
}

/** Preserves the empty new-expense defaults and a caller-supplied local calendar date. */
test('editor initializes a new draft in the storage currency', () => {
  assert.deepEqual(createExpenseEditorDraft(undefined, 'MXN', '2026-01-15'), {
    amount: '',
    transactionCurrency: 'MXN',
    category: '',
    date: '2026-01-15',
    note: '',
  });
});

/** Restores original transaction values rather than displaying the converted storage amount. */
test('editor restores saved original-currency amounts and legacy base amounts exactly', () => {
  const original = savedExpense({ originalAmountMinor: 701, originalCurrency: 'USD' });
  assert.deepEqual(createExpenseEditorDraft(original, 'MXN'), {
    amount: '7.01',
    transactionCurrency: 'USD',
    category: 'Groceries',
    date: '2026-01-15',
    note: 'Weekly groceries',
  });
  assert.equal(createExpenseEditorDraft(savedExpense(), 'MXN').amount, '123.45');
  assert.equal(
    createExpenseEditorDraft(savedExpense({ amountMinor: Number.MAX_SAFE_INTEGER }), 'MXN').amount,
    '90071992547409.91',
  );
  assert.equal(createExpenseEditorDraft(savedExpense({ amountMinor: 1 }), 'MXN').amount, '0.01');
});

/** Detects each editable value without normalizing away unsaved text changes. */
test('editor detects changes to every draft field and recognizes reverted edits', () => {
  const initial = createExpenseEditorDraft(savedExpense(), 'MXN');
  assert.equal(hasExpenseDraftChanges({ ...initial }, initial), false);
  const changes = {
    amount: '123.450',
    transactionCurrency: 'USD' as const,
    category: 'Transport' as const,
    date: '2026-01-16',
    note: 'Weekly groceries ',
  };
  for (const [field, value] of Object.entries(changes)) {
    assert.equal(hasExpenseDraftChanges({ ...initial, [field]: value }, initial), true, field);
  }
  assert.equal(hasExpenseDraftChanges({ ...initial, note: initial.note }, initial), false);
});

/** Keeps local currency entry usable without a network rate cache. */
test('editor prepares an offline base-currency save with trimmed notes and exact cents', () => {
  const draft = {
    ...createExpenseEditorDraft(savedExpense(), 'MXN'),
    amount: '12,34',
    note: '  groceries  ',
  };
  assert.deepEqual(buildExpenseInput(draft, 'MXN', null), {
    amountMinor: 1234,
    originalAmountMinor: 1234,
    originalCurrency: 'MXN',
    category: 'Groceries',
    date: '2026-01-15',
    note: 'groceries',
    rateSnapshot: undefined,
  });
  assert.equal(draft.note, '  groceries  ', 'validation must not mutate editable inputs');
});

/** Delegates conversion to domain rules and captures the supplied rate cache without mutating it. */
test('editor prepares foreign-currency saves using the supplied cached rates', () => {
  const rates = [
    { base: 'MXN' as const, quote: 'USD' as const, rate: 0.05, date: '2026-01-14' },
    { base: 'MXN' as const, quote: 'EUR' as const, rate: 0.04, date: '2026-01-14' },
  ];
  const draft = {
    ...createExpenseEditorDraft(savedExpense(), 'MXN'),
    amount: '1.23',
    transactionCurrency: 'USD' as const,
  };
  const snapshot = JSON.stringify(rates);
  const input = buildExpenseInput(draft, 'MXN', rates);
  assert.equal(input.amountMinor, 2460);
  assert.equal(input.originalAmountMinor, 123);
  assert.equal(input.originalCurrency, 'USD');
  assert.equal(input.rateSnapshot, snapshot);
  assert.equal(JSON.stringify(rates), snapshot);
  assert.throws(() => buildExpenseInput(draft, 'MXN', null), /Saved MXN rates are required/);
});

/** Retains the existing domain validation errors before any persistence request can run. */
test('editor rejects invalid amounts, categories, dates, and oversized notes', () => {
  const draft = createExpenseEditorDraft(savedExpense(), 'MXN');
  for (const amount of ['', '0', '-1', '1.001', '90071992547409.92']) {
    assert.throws(() => buildExpenseInput({ ...draft, amount }, 'MXN', null));
  }
  assert.throws(
    () => buildExpenseInput({ ...draft, category: '' }, 'MXN', null),
    /Choose a category/,
  );
  assert.throws(
    () => buildExpenseInput({ ...draft, date: '2026-02-30' }, 'MXN', null),
    /Choose a valid date/,
  );
  assert.throws(
    () => buildExpenseInput({ ...draft, note: 'x'.repeat(501) }, 'MXN', null),
    /under 500 characters/,
  );
});
