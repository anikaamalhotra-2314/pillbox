import { router, useIsFocused } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FocusedScene } from '@/design-system/primitives/FocusedScene';
import { Pressable } from '@/design-system/primitives/Pressable';
import { StackedCard } from '@/design-system/primitives/StackedCard';
import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, radius, scene, space } from '@/design-system/tokens';
import { toLocalDate } from '@/domain/dates';
import { buildDay, doseKey } from '@/domain/day';
import { greetingFor } from '@/domain/format';
import { availability, coinBalance, earnedOn, isOwned, nextGoal } from '@/domain/home';
import { catalogEntry, FLOORS, type CatalogId } from '@/domain/home-catalog';
import { CoinChip, coinsLabel } from '@/features/home/CoinChip';
import { HouseScene } from '@/features/home/HouseScene';
import { useNow } from '@/hooks/use-now';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { usePillbox } from '@/store/pillbox';

/** How big the house is drawn: this many scene units fill two screen widths. The house is wider than that. */
const SCENE_SCREENS = 2;
const VIEW_UNITS = 540;

const chip = {
  alignSelf: 'flex-start', paddingHorizontal: space[3], paddingVertical: space[1],
  backgroundColor: color.surface.page, borderWidth: borderWidth.default, borderColor: color.border.strong, borderRadius: radius.card,
} as const;

export default function Home() {
  const insets = useSafeAreaInsets();
  const now = useNow();
  const today = toLocalDate(now);
  const focused = useIsFocused();
  const reducedMotion = useReducedMotion();

  const userName = usePillbox((s) => s.userName);
  const home = usePillbox((s) => s.home);
  const medications = usePillbox((s) => s.medications);
  const logs = usePillbox((s) => s.logs);

  const [width, setWidth] = useState(0);
  const [cardHeight, setCardHeight] = useState(0);
  const [lookedAround, setLookedAround] = useState(false);
  const vertical = useRef<ScrollView>(null);
  const snapping = useRef(false);
  const floorsBuilt = FLOORS.filter((f) => isOwned(home, f.id)).length;

  // Every time the tab is opened (and when the house or the card changes size), show the ground floor,
  // where you live. The upper floors are a scroll up.
  useEffect(() => {
    if (!focused || width === 0) return;
    snapping.current = true;
    const frame = requestAnimationFrame(() => vertical.current?.scrollToEnd({ animated: false }));
    const done = setTimeout(() => { snapping.current = false; }, 600);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(done);
    };
  }, [focused, width, cardHeight, floorsBuilt]);

  const timeOfDay = greetingFor(now);
  const balance = coinBalance(home);
  const entries = useMemo(() => buildDay(medications, logs, today, now), [medications, logs, today, now]);
  const onTime = entries.filter((e) => home.earned[doseKey(e.dose)]);
  const coinsToday = earnedOn(home.earned, today).coins;
  const goal = nextGoal(home);
  const goalStatus = goal && availability(home, goal.id);

  // A locked room or floor opens the shop on Rooms; the Shop button opens it on Furniture.
  const openShop = (id?: CatalogId) =>
    router.push({ pathname: '/shop', params: id && catalogEntry(id).kind !== 'item' ? { tab: 'rooms' } : {} });

  return (
    <FocusedScene style={{ flex: 1, backgroundColor: scene.time[timeOfDay].sky }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <ScrollView
        ref={vertical}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
        // Sizes settle over a few layouts (the house, then the card under it). Keep landing on the ground floor
        // until they do.
        onContentSizeChange={() => {
          if (snapping.current) vertical.current?.scrollToEnd({ animated: false });
        }}
      >
        <View style={{ height: insets.top + 64 }} />
        {width > 0 && (
          <ScrollView horizontal style={{ flexGrow: 0 }} showsHorizontalScrollIndicator={false} onScrollBeginDrag={() => setLookedAround(true)} onScroll={() => setLookedAround(true)} scrollEventThrottle={200}>
            <HouseScene
              home={home}
              timeOfDay={timeOfDay}
              userName={userName}
              scale={(width * SCENE_SCREENS) / VIEW_UNITS}
              animate={focused && !reducedMotion}
              onLockedPress={openShop}
              onDecorate={(id) => router.push({ pathname: '/room/[id]', params: { id } })}
            />
          </ScrollView>
        )}
        {/* Room under the summary card, in the color of the ground, so nothing is hidden behind it. */}
        <View style={{ height: cardHeight + space[3], backgroundColor: scene.peachDeep }} />
      </ScrollView>

      <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + space[3], left: space[4], right: space[4], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={chip}><Text variant="subheading" accent accessibilityRole="header">{`${userName}’s Home`}</Text></View>
        <CoinChip coins={balance} />
      </View>

      <View
        pointerEvents="box-none"
        onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}
        style={{ position: 'absolute', left: space[4], right: space[4], bottom: space[3], gap: space[3] }}
      >
        {!lookedAround && (
          <View aria-hidden pointerEvents="none" style={[chip, { alignSelf: 'center' }]}>
            <Text variant="subheading" accent>Scroll to look around · tap to walk</Text>
          </View>
        )}
        <StackedCard tone="cream" contentStyle={{ padding: space[4], gap: space[3] }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: space[2] }}>
            <Text variant="title" accessibilityRole="header">Today</Text>
            <Text variant="subheading" style={{ alignSelf: 'center' }}>
              {entries.length === 0 ? 'No doses today' : `+${coinsToday} · ${onTime.length} of ${entries.length} on time`}
            </Text>
          </View>
          {entries.length > 0 && (
            <View aria-hidden style={{ flexDirection: 'row', gap: space[1] }}>
              {entries.map((e) => (
                <View
                  key={doseKey(e.dose)}
                  style={{
                    flex: 1, height: 10, borderWidth: borderWidth.default, borderColor: color.border.strong,
                    backgroundColor: home.earned[doseKey(e.dose)] ? color.surface.action : color.surface.page,
                  }}
                />
              ))}
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[3] }}>
            <Text variant="subheading" accent style={{ flex: 1 }}>
              {!goal ? 'Your home is complete.'
                : goalStatus?.kind === 'short' ? `${goal.name}: ${coinsLabel(goalStatus.missing)} to go`
                : `${goal.name}: ready to buy`}
            </Text>
            <Pressable
              onPress={() => openShop()}
              accessibilityRole="button"
              accessibilityLabel="Shop"
              style={{ minHeight: 44, minWidth: 72, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space[4], backgroundColor: color.border.strong, borderRadius: radius.card }}
            >
              <Text variant="title" style={{ color: color.surface.page }}>Shop</Text>
            </Pressable>
          </View>
        </StackedCard>
      </View>
    </FocusedScene>
  );
}
