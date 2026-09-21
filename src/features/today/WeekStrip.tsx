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

/** Seven days visible, scrollable in both directions, centered on today at first (decision 0006). */
export function WeekStrip({ today, selected, onSelect }: Props) {
  const [width, setWidth] = useState(0);
  // Anchored at mount so the list doesn't shift under the user when the date rolls over.
  const [anchor] = useState(today);
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
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      {...webKeyProps}
    >
      {width > 0 && (
        <FlatList
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
const MARKER_OFFSET = 3;

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
      style={{ width, alignItems: 'center', paddingVertical: space[3], gap: space[2] }}
    >
      <Text variant="title" bold={isSelected}>{weekdayShort(date)}</Text>
      <View style={{ width: MARKER + MARKER_OFFSET, height: MARKER + MARKER_OFFSET }}>
        {isSelected && (
          <View
            style={{
              position: 'absolute', left: MARKER_OFFSET, top: MARKER_OFFSET, width: MARKER, height: MARKER,
              borderRadius: MARKER / 2, backgroundColor: color.surface.cabinetCardShadow,
              borderWidth: borderWidth.default, borderColor: color.border.strong,
            }}
          />
        )}
        <View
          style={{
            width: MARKER, height: MARKER, borderRadius: MARKER / 2, alignItems: 'center', justifyContent: 'center',
            backgroundColor: isSelected ? color.surface.selected : 'transparent',
            // Selection is a heavier ring plus a bold label, not fill alone (decision 0009). Today is a thin ring.
            borderWidth: isSelected ? 2 : isToday ? borderWidth.default : 0,
            borderColor: color.border.strong,
          }}
        >
          <Text variant="numeral" bold={isSelected}>{dayOfMonth(date)}</Text>
        </View>
      </View>
    </Pressable>
  );
}
