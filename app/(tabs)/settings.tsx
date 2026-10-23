import { Text } from 'react-native';
import {
  CurrencySettingsPanel,
  PrivacyPanel,
  SampleDataPanel,
} from '../../src/presentation/components/settings-panels';
import { Header, Screen } from '../../src/presentation/components/layout';
import { useExpenses } from '../../src/presentation/expense-provider';

/** Provides local display, exchange-rate, demo-data, and privacy preferences. */
export default function Settings() {
  const { currency, baseCurrency, rates, refreshingRates, rateWarning, expenses, busy, store } =
    useExpenses();
  return (
    <Screen>
      <Header title="Make it yours" subtitle="A few simple preferences." />
      <CurrencySettingsPanel
        currency={currency}
        baseCurrency={baseCurrency}
        rates={rates}
        busy={busy}
        refreshingRates={refreshingRates}
        warning={rateWarning}
        onChangeCurrency={(value) => store.setCurrency(value)}
        onRefreshRates={() => {
          void store.refreshRates(true);
        }}
      />
      <SampleDataPanel disabled={busy || expenses.length > 0} onLoad={() => store.loadDemoData()} />
      <PrivacyPanel />
      <Text className="mt-3 text-center text-xs leading-[18px] text-[#70817B]">
        POCKET · VERSION 1.0.0
      </Text>
    </Screen>
  );
}
