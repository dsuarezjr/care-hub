export type CareStatus = 'Stable' | 'Alert';

export interface PulseDashboard {
  careStatus: CareStatus;
  oneBigThing: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ClinicalLogEntry {
  id: string;
  bloodPressure: string;
  pulse: number;
  speechClarity: 1 | 2 | 3 | 4 | 5;
  mobilityLevel: 'Bed' | 'Assisted Walk' | 'Walker' | 'Independent';
  mood: 'Low' | 'Steady' | 'Positive';
  createdAt: string;
  createdBy: string;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
}

export interface SideEffectReport {
  id: string;
  medicationId: string;
  note: string;
  createdAt: string;
  createdBy: string;
}

export interface VisitLogEntry {
  id: string;
  visitor: string;
  updateSentence: string;
  nextStep: string;
  createdAt: string;
}

export interface TherapyEntry {
  id: string;
  discipline: 'PT' | 'OT' | 'ST';
  minutes: number;
  win: string;
  createdAt: string;
  createdBy: string;
}

export interface ActivityEntry {
  id: string;
  category: 'Fun' | 'Entertainment' | 'Activity' | 'Hygiene';
  note: string;
  createdAt: string;
  createdBy: string;
}

export interface CareDataBundle {
  pulse: PulseDashboard;
  clinicalLog: ClinicalLogEntry[];
  medications: Medication[];
  sideEffects: SideEffectReport[];
  visitLog: VisitLogEntry[];
  therapy: TherapyEntry[];
  activities: ActivityEntry[];
}

export interface FamilyProfile {
  userId: string;
  familyId: string;
  email: string;
  displayName: string;
  roleLabel: string;
  updatedAt: string;
}
