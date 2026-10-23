import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CURRENCIES, type Currency } from '../../../domain/expenses';
import { Button } from '../controls';
import { Icon } from '../icon';
import { Card } from '../layout';
import { PanelHeading } from './panel-heading';
import { PanelAlert } from './panel-alert';

const currencyNames: Record<Currency, string> = {
  MXN: 'Mexican peso',
  USD: 'US dollar',
  EUR: 'Euro',
};

/** Manages display-currency selection and optional exchange-rate refreshes. */
export function CurrencySettingsPanel({
  currency,
  baseCurrency,
  rates,
  busy,
  refreshingRates,
  warning,
  onChangeCurrency,
  onRefreshRates,
}: {
  currency: Currency;
  baseCurrency: Currency;
  rates: readonly { quote: Currency; date: string }[] | null;
  busy: boolean;
  refreshingRates: boolean;
  warning: string | null;
  onChangeCurrency: (currency: Currency) => Promise<unknown>;
  onRefreshRates: () => void;
}) {
  const [error, setError] = useState('');
  return (
    <Card>
      <PanelHeading icon="cash-outline" title="Display currency" />
      <Text className="text-sm leading-[22px] text-[#70817B]">
        Your expenses are stored in {baseCurrency}. Display totals can use the latest available
        daily exchange rates; this never changes a saved expense.
      </Text>
      {CURRENCIES.map((value) => {
        const selected = value === currency;
        return (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, disabled: busy }}
            disabled={busy}
            className={`flex-row items-center justify-between gap-3 rounded-[14px] border p-[15px] ${selected ? 'border-[#167A63] bg-[#E6F2EC]' : 'border-[#E3EAE5] bg-white'}`}
            onPress={() => {
              setError('');
              void onChangeCurrency(value).catch(() => {
                setError('Could not save your preference. Please try again.');
              });
            }}
          >
            <View className="flex-row items-center gap-2">
              <Text className="w-10 text-sm font-semibold text-[#17352F]">{value}</Text>
              <Text className="text-sm leading-[22px] text-[#70817B]">{currencyNames[value]}</Text>
            </View>
            <Icon
              name={selected ? 'radio-button-on' : 'radio-button-off'}
              color={selected ? '#167A63' : '#70817B'}
            />
          </Pressable>
        );
      })}
      {error ? <PanelAlert message={error} /> : null}
      <Text className="text-xs leading-[18px] text-[#70817B]">
        {rates
          ? `Saved daily rates: ${rates.map((rate) => `${rate.quote} · ${rate.date}`).join('  ')}`
          : 'No saved exchange rates yet. Base-currency expenses still work offline.'}
      </Text>
      <Button
        secondary
        icon="refresh-outline"
        disabled={busy || refreshingRates}
        onPress={onRefreshRates}
      >
        {refreshingRates ? 'Updating rates…' : 'Update exchange rates'}
      </Button>
      {warning ? <PanelAlert message={warning} /> : null}
    </Card>
  );
}
