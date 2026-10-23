import { router, useLocalSearchParams } from 'expo-router';
import { timestampLabel } from '../src/domain/expenses';
import { exitExpense } from '../src/navigation';
import { AmountField } from '../src/presentation/components/expense-form/amount-field';
import { CategoryField } from '../src/presentation/components/expense-form/category-field';
import { DateField } from '../src/presentation/components/expense-form/date-field';
import { ExpenseAudit } from '../src/presentation/components/expense-form/expense-audit';
import { ExpenseFormActions } from '../src/presentation/components/expense-form/expense-form-actions';
import { ExpenseFormHeader } from '../src/presentation/components/expense-form/expense-form-header';
import { ExpenseFormLayout } from '../src/presentation/components/expense-form/expense-form-layout';
import { MissingExpense } from '../src/presentation/components/expense-form/missing-expense';
import { NoteField } from '../src/presentation/components/expense-form/note-field';
import { TransactionCurrencyField } from '../src/presentation/components/expense-form/transaction-currency-field';
import { useExpenseEditor } from '../src/presentation/hooks/use-expense-editor';

/** Returns through navigation history, or to the overview for a cold-start expense link. */
function leaveExpenseForm() {
  exitExpense(router);
}

/** Composes the expense editor's controlled fields and binds its exit action to Expo routing. */
export default function ExpenseForm() {
  const { id: rawExpenseId } = useLocalSearchParams<{ id?: string }>();
  const expenseId = rawExpenseId === undefined ? undefined : Number(rawExpenseId);
  const editor = useExpenseEditor(expenseId, leaveExpenseForm);

  return (
    <ExpenseFormLayout>
      <ExpenseFormHeader editing={editor.editing} busy={editor.busy} onClose={editor.close} />
      {editor.missing ? (
        <MissingExpense onBack={leaveExpenseForm} />
      ) : (
        <>
          <AmountField
            value={editor.draft.amount}
            currency={editor.draft.transactionCurrency}
            editable={!editor.busy}
            autoFocus={!editor.editing}
            onChange={(value) => editor.updateDraft('amount', value)}
          />
          <TransactionCurrencyField
            value={editor.draft.transactionCurrency}
            baseCurrency={editor.baseCurrency}
            hasRates={editor.hasRates}
            disabled={editor.busy}
            onChange={(value) => editor.updateDraft('transactionCurrency', value)}
          />
          <CategoryField
            value={editor.draft.category}
            disabled={editor.busy}
            onChange={(value) => editor.updateDraft('category', value)}
          />
          <DateField
            value={editor.draft.date}
            disabled={editor.busy}
            onChange={(value) => editor.updateDraft('date', value)}
          />
          <NoteField
            value={editor.draft.note}
            editable={!editor.busy}
            onChange={(value) => editor.updateDraft('note', value)}
          />
          {editor.editing && editor.original ? (
            <ExpenseAudit
              createdAt={timestampLabel(editor.original.createdAt)}
              updatedAt={timestampLabel(editor.original.updatedAt)}
            />
          ) : null}
          <ExpenseFormActions
            editing={editor.editing}
            busy={editor.busy}
            error={editor.error}
            onSave={editor.save}
            onDelete={editor.remove}
          />
        </>
      )}
    </ExpenseFormLayout>
  );
}
