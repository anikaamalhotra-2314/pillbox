import { router } from 'expo-router';
import { View } from 'react-native';

import { ScreenHeader } from '@/design-system/primitives/ScreenHeader';
import { toMedication } from '@/domain/medication';
import { MedicationForm } from '@/features/medication-form/MedicationForm';
import { usePillbox } from '@/store/pillbox';

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

export default function AddMedication() {
  const addMedication = usePillbox((s) => s.addMedication);
  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="Add New Medication" onBack={leave} />
      <MedicationForm
        submitLabel="Save Medication"
        onSubmit={(draft) => {
          addMedication(toMedication(draft, newId()));
          leave();
        }}
      />
    </View>
  );
}
