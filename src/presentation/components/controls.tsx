import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { monthLabel, shiftMonth } from '../../domain/expenses.ts';
import { Icon, type IconName } from './icon.tsx';
import { colors } from './theme.ts';

/** Renders a primary, secondary, or destructive action with a consistent touch target. */
export function Button({
  children,
  onPress,
  disabled,
  secondary = false,
  danger = false,
  icon,
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
  icon?: IconName;
}) {
  const backgroundClass = danger ? 'bg-[#FBEDED]' : secondary ? 'bg-[#E6F2EC]' : 'bg-[#167A63]';
  const textClass = danger || secondary ? 'text-[#167A63]' : 'text-white';
  const iconColor = danger ? colors.danger : secondary ? colors.teal : colors.white;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      className={`min-h-[52px] flex-row items-center justify-center gap-2 rounded-[14px] px-[18px] py-[14px] ${backgroundClass} ${disabled ? 'opacity-55' : ''}`}
      disabled={disabled}
      onPress={onPress}
    >
      {icon ? <Icon name={icon} size={20} color={iconColor} /> : null}
      <Text className={`text-[15px] font-semibold ${textClass}`}>{children}</Text>
    </Pressable>
  );
}

/** Renders an accessible icon-only control for compact navigation and dismissal actions. */
export function IconButton({
  name,
  label,
  onPress,
  disabled,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      className={`min-h-11 min-w-11 items-center justify-center rounded-xl ${disabled ? 'opacity-30' : ''}`}
      disabled={disabled}
      onPress={onPress}
    >
      <Icon name={name} size={20} />
    </Pressable>
  );
}

/** Selects a valid calendar month without allowing the domain's supported range to overflow. */
export function MonthPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View className="flex-row items-center justify-between rounded-[15px] border border-[#E3EAE5] bg-white p-1">
      <IconButton
        name="chevron-back"
        label="Previous month"
        onPress={() => onChange(shiftMonth(value, -1))}
        disabled={value === '1900-01'}
      />
      <View className="flex-row items-center gap-2">
        <Icon name="calendar-outline" size={17} color={colors.teal} />
        <Text accessibilityLiveRegion="polite" className="text-[15px] font-semibold text-[#17352F]">
          {monthLabel(value)}
        </Text>
      </View>
      <IconButton
        name="chevron-forward"
        label="Next month"
        onPress={() => onChange(shiftMonth(value, 1))}
        disabled={value === '9999-12'}
      />
    </View>
  );
}
