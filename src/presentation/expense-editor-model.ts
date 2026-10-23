import { toBaseMinor, type Rate } from '../domain/currency.ts';
import {
  localDate,
  validateDraft,
  type Category,
  type Currency,
  type Expense,
  type ExpenseInput,
} from '../domain/expenses.ts';

/** Holds editable input text separately from validated, integer-cent expense records. */
export type ExpenseEditorDraft = {
  amount: string;
  transactionCurrency: Currency;
  category: Category | '';
  date: string;
  note: string;
};

/** Restores original transaction values or initializes a blank, local-date expense draft. */
export function createExpenseEditorDraft(
  original: Expense | undefined,
  baseCurrency: Currency,
  today = localDate(),
): ExpenseEditorDraft {
  const amountMinor = original?.originalAmountMinor ?? original?.amountMinor;
  return {
    amount: amountMinor
      ? `${Math.floor(amountMinor / 100)}.${String(amountMinor % 100).padStart(2, '0')}`
      : '',
    transactionCurrency: original?.originalCurrency ?? baseCurrency,
    category: original?.category ?? '',
    date: original?.date ?? today,
    note: original?.note ?? '',
  };
}

/** Compares raw inputs so the discard prompt also protects unnormalized text edits. */
export function hasExpenseDraftChanges(
  draft: ExpenseEditorDraft,
  initial: ExpenseEditorDraft,
): boolean {
  return (
    draft.amount !== initial.amount ||
    draft.transactionCurrency !== initial.transactionCurrency ||
    draft.category !== initial.category ||
    draft.date !== initial.date ||
    draft.note !== initial.note
  );
}

/** Adapts input text to the store contract using the existing domain validation and conversion rules. */
export function buildExpenseInput(
  draft: ExpenseEditorDraft,
  baseCurrency: Currency,
  rates: readonly Rate[] | null,
): ExpenseInput {
  const validated = validateDraft(draft);
  const originalAmountMinor = validated.amountMinor;
  const amountMinor = toBaseMinor(
    originalAmountMinor,
    draft.transactionCurrency,
    baseCurrency,
    rates,
  );
  if (amountMinor === null) {
    throw new Error(
      `Saved ${baseCurrency} rates are required before recording a ${draft.transactionCurrency} expense.`,
    );
  }
  return {
    ...validated,
    amountMinor,
    originalAmountMinor,
    originalCurrency: draft.transactionCurrency,
    rateSnapshot: rates ? JSON.stringify(rates) : undefined,
  };
}
