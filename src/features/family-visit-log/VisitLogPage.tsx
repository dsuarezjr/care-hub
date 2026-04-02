import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useCareDataBundle } from '../care/useCareData';
import type { VisitLogEntry } from '../../domain/models/care';
import { syncFamilyData } from '../../services/storage/cloudSync';
import { appendVisitEntry } from '../../services/storage/localStore';
import { formatTimestamp } from '../../utils/time';

export function VisitLogPage() {
  const { user, profile, canEdit } = useAuth();
  const data = useCareDataBundle();
  const [visitor, setVisitor] = useState<VisitLogEntry['visitor']>(profile?.displayName || 'Family Member');
  const [updateSentence, setUpdateSentence] = useState('Ramon smiled during breathing exercises today.');
  const [nextStep, setNextStep] = useState('Martha: bring his favorite playlist for evening calm time.');

  useEffect(() => {
    setVisitor(profile?.displayName || 'Family Member');
  }, [profile?.displayName]);

  function submit() {
    if (!canEdit) {
      return;
    }

    if (!updateSentence.trim() || !nextStep.trim()) {
      return;
    }

    const entry: VisitLogEntry = {
      id: crypto.randomUUID(),
      visitor,
      updateSentence,
      nextStep,
      createdAt: new Date().toISOString()
    };

    appendVisitEntry(entry);
    setUpdateSentence('');
    setNextStep('');
    void syncFamilyData(user);
  }

  return (
    <section className="panel">
      <h2>Family Visit Log</h2>
      <p className="lead">Leave a one-sentence update and a clear handoff next step.</p>
      {!canEdit ? <p className="status-error">Viewer access: posting updates is disabled.</p> : null}

      <label htmlFor="visitor">Visitor</label>
      <input
        id="visitor"
        value={visitor}
        disabled={!canEdit}
        onChange={(event) => setVisitor(event.target.value)}
      />

      <label htmlFor="update">1-Sentence Update</label>
      <textarea
        id="update"
        rows={2}
        value={updateSentence}
        disabled={!canEdit}
        onChange={(event) => setUpdateSentence(event.target.value)}
      />

      <label htmlFor="next-step">Next Step For Next Visitor</label>
      <textarea
        id="next-step"
        rows={2}
        value={nextStep}
        disabled={!canEdit}
        onChange={(event) => setNextStep(event.target.value)}
      />

      <button type="button" onClick={submit} disabled={!canEdit}>Post Visit Update</button>

      <ul className="feed">
        {data.visitLog.map((entry) => (
          <li key={entry.id}>
            <strong>{entry.visitor}:</strong> {entry.updateSentence}<br />
            Next: {entry.nextStep}
            <br />
            <small>Logged {formatTimestamp(entry.createdAt)}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
