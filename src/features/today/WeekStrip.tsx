import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Platform, View, type LayoutChangeEvent } from 'react-native';

import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, space } from '@/design-system/tokens';
import { addDays, dayOfMonth, type LocalDate } from '@/domain/dates';
import { spokenDate, weekdayShort } from '@/domain/format';
import { Pressable } from '@/design-system/primitives/Pressable';

const DAYS_EACH_SIDE = 60;
const VISIBLE = 7;
const CENTER = 3; // index of today within the 7 visible days when the strip first appears

type Props = { today: LocalDate; selected: LocalDate; onSelect: (date: LocalDate) => void };

/** Seven days visible, scrollable in both directions, centered on today, including after midnight (decision 0006). */
export function WeekStrip({ today, selected, onSelect }: Props) {
  const [width, setWidth] = useState(0);
  // Re-anchored when the date rolls over, so today is always the centre (decision 0006).
  const [anchor, setAnchor] = useState(today);
  if (anchor !== today) setAnchor(today);
  const days = useMemo(
    () => Array.from({ length: DAYS_EACH_SIDE * 2 + 1 }, (_, i) => addDays(anchor, i - DAYS_EACH_SIDE)),
    [anchor],
  );
  const itemWidth = width / VISIBLE;

  // Roving tabindex: only the selected day is a Tab stop, and the arrow keys move between days, so a
  // keyboard user is not made to Tab through every date to reach the doses.
  const listRef = useRef<FlatList<LocalDate>>(null);
  const cells = useRef(new Map<LocalDate, View | null>());
  const [focusTarget, setFocusTarget] = useState<LocalDate | null>(null);

  const move = (delta: number) => {
    const next = addDays(selected, delta);
    const index = days.indexOf(next);
    if (index < 0) return;
    onSelect(next);
    listRef.current?.scrollToIndex({ index, viewPosition: 0.5, animated: false });
    setFocusTarget(next);
  };

  // `onKeyDown` is supported by React Native Web but is not in React Native's View typings.
  const webKeyProps = Platform.OS === 'web'
    ? {
        onKeyDown: (e: { nativeEvent: { key: string }; preventDefault: () => void }) => {
          const key = e.nativeEvent.key;
          if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;
          e.preventDefault();
          move(key === 'ArrowRight' ? 1 : -1);
        },
      }
    : {};

  useEffect(() => {
    if (!focusTarget) return;
    const id = requestAnimationFrame(() => {
      cells.current.get(focusTarget)?.focus();
      setFocusTarget(null);
    });
    return () => cancelAnimationFrame(id);
  }, [focusTarget, selected]);

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => {
        // A hidden tab measures 0 wide; keep the last width so the strip is not rebuilt (and re-scrolled) on return.
        const w = e.nativeEvent.layout.width;
        if (w > 0) setWidth(w);
      }}
      {...webKeyProps}
    >
      {width > 0 && (
        <FlatList
          // A new anchor remounts the list, since `initialScrollIndex` only applies on mount.
          key={anchor}
          ref={listRef}
          horizontal
          data={days}
          extraData={`${selected}|${today}`}
          keyExtractor={(d) => d}
          getItemLayout={(_, index) => ({ length: itemWidth, offset: itemWidth * index, index })}
          initialScrollIndex={DAYS_EACH_SIDE - CENTER}
          snapToInterval={itemWidth}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <DayCell
              date={item} width={itemWidth} isToday={item === today} isSelected={item === selected}
              onPress={() => onSelect(item)}
              cellRef={(el) => { cells.current.set(item, el); }}
            />
          )}
        />
      )}
    </View>
  );
}

const MARKER = 32;
const TODAY_DOT = 4;

function DayCell({ date, width, isToday, isSelected, onPress, cellRef }: {
  date: LocalDate; width: number; isToday: boolean; isSelected: boolean; onPress: () => void; cellRef: (el: View | null) => void;
}) {
  return (
    <Pressable
      ref={cellRef}
      tabIndex={isSelected ? 0 : -1}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={spokenDate(date, isToday)}
      aria-selected={isSelected}
      style={{ width, alignItems: 'center', paddingTop: space[3], paddingBottom: space[2], gap: space[1] }}
    >
      <Text variant="title">{weekdayShort(date)}</Text>
      <View
        style={{
          width: MARKER, height: MARKER, borderRadius: MARKER / 2, alignItems: 'center', justifyContent: 'center', marginTop: space[1],
          backgroundColor: isSelected ? color.surface.selected : 'transparent',
          // Selection is a ring plus fill, so it never depends on the faint fill alone (decision 0009). The ring
          // is the app's standard 1pt border; today is marked by a dot instead, so the two never look alike.
          borderWidth: isSelected ? borderWidth.default : 0,
          borderColor: color.border.strong,
        }}
      >
        <Text variant="numeral">{dayOfMonth(date)}</Text>
      </View>
      {/* Every cell reserves the dot's space, so the strip does not shift as the selection moves. */}
      <View style={{ width: TODAY_DOT, height: TODAY_DOT, borderRadius: TODAY_DOT / 2, backgroundColor: isToday ? color.border.strong : 'transparent' }} />
    </Pressable>
  );
}
