import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CURRENCIES, type Currency } from '../../domain/expenses';
import { Button } from './controls';
import { Icon } from './icon';
import { Card } from './layout';

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

/** Offers sample data loading while protecting existing expense records. */
export function SampleDataPanel({
  disabled,
  onLoad,
}: {
  disabled: boolean;
  onLoad: () => Promise<boolean>;
}) {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  return (
    <Card>
      <PanelHeading icon="flask-outline" title="Sample expenses" />
      <Text className="text-sm leading-[22px] text-[#70817B]">
        Load five editable examples for the current month to try the overview and categories.
      </Text>
      {disabled ? (
        <Text className="text-xs leading-[18px] text-[#70817B]">
          Available when your expense list is empty. Your existing expenses are kept safe.
        </Text>
      ) : null}
      <Button
        icon="download-outline"
        disabled={disabled}
        onPress={() => {
          setError('');
          setMessage('');
          void onLoad()
            .then((loaded) => {
              if (loaded)
                setMessage(
                  'Five sample expenses are ready. Open Overview to see them in the current month.',
                );
            })
            .catch((cause: unknown) => {
              setError(
                cause instanceof Error
                  ? cause.message
                  : 'Could not load the examples. Please try again.',
              );
            });
        }}
      >
        Load sample expenses
      </Button>
      {error ? <PanelAlert message={error} /> : null}
      {message ? (
        <Text accessibilityLiveRegion="polite" className="text-sm leading-[22px] text-[#167A63]">
          {message}
        </Text>
      ) : null}
    </Card>
  );
}

/** Explains the product's local-only privacy model. */
export function PrivacyPanel() {
  return (
    <Card>
      <PanelHeading icon="shield-checkmark-outline" title="A private little pocket" />
      <Text className="text-sm leading-[22px] text-[#70817B]">
        Your expenses live on this device. No account, no cloud sync, and no internet needed to
        track your spending.
      </Text>
      <Text className="text-sm leading-[22px] text-[#70817B]">
        Data stays saved when you close the app. Uninstalling the app or clearing its storage may
        remove your expenses.
      </Text>
    </Card>
  );
}

/** Supplies the shared icon-and-title treatment used by each settings panel. */
function PanelHeading({
  icon,
  title,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  title: string;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <Icon name={icon} color="#167A63" />
      <Text className="text-[18px] font-semibold tracking-[-0.3px] text-[#17352F]">{title}</Text>
    </View>
  );
}

/** Announces a settings operation failure without duplicating alert styling. */
function PanelAlert({ message }: { message: string }) {
  return (
    <Text accessibilityRole="alert" className="text-sm leading-[21px] text-[#B33A3A]">
      {message}
    </Text>
  );
}
