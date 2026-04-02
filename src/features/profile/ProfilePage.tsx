import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';

export function ProfilePage() {
  const { profile, saveProfile, canCoordinate } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [roleLabel, setRoleLabel] = useState(profile?.roleLabel || 'Family member');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setDisplayName(profile?.displayName || '');
    setRoleLabel(profile?.roleLabel || 'Family member');
  }, [profile?.displayName, profile?.roleLabel]);

  async function submit() {
    setMessage('');
    setError('');
    const result = await saveProfile({ displayName, roleLabel });
    if (result.error) {
      setError(result.error);
      return;
    }

    setMessage('Profile saved. New entries will use your updated name.');
  }

  return (
    <section className="panel">
      <h2>Family Profile</h2>
      <p className="lead">Set the name and role that will appear on updates across the shared care log.</p>

      <label htmlFor="profile-email">Email</label>
      <input id="profile-email" value={profile?.email || ''} readOnly />

      <label htmlFor="profile-name">Display Name</label>
      <input
        id="profile-name"
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
      />

      <label htmlFor="profile-role">Role</label>
      <select
        id="profile-role"
        value={roleLabel}
        disabled={!canCoordinate}
        onChange={(event) => setRoleLabel(event.target.value)}
      >
        <option value="viewer">Viewer</option>
        <option value="editor">Editor</option>
        <option value="coordinator">Coordinator</option>
      </select>
      {!canCoordinate ? <p className="lead">Only coordinators can change roles.</p> : null}

      <button type="button" onClick={submit} disabled={!displayName.trim()}>
        Save Profile
      </button>

      {error ? <p className="status-error">{error}</p> : null}
      {message ? <p className="status-ok">{message}</p> : null}
    </section>
  );
}
