import { useState } from 'react';
import { router } from 'expo-router';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIES, dateLabel, filterExpenses, groupByDate, monthKey, type Category } from '../../src/domain/expenses';
import { useExpenses } from '../../src/provider';
import { Button, colors, EmptyState, ExpenseRow, Header, MonthPicker, styles } from '../../src/ui';

export default function Expenses() {
  const { expenses, currency, baseCurrency } = useExpenses();
  const [month, setMonth] = useState(monthKey);
  const [category, setCategory] = useState<Category>();
  const entries = filterExpenses(expenses, month, category);
  return <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
    <FlatList data={groupByDate(entries)} keyExtractor={group => group.date}
      contentContainerStyle={[styles.content, { paddingTop: 22, flexGrow: 1 }]}
      ListHeaderComponent={<View style={{ gap: 22 }}>
        <Header title="Your expenses" subtitle="A little record of your everyday." />
        <Button icon="add" onPress={() => router.push('/expense')}>Add expense</Button>
        <MonthPicker value={month} onChange={setMonth} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {(['All', ...CATEGORIES] as const).map(item => {
            const selected = item === (category ?? 'All');
            return <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setCategory(item === 'All' ? undefined : item)} style={[styles.chip, selected && styles.chipSelected]}><Text style={{ color: selected ? colors.teal : colors.muted, fontSize: 13, fontWeight: selected ? '600' : '400' }}>{item}</Text></Pressable>;
          })}
        </ScrollView>
        <Text style={styles.small}>{entries.length} {entries.length === 1 ? 'expense' : 'expenses'} · Tap to edit</Text>
      </View>}
      ListEmptyComponent={<EmptyState title={expenses.length ? 'Nothing here yet' : 'Your story starts here'} message={category ? 'No expenses match this category and month. Try another filter or add an expense.' : 'No expenses in this month. Add one to start tracking your spending.'} />}
      renderItem={({ item }) => <View style={{ gap: 10 }}><Text accessibilityRole="header" style={[styles.small, { fontWeight: '600' }]}>{dateLabel(item.date)}</Text><View style={[styles.card, { paddingVertical: 3, gap: 0 }]}>{item.expenses.map((expense, index) => <ExpenseRow key={expense.id} expense={expense} currency={currency} baseCurrency={baseCurrency} last={index === item.expenses.length - 1} />)}</View></View>} />
  </SafeAreaView>;
}
