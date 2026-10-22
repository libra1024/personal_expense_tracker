import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { calendarMonthDays, localDate, monthLabel, shiftMonth } from '../domain/expenses.ts';
import { colors, Icon, IconButton, styles } from './ui.tsx';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ExpenseCalendar({ value, onChange, disabled }: { value: string; onChange: (date: string) => void; disabled?: boolean }) {
  const [month, setMonth] = useState(value.slice(0, 7));
  const days = calendarMonthDays(month);
  const today = localDate();
  return <View accessibilityLabel="Choose expense date" style={[styles.card, { padding: 14, gap: 10, backgroundColor: '#FBFDFC' }]}>
    <View style={styles.between}>
      <IconButton name="chevron-back" label="Previous calendar month" disabled={disabled || month === '1900-01'} onPress={() => setMonth(shiftMonth(month, -1))} />
      <Text accessibilityLiveRegion="polite" style={styles.monthLabel}>{monthLabel(month)}</Text>
      <IconButton name="chevron-forward" label="Next calendar month" disabled={disabled || month === '9999-12'} onPress={() => setMonth(shiftMonth(month, 1))} />
    </View>
    <View style={{ flexDirection: 'row' }}>{weekdays.map(day => <Text key={day} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: colors.muted }}>{day}</Text>)}</View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{days.map((day, index) => {
      if (!day) return <View key={`empty-${index}`} style={{ width: '14.2857%', aspectRatio: 1 }} />;
      const selected = day === value;
      const isToday = day === today;
      return <Pressable key={day} accessibilityRole="radio" accessibilityLabel={day} accessibilityState={{ checked: selected, disabled: !!disabled }} disabled={disabled} onPress={() => onChange(day)}
        style={({ pressed }) => [{ width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 3, opacity: pressed ? 0.6 : 1 }]}>
        <View style={{ width: '100%', height: '100%', maxHeight: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.teal : isToday ? colors.pale : 'transparent', borderWidth: isToday && !selected ? 1 : 0, borderColor: colors.teal }}>
          <Text style={{ color: selected ? colors.white : colors.ink, fontWeight: selected || isToday ? '700' : '500' }}>{Number(day.slice(-2))}</Text>
        </View>
      </Pressable>;
    })}</View>
    <View style={[styles.row, { justifyContent: 'center' }]}><Icon name="calendar-outline" size={14} color={colors.teal} /><Text style={styles.small}>Tap a day to select it</Text></View>
  </View>;
}
