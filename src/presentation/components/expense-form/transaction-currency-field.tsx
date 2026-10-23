import { Pressable, Text, View } from 'react-native';
import { CURRENCIES, type Currency } from '../../../domain/expenses';

/** Lets people choose the currency used for the transaction amount. */
export function TransactionCurrencyField({
  value,
  baseCurrency,
  hasRates,
  disabled,
  onChange,
}: {
  value: Currency;
  baseCurrency: Currency;
  hasRates: boolean;
  disabled: boolean;
  onChange: (currency: Currency) => void;
}) {
  return (
    <View className="gap-2">
      <Text className="text-[13px] font-semibold text-[#17352F]">Transaction currency</Text>
      <View className="flex-row gap-2">
        {CURRENCIES.map((currency) => {
          const selected = currency === value;
          return (
            <Pressable
              key={currency}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled }}
              className={`min-h-11 justify-center rounded-[13px] border px-3.5 ${selected ? 'border-[#167A63] bg-[#E6F2EC]' : 'border-[#E3EAE5] bg-white'}`}
              disabled={disabled}
              onPress={() => onChange(currency)}
            >
              <Text className={selected ? 'text-[#167A63]' : 'text-[#17352F]'}>{currency}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text className="text-xs leading-[18px] text-[#70817B]">
        {value === baseCurrency
          ? `Stored as ${baseCurrency}.`
          : hasRates
            ? `Uses the saved daily rate to lock this expense in ${baseCurrency}.`
            : `Connect once or update rates before adding a ${value} expense.`}
      </Text>
    </View>
  );
}
