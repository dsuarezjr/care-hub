import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useCareDataBundle } from '../care/useCareData';
import type { TherapyEntry } from '../../domain/models/care';
import { syncFamilyData } from '../../services/storage/cloudSync';
import { appendTherapyEntry } from '../../services/storage/localStore';
import { formatTimestamp } from '../../utils/time';

export function TherapyTrackerPage() {
  const { user, profile, canEdit } = useAuth();
  const data = useCareDataBundle();
  const [createdBy, setCreatedBy] = useState(profile?.displayName || 'Family Member');
  const [discipline, setDiscipline] = useState<TherapyEntry['discipline']>('PT');
  const [minutes, setMinutes] = useState(30);
  const [win, setWin] = useState('Improved standing endurance by 2 minutes.');

  useEffect(() => {
    setCreatedBy(profile?.displayName || 'Family Member');
  }, [profile?.displayName]);

  function submit() {
    if (!canEdit) {
      return;
    }

    const entry: TherapyEntry = {
      id: crypto.randomUUID(),
      createdBy,
      discipline,
      minutes,
      win,
      createdAt: new Date().toISOString()
    };

    appendTherapyEntry(entry);
    void syncFamilyData(user);
  }

  return (
    <section className="panel">
      <h2>Therapy Tracker</h2>
      <p className="lead">Track PT, OT, and ST minutes with clear wins from each session.</p>
      {!canEdit ? <p className="status-error">Viewer access: therapy logging is disabled.</p> : null}

      <div className="grid-two">
        <div>
          <label htmlFor="therapist">Logged By</label>
          <input id="therapist" value={createdBy} disabled={!canEdit} onChange={(event) => setCreatedBy(event.target.value)} />
        </div>
        <div>
          <label htmlFor="discipline">Discipline</label>
          <select
            id="discipline"
            value={discipline}
            disabled={!canEdit}
            onChange={(event) => setDiscipline(event.target.value as TherapyEntry['discipline'])}
          >
            <option value="PT">Physical Therapy (PT)</option>
            <option value="OT">Occupational Therapy (OT)</option>
            <option value="ST">Speech Therapy (ST)</option>
          </select>
        </div>
        <div>
          <label htmlFor="minutes">Minutes</label>
          <input
            id="minutes"
            type="number"
            value={minutes}
            disabled={!canEdit}
            onChange={(event) => setMinutes(Number(event.target.value) || 0)}
          />
        </div>
      </div>

      <label htmlFor="win">Session Win</label>
      <textarea id="win" rows={3} value={win} disabled={!canEdit} onChange={(event) => setWin(event.target.value)} />

      <button type="button" onClick={submit} disabled={!canEdit}>Log Therapy Session</button>

      <ul className="feed">
        {data.therapy.map((entry) => (
          <li key={entry.id}>
            <strong>{entry.discipline}</strong> {entry.minutes} min | {entry.win} ({entry.createdBy})
            <br />
            <small>Logged {formatTimestamp(entry.createdAt)}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
