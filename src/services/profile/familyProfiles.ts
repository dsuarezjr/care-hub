import type { User } from '@supabase/supabase-js';
import type { FamilyProfile } from '../../domain/models/care';
import { hasSupabaseConfig, supabase } from '../auth/supabaseClient';
import { loadLocalProfile, saveLocalProfile } from './profileStore';

const PROFILE_TABLE = 'family_profiles';
const MEMBERS_TABLE = 'family_members';

function familyId(): string {
  return import.meta.env.VITE_FAMILY_ID || 'ramon-family';
}

function isMissingRelationError(message: string): boolean {
  return /relation .* does not exist/i.test(message);
}

function fallbackDisplayName(user: User): string {
  const fromMetadata = user.user_metadata.display_name || user.user_metadata.full_name;
  if (typeof fromMetadata === 'string' && fromMetadata.trim()) {
    return fromMetadata.trim();
  }

  return (user.email || 'Family Member').split('@')[0];
}

export function buildDefaultProfile(user: User): FamilyProfile {
  return {
    userId: user.id,
    familyId: familyId(),
    email: user.email || '',
    displayName: fallbackDisplayName(user),
    roleLabel: 'Family member',
    updatedAt: new Date().toISOString()
  };
}

export async function bootstrapFamilyProfile(user: User): Promise<FamilyProfile> {
  const local = loadLocalProfile(user.id) || buildDefaultProfile(user);

  if (!hasSupabaseConfig || !supabase) {
    return local;
  }

  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select('user_id, family_id, email, display_name, role_label, updated_at')
    .eq('family_id', local.familyId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error.message)) {
      saveLocalProfile(local);
      return local;
    }

    return local;
  }

  if (!data) {
    const seeded = await saveFamilyProfile(local);
    return seeded.profile || local;
  }

  const profile: FamilyProfile = {
    userId: data.user_id,
    familyId: data.family_id,
    email: data.email,
    displayName: data.display_name,
    roleLabel: data.role_label,
    updatedAt: data.updated_at
  };

  saveLocalProfile(profile);
  return profile;
}

export async function saveFamilyProfile(profile: FamilyProfile): Promise<{ profile?: FamilyProfile; error?: string }> {
  saveLocalProfile(profile);

  if (!hasSupabaseConfig || !supabase) {
    return { profile };
  }

  const { error: memberError } = await supabase.from(MEMBERS_TABLE).upsert(
    {
      family_id: profile.familyId,
      user_id: profile.userId,
      email: profile.email,
      role_label: profile.roleLabel,
      updated_at: profile.updatedAt
    },
    { onConflict: 'family_id,user_id' }
  );

  if (memberError && !isMissingRelationError(memberError.message)) {
    return { error: memberError.message, profile };
  }

  const payload = {
    user_id: profile.userId,
    family_id: profile.familyId,
    email: profile.email,
    display_name: profile.displayName,
    role_label: profile.roleLabel,
    updated_at: profile.updatedAt
  };

  const { error } = await supabase.from(PROFILE_TABLE).upsert(payload, { onConflict: 'family_id,user_id' });

  if (error) {
    if (isMissingRelationError(error.message)) {
      return { profile };
    }

    return { error: error.message, profile };
  }

  return { profile };
}
