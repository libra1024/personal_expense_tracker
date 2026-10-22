import { Stack } from 'expo-router';
import { ActivityIndicator, StatusBar, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ExpenseProvider, useExpenses } from '../src/provider';
import { Button, colors, Icon, styles } from '../src/ui';

export const unstable_settings = { anchor: '(tabs)' };

function Navigation() {
  const { ready, error, store } = useExpenses();
  if (!ready) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: 32, gap: 18 }}>
    <Icon name="wallet-outline" color={colors.teal} size={42} />
    <Text style={styles.sectionTitle}>Your money, a little clearer.</Text>
    {error ? <><Text accessibilityRole="alert" style={[styles.error, { textAlign: 'center' }]}>{error}</Text><Button onPress={() => { void store.initialize(); }}>Try again</Button></> : <ActivityIndicator color={colors.teal} accessibilityLabel="Opening your expenses" />}
  </View>;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Screen name="(tabs)" />
    <Stack.Screen name="expense" options={{ presentation: 'modal', gestureEnabled: false }} />
  </Stack>;
}
export default function RootLayout() {
  return <SafeAreaProvider><StatusBar barStyle="dark-content" /><ExpenseProvider><Navigation /></ExpenseProvider></SafeAreaProvider>;
}
