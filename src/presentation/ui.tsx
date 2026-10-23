import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ColorValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ComponentProps, ReactNode } from "react";
import { historicalExpenseMinor } from "../domain/currency.ts";
import {
  dateLabel,
  formatMoney,
  monthLabel,
  shiftMonth,
  type Category,
  type Currency,
  type Expense,
} from "../domain/expenses.ts";

export const colors = {
  background: "#F5F7F5",
  white: "#FFFFFF",
  ink: "#17352F",
  muted: "#70817B",
  teal: "#167A63",
  pale: "#E6F2EC",
  line: "#E3EAE5",
  danger: "#B33A3A",
};
type IconName = ComponentProps<typeof Ionicons>["name"];
export const categoryMeta: Record<
  Category,
  { icon: IconName; color: string; background: string }
> = {
  "Food & Drink": {
    icon: "restaurant-outline",
    color: "#BB743D",
    background: "#FBEDDF",
  },
  Groceries: {
    icon: "basket-outline",
    color: "#438866",
    background: "#EAF3E6",
  },
  Transport: { icon: "bus-outline", color: "#4D7BA5", background: "#E8F0F7" },
  Housing: { icon: "home-outline", color: "#8B6B4A", background: "#F5EDE5" },
  Bills: { icon: "receipt-outline", color: "#A88935", background: "#F6F1DD" },
  Insurance: {
    icon: "shield-checkmark-outline",
    color: "#557B95",
    background: "#E7F0F5",
  },
  Shopping: {
    icon: "bag-handle-outline",
    color: "#A56E99",
    background: "#F6EAF3",
  },
  Health: { icon: "heart-outline", color: "#B7626F", background: "#F8E8EB" },
  "Personal Care": {
    icon: "sparkles-outline",
    color: "#A47B55",
    background: "#F8EFE4",
  },
  Education: {
    icon: "school-outline",
    color: "#6677A8",
    background: "#EBEEF8",
  },
  Childcare: { icon: "happy-outline", color: "#C17A4F", background: "#FBEBDD" },
  Pets: { icon: "paw-outline", color: "#7E7251", background: "#F2F0E5" },
  Subscriptions: {
    icon: "repeat-outline",
    color: "#6B7D9B",
    background: "#E9EEF5",
  },
  Entertainment: {
    icon: "headset-outline",
    color: "#8471B5",
    background: "#EFEAF8",
  },
  Travel: { icon: "airplane-outline", color: "#479596", background: "#E2F2F1" },
  "Gifts & Donations": {
    icon: "gift-outline",
    color: "#B4697B",
    background: "#F8E9EE",
  },
  "Taxes & Fees": {
    icon: "calculator-outline",
    color: "#718064",
    background: "#EDF1E9",
  },
  Business: {
    icon: "briefcase-outline",
    color: "#65798C",
    background: "#E8EEF2",
  },
  Other: { icon: "grid-outline", color: "#74847C", background: "#EDF0ED" },
};
export function Icon({
  name,
  size = 22,
  color = colors.ink,
}: {
  name: IconName;
  size?: number;
  color?: ColorValue;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function Screen({
  children,
  scroll = true,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  const content = <View style={styles.content}>{children}</View>;
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
export function Header({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.eyebrow}>POCKET / PERSONAL FINANCE</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {action}
    </View>
  );
}
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        danger && { backgroundColor: "#FBEDED" },
        (disabled || pressed) && { opacity: 0.55 },
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          size={20}
          color={
            danger ? colors.danger : secondary ? colors.teal : colors.white
          }
        />
      )}
      <Text
        style={[
          styles.buttonText,
          secondary && { color: colors.teal },
          danger && { color: colors.danger },
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}
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
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      style={[styles.iconButton, disabled && { opacity: 0.3 }]}
    >
      <Icon name={name} size={20} />
    </Pressable>
  );
}
export function MonthPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.monthPicker}>
      <IconButton
        name="chevron-back"
        label="Previous month"
        onPress={() => onChange(shiftMonth(value, -1))}
        disabled={value === "1900-01"}
      />
      <View style={styles.row}>
        <Icon name="calendar-outline" size={17} color={colors.teal} />
        <Text accessibilityLiveRegion="polite" style={styles.monthLabel}>
          {monthLabel(value)}
        </Text>
      </View>
      <IconButton
        name="chevron-forward"
        label="Next month"
        onPress={() => onChange(shiftMonth(value, 1))}
        disabled={value === "9999-12"}
      />
    </View>
  );
}
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
    <Card style={{ alignItems: "center", paddingVertical: 35, gap: 12 }}>
      <View style={styles.emptyIcon}>
        <Icon name="wallet-outline" size={30} color={colors.teal} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={[styles.body, { textAlign: "center", maxWidth: 270 }]}>
        {message}
      </Text>
      {add && (
        <Button icon="add" onPress={() => router.push("/expense")}>
          Add your first expense
        </Button>
      )}
    </Card>
  );
}
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
      accessibilityRole="button"
      accessibilityLabel={`Edit ${expense.category}, ${amount}, ${dateLabel(expense.date)}`}
      onPress={() =>
        router.push({
          pathname: "/expense",
          params: { id: String(expense.id) },
        })
      }
      style={({ pressed }) => [
        styles.expenseRow,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.line },
        pressed && { opacity: 0.6 },
      ]}
    >
      <View style={[styles.categoryIcon, { backgroundColor: meta.background }]}>
        <Icon name={meta.icon} color={meta.color} size={21} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {expense.note || expense.category}
        </Text>
        <Text style={styles.small}>{expense.category}</Text>
      </View>
      <Text style={styles.amount}>{amount}</Text>
      <Icon name="chevron-forward" size={15} color={colors.muted} />
    </Pressable>
  );
}
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    padding: 22,
    gap: 24,
    paddingBottom: 34,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 14,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.8,
    color: colors.teal,
    marginBottom: 13,
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -1,
  },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 7 },
  body: { fontSize: 14, lineHeight: 22, color: colors.muted },
  small: { fontSize: 12, color: colors.muted, lineHeight: 18 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20,
    gap: 16,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  button: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.teal,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  secondary: { backgroundColor: colors.pale },
  buttonText: { color: colors.white, fontWeight: "600", fontSize: 15 },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  monthPicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 4,
  },
  monthLabel: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.pale,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 15,
  },
  categoryIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  rowTitle: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  amount: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
    maxWidth: "46%",
  },
  error: { color: colors.danger, fontSize: 14, lineHeight: 21 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 9,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    color: colors.ink,
    padding: 16,
    minHeight: 54,
    fontSize: 16,
  },
  chip: {
    minHeight: 44,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  chipSelected: { backgroundColor: colors.pale, borderColor: colors.teal },
});
