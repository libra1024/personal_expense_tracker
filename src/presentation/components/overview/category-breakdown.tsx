import { Text, View } from 'react-native';
import { historicalExpenseMinor } from '../../../domain/currency';
import { formatMoney, type Currency, type Expense, type summarize } from '../../../domain/expenses';
import { categoryMeta } from '../expense-display';
import { Icon } from '../icon';
import { Card } from '../layout';

/** Renders category totals and proportional bars from the monthly summary. */
export function CategoryBreakdown({
  entries,
  summary,
  currency,
  baseCurrency,
}: {
  entries: Expense[];
  summary: ReturnType<typeof summarize>;
  currency: Currency;
  baseCurrency: Currency;
}) {
  return (
    <Card>
      {summary.categories.map((item) => {
        const meta = categoryMeta[item.category];
        const share = item.totalMinor / summary.totalMinor;
        const amounts = entries
          .filter((expense) => expense.category === item.category)
          .map((expense) => historicalExpenseMinor(expense, baseCurrency, currency));
        const total = amounts.every((amount): amount is number => amount !== null)
          ? amounts.reduce((sum, amount) => sum + amount, 0)
          : null;
        return (
          <View key={item.category} className="gap-2.5">
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-row items-center gap-2">
                <Icon name={meta.icon} color={meta.color} size={18} />
                <Text className="text-sm font-semibold text-[#17352F]">{item.category}</Text>
              </View>
              <Text className="max-w-[46%] text-[13px] font-semibold text-[#17352F]">
                {total === null
                  ? `${formatMoney(item.totalMinor, baseCurrency)} · historical rate unavailable`
                  : formatMoney(total, currency)}
              </Text>
            </View>
            <View
              accessibilityLabel={`${item.category}: ${Math.round(share * 100)} percent`}
              className="h-[7px] overflow-hidden rounded-[10px] bg-[#F5F7F5]"
            >
              <View
                className="h-[7px] rounded-[10px]"
                style={{ width: `${share * 100}%`, backgroundColor: meta.color }}
              />
            </View>
          </View>
        );
      })}
    </Card>
  );
}
