import { StyleSheet } from 'react-native';

/** Shared palette for dynamic native styles that cannot be represented by static Tailwind classes. */
export const colors = {
  background: '#F5F7F5',
  white: '#FFFFFF',
  ink: '#17352F',
  muted: '#70817B',
  teal: '#167A63',
  pale: '#E6F2EC',
  line: '#E3EAE5',
  danger: '#B33A3A',
};

/** Retains the startup screen's native text styles; other components use Tailwind classes. */
export const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  error: { color: colors.danger, fontSize: 14, lineHeight: 21 },
});
