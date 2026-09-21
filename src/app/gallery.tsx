import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { StackedCard } from '@/design-system/primitives/StackedCard';
import { Text } from '@/design-system/primitives/Text';
import { fontSize, space } from '@/design-system/tokens';

// Development gallery for design-system pieces. Will be replaced by Storybook.
export default function Gallery() {
  const [taps, setTaps] = useState(0);
  return (
    <ScrollView contentContainerStyle={{ padding: space.gutter, paddingTop: 64, gap: space[6] }}>
      <Text variant="heading">Gallery</Text>

      <Section title="Type">
        {(Object.keys(fontSize) as (keyof typeof fontSize)[]).map((v) => (
          <Text key={v} variant={v}>{`${v} ${fontSize[v]}: Good Morning, Anika.`}</Text>
        ))}
        <Text variant="title" accent>accent: 10:30am</Text>
        <Text variant="title" bold>bold: Save Changes!</Text>
        <Text variant="subheading" tone="taken">taken: 1 pill | 125mg</Text>
        <Text variant="subheading" tone="placeholder">placeholder: e.g. Amoxicillin</Text>
      </Section>

      <Section title="StackedCard: peach, static">
        <Card name="Synthroid" />
      </Section>
      <Section title={`StackedCard: peach, pressable (taps: ${taps})`}>
        <Card name="Calcium" onPress={() => setTaps((n) => n + 1)} />
      </Section>
      <Section title="StackedCard: peach, forced pressed">
        <Card name="Microgestin" pressed />
      </Section>
      <Section title="StackedCard: periwinkle">
        <Card name="Synthroid" tone="periwinkle" />
      </Section>
      <Section title="StackedCard: yellow (button)">
        <StackedCard tone="yellow" onPress={() => setTaps((n) => n + 1)} accessibilityLabel="Save changes" contentStyle={{ paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center' }} style={{ alignSelf: 'flex-start' }}>
          <Text variant="title">Save Changes!</Text>
        </StackedCard>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space[2] }}>
      <Text variant="subheading" accent tone="placeholder">{title}</Text>
      {children}
    </View>
  );
}

function Card({ name, tone, onPress, pressed }: { name: string; tone?: 'peach' | 'periwinkle'; onPress?: () => void; pressed?: boolean }) {
  return (
    <StackedCard
      tone={tone}
      onPress={onPress}
      pressed={pressed}
      accessibilityLabel={`${name}, 1 pill, 125 milligrams`}
      contentStyle={{ minHeight: 66, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text variant="title">{name}</Text>
      <Text variant="subheading">1 pill | 125mg</Text>
    </StackedCard>
  );
}
