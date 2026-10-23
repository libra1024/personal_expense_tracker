import { useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { historicalExpenseMinor } from '../../src/domain/currency';
import { filterExpenses, formatMoney, monthKey, summarize } from '../../src/domain/expenses';
import { useExpenses } from '../../src/presentation/expense-provider';
import { Button, MonthPicker } from '../../src/presentation/components/controls';
import {
  categoryMeta,
  EmptyState,
  ExpenseRow,
} from '../../src/presentation/components/expense-display';
import { Icon } from '../../src/presentation/components/icon';
import { Card, Header, Screen } from '../../src/presentation/components/layout';
import { colors, styles } from '../../src/presentation/components/theme';

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
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 17,
              backgroundColor: colors.pale,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="wallet-outline" color={colors.teal} size={25} />
          </View>
        }
      />
      <MonthPicker value={month} onChange={setMonth} />
      <Card style={{ backgroundColor: colors.ink, borderColor: colors.ink, padding: 25, gap: 18 }}>
        <View style={styles.between}>
          <Text style={{ color: '#BDD1C7', fontSize: 13 }}>TOTAL SPENT THIS MONTH</Text>
          <Icon name="arrow-up-outline" size={20} color="#BDD1C7" />
        </View>
        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          style={{ fontSize: 37, fontWeight: '600', color: colors.white, letterSpacing: -1 }}
        >
          {summary && historicalTotal !== null
            ? formatMoney(historicalTotal, currency)
            : summary
              ? `${formatMoney(summary.totalMinor, baseCurrency)} · historical rate unavailable`
              : 'Total unavailable'}
        </Text>
        <View style={{ borderTopWidth: 1, borderTopColor: '#36534A', paddingTop: 17 }}>
          <Text style={{ color: '#BDD1C7', fontSize: 13 }}>
            {entries.length} {entries.length === 1 ? 'expense' : 'expenses'} recorded · {currency}
          </Text>
        </View>
      </Card>
      <Button icon="add" onPress={() => router.push('/expense')}>
        Add expense
      </Button>
      {rateWarning ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {rateWarning}
        </Text>
      ) : null}
      {currency !== baseCurrency ? (
        <Text style={styles.small}>Converted totals use each expense’s saved historical rate.</Text>
      ) : null}
      {summaryError ? (
        <Text accessibilityRole="alert" style={styles.error}>
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
          <View style={styles.between}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Where it went
            </Text>
            <Text style={styles.small}>BY CATEGORY</Text>
          </View>
          {summary && (
            <Card>
              {summary.categories.map((item) => {
                const meta = categoryMeta[item.category];
                const share = item.totalMinor / summary!.totalMinor;
                const categoryAmounts = entries
                  .filter((expense) => expense.category === item.category)
                  .map((expense) => historicalExpenseMinor(expense, baseCurrency, currency));
                const categoryTotal = categoryAmounts.every(
                  (amount): amount is number => amount !== null,
                )
                  ? categoryAmounts.reduce((sum, amount) => sum + amount, 0)
                  : null;
                return (
                  <View key={item.category} style={{ gap: 10 }}>
                    <View style={styles.between}>
                      <View style={styles.row}>
                        <Icon name={meta.icon} color={meta.color} size={18} />
                        <Text style={styles.rowTitle}>{item.category}</Text>
                      </View>
                      <Text style={styles.amount}>
                        {categoryTotal === null
                          ? `${formatMoney(item.totalMinor, baseCurrency)} · historical rate unavailable`
                          : formatMoney(categoryTotal, currency)}
                      </Text>
                    </View>
                    <View
                      accessibilityLabel={`${item.category}: ${Math.round(share * 100)} percent`}
                      style={{
                        height: 7,
                        backgroundColor: colors.background,
                        borderRadius: 10,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          height: 7,
                          width: `${share * 100}%`,
                          backgroundColor: meta.color,
                          borderRadius: 10,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </Card>
          )}
          <View style={styles.between}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Recent expenses
            </Text>
            <Text style={styles.small}>LATEST {Math.min(entries.length, 3)}</Text>
          </View>
          <Card style={{ paddingVertical: 3 }}>
            {entries.slice(0, 3).map((expense, index) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                currency={currency}
                baseCurrency={baseCurrency}
                last={index === Math.min(entries.length, 3) - 1}
              />
            ))}
          </Card>
        </>
      )}
      <View style={[styles.row, { justifyContent: 'center' }]}>
        <Icon name="shield-checkmark-outline" size={14} color={colors.muted} />
        <Text style={styles.small}>Saved on your device. Always yours.</Text>
      </View>
    </Screen>
  );
}
