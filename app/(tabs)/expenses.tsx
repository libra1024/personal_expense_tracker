import { useState } from 'react';
import { router } from 'expo-router';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { filterExpenses, groupByDate, monthKey, type Category } from '../../src/domain/expenses';
import { Button, MonthPicker } from '../../src/presentation/components/controls';
import { EmptyState } from '../../src/presentation/components/expense-display';
import { CategoryFilter } from '../../src/presentation/components/history/category-filter';
import { DailyExpenseGroup } from '../../src/presentation/components/history/daily-expense-group';
import { Header } from '../../src/presentation/components/layout';
import { useExpenses } from '../../src/presentation/expense-provider';

/** Lists the saved expenses for the selected month and optional category filter. */
export default function Expenses() {
  const { expenses, currency, baseCurrency } = useExpenses();
  const [month, setMonth] = useState(monthKey);
  const [category, setCategory] = useState<Category>();
  const entries = filterExpenses(expenses, month, category);
  return (
    <SafeAreaView className="flex-1 bg-[#F5F7F5]" edges={['top', 'left', 'right']}>
      <FlatList
        data={groupByDate(entries)}
        keyExtractor={(group) => group.date}
        contentContainerClassName="w-full max-w-[680px] self-center gap-6 px-[22px] pb-[34px] pt-[22px]"
        ListHeaderComponent={
          <View className="gap-[22px]">
            <Header title="Your expenses" subtitle="A little record of your everyday." />
            <Button icon="add" onPress={() => router.push('/expense')}>
              Add expense
            </Button>
            <MonthPicker value={month} onChange={setMonth} />
            <CategoryFilter value={category} onChange={setCategory} />
            <Text className="text-xs leading-[18px] text-[#70817B]">
              {entries.length} {entries.length === 1 ? 'expense' : 'expenses'} · Tap to edit
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={expenses.length ? 'Nothing here yet' : 'Your story starts here'}
            message={
              category
                ? 'No expenses match this category and month. Try another filter or add an expense.'
                : 'No expenses in this month. Add one to start tracking your spending.'
            }
          />
        }
        renderItem={({ item }) => (
          <DailyExpenseGroup
            date={item.date}
            expenses={item.expenses}
            currency={currency}
            baseCurrency={baseCurrency}
          />
        )}
      />
    </SafeAreaView>
  );
}
