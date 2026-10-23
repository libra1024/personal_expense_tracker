import { Text, View } from 'react-native';
import { Icon } from '../icon';

/** States the app's local-only storage promise at the bottom of the overview. */
export function DevicePrivacyNote() {
  return (
    <View className="flex-row items-center justify-center gap-2">
      <Icon name="shield-checkmark-outline" size={14} color="#70817B" />
      <Text className="text-xs leading-[18px] text-[#70817B]">
        Saved on your device. Always yours.
      </Text>
    </View>
  );
}
