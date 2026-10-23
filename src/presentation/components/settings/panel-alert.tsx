import { Text } from 'react-native';

/** Announces a settings operation failure without duplicating alert styling. */
export function PanelAlert({ message }: { message: string }) {
  return (
    <Text accessibilityRole="alert" className="text-sm leading-[21px] text-[#B33A3A]">
      {message}
    </Text>
  );
}
