import type { FamilyProfile } from '../../domain/models/care';

const PROFILE_STORAGE_KEY = 'ramon-care-hub-profile-v1';

export function loadLocalProfile(userId: string): FamilyProfile | null {
  const raw = localStorage.getItem(`${PROFILE_STORAGE_KEY}:${userId}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as FamilyProfile;
  } catch {
    return null;
  }
}

export function saveLocalProfile(profile: FamilyProfile): void {
  localStorage.setItem(`${PROFILE_STORAGE_KEY}:${profile.userId}`, JSON.stringify(profile));
}
