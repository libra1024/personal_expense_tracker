import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  CATEGORIES,
  dateLabel,
  type Category,
  type Currency,
  type Expense,
} from '../../domain/expenses';
import { ExpenseRow } from './expense-display';

/** Lets people filter the expense history by a single category. */
export function CategoryFilter({
  value,
  onChange,
}: {
  value: Category | undefined;
  onChange: (category: Category | undefined) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
      {(['All', ...CATEGORIES] as const).map((item) => {
        const selected = item === (value ?? 'All');
        return (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={`min-h-11 justify-center rounded-[13px] border px-3.5 ${selected ? 'border-[#167A63] bg-[#E6F2EC]' : 'border-[#E3EAE5] bg-white'}`}
            onPress={() => onChange(item === 'All' ? undefined : item)}
          >
            <Text
              className={`text-[13px] ${selected ? 'font-semibold text-[#167A63]' : 'text-[#70817B]'}`}
            >
              {item}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Groups one calendar day of expense rows inside a compact card. */
export function DailyExpenseGroup({
  date,
  expenses,
  currency,
  baseCurrency,
}: {
  date: string;
  expenses: Expense[];
  currency: Currency;
  baseCurrency: Currency;
}) {
  return (
    <View className="gap-2.5">
      <Text
        accessibilityRole="header"
        className="text-xs leading-[18px] font-semibold text-[#70817B]"
      >
        {dateLabel(date)}
      </Text>
      <View className="gap-0 rounded-[20px] border border-[#E3EAE5] bg-white px-5 py-[3px]">
        {expenses.map((expense, index) => (
          <ExpenseRow
            key={expense.id}
            expense={expense}
            currency={currency}
            baseCurrency={baseCurrency}
            last={index === expenses.length - 1}
          />
        ))}
      </View>
    </View>
  );
}
