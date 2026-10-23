import { Pressable, ScrollView, Text } from 'react-native';
import { CATEGORIES, type Category } from '../../../domain/expenses';

/** Lets people filter the expense history by a single category. */
export function CategoryFilter({
  value,
  onChange,
}: {
  value: Category | undefined;
  onChange: (category: Category | undefined) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
      {(['All', ...CATEGORIES] as const).map((item) => {
        const selected = item === (value ?? 'All');
        return (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={`min-h-11 justify-center rounded-[13px] border px-3.5 ${selected ? 'border-[#167A63] bg-[#E6F2EC]' : 'border-[#E3EAE5] bg-white'}`}
            onPress={() => onChange(item === 'All' ? undefined : item)}
          >
            <Text
              className={`text-[13px] ${selected ? 'font-semibold text-[#167A63]' : 'text-[#70817B]'}`}
            >
              {item}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
