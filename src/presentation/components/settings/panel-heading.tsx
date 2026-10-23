import { Text, View } from 'react-native';
import { Icon } from '../icon';

/** Supplies the shared icon-and-title treatment used by each settings panel. */
export function PanelHeading({
  icon,
  title,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  title: string;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <Icon name={icon} color="#167A63" />
      <Text className="text-[18px] font-semibold tracking-[-0.3px] text-[#17352F]">{title}</Text>
    </View>
  );
}
