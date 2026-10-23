import { Text } from 'react-native';
import { Card } from '../layout';
import { PanelHeading } from './panel-heading';

/** Explains the product's local-only privacy model. */
export function PrivacyPanel() {
  return (
    <Card>
      <PanelHeading icon="shield-checkmark-outline" title="A private little pocket" />
      <Text className="text-sm leading-[22px] text-[#70817B]">
        Your expenses live on this device. No account, no cloud sync, and no internet needed to
        track your spending.
      </Text>
      <Text className="text-sm leading-[22px] text-[#70817B]">
        Data stays saved when you close the app. Uninstalling the app or clearing its storage may
        remove your expenses.
      </Text>
    </Card>
  );
}
