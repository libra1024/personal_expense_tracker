import { Pressable, Text, View } from 'react-native';
import { CATEGORIES, type Category } from '../../../domain/expenses';
import { categoryMeta } from '../expense-display';
import { Icon } from '../icon';

/** Selects the transaction category with category-specific icon feedback. */
export function CategoryField({
  value,
  disabled,
  onChange,
}: {
  value: Category | '';
  disabled: boolean;
  onChange: (category: Category) => void;
}) {
  return (
    <View className="gap-2">
      <Text className="text-[13px] font-semibold text-[#17352F]">Category</Text>
      <View className="flex-row flex-wrap gap-2">
        {CATEGORIES.map((category) => {
          const selected = category === value;
          return (
            <Pressable
              key={category}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled }}
              className={`min-h-11 flex-row items-center justify-center gap-2 rounded-[13px] border px-3.5 ${selected ? 'border-[#167A63] bg-[#E6F2EC]' : 'border-[#E3EAE5] bg-white'}`}
              disabled={disabled}
              onPress={() => onChange(category)}
            >
              <Icon
                name={categoryMeta[category].icon}
                size={17}
                color={selected ? '#167A63' : categoryMeta[category].color}
              />
              <Text className={`text-[13px] ${selected ? 'text-[#167A63]' : 'text-[#17352F]'}`}>
                {category}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
