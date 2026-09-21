import { View } from 'react-native';

import { Text } from '@/design-system/primitives/Text';
import { space } from '@/design-system/tokens';
import { formatDays } from '@/domain/format';
import type { Medication } from '@/domain/types';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: space[3] }}>
      <Text variant="label" accent tone="placeholder" style={{ width: 96 }}>{label}</Text>
      <Text variant="numeral" style={{ flex: 1 }}>{value}</Text>
    </View>
  );
}

/** The read-only summary of a medication's settings. Not in the Figma, which shows only the doses. */
export function MedicationInfo({ medication: m }: { medication: Medication }) {
  return (
    <View style={{ gap: space[3] }}>
      <Row label="Dosage" value={m.dosage} />
      {m.notes ? <Row label="Notes" value={m.notes} /> : null}
      <Row label="Days" value={formatDays(m.days)} />
      <Row label="Grace" value={`${m.graceMinutes} minutes`} />
      <Row label="Alerts" value={m.alertsEnabled ? 'On' : 'Off'} />
    </View>
  );
}
