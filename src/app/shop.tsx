import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { AccessibilityInfo, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmModal } from '@/design-system/primitives/ConfirmModal';
import { Pressable } from '@/design-system/primitives/Pressable';
import { ScreenHeader } from '@/design-system/primitives/ScreenHeader';
import { StackedCard } from '@/design-system/primitives/StackedCard';
import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, radius, space } from '@/design-system/tokens';
import { greetingFor } from '@/domain/format';
import { availability, coinBalance, isOwned, type Availability } from '@/domain/home';
import { BUILD_ORDER, catalogEntry, itemsIn, ROOMS, roomsOn, type CatalogEntry } from '@/domain/home-catalog';
import { CoinChip, coinsLabel } from '@/features/home/CoinChip';
import { Thumbnail } from '@/features/home/Thumbnail';
import { useNow } from '@/hooks/use-now';
import { usePillbox } from '@/store/pillbox';

type Tab = 'furniture' | 'rooms';
const DEV_GRANT = 500;
const TABS: { id: Tab; label: string }[] = [{ id: 'furniture', label: 'Furniture' }, { id: 'rooms', label: 'Rooms' }];

const leave = () => (router.canGoBack() ? router.back() : router.replace('/home'));

/** "the kitchen", for sentences. */
const the = (entry: CatalogEntry) => `the ${entry.name.toLowerCase()}`;

function whereItGoes(entry: CatalogEntry): string {
  switch (entry.kind) {
    case 'item': return `Then you can put it where you like in ${the(catalogEntry(entry.room))}.`;
    case 'room': return 'Then you can furnish it from the Furniture tab.';
    case 'floor': return `It comes with space for ${roomsOn(entry.id).length === 3 ? 'three' : 'two'} new rooms.`;
  }
}

export default function Shop() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'rooms' ? 'rooms' : 'furniture');
  const [confirming, setConfirming] = useState<CatalogEntry | null>(null);
  const home = usePillbox((s) => s.home);
  const buy = usePillbox((s) => s.buy);
  const timeOfDay = greetingFor(useNow());
  const balance = coinBalance(home);

  const confirmPurchase = () => {
    if (!confirming) return;
    const bought = confirming;
    setConfirming(null);
    buy(bought.id, new Date());
    const left = coinBalance(usePillbox.getState().home);
    AccessibilityInfo.announceForAccessibility(`${bought.name} bought. ${coinsLabel(left)} left.`);
    // New furniture goes straight to its room, selected, so it can be put where you want it.
    if (bought.kind === 'item') router.push({ pathname: '/room/[id]', params: { id: bought.room, item: bought.id } });
  };

  const grid = (entries: CatalogEntry[]) => (
    <Grid>
      {entries.map((e) => (
        <ShopCard key={e.id} entry={e} status={availability(home, e.id)} timeOfDay={timeOfDay} onBuy={() => setConfirming(e)} />
      ))}
    </Grid>
  );

  return (
    <View style={{ flex: 1, backgroundColor: color.surface.page }}>
      <ScreenHeader
        title="Shop"
        onBack={leave}
        right={<View style={{ justifyContent: 'center', paddingHorizontal: space[4] }}><CoinChip coins={balance} /></View>}
      />

      <View role="tablist" style={{ flexDirection: 'row', gap: space[2], paddingHorizontal: space[5], paddingTop: space[4] }}>
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              role="tab"
              aria-selected={on}
              accessibilityLabel={t.label}
              style={{
                minHeight: 44, justifyContent: 'center', paddingHorizontal: space[4], borderRadius: radius.card,
                borderWidth: borderWidth.default, borderColor: color.border.strong,
                backgroundColor: on ? color.border.strong : 'transparent',
              }}
            >
              <Text variant="subheading" style={on ? { color: color.surface.page } : undefined}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ padding: space[5], paddingBottom: insets.bottom + space[8], gap: space[5] }}>
        <Text variant="subheading" accent>Every dose you take on time earns 5 coins.</Text>
        {/* Development builds only: stripped from release builds, where __DEV__ is false. */}
        {__DEV__ && (
          <Pressable
            onPress={() => usePillbox.getState().grantCoins(DEV_GRANT)}
            accessibilityRole="button"
            accessibilityLabel={`Add ${DEV_GRANT} coins, for testing`}
            style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: space[4], borderWidth: borderWidth.default, borderColor: color.border.strong, borderStyle: 'dashed', borderRadius: radius.card }}
          >
            <Text variant="subheading">{`+${DEV_GRANT} coins (dev)`}</Text>
          </Pressable>
        )}
        {tab === 'furniture'
          ? ROOMS.map((room) => (
            <View key={room.id} style={{ gap: space[3] }}>
              <Text variant="title" accessibilityRole="header">{room.name}</Text>
              {isOwned(home, room.id)
                ? grid(itemsIn(room.id))
                : <Text variant="subheading" tone="placeholder">{`Unlock ${the(room)} on the Rooms tab to furnish it.`}</Text>}
            </View>
          ))
          : (
            <View style={{ gap: space[3] }}>
              {grid(BUILD_ORDER.filter((e) => e.price > 0))}
            </View>
          )}
      </ScrollView>

      <ConfirmModal
        visible={confirming !== null}
        title={confirming ? `${confirming.name}, ${coinsLabel(confirming.price)}` : ''}
        message={confirming ? whereItGoes(confirming) : ''}
        confirmLabel="Buy it"
        cancelLabel="Not now"
        onConfirm={confirmPurchase}
        onCancel={() => setConfirming(null)}
      />
    </View>
  );
}

/** Two columns. Rows are built by hand so every card in a row shares its height. */
function Grid({ children }: { children: ReactNode[] }) {
  const rows: ReactNode[][] = [];
  children.forEach((child, i) => (i % 2 ? rows[rows.length - 1].push(child) : rows.push([child])));
  return (
    <View style={{ gap: space[4] }}>
      {rows.map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: space[3] }}>
          {row.map((card, j) => <View key={j} style={{ flex: 1 }}>{card}</View>)}
          {row.length === 1 && <View style={{ flex: 1 }} />}
        </View>
      ))}
    </View>
  );
}

function statusText(status: Availability): string | undefined {
  switch (status.kind) {
    case 'owned': return 'In your home';
    case 'short': return `${coinsLabel(status.missing)} to go`;
    case 'locked': return `Needs ${the(catalogEntry(status.needs))}`;
    case 'available': return undefined;
  }
}

function ShopCard({ entry, status, timeOfDay, onBuy }: { entry: CatalogEntry; status: Availability; timeOfDay: ReturnType<typeof greetingFor>; onBuy: () => void }) {
  const note = statusText(status);
  return (
    <StackedCard tone="periwinkle" dimmed={status.kind === 'owned'} style={{ flex: 1 }} contentStyle={{ flex: 1, alignItems: 'center', gap: space[2], padding: space[3] }}>
      {/* A cream backing, so periwinkle furniture does not vanish into the periwinkle card (as in the cabinet). */}
      <View style={{ height: 76, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', backgroundColor: color.surface.page, borderRadius: radius.card }}>
        <Thumbnail id={entry.id} timeOfDay={timeOfDay} height={64} />
      </View>
      <Text variant="subheading" style={{ textAlign: 'center' }}>{entry.name}</Text>
      <Text variant="subheading" accent>{coinsLabel(entry.price)}</Text>
      <View style={{ flex: 1 }} />
      {status.kind === 'available' ? (
        <Pressable
          onPress={onBuy}
          accessibilityRole="button"
          accessibilityLabel={`Buy ${entry.name} for ${coinsLabel(entry.price)}`}
          style={{
            minHeight: 44, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', borderRadius: radius.card,
            backgroundColor: color.surface.action, borderWidth: borderWidth.default, borderColor: color.border.strong,
          }}
        >
          <Text variant="subheading">Buy</Text>
        </Pressable>
      ) : (
        <View style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text variant="subheading" accent style={{ textAlign: 'center' }}>{note}</Text>
        </View>
      )}
    </StackedCard>
  );
}
