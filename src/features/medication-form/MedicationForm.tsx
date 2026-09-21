import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';

import { Checkbox } from '@/design-system/primitives/Checkbox';
import { StackedCard } from '@/design-system/primitives/StackedCard';
import { Text } from '@/design-system/primitives/Text';
import { TextField } from '@/design-system/primitives/TextField';
import { space } from '@/design-system/tokens';
import { emptyDraft, hasErrors, MAX_GRACE_MINUTES, validateDraft, type MedicationDraft } from '@/domain/medication';
import { DayPicker } from './DayPicker';
import { TimeList } from './TimeList';
import { Pressable } from '@/design-system/primitives/Pressable';

type Props = {
  initial?: MedicationDraft;
  submitLabel: string;
  onSubmit: (draft: MedicationDraft) => void;
};

/** Shared by Add and Edit. Errors appear only after the first attempt to save, then update as you fix them. */
export function MedicationForm({ initial, submitLabel, onSubmit }: Props) {
  const [draft, setDraft] = useState<MedicationDraft>(initial ?? emptyDraft());
  const [submitted, setSubmitted] = useState(false);
  const dosageRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

  const errors = submitted ? validateDraft(draft) : {};
  const patch = (p: Partial<MedicationDraft>) => setDraft((d) => ({ ...d, ...p }));

  const submit = () => {
    setSubmitted(true);
    if (!hasErrors(validateDraft(draft))) onSubmit(draft);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: space[5], gap: space[5] }}>
        <TextField
          label="Medication Title" required placeholder="e.g. Amoxicillin"
          value={draft.name} onChangeText={(name) => patch({ name })} error={errors.name}
          autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => dosageRef.current?.focus()}
        />
        <TextField
          ref={dosageRef} label="Dosage" required placeholder="e.g. 250 mg"
          value={draft.dosage} onChangeText={(dosage) => patch({ dosage })} error={errors.dosage}
          returnKeyType="next" onSubmitEditing={() => notesRef.current?.focus()}
        />
        <TextField
          ref={notesRef} label="Notes" placeholder="e.g. 1 pill, morning"
          value={draft.notes} onChangeText={(notes) => patch({ notes })} returnKeyType="done"
        />

        <DayPicker value={draft.days} onChange={(days) => patch({ days })} error={errors.days} />

        <Pressable
          onPress={() => patch({ alertsEnabled: !draft.alertsEnabled })}
          accessibilityRole="checkbox"
          accessibilityLabel="Send alerts"
          aria-checked={draft.alertsEnabled}
          style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], minHeight: 44 }}
        >
          <Text variant="label" accent>Send alerts?</Text>
          <Checkbox decorative checked={draft.alertsEnabled} accessibilityLabel="Send alerts" />
        </Pressable>

        <TextField
          label="Grace window (minutes)" keyboardType="number-pad" maxLength={3}
          hint={`How long after the scheduled time a dose still counts as due. Up to ${MAX_GRACE_MINUTES}.`}
          value={draft.graceMinutes} onChangeText={(graceMinutes) => patch({ graceMinutes })} error={errors.graceMinutes}
        />

        <TimeList times={draft.times} onChange={(times) => patch({ times })} error={errors.times} />

        <View style={{ gap: space[3], alignItems: 'flex-start' }}>
          {submitted && hasErrors(errors) && <Text variant="subheading" role="alert">Please fix the highlighted fields.</Text>}
          <StackedCard
            tone="yellow" onPress={submit} accessibilityLabel={submitLabel}
            contentStyle={{ paddingVertical: space[3], paddingHorizontal: space[6], alignItems: 'center', minHeight: 44, justifyContent: 'center' }}
          >
            <Text variant="title">{submitLabel}</Text>
          </StackedCard>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
