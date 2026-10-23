import { Text, TextInput, View } from 'react-native';
import type { Currency } from '../../../domain/expenses';

/** Captures the amount using the selected transaction currency. */
export function AmountField({
  value,
  currency,
  editable,
  autoFocus,
  onChange,
}: {
  value: string;
  currency: Currency;
  editable: boolean;
  autoFocus: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <View className="gap-2 rounded-[20px] border border-[#E3EAE5] bg-white px-5 py-[26px]">
      <Text className="text-[13px] font-semibold text-[#17352F]">
        How much did you spend? · {currency}
      </Text>
      <TextInput
        accessibilityLabel={`Amount in ${currency}`}
        autoFocus={autoFocus}
        className="py-2 text-[44px] font-semibold text-[#17352F]"
        editable={editable}
        keyboardType="decimal-pad"
        maxLength={20}
        placeholder="0.00"
        placeholderTextColor="#B2C0B8"
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
}
