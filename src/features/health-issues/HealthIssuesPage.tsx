import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useCareDataBundle } from '../care/useCareData';
import { addHealthIssue, removeHealthIssue } from '../../services/storage/localStore';
import { syncFamilyData } from '../../services/storage/cloudSync';
import { formatTimestamp } from '../../utils/time';

export function HealthIssuesPage() {
  const { user, profile, canEdit } = useAuth();
  const data = useCareDataBundle();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [createdBy, setCreatedBy] = useState(profile?.displayName || 'Family Member');

  useEffect(() => {
    setCreatedBy(profile?.displayName || 'Family Member');
  }, [profile?.displayName]);

  function handleAdd() {
    if (!canEdit || !title.trim()) {
      return;
    }

    addHealthIssue({
      id: crypto.randomUUID(),
      title: title.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
      createdBy
    });

    setTitle('');
    setNotes('');
    void syncFamilyData(user);
  }

  function handleRemove(issueId: string) {
    if (!canEdit) {
      return;
    }

    removeHealthIssue(issueId);
    void syncFamilyData(user);
  }

  return (
    <section className="panel">
      <h2>Current Health Issues</h2>
      <p className="lead">Track ongoing health concerns so the whole family stays informed.</p>
      {!canEdit ? <p className="status-error">Viewer access: editing is disabled.</p> : null}

      <h3>Add Health Issue</h3>

      <label htmlFor="issue-reporter">Added by</label>
      <input
        id="issue-reporter"
        value={createdBy}
        disabled={!canEdit}
        onChange={(e) => setCreatedBy(e.target.value)}
      />

      <label htmlFor="issue-title">Issue Title</label>
      <input
        id="issue-title"
        placeholder="e.g. Elevated blood pressure"
        value={title}
        disabled={!canEdit}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label htmlFor="issue-notes">Notes (optional)</label>
      <textarea
        id="issue-notes"
        rows={3}
        placeholder="Additional context, observations, or doctor recommendations"
        value={notes}
        disabled={!canEdit}
        onChange={(e) => setNotes(e.target.value)}
      />

      <button type="button" onClick={handleAdd} disabled={!canEdit || !title.trim()}>
        Add Issue
      </button>

      <h3>Active Issues ({data.healthIssues.length})</h3>

      {data.healthIssues.length === 0 ? (
        <p className="lead">No current health issues recorded.</p>
      ) : (
        <ul className="feed">
          {data.healthIssues.map((issue) => (
            <li key={issue.id}>
              <strong>{issue.title}</strong>
              {issue.notes ? <p>{issue.notes}</p> : null}
              <small>Added by {issue.createdBy} — {formatTimestamp(issue.createdAt)}</small>
              <div className="actions">
                <button
                  type="button"
                  className="button-secondary"
                  disabled={!canEdit}
                  onClick={() => handleRemove(issue.id)}
                >
                  Remove Issue
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
