import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useCareDataBundle } from '../care/useCareData';
import type { ActivityEntry } from '../../domain/models/care';
import { syncFamilyData } from '../../services/storage/cloudSync';
import { appendActivityEntry } from '../../services/storage/localStore';
import { formatTimestamp } from '../../utils/time';

export function ActivitiesPage() {
  const { user, profile, canEdit } = useAuth();
  const data = useCareDataBundle();
  const [createdBy, setCreatedBy] = useState(profile?.displayName || 'Family Member');
  const [category, setCategory] = useState<ActivityEntry['category']>('Fun');
  const [note, setNote] = useState('Watched family video and laughed twice.');

  useEffect(() => {
    setCreatedBy(profile?.displayName || 'Family Member');
  }, [profile?.displayName]);

  function submit() {
    if (!canEdit) {
      return;
    }

    if (!note.trim()) {
      return;
    }

    const entry: ActivityEntry = {
      id: crypto.randomUUID(),
      category,
      note,
      createdBy,
      createdAt: new Date().toISOString()
    };

    appendActivityEntry(entry);
    void syncFamilyData(user);
  }

  return (
    <section className="panel">
      <h2>Activities & Hygiene Tracker</h2>
      <p className="lead">Capture daily quality-of-life moments, routines, and personal hygiene updates.</p>
      {!canEdit ? <p className="status-error">Viewer access: adding updates is disabled.</p> : null}

      <div className="grid-two">
        <div>
          <label htmlFor="activity-by">Logged By</label>
          <input id="activity-by" value={createdBy} disabled={!canEdit} onChange={(event) => setCreatedBy(event.target.value)} />
        </div>
        <div>
          <label htmlFor="activity-category">Category</label>
          <select
            id="activity-category"
            value={category}
            disabled={!canEdit}
            onChange={(event) => setCategory(event.target.value as ActivityEntry['category'])}
          >
            <option value="Fun">Fun</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Activity">Activity</option>
            <option value="Hygiene">Hygiene</option>
          </select>
        </div>
      </div>

      <label htmlFor="activity-note">Update</label>
      <textarea
        id="activity-note"
        rows={3}
        value={note}
        disabled={!canEdit}
        onChange={(event) => setNote(event.target.value)}
      />

      <button type="button" onClick={submit} disabled={!canEdit}>Log Activity Update</button>

      <ul className="feed">
        {data.activities.map((entry) => (
          <li key={entry.id}>
            <strong>{entry.category}:</strong> {entry.note} ({entry.createdBy})
            <br />
            <small>Logged {formatTimestamp(entry.createdAt)}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
