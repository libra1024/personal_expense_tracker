import { Text } from 'react-native';
import { Button } from '../controls';

/** Explains a stale expense link and offers a direct way back without rendering editable fields. */
export function MissingExpense({ onBack }: { onBack: () => void }) {
  return (
    <>
      <Text accessibilityRole="alert" className="text-sm leading-[21px] text-[#B33A3A]">
        This expense no longer exists.
      </Text>
      <Button onPress={onBack}>Back to expenses</Button>
    </>
  );
}
