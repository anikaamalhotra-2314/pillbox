import { create } from 'zustand';

import { toLocalDate } from '@/domain/dates';
import { toggleTaken } from '@/domain/logs';
import type { Dose, DoseLog, Medication } from '@/domain/types';
import { seedMedications } from './seed';

interface PillboxState {
  userName: string;
  medications: Medication[];
  logs: DoseLog[];
  toggleTaken: (dose: Dose, now: Date) => void;
}

// In memory only for now. Persistence comes next; the shape is what will be persisted.
export const usePillbox = create<PillboxState>()((set) => ({
  userName: 'Anika',
  medications: seedMedications,
  logs: [],
  toggleTaken: (dose, now) =>
    set((state) => (dose.date > toLocalDate(now) ? state : { logs: toggleTaken(state.logs, dose, now) })),
}));
