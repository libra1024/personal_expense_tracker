import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Alert, BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIES, dateLabel, localDate, validateDraft, type Category } from '../src/expenses';
import { useExpenses } from '../src/provider';
import { exitExpense } from '../src/navigation';
import { Button, categoryMeta, colors, Icon, IconButton, styles } from '../src/ui';

export default function ExpenseForm() {
  const { id: rawId } = useLocalSearchParams<{ id?: string }>();
  const id = rawId === undefined ? undefined : Number(rawId);
  const { expenses, currency, busy, store } = useExpenses();
  const original = expenses.find(e => e.id === id);
  const [amount, setAmount] = useState(() => original ? `${Math.floor(original.amountMinor / 100)}.${String(original.amountMinor % 100).padStart(2, '0')}` : '');
  const [category, setCategory] = useState<Category | ''>(original?.category ?? '');
  const [date, setDate] = useState(original?.date ?? localDate());
  const [note, setNote] = useState(original?.note ?? '');
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState('');
  const finishing = useRef(false);
  const editing = id !== undefined;
  const missing = editing && !original;
  const dirty = amount !== (original ? `${Math.floor(original.amountMinor / 100)}.${String(original.amountMinor % 100).padStart(2, '0')}` : '') || category !== (original?.category ?? '') || date !== (original?.date ?? localDate()) || note !== (original?.note ?? '');

  function close() {
    if (busy) return;
    if (!dirty) { exitExpense(router); return; }
    Alert.alert('Discard changes?', 'Your unsaved changes will be lost.', [{ text: 'Keep editing', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: () => exitExpense(router) }]);
  }
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { close(); return true; });
    return () => subscription.remove();
  });

  async function save() {
    if (busy || finishing.current) return;
    setError('');
    try {
      const input = validateDraft({ amount, category, date, note });
      if (await store.save(input, id)) { finishing.current = true; exitExpense(router); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save this expense. Please try again.'); }
  }
  function remove() {
    if (id === undefined || busy) return;
    Alert.alert('Delete expense?', 'This expense will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setError('');
        try { if (await store.remove(id)) { finishing.current = true; exitExpense(router); } }
        catch { setError('Could not delete the expense. Please try again.'); }
      } },
    ]);
  }
  const [year, month, day] = date.split('-').map(Number);
  return <SafeAreaView style={styles.screen}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.between}><View><Text style={styles.eyebrow}>KEEP THE LITTLE THINGS IN VIEW</Text><Text accessibilityRole="header" style={[styles.title, { fontSize: 28 }]}>{editing ? 'Edit expense' : 'Add expense'}</Text></View><IconButton name="close" label="Close expense form" onPress={close} disabled={busy} /></View>
        {missing ? <><Text accessibilityRole="alert" style={styles.error}>This expense no longer exists.</Text><Button onPress={() => exitExpense(router)}>Back to expenses</Button></> : <>
          <View style={[styles.card, { paddingVertical: 26, gap: 8 }]}>
            <Text style={styles.fieldLabel}>How much did you spend? · {currency}</Text>
            <TextInput accessibilityLabel={`Amount in ${currency}`} editable={!busy} autoFocus={!editing} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#B2C0B8" maxLength={20} style={{ color: colors.ink, fontSize: 44, fontWeight: '600', paddingVertical: 8 }} />
          </View>
          <View><Text style={styles.fieldLabel}>Category</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
            {CATEGORIES.map(item => <Pressable key={item} disabled={busy} accessibilityRole="button" accessibilityState={{ selected: category === item, disabled: busy }} onPress={() => setCategory(item)} style={[styles.chip, { flexDirection: 'row', alignItems: 'center', gap: 7 }, category === item && styles.chipSelected]}><Icon name={categoryMeta[item].icon} size={17} color={category === item ? colors.teal : categoryMeta[item].color} /><Text style={{ fontSize: 13, color: category === item ? colors.teal : colors.ink }}>{item}</Text></Pressable>)}
          </View></View>
          <View><Text style={styles.fieldLabel}>Date</Text><Pressable accessibilityRole="button" accessibilityLabel={`Expense date: ${dateLabel(date)}`} disabled={busy} onPress={() => setShowPicker(true)} style={[styles.input, styles.between]}><Text style={{ color: colors.ink, fontSize: 15 }}>{dateLabel(date)}</Text><Icon name="calendar-outline" color={colors.teal} size={21} /></Pressable>
            {showPicker && <View><DateTimePicker mode="date" value={new Date(year, month - 1, day, 12)} minimumDate={new Date(1900, 0, 1)} maximumDate={new Date(9999, 11, 31)} display={Platform.OS === 'ios' ? 'spinner' : 'default'} themeVariant="light" onChange={(event, selected) => { if (Platform.OS !== 'ios') setShowPicker(false); if (event.type !== 'dismissed' && selected) setDate(localDate(selected)); }} />{Platform.OS === 'ios' && <Button secondary onPress={() => setShowPicker(false)}>Done</Button>}</View>}
          </View>
          <View><Text style={styles.fieldLabel}>Note <Text style={{ color: colors.muted, fontWeight: '400' }}>(optional)</Text></Text><TextInput accessibilityLabel="Expense note, optional" editable={!busy} multiline maxLength={500} value={note} onChangeText={setNote} placeholder="What was it for?" placeholderTextColor={colors.muted} style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]} /></View>
          {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.error}>{error}</Text> : null}
          <Button icon="checkmark" onPress={() => { void save(); }} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Save expense'}</Button>
          {editing && <Button danger icon="trash-outline" onPress={remove} disabled={busy}>Delete expense</Button>}
        </>}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
