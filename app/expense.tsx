import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toBaseMinor } from '../src/domain/currency';
import {
  localDate,
  parseAmount,
  timestampLabel,
  validateDraft,
  type Category,
  type Currency,
} from '../src/domain/expenses';
import { exitExpense } from '../src/navigation';
import { Button, IconButton } from '../src/presentation/components/controls';
import {
  AmountField,
  CategoryField,
  DateField,
  ExpenseAudit,
  NoteField,
  TransactionCurrencyField,
} from '../src/presentation/components/expense-fields';
import { useExpenses } from '../src/presentation/expense-provider';

/** Creates or updates one expense while retaining its original currency and exchange-rate snapshot. */
export default function ExpenseForm() {
  const { id: rawId } = useLocalSearchParams<{ id?: string }>();
  const id = rawId === undefined ? undefined : Number(rawId);
  const { expenses, baseCurrency, rates, busy, store } = useExpenses();
  const original = expenses.find((expense) => expense.id === id);
  const [amount, setAmount] = useState(() => {
    const minor = original?.originalAmountMinor ?? original?.amountMinor;
    return minor ? `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, '0')}` : '';
  });
  const [transactionCurrency, setTransactionCurrency] = useState<Currency>(
    original?.originalCurrency ?? baseCurrency,
  );
  const [category, setCategory] = useState<Category | ''>(original?.category ?? '');
  const [date, setDate] = useState(original?.date ?? localDate());
  const [note, setNote] = useState(original?.note ?? '');
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState('');
  const finishing = useRef(false);
  const editing = id !== undefined;
  const missing = editing && !original;
  const originalAmount = original
    ? `${Math.floor((original.originalAmountMinor ?? original.amountMinor) / 100)}.${String((original.originalAmountMinor ?? original.amountMinor) % 100).padStart(2, '0')}`
    : '';
  const dirty =
    amount !== originalAmount ||
    transactionCurrency !== (original?.originalCurrency ?? baseCurrency) ||
    category !== (original?.category ?? '') ||
    date !== (original?.date ?? localDate()) ||
    note !== (original?.note ?? '');

  /** Returns to the prior screen after confirming any unsaved changes. */
  function close() {
    if (busy) return;
    if (!dirty) {
      exitExpense(router);
      return;
    }
    Alert.alert('Discard changes?', 'Your unsaved changes will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => exitExpense(router) },
    ]);
  }

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => subscription.remove();
  });

  /** Validates and persists the draft while preventing duplicate in-flight submissions. */
  async function save() {
    if (busy || finishing.current) return;
    setError('');
    try {
      const draft = validateDraft({ amount, category, date, note });
      const originalAmountMinor = parseAmount(amount);
      const amountMinor = toBaseMinor(
        originalAmountMinor,
        transactionCurrency,
        baseCurrency,
        rates,
      );
      if (amountMinor === null) {
        throw new Error(
          `Saved ${baseCurrency} rates are required before recording a ${transactionCurrency} expense.`,
        );
      }
      const input = {
        ...draft,
        amountMinor,
        originalAmountMinor,
        originalCurrency: transactionCurrency,
        rateSnapshot: rates ? JSON.stringify(rates) : undefined,
      };
      if (await store.save(input, id)) {
        finishing.current = true;
        exitExpense(router);
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not save this expense. Please try again.',
      );
    }
  }

  /** Soft-deletes the existing expense after an explicit destructive-action confirmation. */
  function remove() {
    if (id === undefined || busy) return;
    Alert.alert('Delete expense?', 'This expense will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setError('');
          try {
            if (await store.remove(id)) {
              finishing.current = true;
              exitExpense(router);
            }
          } catch {
            setError('Could not delete the expense. Please try again.');
          }
        },
      },
    ]);
  }

  const [year, month, day] = date.split('-').map(Number);
  return (
    <SafeAreaView className="flex-1 bg-[#F5F7F5]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="w-full max-w-[680px] self-center gap-6 px-[22px] pb-[34px]"
        >
          <View className="flex-row items-center justify-between gap-3">
            <View>
              <Text className="mb-[13px] text-[10px] font-bold tracking-[1.8px] text-[#167A63]">
                KEEP THE LITTLE THINGS IN VIEW
              </Text>
              <Text
                accessibilityRole="header"
                className="text-[28px] font-bold tracking-[-1px] text-[#17352F]"
              >
                {editing ? 'Edit expense' : 'Add expense'}
              </Text>
            </View>
            <IconButton name="close" label="Close expense form" onPress={close} disabled={busy} />
          </View>
          {missing ? (
            <>
              <Text accessibilityRole="alert" className="text-sm leading-[21px] text-[#B33A3A]">
                This expense no longer exists.
              </Text>
              <Button onPress={() => exitExpense(router)}>Back to expenses</Button>
            </>
          ) : (
            <>
              <AmountField
                value={amount}
                currency={transactionCurrency}
                editable={!busy}
                autoFocus={!editing}
                onChange={setAmount}
              />
              <TransactionCurrencyField
                value={transactionCurrency}
                baseCurrency={baseCurrency}
                hasRates={!!rates}
                disabled={busy}
                onChange={setTransactionCurrency}
              />
              <CategoryField value={category} disabled={busy} onChange={setCategory} />
              <DateField value={date} disabled={busy} onPress={() => setShowPicker(true)} />
              {showPicker ? (
                <View>
                  <DateTimePicker
                    mode="date"
                    value={new Date(year, month - 1, day, 12)}
                    minimumDate={new Date(1900, 0, 1)}
                    maximumDate={new Date(9999, 11, 31)}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    themeVariant="light"
                    onChange={(event, selected) => {
                      if (Platform.OS !== 'ios') setShowPicker(false);
                      if (event.type !== 'dismissed' && selected) setDate(localDate(selected));
                    }}
                  />
                  {Platform.OS === 'ios' ? (
                    <Button secondary onPress={() => setShowPicker(false)}>
                      Done
                    </Button>
                  ) : null}
                </View>
              ) : null}
              <NoteField value={note} editable={!busy} onChange={setNote} />
              {editing && original ? (
                <ExpenseAudit
                  createdAt={timestampLabel(original.createdAt)}
                  updatedAt={timestampLabel(original.updatedAt)}
                />
              ) : null}
              {error ? (
                <Text
                  accessibilityRole="alert"
                  accessibilityLiveRegion="assertive"
                  className="text-sm leading-[21px] text-[#B33A3A]"
                >
                  {error}
                </Text>
              ) : null}
              <Button icon="checkmark" onPress={() => void save()} disabled={busy}>
                {busy ? 'Saving…' : editing ? 'Save changes' : 'Save expense'}
              </Button>
              {editing ? (
                <Button danger icon="trash-outline" onPress={remove} disabled={busy}>
                  Delete expense
                </Button>
              ) : null}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
