import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { Pressable } from '@/design-system/primitives/Pressable';
import { ScreenHeader } from '@/design-system/primitives/ScreenHeader';
import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, radius, scene, space } from '@/design-system/tokens';
import { avatarOf, BOTTOM_COLORS, HAIR_COLORS, SKIN_TONES, TOP_COLORS, type Avatar } from '@/domain/avatar';
import { Person } from '@/features/home/art/characters';
import { SwatchRow } from '@/features/home/SwatchRow';
import { usePillbox } from '@/store/pillbox';

const leave = () => (router.canGoBack() ? router.back() : router.replace('/home'));

/** Change how you look in the little home: skin, hair, top and bottoms. Saved as it changes, and free. */
export default function Character() {
  const saved = usePillbox((s) => s.home.avatar);
  const changeAvatar = usePillbox((s) => s.changeAvatar);
  const avatar = avatarOf(saved);
  const a = scene.avatar;

  const row = <K extends keyof Avatar>(part: K, title: string, options: readonly { id: Avatar[K]; name: string }[], fill: (id: Avatar[K]) => string) => (
    <SwatchRow<Avatar[K]>
      title={title}
      options={options.map((o) => ({ id: o.id, label: o.name, fill: fill(o.id) }))}
      value={avatar[part]}
      onChange={(v) => v && changeAvatar({ [part]: v } as Partial<Avatar>)}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: color.surface.page }}>
      <ScreenHeader
        title="Your look"
        onBack={leave}
        right={
          <Pressable
            onPress={leave}
            accessibilityRole="button"
            accessibilityLabel="Done changing your look"
            style={{ minWidth: 72, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space[4], borderLeftWidth: borderWidth.default, borderLeftColor: color.border.strong }}
          >
            <Text variant="title">Done</Text>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[5] }}>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={`You: ${avatar.skin} skin, ${avatar.hair} hair, a ${avatar.top} top and ${avatar.bottom} bottoms`}
          style={{ alignSelf: 'center', borderWidth: borderWidth.default, borderColor: color.border.strong, borderRadius: radius.card, overflow: 'hidden' }}
        >
          <Svg width={160} height={200} viewBox="0 0 40 50">
            <Rect x={0} y={0} width={40} height={50} fill={scene.time.Morning.wall} />
            <Person x={20} feetY={49} avatar={avatar} />
          </Svg>
        </View>
        {row('skin', 'Skin', SKIN_TONES, (id) => a.skin[id][0])}
        {row('hair', 'Hair', HAIR_COLORS, (id) => a.hair[id][0])}
        {row('top', 'Top', TOP_COLORS, (id) => a.top[id][0])}
        {row('bottom', 'Bottoms', BOTTOM_COLORS, (id) => a.bottom[id][0])}
      </ScrollView>
    </View>
  );
}
