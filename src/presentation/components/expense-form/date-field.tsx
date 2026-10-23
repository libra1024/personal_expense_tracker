import { useState } from 'react';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Platform, Pressable, Text, View } from 'react-native';
import { dateLabel, localDate } from '../../../domain/expenses';
import { Button } from '../controls';
import { Icon } from '../icon';

/** Owns native picker visibility while exposing only a controlled local-calendar date to the form. */
export function DateField({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [year, month, day] = value.split('-').map(Number);

  /** Ignores dismissals, preserves local dates, and keeps the iOS spinner open until Done. */
  function handleDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS !== 'ios') setShowPicker(false);
    if (event.type !== 'dismissed' && selectedDate) onChange(localDate(selectedDate));
  }

  return (
    <>
      <View className="gap-2">
        <Text className="text-[13px] font-semibold text-[#17352F]">Date</Text>
        <Pressable
          accessibilityLabel={`Expense date: ${dateLabel(value)}`}
          accessibilityRole="button"
          className="min-h-[54px] flex-row items-center justify-between rounded-[14px] border border-[#E3EAE5] bg-white p-4"
          disabled={disabled}
          onPress={() => setShowPicker(true)}
        >
          <Text className="text-[15px] text-[#17352F]">{dateLabel(value)}</Text>
          <Icon name="calendar-outline" color="#167A63" size={21} />
        </Pressable>
      </View>
      {showPicker ? (
        <View>
          <DateTimePicker
            mode="date"
            value={new Date(year, month - 1, day, 12)}
            minimumDate={new Date(1900, 0, 1)}
            maximumDate={new Date(9999, 11, 31)}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            themeVariant="light"
            onChange={handleDateChange}
          />
          {Platform.OS === 'ios' ? (
            <Button secondary onPress={() => setShowPicker(false)}>
              Done
            </Button>
          ) : null}
        </View>
      ) : null}
    </>
  );
}
