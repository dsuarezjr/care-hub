import type {
  ActivityEntry,
  CareDataBundle,
  ClinicalLogEntry,
  HealthIssue,
  Medication,
  PulseDashboard,
  SideEffectReport,
  TherapyEntry,
  VisitLogEntry
} from '../../domain/models/care';
import { markDirty } from './syncStatus';

const STORAGE_KEY = 'ramon-care-hub-data-v1';
const listeners = new Set<() => void>();
let cachedSnapshot: CareDataBundle | null = null;
let cachedRawValue: string | null = null;

const defaultPulse: PulseDashboard = {
  careStatus: 'Stable',
  oneBigThing: 'Keep hydration and speech exercises consistent this week.',
  updatedAt: new Date().toISOString(),
  updatedBy: 'System'
};

const defaultMeds: Medication[] = [
  { id: 'med-1', name: 'Aspirin', dose: '81 mg', frequency: 'Daily' },
  { id: 'med-2', name: 'Atorvastatin', dose: '40 mg', frequency: 'Nightly' }
];

export function createDefaultCareData(): CareDataBundle {
  return {
    pulse: { ...defaultPulse },
    clinicalLog: [],
    medications: [...defaultMeds],
    sideEffects: [],
    visitLog: [],
    therapy: [],
    activities: [],
    healthIssues: []
  };
}

function normalizeCareData(data: Partial<CareDataBundle>): CareDataBundle {
  const defaults = createDefaultCareData();

  return {
    ...defaults,
    ...data,
    medications: data.medications?.length ? data.medications : defaults.medications,
    clinicalLog: data.clinicalLog || defaults.clinicalLog,
    sideEffects: data.sideEffects || defaults.sideEffects,
    visitLog: data.visitLog || defaults.visitLog,
    therapy: data.therapy || defaults.therapy,
    activities: data.activities || defaults.activities,
    healthIssues: data.healthIssues || defaults.healthIssues,
    pulse: {
      ...defaults.pulse,
      ...data.pulse
    }
  };
}

function readSnapshotFromStorage(raw: string | null): CareDataBundle {
  if (!raw) {
    return createDefaultCareData();
  }

  try {
    return normalizeCareData(JSON.parse(raw) as CareDataBundle);
  } catch {
    return createDefaultCareData();
  }
}

function notifyListeners(): void {
  listeners.forEach((listener) => {
    listener();
  });
}

export function subscribeCareData(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function loadCareData(): CareDataBundle {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (cachedSnapshot && raw === cachedRawValue) {
    return cachedSnapshot;
  }

  cachedRawValue = raw;
  cachedSnapshot = readSnapshotFromStorage(raw);
  return cachedSnapshot;
}

export function saveCareData(data: CareDataBundle): void {
  const serialized = JSON.stringify(data);
  cachedRawValue = serialized;
  cachedSnapshot = data;
  localStorage.setItem(STORAGE_KEY, serialized);
  markDirty();
  notifyListeners();
}

export function appendClinicalEntry(entry: ClinicalLogEntry): CareDataBundle {
  const current = loadCareData();
  const next = { ...current, clinicalLog: [entry, ...current.clinicalLog] };
  saveCareData(next);
  return next;
}

export function appendVisitEntry(entry: VisitLogEntry): CareDataBundle {
  const current = loadCareData();
  const next = { ...current, visitLog: [entry, ...current.visitLog] };
  saveCareData(next);
  return next;
}

export function appendTherapyEntry(entry: TherapyEntry): CareDataBundle {
  const current = loadCareData();
  const next = { ...current, therapy: [entry, ...current.therapy] };
  saveCareData(next);
  return next;
}

export function appendActivityEntry(entry: ActivityEntry): CareDataBundle {
  const current = loadCareData();
  const next = { ...current, activities: [entry, ...current.activities] };
  saveCareData(next);
  return next;
}

export function addSideEffectReport(entry: SideEffectReport): CareDataBundle {
  const current = loadCareData();
  const next = { ...current, sideEffects: [entry, ...current.sideEffects] };
  saveCareData(next);
  return next;
}

export function updatePulse(pulse: PulseDashboard): CareDataBundle {
  const current = loadCareData();
  const next = { ...current, pulse };
  saveCareData(next);
  return next;
}

export function upsertMedication(medication: Medication): CareDataBundle {
  const current = loadCareData();
  const existingIndex = current.medications.findIndex((item) => item.id === medication.id);

  const nextMeds = [...current.medications];
  if (existingIndex === -1) {
    nextMeds.unshift(medication);
  } else {
    nextMeds[existingIndex] = medication;
  }

  const next = { ...current, medications: nextMeds };
  saveCareData(next);
  return next;
}

export function removeMedication(medicationId: string): CareDataBundle {
  const current = loadCareData();
  const next = {
    ...current,
    medications: current.medications.filter((item) => item.id !== medicationId)
  };
  saveCareData(next);
  return next;
}

export function addHealthIssue(issue: HealthIssue): CareDataBundle {
  const current = loadCareData();
  const next = { ...current, healthIssues: [issue, ...current.healthIssues] };
  saveCareData(next);
  return next;
}

export function removeHealthIssue(issueId: string): CareDataBundle {
  const current = loadCareData();
  const next = {
    ...current,
    healthIssues: current.healthIssues.filter((item) => item.id !== issueId)
  };
  saveCareData(next);
  return next;
}
