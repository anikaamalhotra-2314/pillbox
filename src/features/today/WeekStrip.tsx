import { useMemo, useState } from 'react';
import { FlatList, Pressable, View, type LayoutChangeEvent } from 'react-native';

import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, space } from '@/design-system/tokens';
import { addDays, dayOfMonth, type LocalDate } from '@/domain/dates';
import { spokenDate, weekdayShort } from '@/domain/format';

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

  return (
    <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <FlatList
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
            <DayCell date={item} width={itemWidth} isToday={item === today} isSelected={item === selected} onPress={() => onSelect(item)} />
          )}
        />
      )}
    </View>
  );
}

const MARKER = 32;
const MARKER_OFFSET = 3;

function DayCell({ date, width, isToday, isSelected, onPress }: {
  date: LocalDate; width: number; isToday: boolean; isSelected: boolean; onPress: () => void;
}) {
  return (
    <Pressable
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
