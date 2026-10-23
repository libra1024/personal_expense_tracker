import type { ReactNode } from 'react';
import { ScrollView, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Provides a safe, scrolling page shell with Pocket's shared spacing and background. */
export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const content = (
    <View className="w-full max-w-[680px] gap-6 self-center px-[22px] pb-[34px]">{children}</View>
  );
  return (
    <SafeAreaView className="flex-1 bg-[#F5F7F5]" edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView contentContainerClassName="flex-grow" keyboardShouldPersistTaps="handled">
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

/** Displays the shared page heading with optional trailing action content. */
export function Header({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-3 pt-3.5">
      <View className="flex-1">
        <Text className="mb-3 text-[10px] font-bold tracking-[1.8px] text-[#167A63]">
          POCKET / PERSONAL FINANCE
        </Text>
        <Text
          accessibilityRole="header"
          className="text-[32px] font-bold tracking-[-1px] text-[#17352F]"
        >
          {title}
        </Text>
        <Text className="mt-2 text-sm leading-[21px] text-[#70817B]">{subtitle}</Text>
      </View>
      {action}
    </View>
  );
}

/** Groups related content inside Pocket's bordered card surface. */
export function Card({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      className={`gap-4 rounded-[20px] border border-[#E3EAE5] bg-white p-5 ${className}`}
      style={style}
    >
      {children}
    </View>
  );
}
