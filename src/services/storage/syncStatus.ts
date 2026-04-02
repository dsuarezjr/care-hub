import { useSyncExternalStore } from 'react';

export type SyncStatus = {
  isSyncing: boolean;
  isDirty: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
};

const listeners = new Set<() => void>();

let status: SyncStatus = {
  isSyncing: false,
  isDirty: false,
  lastSyncedAt: null,
  lastError: null
};

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeSyncStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSyncStatus(): SyncStatus {
  return status;
}

export function markDirty() {
  status = { ...status, isDirty: true };
  emit();
}

export function markSyncStart() {
  status = { ...status, isSyncing: true, lastError: null };
  emit();
}

export function markSyncSuccess(message?: string) {
  status = {
    ...status,
    isSyncing: false,
    isDirty: false,
    lastSyncedAt: new Date().toISOString(),
    lastError: message && message.toLowerCase().includes('error') ? message : null
  };
  emit();
}

export function markSyncError(message: string) {
  status = { ...status, isSyncing: false, lastError: message };
  emit();
}

export function useSyncStatus() {
  return useSyncExternalStore(subscribeSyncStatus, getSyncStatus, getSyncStatus);
}
