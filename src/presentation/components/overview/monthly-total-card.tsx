import { Text, View } from 'react-native';
import { formatMoney, type Currency, type Expense, type summarize } from '../../../domain/expenses';
import { Icon } from '../icon';

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
