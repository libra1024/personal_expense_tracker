import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CURRENCIES } from '../../src/domain/expenses';
import { useExpenses } from '../../src/provider';
import { Button, Card, colors, Header, Icon, Screen, styles } from '../../src/ui';

const names = { MXN: 'Mexican peso', USD: 'US dollar', EUR: 'Euro' };
export default function Settings() {
  const { currency, baseCurrency, rates, refreshingRates, rateWarning, expenses, busy, store } = useExpenses();
  const [error, setError] = useState('');
  const [sampleError, setSampleError] = useState('');
  const [sampleMessage, setSampleMessage] = useState('');
  return <Screen>
    <Header title="Make it yours" subtitle="A few simple preferences." />
    <Card>
      <View style={styles.row}><Icon name="cash-outline" color={colors.teal} /><Text style={styles.sectionTitle}>Display currency</Text></View>
      <Text style={styles.body}>Your expenses are stored in {baseCurrency}. Display totals can use the latest available daily exchange rates; this never changes a saved expense.</Text>
      {CURRENCIES.map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: value === currency, disabled: busy }} disabled={busy} onPress={async () => {
        setError('');
        try { await store.setCurrency(value); } catch { setError('Could not save your preference. Please try again.'); }
      }} style={[styles.between, { padding: 15, borderRadius: 14, borderWidth: 1, borderColor: currency === value ? colors.teal : colors.line, backgroundColor: currency === value ? colors.pale : colors.white }]}>
        <View style={styles.row}><Text style={[styles.rowTitle, { width: 40 }]}>{value}</Text><Text style={styles.body}>{names[value]}</Text></View><Icon name={currency === value ? 'radio-button-on' : 'radio-button-off'} color={currency === value ? colors.teal : colors.muted} />
      </Pressable>)}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Text style={styles.small}>{rates ? `Saved daily rates: ${rates.map(rate => `${rate.quote} · ${rate.date}`).join('  ')}` : 'No saved exchange rates yet. Base-currency expenses still work offline.'}</Text>
      <Button secondary icon="refresh-outline" disabled={busy || refreshingRates} onPress={() => { void store.refreshRates(true); }}>{refreshingRates ? 'Updating rates…' : 'Update exchange rates'}</Button>
      {rateWarning ? <Text accessibilityRole="alert" style={styles.error}>{rateWarning}</Text> : null}
    </Card>
    <Card>
      <View style={styles.row}><Icon name="flask-outline" color={colors.teal} /><Text style={styles.sectionTitle}>Sample expenses</Text></View>
      <Text style={styles.body}>Load five editable examples for the current month to try the overview and categories.</Text>
      {expenses.length > 0 ? <Text style={styles.small}>Available when your expense list is empty. Your existing expenses are kept safe.</Text> : null}
      <Button icon="download-outline" disabled={busy || expenses.length > 0} onPress={async () => {
        setSampleError(''); setSampleMessage('');
        try {
          if (await store.loadDemoData()) setSampleMessage('Five sample expenses are ready. Open Overview to see them in the current month.');
        } catch (cause) {
          setSampleError(cause instanceof Error ? cause.message : 'Could not load the examples. Please try again.');
        }
      }}>Load sample expenses</Button>
      {sampleError ? <Text accessibilityRole="alert" style={styles.error}>{sampleError}</Text> : null}
      {sampleMessage ? <Text accessibilityLiveRegion="polite" style={[styles.body, { color: colors.teal }]}>{sampleMessage}</Text> : null}
    </Card>
    <Card>
      <View style={styles.row}><Icon name="shield-checkmark-outline" color={colors.teal} /><Text style={styles.sectionTitle}>A private little pocket</Text></View>
      <Text style={styles.body}>Your expenses live on this device. No account, no cloud sync, and no internet needed to track your spending.</Text>
      <Text style={styles.body}>Data stays saved when you close the app. Uninstalling the app or clearing its storage may remove your expenses.</Text>
    </Card>
    <Text style={[styles.small, { textAlign: 'center', marginTop: 12 }]}>POCKET · VERSION 1.0.0</Text>
  </Screen>;
}
