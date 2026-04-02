import type { User } from '@supabase/supabase-js';
import type {
  ActivityEntry,
  CareDataBundle,
  ClinicalLogEntry,
  Medication,
  PulseDashboard,
  SideEffectReport,
  TherapyEntry,
  VisitLogEntry
} from '../../domain/models/care';
import { hasSupabaseConfig, supabase } from '../auth/supabaseClient';
import { createDefaultCareData, loadCareData, saveCareData } from './localStore';
import { markSyncError, markSyncStart, markSyncSuccess } from './syncStatus';

const SNAPSHOT_TABLE = 'care_hub_snapshots';
const ENTRY_TABLE = 'care_entries';
const PULSE_TABLE = 'care_pulse';
const retryAttempts = new Map<string, number>();
const retryTimers = new Map<string, number>();

type SyncResult = {
  ok: boolean;
  message: string;
};

type EntryType = 'clinicalLog' | 'sideEffects' | 'visitLog' | 'therapy' | 'activities' | 'medications';

type EntryRow = {
  id: string;
  family_id: string;
  entry_type: EntryType;
  payload: Record<string, unknown>;
  created_at: string;
  created_by: string;
  updated_at: string;
};

type PulseRow = {
  family_id: string;
  care_status: PulseDashboard['careStatus'];
  one_big_thing: string;
  updated_at: string;
  updated_by: string;
};

function familyId(): string {
  return import.meta.env.VITE_FAMILY_ID || 'ramon-family';
}

function isMissingRelationError(message: string): boolean {
  return /relation .* does not exist/i.test(message);
}

function nowIso(): string {
  return new Date().toISOString();
}

function isTransientError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('network') || lower.includes('fetch') || lower.includes('timeout');
}

function resetRetryState() {
  const key = familyId();
  const timer = retryTimers.get(key);
  if (timer) {
    window.clearTimeout(timer);
  }

  retryTimers.delete(key);
  retryAttempts.delete(key);
}

function scheduleRetry(user: User | null, reason: string) {
  if (!user || !isTransientError(reason)) {
    return;
  }

  const key = familyId();
  const attempt = (retryAttempts.get(key) || 0) + 1;
  if (attempt > 3) {
    return;
  }

  if (retryTimers.has(key)) {
    return;
  }

  retryAttempts.set(key, attempt);
  const delayMs = attempt * 5000;
  const timer = window.setTimeout(() => {
    retryTimers.delete(key);
    void syncFamilyData(user);
  }, delayMs);

  retryTimers.set(key, timer);
}

function toEntryRows(bundle: CareDataBundle): EntryRow[] {
  const mapEntries = <T extends { id: string; createdAt: string; createdBy?: string }>(
    entryType: EntryType,
    entries: T[]
  ) => entries.map((entry) => ({
    id: entry.id,
    family_id: familyId(),
    entry_type: entryType,
    payload: entry as unknown as Record<string, unknown>,
    created_at: entry.createdAt,
    created_by: entry.createdBy || ('visitor' in entry ? String(entry.visitor) : 'unknown'),
    updated_at: entry.createdAt
  }));

  return [
    ...bundle.medications.map((entry) => ({
      id: entry.id,
      family_id: familyId(),
      entry_type: 'medications' as const,
      payload: entry as unknown as Record<string, unknown>,
      created_at: nowIso(),
      created_by: 'system',
      updated_at: nowIso()
    })),
    ...mapEntries('clinicalLog', bundle.clinicalLog),
    ...mapEntries('sideEffects', bundle.sideEffects),
    ...mapEntries('visitLog', bundle.visitLog),
    ...mapEntries('therapy', bundle.therapy),
    ...mapEntries('activities', bundle.activities)
  ];
}

function toPulseRow(pulse: PulseDashboard): PulseRow {
  return {
    family_id: familyId(),
    care_status: pulse.careStatus,
    one_big_thing: pulse.oneBigThing,
    updated_at: pulse.updatedAt,
    updated_by: pulse.updatedBy
  };
}

function sortByCreatedAtDesc<T extends { createdAt: string }>(entries: T[]): T[] {
  return [...entries].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function mergeById<T extends { id: string; createdAt: string }>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>();

  [...remote, ...local].forEach((entry) => {
    const existing = map.get(entry.id);
    if (!existing || entry.createdAt > existing.createdAt) {
      map.set(entry.id, entry);
    }
  });

  return sortByCreatedAtDesc(Array.from(map.values()));
}

function mergePulse(local: PulseDashboard, remote: PulseDashboard): PulseDashboard {
  return remote.updatedAt > local.updatedAt ? remote : local;
}

function mergeBundles(local: CareDataBundle, remote: CareDataBundle): CareDataBundle {
  const medicationMap = new Map<string, Medication>();
  remote.medications.forEach((item) => medicationMap.set(item.id, item));
  local.medications.forEach((item) => medicationMap.set(item.id, item));

  return {
    ...createDefaultCareData(),
    medications: Array.from(medicationMap.values()),
    pulse: mergePulse(local.pulse, remote.pulse),
    clinicalLog: mergeById(local.clinicalLog, remote.clinicalLog),
    sideEffects: mergeById(local.sideEffects, remote.sideEffects),
    visitLog: mergeById(local.visitLog, remote.visitLog),
    therapy: mergeById(local.therapy, remote.therapy),
    activities: mergeById(local.activities, remote.activities)
  };
}

function bundleFromRows(rows: EntryRow[], pulseRow?: PulseRow | null): CareDataBundle {
  const bundle = createDefaultCareData();

  rows.forEach((row) => {
    if (row.entry_type === 'clinicalLog') {
      bundle.clinicalLog.push(row.payload as unknown as ClinicalLogEntry);
    }
    if (row.entry_type === 'medications') {
      bundle.medications.push(row.payload as unknown as Medication);
    }
    if (row.entry_type === 'sideEffects') {
      bundle.sideEffects.push(row.payload as unknown as SideEffectReport);
    }
    if (row.entry_type === 'visitLog') {
      bundle.visitLog.push(row.payload as unknown as VisitLogEntry);
    }
    if (row.entry_type === 'therapy') {
      bundle.therapy.push(row.payload as unknown as TherapyEntry);
    }
    if (row.entry_type === 'activities') {
      bundle.activities.push(row.payload as unknown as ActivityEntry);
    }
  });

  bundle.clinicalLog = sortByCreatedAtDesc(bundle.clinicalLog);
  bundle.sideEffects = sortByCreatedAtDesc(bundle.sideEffects);
  bundle.visitLog = sortByCreatedAtDesc(bundle.visitLog);
  bundle.therapy = sortByCreatedAtDesc(bundle.therapy);
  bundle.activities = sortByCreatedAtDesc(bundle.activities);

  if (pulseRow) {
    bundle.pulse = {
      careStatus: pulseRow.care_status,
      oneBigThing: pulseRow.one_big_thing,
      updatedAt: pulseRow.updated_at,
      updatedBy: pulseRow.updated_by
    };
  }

  return bundle;
}

async function pushSnapshotFallback(user: User | null, bundle: CareDataBundle): Promise<SyncResult> {
  if (!supabase) {
    return { ok: false, message: 'Cloud sync is not configured yet.' };
  }

  const payload = {
    family_id: familyId(),
    data: bundle as unknown as Record<string, unknown>,
    updated_at: nowIso(),
    updated_by: user?.email || 'unknown'
  };

  const { error } = await supabase.from(SNAPSHOT_TABLE).upsert(payload, { onConflict: 'family_id' });

  if (error) {
    markSyncError(error.message);
    return { ok: false, message: error.message };
  }

  markSyncSuccess();
  return { ok: true, message: 'Local updates pushed to cloud.' };
}

async function pullSnapshotFallback(): Promise<{ bundle?: CareDataBundle; result: SyncResult }> {
  if (!supabase) {
    return { result: { ok: false, message: 'Cloud sync is not configured yet.' } };
  }

  const { data, error } = await supabase
    .from(SNAPSHOT_TABLE)
    .select('data')
    .eq('family_id', familyId())
    .maybeSingle();

  if (error) {
    return { result: { ok: false, message: error.message } };
  }

  if (!data?.data) {
    return { result: { ok: false, message: 'No cloud snapshot found yet.' } };
  }

  return {
    bundle: data.data as CareDataBundle,
    result: { ok: true, message: 'Cloud snapshot downloaded to this device.' }
  };
}

async function fetchRemoteBundle(): Promise<{ bundle?: CareDataBundle; error?: string; fallback?: boolean }> {
  if (!supabase) {
    return { error: 'Cloud sync is not configured yet.' };
  }

  const [{ data: pulseData, error: pulseError }, { data: entryData, error: entryError }] = await Promise.all([
    supabase.from(PULSE_TABLE).select('family_id, care_status, one_big_thing, updated_at, updated_by').eq('family_id', familyId()).maybeSingle(),
    supabase.from(ENTRY_TABLE).select('id, family_id, entry_type, payload, created_at, created_by, updated_at').eq('family_id', familyId())
  ]);

  const firstError = pulseError || entryError;
  if (firstError) {
    if (isMissingRelationError(firstError.message)) {
      const snapshot = await pullSnapshotFallback();
      return snapshot.bundle
        ? { bundle: snapshot.bundle, fallback: true }
        : { error: snapshot.result.message, fallback: true };
    }

    return { error: firstError.message };
  }

  return {
    bundle: bundleFromRows((entryData || []) as EntryRow[], (pulseData || null) as PulseRow | null)
  };
}

async function pushBundle(user: User | null, bundle: CareDataBundle): Promise<SyncResult> {
  if (!hasSupabaseConfig || !supabase) {
    return { ok: false, message: 'Cloud sync is not configured yet.' };
  }

  const pulsePayload = toPulseRow(bundle.pulse);
  const entryPayload = toEntryRows(bundle);

  const { error: pulseError } = await supabase.from(PULSE_TABLE).upsert(pulsePayload, { onConflict: 'family_id' });
  if (pulseError) {
    if (isMissingRelationError(pulseError.message)) {
      return pushSnapshotFallback(user, bundle);
    }

    return { ok: false, message: pulseError.message };
  }

  if (entryPayload.length) {
    const { error: entryError } = await supabase.from(ENTRY_TABLE).upsert(entryPayload, { onConflict: 'id' });
    if (entryError) {
      if (isMissingRelationError(entryError.message)) {
        return pushSnapshotFallback(user, bundle);
      }

      return { ok: false, message: entryError.message };
    }
  }

  return { ok: true, message: 'Per-entry cloud sync completed.' };
}

export async function pushLocalSnapshot(user: User | null): Promise<SyncResult> {
  markSyncStart();
  const bundle = loadCareData();
  const result = await pushBundle(user, bundle);
  if (result.ok) {
    resetRetryState();
    markSyncSuccess();
  } else {
    scheduleRetry(user, result.message);
    markSyncError(result.message);
  }

  return result;
}

export async function pullCloudSnapshot(): Promise<SyncResult> {
  markSyncStart();
  const remote = await fetchRemoteBundle();
  if (!remote.bundle) {
    markSyncError(remote.error || 'No cloud data found.');
    return { ok: false, message: remote.error || 'No cloud data found.' };
  }

  saveCareData(remote.bundle);
  markSyncSuccess();
  return {
    ok: true,
    message: remote.fallback ? 'Cloud snapshot downloaded to this device.' : 'Cloud entries downloaded to this device.'
  };
}

export async function syncFamilyData(user: User | null): Promise<SyncResult> {
  markSyncStart();
  if (!hasSupabaseConfig || !supabase || !user) {
    markSyncError('Sync requires a signed-in user and Supabase configuration.');
    return { ok: false, message: 'Sync requires a signed-in user and Supabase configuration.' };
  }

  const local = loadCareData();
  const remote = await fetchRemoteBundle();

  if (remote.error && !remote.bundle) {
    const pushed = await pushBundle(user, local);
    if (pushed.ok) {
      resetRetryState();
      markSyncSuccess();
      return { ok: true, message: 'Cloud sync initialized from this device.' };
    }

    scheduleRetry(user, pushed.message);
    markSyncError(pushed.message);
    return pushed;
  }

  const merged = remote.bundle ? mergeBundles(local, remote.bundle) : local;
  saveCareData(merged);

  const pushed = await pushBundle(user, merged);
  if (!pushed.ok) {
    scheduleRetry(user, pushed.message);
    markSyncError(pushed.message);
    return pushed;
  }

  resetRetryState();
  markSyncSuccess();
  return {
    ok: true,
    message: remote.fallback
      ? 'Snapshot sync completed. Apply the new Supabase schema to unlock per-entry collaboration.'
      : 'Per-entry cloud sync completed.'
  };
}

export const __testables = {
  mergeById,
  mergePulse,
  mergeBundles
};
