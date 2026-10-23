import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Supplies the editor's safe-area, keyboard avoidance, and responsive scrolling layout. */
export function ExpenseFormLayout({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-[#F5F7F5]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="w-full max-w-[680px] self-center gap-6 px-[22px] pb-[34px]"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
