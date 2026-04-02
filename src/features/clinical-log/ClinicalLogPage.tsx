import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useCareDataBundle } from '../care/useCareData';
import type { ClinicalLogEntry } from '../../domain/models/care';
import { syncFamilyData } from '../../services/storage/cloudSync';
import { appendClinicalEntry } from '../../services/storage/localStore';
import { formatTimestamp } from '../../utils/time';

export function ClinicalLogPage() {
  const { user, profile, canEdit } = useAuth();
  const data = useCareDataBundle();
  const [createdBy, setCreatedBy] = useState(profile?.displayName || 'Family Member');
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [pulse, setPulse] = useState(78);
  const [speechClarity, setSpeechClarity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [mobilityLevel, setMobilityLevel] = useState<'Bed' | 'Assisted Walk' | 'Walker' | 'Independent'>('Assisted Walk');
  const [mood, setMood] = useState<'Low' | 'Steady' | 'Positive'>('Steady');

  useEffect(() => {
    setCreatedBy(profile?.displayName || 'Family Member');
  }, [profile?.displayName]);

  function submit() {
    if (!canEdit) {
      return;
    }

    const entry: ClinicalLogEntry = {
      id: crypto.randomUUID(),
      createdBy,
      bloodPressure,
      pulse,
      speechClarity,
      mobilityLevel,
      mood,
      createdAt: new Date().toISOString()
    };

    appendClinicalEntry(entry);
    void syncFamilyData(user);
  }

  return (
    <section className="panel">
      <h2>Clinical Log</h2>
      <p className="lead">Track vitals and stroke recovery indicators after each check-in.</p>
      {!canEdit ? <p className="status-error">Viewer access: adding entries is disabled.</p> : null}

      <div className="grid-two">
        <div>
          <label htmlFor="clinical-by">Recorded By</label>
          <input id="clinical-by" value={createdBy} disabled={!canEdit} onChange={(event) => setCreatedBy(event.target.value)} />
        </div>
        <div>
          <label htmlFor="bp">Blood Pressure</label>
          <input id="bp" value={bloodPressure} disabled={!canEdit} onChange={(event) => setBloodPressure(event.target.value)} />
        </div>
        <div>
          <label htmlFor="pulse">Pulse</label>
          <input
            id="pulse"
            type="number"
            value={pulse}
            disabled={!canEdit}
            onChange={(event) => setPulse(Number(event.target.value) || 0)}
          />
        </div>
        <div>
          <label htmlFor="speech">Speech Clarity (1-5)</label>
          <input
            id="speech"
            type="number"
            min={1}
            max={5}
            value={speechClarity}
            disabled={!canEdit}
            onChange={(event) => {
              const value = Number(event.target.value);
              const clamped = Math.min(5, Math.max(1, value || 1)) as 1 | 2 | 3 | 4 | 5;
              setSpeechClarity(clamped);
            }}
          />
        </div>
        <div>
          <label htmlFor="mobility">Mobility Level</label>
          <select
            id="mobility"
            value={mobilityLevel}
            disabled={!canEdit}
            onChange={(event) => setMobilityLevel(event.target.value as ClinicalLogEntry['mobilityLevel'])}
          >
            <option value="Bed">Bed</option>
            <option value="Assisted Walk">Assisted Walk</option>
            <option value="Walker">Walker</option>
            <option value="Independent">Independent</option>
          </select>
        </div>
        <div>
          <label htmlFor="mood">Mood</label>
          <select
            id="mood"
            value={mood}
            disabled={!canEdit}
            onChange={(event) => setMood(event.target.value as ClinicalLogEntry['mood'])}
          >
            <option value="Low">Low</option>
            <option value="Steady">Steady</option>
            <option value="Positive">Positive</option>
          </select>
        </div>
      </div>

      <button type="button" onClick={submit} disabled={!canEdit}>Add Clinical Entry</button>

      <ul className="feed">
        {data.clinicalLog.map((entry) => (
          <li key={entry.id}>
            <strong>{entry.bloodPressure}</strong> | Pulse {entry.pulse} | Speech {entry.speechClarity}/5 | {entry.mobilityLevel} | {entry.mood} ({entry.createdBy})
            <br />
            <small>Logged {formatTimestamp(entry.createdAt)}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
