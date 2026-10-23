import { Text } from 'react-native';
import { Button } from '../controls';

/** Presents save/delete actions and announces validation or persistence errors accessibly. */
export function ExpenseFormActions({
  editing,
  busy,
  error,
  onSave,
  onDelete,
}: {
  editing: boolean;
  busy: boolean;
  error: string;
  onSave: () => Promise<void>;
  onDelete: () => void;
}) {
  return (
    <>
      {error ? (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          className="text-sm leading-[21px] text-[#B33A3A]"
        >
          {error}
        </Text>
      ) : null}
      <Button icon="checkmark" onPress={() => void onSave()} disabled={busy}>
        {busy ? 'Saving…' : editing ? 'Save changes' : 'Save expense'}
      </Button>
      {editing ? (
        <Button danger icon="trash-outline" onPress={onDelete} disabled={busy}>
          Delete expense
        </Button>
      ) : null}
    </>
  );
}
