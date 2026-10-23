import { Text, TextInput, View, Pressable } from 'react-native';
import {
  CATEGORIES,
  CURRENCIES,
  dateLabel,
  type Category,
  type Currency,
} from '../../domain/expenses';
import { categoryMeta } from './expense-display';
import { Icon } from './icon';

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

/** Selects the transaction category with category-specific icon feedback. */
export function CategoryField({
  value,
  disabled,
  onChange,
}: {
  value: Category | '';
  disabled: boolean;
  onChange: (category: Category) => void;
}) {
  return (
    <View className="gap-2">
      <Text className="text-[13px] font-semibold text-[#17352F]">Category</Text>
      <View className="flex-row flex-wrap gap-2">
        {CATEGORIES.map((category) => {
          const selected = category === value;
          return (
            <Pressable
              key={category}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled }}
              className={`min-h-11 flex-row items-center justify-center gap-2 rounded-[13px] border px-3.5 ${selected ? 'border-[#167A63] bg-[#E6F2EC]' : 'border-[#E3EAE5] bg-white'}`}
              disabled={disabled}
              onPress={() => onChange(category)}
            >
              <Icon
                name={categoryMeta[category].icon}
                size={17}
                color={selected ? '#167A63' : categoryMeta[category].color}
              />
              <Text className={`text-[13px] ${selected ? 'text-[#167A63]' : 'text-[#17352F]'}`}>
                {category}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Opens the native calendar picker while showing the currently selected date. */
export function DateField({
  value,
  disabled,
  onPress,
}: {
  value: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <View className="gap-2">
      <Text className="text-[13px] font-semibold text-[#17352F]">Date</Text>
      <Pressable
        accessibilityLabel={`Expense date: ${dateLabel(value)}`}
        accessibilityRole="button"
        className="min-h-[54px] flex-row items-center justify-between rounded-[14px] border border-[#E3EAE5] bg-white p-4"
        disabled={disabled}
        onPress={onPress}
      >
        <Text className="text-[15px] text-[#17352F]">{dateLabel(value)}</Text>
        <Icon name="calendar-outline" color="#167A63" size={21} />
      </Pressable>
    </View>
  );
}

/** Captures the optional free-form note for an expense. */
export function NoteField({
  value,
  editable,
  onChange,
}: {
  value: string;
  editable: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <View className="gap-2">
      <Text className="text-[13px] font-semibold text-[#17352F]">
        Note <Text className="font-normal text-[#70817B]">(optional)</Text>
      </Text>
      <TextInput
        accessibilityLabel="Expense note, optional"
        className="min-h-[90px] rounded-[14px] border border-[#E3EAE5] bg-white p-4 text-base text-[#17352F]"
        editable={editable}
        maxLength={500}
        multiline
        placeholder="What was it for?"
        placeholderTextColor="#70817B"
        textAlignVertical="top"
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
}

/** Shows immutable audit timestamps for an existing expense. */
export function ExpenseAudit({ createdAt, updatedAt }: { createdAt: string; updatedAt: string }) {
  return (
    <View className="gap-1 rounded-[20px] border border-[#E3EAE5] bg-white p-[15px]">
      <Text className="text-xs leading-[18px] text-[#70817B]">Created · {createdAt}</Text>
      <Text className="text-xs leading-[18px] text-[#70817B]">Last modified · {updatedAt}</Text>
    </View>
  );
}
