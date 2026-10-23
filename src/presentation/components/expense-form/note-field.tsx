import { Text, TextInput, View } from 'react-native';

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
