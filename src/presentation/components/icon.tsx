import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { colors } from './theme.ts';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/** Renders a consistent Ionicons glyph with Pocket's default ink color. */
export function Icon({
  name,
  size = 22,
  color = colors.ink,
}: {
  name: IconName;
  size?: number;
  color?: ColorValue;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
