import { useState } from 'react';
import { Text } from 'react-native';
import { Button } from '../controls';
import { Card } from '../layout';
import { PanelHeading } from './panel-heading';
import { PanelAlert } from './panel-alert';

/** Offers sample data loading while protecting existing expense records. */
export function SampleDataPanel({
  disabled,
  onLoad,
}: {
  disabled: boolean;
  onLoad: () => Promise<boolean>;
}) {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  return (
    <Card>
      <PanelHeading icon="flask-outline" title="Sample expenses" />
      <Text className="text-sm leading-[22px] text-[#70817B]">
        Load five editable examples for the current month to try the overview and categories.
      </Text>
      {disabled ? (
        <Text className="text-xs leading-[18px] text-[#70817B]">
          Available when your expense list is empty. Your existing expenses are kept safe.
        </Text>
      ) : null}
      <Button
        icon="download-outline"
        disabled={disabled}
        onPress={() => {
          setError('');
          setMessage('');
          void onLoad()
            .then((loaded) => {
              if (loaded)
                setMessage(
                  'Five sample expenses are ready. Open Overview to see them in the current month.',
                );
            })
            .catch((cause: unknown) => {
              setError(
                cause instanceof Error
                  ? cause.message
                  : 'Could not load the examples. Please try again.',
              );
            });
        }}
      >
        Load sample expenses
      </Button>
      {error ? <PanelAlert message={error} /> : null}
      {message ? (
        <Text accessibilityLiveRegion="polite" className="text-sm leading-[22px] text-[#167A63]">
          {message}
        </Text>
      ) : null}
    </Card>
  );
}
