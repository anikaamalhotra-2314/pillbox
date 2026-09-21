import { WEEKDAYS } from '@/domain/dates';
import { DEFAULT_GRACE_MINUTES, type Medication } from '@/domain/types';

// Sample data from the Figma home screen, until add/edit medication exists.
export const seedMedications: Medication[] = [
  { id: 'synthroid', name: 'Synthroid', dosage: '125mg', notes: '1 pill', days: [...WEEKDAYS], times: ['06:30', '19:00'], graceMinutes: DEFAULT_GRACE_MINUTES, alertsEnabled: true },
  { id: 'microgestin', name: 'Microgestin', dosage: '125mg', notes: '1 pill', days: [...WEEKDAYS], times: ['10:30'], graceMinutes: DEFAULT_GRACE_MINUTES, alertsEnabled: true },
  { id: 'calcium', name: 'Calcium', dosage: '125mg', notes: '1 pill', days: [...WEEKDAYS], times: ['13:00'], graceMinutes: DEFAULT_GRACE_MINUTES, alertsEnabled: false },
];
