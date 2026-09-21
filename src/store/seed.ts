import { WEEKDAYS, type LocalDate } from '@/domain/dates';
import { DEFAULT_GRACE_MINUTES, type Medication } from '@/domain/types';

const base = { dosage: '125mg', notes: '1 pill', days: [...WEEKDAYS], graceMinutes: DEFAULT_GRACE_MINUTES };

/** Sample data from the Figma home screen, until there is a real empty state. Counts from `startDate` onward. */
export function createSeedMedications(startDate: LocalDate): Medication[] {
  return [
    { ...base, id: 'synthroid', name: 'Synthroid', times: ['06:30', '19:00'], alertsEnabled: true, startDate, icon: { shape: 'scored', color: 'periwinkle' } },
    { ...base, id: 'microgestin', name: 'Microgestin', times: ['10:30'], alertsEnabled: true, startDate, icon: { shape: 'capsule', color: 'peach' } },
    { ...base, id: 'calcium', name: 'Calcium', times: ['13:00'], alertsEnabled: false, startDate, icon: { shape: 'oval', color: 'yellow' } },
  ];
}
