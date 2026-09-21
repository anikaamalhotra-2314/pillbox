import AsyncStorage from '@react-native-async-storage/async-storage';

import { createPillboxStore } from './create-store';

export { STORAGE_KEY } from './create-store';
export type { PillboxState } from './create-store';

// AsyncStorage is localStorage on web and native storage on iOS.
export const usePillbox = createPillboxStore(AsyncStorage);
