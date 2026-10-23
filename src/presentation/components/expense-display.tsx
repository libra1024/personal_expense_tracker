import { router } from 'expo-router';
import { Text, View, Pressable } from 'react-native';
import { historicalExpenseMinor } from '../../domain/currency.ts';
import {
  dateLabel,
  formatMoney,
  type Category,
  type Currency,
  type Expense,
} from '../../domain/expenses.ts';
import { Button } from './controls.tsx';
import { Icon, type IconName } from './icon.tsx';
import { Card } from './layout.tsx';
import { colors } from './theme.ts';

/** Defines the icon and palette treatment for each expense category. */
export const categoryMeta: Record<Category, { icon: IconName; color: string; background: string }> =
  {
    'Food & Drink': { icon: 'restaurant-outline', color: '#BB743D', background: '#FBEDDF' },
    Groceries: { icon: 'basket-outline', color: '#438866', background: '#EAF3E6' },
    Transport: { icon: 'bus-outline', color: '#4D7BA5', background: '#E8F0F7' },
    Housing: { icon: 'home-outline', color: '#8B6B4A', background: '#F5EDE5' },
    Bills: { icon: 'receipt-outline', color: '#A88935', background: '#F6F1DD' },
    Insurance: { icon: 'shield-checkmark-outline', color: '#557B95', background: '#E7F0F5' },
    Shopping: { icon: 'bag-handle-outline', color: '#A56E99', background: '#F6EAF3' },
    Health: { icon: 'heart-outline', color: '#B7626F', background: '#F8E8EB' },
    'Personal Care': { icon: 'sparkles-outline', color: '#A47B55', background: '#F8EFE4' },
    Education: { icon: 'school-outline', color: '#6677A8', background: '#EBEEF8' },
    Childcare: { icon: 'happy-outline', color: '#C17A4F', background: '#FBEBDD' },
    Pets: { icon: 'paw-outline', color: '#7E7251', background: '#F2F0E5' },
    Subscriptions: { icon: 'repeat-outline', color: '#6B7D9B', background: '#E9EEF5' },
    Entertainment: { icon: 'headset-outline', color: '#8471B5', background: '#EFEAF8' },
    Travel: { icon: 'airplane-outline', color: '#479596', background: '#E2F2F1' },
    'Gifts & Donations': { icon: 'gift-outline', color: '#B4697B', background: '#F8E9EE' },
    'Taxes & Fees': { icon: 'calculator-outline', color: '#718064', background: '#EDF1E9' },
    Business: { icon: 'briefcase-outline', color: '#65798C', background: '#E8EEF2' },
    Other: { icon: 'grid-outline', color: '#74847C', background: '#EDF0ED' },
  };

/** Explains an empty expense collection and optionally provides the first-add action. */
export function EmptyState({
  title,
  message,
  add = false,
}: {
  title: string;
  message: string;
  add?: boolean;
}) {
  return (
    <Card className="items-center gap-3 py-9">
      <View className="mb-1 h-16 w-16 items-center justify-center rounded-[22px] bg-[#E6F2EC]">
        <Icon name="wallet-outline" size={30} color={colors.teal} />
      </View>
      <Text className="text-[18px] font-semibold tracking-[-0.3px] text-[#17352F]">{title}</Text>
      <Text className="max-w-[270px] text-center text-sm leading-[22px] text-[#70817B]">
        {message}
      </Text>
      {add ? (
        <Button icon="add" onPress={() => router.push('/expense')}>
          Add your first expense
        </Button>
      ) : null}
    </Card>
  );
}

/** Displays a saved expense using its immutable historical conversion data when available. */
export function ExpenseRow({
  expense,
  currency,
  baseCurrency = currency,
  last = false,
}: {
  expense: Expense;
  currency: Currency;
  baseCurrency?: Currency;
  last?: boolean;
}) {
  const meta = categoryMeta[expense.category] ?? categoryMeta.Other;
  const converted = historicalExpenseMinor(expense, baseCurrency, currency);
  const amount =
    converted === null
      ? formatMoney(expense.amountMinor, baseCurrency)
      : formatMoney(converted, currency);
  return (
    <Pressable
      accessibilityLabel={`Edit ${expense.category}, ${amount}, ${dateLabel(expense.date)}`}
      accessibilityRole="button"
      className={`flex-row items-center gap-3 py-[15px] ${last ? '' : 'border-b border-[#E3EAE5]'}`}
      onPress={() => router.push({ pathname: '/expense', params: { id: String(expense.id) } })}
    >
      <View
        className="h-[43px] w-[43px] items-center justify-center rounded-[14px]"
        style={{ backgroundColor: meta.background }}
      >
        <Icon name={meta.icon} color={meta.color} size={21} />
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-sm font-semibold text-[#17352F]" numberOfLines={1}>
          {expense.note || expense.category}
        </Text>
        <Text className="text-xs leading-[18px] text-[#70817B]">{expense.category}</Text>
      </View>
      <Text className="max-w-[46%] text-[13px] font-semibold text-[#17352F]">{amount}</Text>
      <Icon name="chevron-forward" size={15} color={colors.muted} />
    </Pressable>
  );
}
