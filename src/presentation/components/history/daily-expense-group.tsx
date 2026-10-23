import { Text, View } from 'react-native';
import { dateLabel, type Currency, type Expense } from '../../../domain/expenses';
import { ExpenseRow } from '../expense-display';

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
