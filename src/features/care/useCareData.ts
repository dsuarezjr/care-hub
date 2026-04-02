import { useSyncExternalStore } from 'react';
import { loadCareData, subscribeCareData } from '../../services/storage/localStore';

export function useCareDataBundle() {
  return useSyncExternalStore(subscribeCareData, loadCareData, loadCareData);
}
