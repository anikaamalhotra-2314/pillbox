import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { PlaceholderScreen } from '@/design-system/primitives/PlaceholderScreen';
import { Pressable } from '@/design-system/primitives/Pressable';
import { ScreenHeader } from '@/design-system/primitives/ScreenHeader';
import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, space } from '@/design-system/tokens';
import { greetingFor } from '@/domain/format';
import { isOwned } from '@/domain/home';
import { catalogEntry, isCatalogId, type ItemId, type RoomId } from '@/domain/home-catalog';
import { RoomEditor } from '@/features/home/RoomEditor';
import { useNow } from '@/hooks/use-now';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { usePillbox } from '@/store/pillbox';

const leave = () => (router.canGoBack() ? router.back() : router.replace('/home'));

/** Decorate one room. `item` preselects a piece, as right after buying it. */
export default function DecorateRoom() {
  const { id, item } = useLocalSearchParams<{ id: string; item?: string }>();
  const home = usePillbox((s) => s.home);
  const timeOfDay = greetingFor(useNow());
  const reducedMotion = useReducedMotion();

  const room = isCatalogId(id) ? catalogEntry(id) : undefined;
  if (!room || room.kind !== 'room' || !isOwned(home, room.id)) {
    return <PlaceholderScreen title="Room not found" note="This room isn't part of your home yet." back />;
  }
  const initial = isCatalogId(item) && catalogEntry(item).kind === 'item' && isOwned(home, item) ? (item as ItemId) : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: color.surface.page }}>
      <ScreenHeader
        title={room.name}
        onBack={leave}
        right={
          <Pressable
            onPress={leave}
            accessibilityRole="button"
            accessibilityLabel="Done decorating"
            style={{ minWidth: 72, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space[4], borderLeftWidth: borderWidth.default, borderLeftColor: color.border.strong }}
          >
            <Text variant="title">Done</Text>
          </Pressable>
        }
      />
      <RoomEditor roomId={room.id as RoomId} initialItem={initial} timeOfDay={timeOfDay} animate={!reducedMotion} />
    </View>
  );
}
