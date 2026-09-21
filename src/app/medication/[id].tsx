import { useLocalSearchParams } from 'expo-router';

import { PlaceholderScreen } from '@/design-system/primitives/PlaceholderScreen';
import { usePillbox } from '@/store/pillbox';

export default function MedicationDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const name = usePillbox((s) => s.medications.find((m) => m.id === id)?.name);
  return <PlaceholderScreen back title={name ?? 'Medication'} note="Details and edit mode: designed, not built yet." />;
}
