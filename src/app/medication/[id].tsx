import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { MedicationIcon } from '@/design-system/icons/MedicationIcon';
import { ActionMenu } from '@/design-system/primitives/ActionMenu';
import { ConfirmModal } from '@/design-system/primitives/ConfirmModal';
import { PlaceholderScreen } from '@/design-system/primitives/PlaceholderScreen';
import { Pressable } from '@/design-system/primitives/Pressable';
import { ScreenHeader } from '@/design-system/primitives/ScreenHeader';
import { Text } from '@/design-system/primitives/Text';
import { borderWidth, color, space } from '@/design-system/tokens';
import { toLocalDate } from '@/domain/dates';
import { buildDay, doseKey } from '@/domain/day';
import { toDraft, updatedMedication } from '@/domain/medication';
import { MedicationInfo } from '@/features/medication-details/MedicationInfo';
import { MedicationForm } from '@/features/medication-form/MedicationForm';
import { DoseCard } from '@/features/today/DoseCard';
import { useNow } from '@/hooks/use-now';
import { usePillbox } from '@/store/pillbox';

const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

export default function MedicationDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const medication = usePillbox((s) => s.medications.find((m) => m.id === id));
  const logs = usePillbox((s) => s.logs);
  const { toggleTaken, updateMedication, deleteMedication } = usePillbox.getState();
  const now = useNow();

  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const todaysDoses = useMemo(
    () => (medication ? buildDay([medication], logs, toLocalDate(now), now) : []),
    [medication, logs, now],
  );

  if (!medication) {
    return <PlaceholderScreen back title="Medication not found" note="It may have been deleted." />;
  }

  const hero = (
    <View style={{ alignItems: 'center', paddingVertical: space[5], borderBottomWidth: borderWidth.default, borderBottomColor: color.border.strong }}>
      <MedicationIcon />
    </View>
  );

  if (editing) {
    return (
      <View style={{ flex: 1 }}>
        <ScreenHeader title="Edit Medication" onBack={() => setEditing(false)} />
        <MedicationForm
          initial={toDraft(medication)}
          submitLabel="Save Changes!"
          footnote="Changes to days and times also apply to past days."
          header={hero}
          onSubmit={(draft) => {
            updateMedication(updatedMedication(medication, draft));
            setEditing(false);
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader
        title={medication.name}
        onBack={leave}
        right={
          <Pressable
            onPress={() => setEditing(true)}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${medication.name}`}
            style={{ width: 72, alignItems: 'center', justifyContent: 'center', borderLeftWidth: borderWidth.default, borderLeftColor: color.border.strong }}
          >
            <Text variant="label" accent>Edit</Text>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: space[6] }}>
        <View>
          {hero}
          <Pressable
            onPress={() => setMenuOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`More actions for ${medication.name}`}
            style={{ position: 'absolute', top: 0, left: 0, width: 44, height: 44, paddingTop: space[1], paddingLeft: space[2] }}
          >
            <Text variant="subheading">···</Text>
          </Pressable>
        </View>

        <View style={{ padding: space[5], gap: space[5] }}>
          <MedicationInfo medication={medication} />

          <View style={{ gap: space[3] }}>
            <Text variant="label" accent>Today</Text>
            {todaysDoses.length === 0 ? (
              <Text variant="subheading" tone="placeholder">Not scheduled today.</Text>
            ) : (
              todaysDoses.map((e) => (
                <DoseCard
                  key={doseKey(e.dose)}
                  name={e.medication.name}
                  subtitle={e.medication.notes ? `${e.medication.notes} | ${e.medication.dosage}` : e.medication.dosage}
                  time={e.dose.time}
                  status={e.status}
                  alertsEnabled={e.medication.alertsEnabled}
                  loggedAt={e.log?.loggedAt}
                  onToggleTaken={() => toggleTaken(e.dose, now)}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <ActionMenu
        visible={menuOpen}
        title={medication.name}
        actions={[{ label: 'Delete medication', onPress: () => { setMenuOpen(false); setConfirmingDelete(true); } }]}
        onClose={() => setMenuOpen(false)}
      />
      <ConfirmModal
        visible={confirmingDelete}
        title={`Delete ${medication.name}?`}
        message="This removes its schedule and its history. This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Keep"
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          setConfirmingDelete(false);
          deleteMedication(medication.id);
          leave();
        }}
      />
    </View>
  );
}
