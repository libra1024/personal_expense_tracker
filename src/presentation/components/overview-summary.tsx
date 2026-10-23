import { Text, View } from 'react-native';
import { historicalExpenseMinor } from '../../domain/currency';
import { formatMoney, type Currency, type Expense, type summarize } from '../../domain/expenses';
import { ExpenseRow, categoryMeta } from './expense-display';
import { Icon } from './icon';
import { Card } from './layout';

/** Displays the selected month's total with its historical conversion status. */
export function MonthlyTotalCard({
  entries,
  summary,
  historicalTotal,
  currency,
  baseCurrency,
}: {
  entries: Expense[];
  summary: ReturnType<typeof summarize> | undefined;
  historicalTotal: number | null;
  currency: Currency;
  baseCurrency: Currency;
}) {
  const total = summary
    ? historicalTotal === null
      ? `${formatMoney(summary.totalMinor, baseCurrency)} · historical rate unavailable`
      : formatMoney(historicalTotal, currency)
    : 'Total unavailable';
  return (
    <View className="gap-[18px] rounded-[20px] border border-[#17352F] bg-[#17352F] p-[25px]">
      <View className="flex-row items-center justify-between">
        <Text className="text-[13px] text-[#BDD1C7]">TOTAL SPENT THIS MONTH</Text>
        <Icon name="arrow-up-outline" size={20} color="#BDD1C7" />
      </View>
      <Text
        adjustsFontSizeToFit
        numberOfLines={1}
        className="text-[37px] font-semibold tracking-[-1px] text-white"
      >
        {total}
      </Text>
      <View className="border-t border-[#36534A] pt-[17px]">
        <Text className="text-[13px] text-[#BDD1C7]">
          {entries.length} {entries.length === 1 ? 'expense' : 'expenses'} recorded · {currency}
        </Text>
      </View>
    </View>
  );
}

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

/** Displays the latest three expenses without duplicating row presentation logic. */
export function RecentExpenses({
  entries,
  currency,
  baseCurrency,
}: {
  entries: Expense[];
  currency: Currency;
  baseCurrency: Currency;
}) {
  const recentEntries = entries.slice(0, 3);
  return (
    <Card className="gap-0 py-[3px]">
      {recentEntries.map((expense, index) => (
        <ExpenseRow
          key={expense.id}
          expense={expense}
          currency={currency}
          baseCurrency={baseCurrency}
          last={index === recentEntries.length - 1}
        />
      ))}
    </Card>
  );
}

/** States the app's local-only storage promise at the bottom of the overview. */
export function DevicePrivacyNote() {
  return (
    <View className="flex-row items-center justify-center gap-2">
      <Icon name="shield-checkmark-outline" size={14} color="#70817B" />
      <Text className="text-xs leading-[18px] text-[#70817B]">
        Saved on your device. Always yours.
      </Text>
    </View>
  );
}
