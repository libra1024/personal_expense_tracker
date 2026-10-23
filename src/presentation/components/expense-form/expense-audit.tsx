import { Text, View } from 'react-native';

/** Shows immutable audit timestamps for an existing expense. */
export function ExpenseAudit({ createdAt, updatedAt }: { createdAt: string; updatedAt: string }) {
  return (
    <View className="gap-1 rounded-[20px] border border-[#E3EAE5] bg-white p-[15px]">
      <Text className="text-xs leading-[18px] text-[#70817B]">Created · {createdAt}</Text>
      <Text className="text-xs leading-[18px] text-[#70817B]">Last modified · {updatedAt}</Text>
    </View>
  );
}
