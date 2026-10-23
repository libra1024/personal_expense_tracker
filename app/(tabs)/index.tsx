import { useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { historicalExpenseMinor } from '../../src/domain/currency';
import { filterExpenses, monthKey, summarize } from '../../src/domain/expenses';
import { Button, MonthPicker } from '../../src/presentation/components/controls';
import { EmptyState } from '../../src/presentation/components/expense-display';
import { Icon } from '../../src/presentation/components/icon';
import { Header, Screen } from '../../src/presentation/components/layout';
import {
  CategoryBreakdown,
  DevicePrivacyNote,
  MonthlyTotalCard,
  RecentExpenses,
} from '../../src/presentation/components/overview-summary';
import { useExpenses } from '../../src/presentation/expense-provider';

/** Shows the selected month’s totals, category distribution, and recent activity. */
export default function Overview() {
  const { expenses, currency, baseCurrency, rateWarning } = useExpenses();
  const [month, setMonth] = useState(monthKey);
  const entries = filterExpenses(expenses, month);
  const historicalAmounts = entries.map((expense) =>
    historicalExpenseMinor(expense, baseCurrency, currency),
  );
  const historicalTotal = historicalAmounts.every((amount): amount is number => amount !== null)
    ? historicalAmounts.reduce((sum, amount) => sum + amount, 0)
    : null;
  let summary: ReturnType<typeof summarize> | undefined;
  let summaryError = '';
  try {
    summary = summarize(entries);
  } catch (error) {
    summaryError = (error as Error).message;
  }
  return (
    <Screen>
      <Header
        title="A clearer picture."
        subtitle="Small expenses. Better awareness."
        action={
          <View className="h-12 w-12 items-center justify-center rounded-[17px] bg-[#E6F2EC]">
            <Icon name="wallet-outline" color="#167A63" size={25} />
          </View>
        }
      />
      <MonthPicker value={month} onChange={setMonth} />
      <MonthlyTotalCard
        entries={entries}
        summary={summary}
        historicalTotal={historicalTotal}
        currency={currency}
        baseCurrency={baseCurrency}
      />
      <Button icon="add" onPress={() => router.push('/expense')}>
        Add expense
      </Button>
      {rateWarning ? (
        <Text accessibilityRole="alert" className="text-sm leading-[21px] text-[#B33A3A]">
          {rateWarning}
        </Text>
      ) : null}
      {currency !== baseCurrency ? (
        <Text className="text-xs leading-[18px] text-[#70817B]">
          Converted totals use each expense’s saved historical rate.
        </Text>
      ) : null}
      {summaryError ? (
        <Text accessibilityRole="alert" className="text-sm leading-[21px] text-[#B33A3A]">
          {summaryError}
        </Text>
      ) : null}
      {!entries.length ? (
        <EmptyState
          title="A fresh start"
          message="Add an expense to see where your money goes. Every little bit counts."
        />
      ) : (
        <>
          <View className="flex-row items-center justify-between gap-3">
            <Text
              accessibilityRole="header"
              className="text-[18px] font-semibold tracking-[-0.3px] text-[#17352F]"
            >
              Where it went
            </Text>
            <Text className="text-xs leading-[18px] text-[#70817B]">BY CATEGORY</Text>
          </View>
          {summary ? (
            <CategoryBreakdown
              entries={entries}
              summary={summary}
              currency={currency}
              baseCurrency={baseCurrency}
            />
          ) : null}
          <View className="flex-row items-center justify-between gap-3">
            <Text
              accessibilityRole="header"
              className="text-[18px] font-semibold tracking-[-0.3px] text-[#17352F]"
            >
              Recent expenses
            </Text>
            <Text className="text-xs leading-[18px] text-[#70817B]">
              LATEST {Math.min(entries.length, 3)}
            </Text>
          </View>
          <RecentExpenses entries={entries} currency={currency} baseCurrency={baseCurrency} />
        </>
      )}
      <DevicePrivacyNote />
    </Screen>
  );
}
