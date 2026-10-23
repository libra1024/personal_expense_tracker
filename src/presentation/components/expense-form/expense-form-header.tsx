import { Text, View } from 'react-native';
import { IconButton } from '../controls';

/** Displays the editor mode and a close action that respects in-flight persistence. */
export function ExpenseFormHeader({
  editing,
  busy,
  onClose,
}: {
  editing: boolean;
  busy: boolean;
  onClose: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <View>
        <Text className="mb-[13px] text-[10px] font-bold tracking-[1.8px] text-[#167A63]">
          KEEP THE LITTLE THINGS IN VIEW
        </Text>
        <Text
          accessibilityRole="header"
          className="text-[28px] font-bold tracking-[-1px] text-[#17352F]"
        >
          {editing ? 'Edit expense' : 'Add expense'}
        </Text>
      </View>
      <IconButton name="close" label="Close expense form" onPress={onClose} disabled={busy} />
    </View>
  );
}
