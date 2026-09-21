import { useIsFocused } from 'expo-router';
import { View, type ViewProps } from 'react-native';

/**
 * The root view of a tab screen. The tab navigator keeps inactive tabs mounted, and on web it leaves them
 * laid out behind the active one, so their buttons stay reachable with the keyboard while `aria-hidden`.
 * `display: none` removes them from both the tab order and the accessibility tree; state is kept.
 */
export function FocusedScene({ style, ...rest }: ViewProps) {
  const focused = useIsFocused();
  return <View {...rest} style={[style, !focused && { display: 'none' }]} />;
}
