import { useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { filterExpenses, formatMoney, monthKey, summarize } from '../../src/expenses';
import { useExpenses } from '../../src/provider';
import { Button, Card, categoryMeta, colors, EmptyState, ExpenseRow, Header, Icon, MonthPicker, Screen, styles } from '../../src/ui';

export default function Overview() {
  const { expenses, currency } = useExpenses();
  const [month, setMonth] = useState(monthKey);
  const entries = filterExpenses(expenses, month);
  let summary: ReturnType<typeof summarize> | undefined;
  let summaryError = '';
  try { summary = summarize(entries); } catch (error) { summaryError = (error as Error).message; }
  return <Screen>
    <Header title="A clearer picture." subtitle="Small expenses. Better awareness." action={<View style={{ width: 48, height: 48, borderRadius: 17, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' }}><Icon name="wallet-outline" color={colors.teal} size={25} /></View>} />
    <MonthPicker value={month} onChange={setMonth} />
    <Card style={{ backgroundColor: colors.ink, borderColor: colors.ink, padding: 25, gap: 18 }}>
      <View style={styles.between}><Text style={{ color: '#BDD1C7', fontSize: 13 }}>TOTAL SPENT THIS MONTH</Text><Icon name="arrow-up-outline" size={20} color="#BDD1C7" /></View>
      <Text adjustsFontSizeToFit numberOfLines={1} style={{ fontSize: 37, fontWeight: '600', color: colors.white, letterSpacing: -1 }}>{summary ? formatMoney(summary.totalMinor, currency) : 'Total unavailable'}</Text>
      <View style={{ borderTopWidth: 1, borderTopColor: '#36534A', paddingTop: 17 }}><Text style={{ color: '#BDD1C7', fontSize: 13 }}>{entries.length} {entries.length === 1 ? 'expense' : 'expenses'} recorded · {currency}</Text></View>
    </Card>
    <Button icon="add" onPress={() => router.push('/expense')}>Add expense</Button>
    {summaryError ? <Text accessibilityRole="alert" style={styles.error}>{summaryError}</Text> : null}
    {!entries.length ? <EmptyState title="A fresh start" message="Add an expense to see where your money goes. Every little bit counts." /> : <>
      <View style={styles.between}><Text accessibilityRole="header" style={styles.sectionTitle}>Where it went</Text><Text style={styles.small}>BY CATEGORY</Text></View>
      {summary && <Card>{summary.categories.map(item => {
        const meta = categoryMeta[item.category];
        const share = item.totalMinor / summary!.totalMinor;
        return <View key={item.category} style={{ gap: 10 }}>
          <View style={styles.between}><View style={styles.row}><Icon name={meta.icon} color={meta.color} size={18} /><Text style={styles.rowTitle}>{item.category}</Text></View><Text style={styles.amount}>{formatMoney(item.totalMinor, currency)}</Text></View>
          <View accessibilityLabel={`${item.category}: ${Math.round(share * 100)} percent`} style={{ height: 7, backgroundColor: colors.background, borderRadius: 10, overflow: 'hidden' }}><View style={{ height: 7, width: `${share * 100}%`, backgroundColor: meta.color, borderRadius: 10 }} /></View>
        </View>;
      })}</Card>}
      <View style={styles.between}><Text accessibilityRole="header" style={styles.sectionTitle}>Recent expenses</Text><Text style={styles.small}>LATEST {Math.min(entries.length, 3)}</Text></View>
      <Card style={{ paddingVertical: 3 }}>{entries.slice(0, 3).map((expense, index) => <ExpenseRow key={expense.id} expense={expense} currency={currency} last={index === Math.min(entries.length, 3) - 1} />)}</Card>
    </>}
    <View style={[styles.row, { justifyContent: 'center' }]}><Icon name="shield-checkmark-outline" size={14} color={colors.muted} /><Text style={styles.small}>Saved on your device. Always yours.</Text></View>
  </Screen>;
}
