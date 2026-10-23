import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, BackHandler } from 'react-native';
import {
  buildExpenseInput,
  createExpenseEditorDraft,
  hasExpenseDraftChanges,
  type ExpenseEditorDraft,
} from '../expense-editor-model';
import { useExpenses } from '../expense-provider';

/** Coordinates editor state, confirmations, and store mutations without coupling them to routing or JSX. */
export function useExpenseEditor(expenseId: number | undefined, onExit: () => void) {
  const { expenses, baseCurrency, rates, busy, store } = useExpenses();
  const original = expenses.find((expense) => expense.id === expenseId);
  const [draft, setDraft] = useState(() => createExpenseEditorDraft(original, baseCurrency));
  const [error, setError] = useState('');
  const finishing = useRef(false);
  const editing = expenseId !== undefined;
  const missing = editing && !original;
  const dirty = hasExpenseDraftChanges(draft, createExpenseEditorDraft(original, baseCurrency));

  /** Updates one typed draft field while retaining every other unsaved input. */
  function updateDraft<Field extends keyof ExpenseEditorDraft>(
    field: Field,
    value: ExpenseEditorDraft[Field],
  ) {
    setDraft((currentDraft) => ({ ...currentDraft, [field]: value }));
  }

  /** Returns to the prior screen after confirming any unsaved changes. */
  const close = useCallback(() => {
    if (busy) return;
    if (!dirty) {
      onExit();
      return;
    }
    Alert.alert('Discard changes?', 'Your unsaved changes will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: onExit },
    ]);
  }, [busy, dirty, onExit]);

  /** Keeps hardware back behavior aligned with the close button and releases the native listener. */
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => subscription.remove();
  }, [close]);

  /** Validates and saves the current draft, leaving it intact when persistence fails. */
  async function save() {
    if (busy || finishing.current) return;
    setError('');
    try {
      const input = buildExpenseInput(draft, baseCurrency, rates);
      if (await store.save(input, expenseId)) {
        finishing.current = true;
        onExit();
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not save this expense. Please try again.',
      );
    }
  }

  /** Soft-deletes an existing record only after an explicit destructive-action confirmation. */
  function remove() {
    if (expenseId === undefined || busy) return;
    Alert.alert('Delete expense?', 'This expense will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setError('');
          try {
            if (await store.remove(expenseId)) {
              finishing.current = true;
              onExit();
            }
          } catch {
            setError('Could not delete the expense. Please try again.');
          }
        },
      },
    ]);
  }

  return {
    draft,
    updateDraft,
    original,
    baseCurrency,
    hasRates: !!rates,
    busy,
    editing,
    missing,
    error,
    close,
    save,
    remove,
  };
}
