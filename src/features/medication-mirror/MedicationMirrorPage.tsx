import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useCareDataBundle } from '../care/useCareData';
import type { Medication, SideEffectReport } from '../../domain/models/care';
import { syncFamilyData } from '../../services/storage/cloudSync';
import { addSideEffectReport, removeMedication, upsertMedication } from '../../services/storage/localStore';
import { formatTimestamp } from '../../utils/time';

export function MedicationMirrorPage() {
  const { user, profile, canEdit } = useAuth();
  const data = useCareDataBundle();
  const [reporter, setReporter] = useState(profile?.displayName || 'Family Member');
  const [activeMedicationId, setActiveMedicationId] = useState('');
  const [note, setNote] = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftDose, setDraftDose] = useState('');
  const [draftFrequency, setDraftFrequency] = useState('');
  const [syncMessage, setSyncMessage] = useState('');
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    setReporter(profile?.displayName || 'Family Member');
  }, [profile?.displayName]);

  function submitReport() {
    if (!canEdit) {
      return;
    }

    if (!activeMedicationId || !note.trim()) {
      return;
    }

    const report: SideEffectReport = {
      id: crypto.randomUUID(),
      medicationId: activeMedicationId,
      note,
      createdBy: reporter,
      createdAt: new Date().toISOString()
    };

    addSideEffectReport(report);
    setNote('');
    void syncFamilyData(user);
  }

  function saveMedication(medication: Medication) {
    if (!canEdit) {
      return;
    }

    upsertMedication(medication);
    void syncFamilyData(user);
  }

  function addMedication() {
    if (!canEdit || !draftName.trim() || !draftDose.trim() || !draftFrequency.trim()) {
      return;
    }

    const medication: Medication = {
      id: crypto.randomUUID(),
      name: draftName.trim(),
      dose: draftDose.trim(),
      frequency: draftFrequency.trim()
    };

    upsertMedication(medication);
    setDraftName('');
    setDraftDose('');
    setDraftFrequency('');
    void syncFamilyData(user);
  }

  function deleteMedication(medicationId: string) {
    if (!canEdit) {
      return;
    }

    removeMedication(medicationId);
    if (activeMedicationId === medicationId) {
      setActiveMedicationId('');
    }
    void syncFamilyData(user);
  }

  async function quickSync() {
    setSyncMessage('');
    setSyncError('');
    const result = await syncFamilyData(user);
    if (!result.ok) {
      setSyncError(result.message);
      return;
    }

    setSyncMessage(result.message);
  }

  return (
    <section className="panel">
      <h2>Medication Mirror</h2>
      <p className="lead">Medication list from the SNF with family editing support and side-effect reporting.</p>
      {!canEdit ? <p className="status-error">Viewer access: side-effect reporting is disabled.</p> : null}

      <div className="actions">
        <button type="button" onClick={() => void quickSync()} className="button-secondary">Sync Medications Now</button>
      </div>
      {syncError ? <p className="status-error">{syncError}</p> : null}
      {syncMessage ? <p className="status-ok">{syncMessage}</p> : null}

      <h3>Medication List</h3>

      <ul className="feed">
        {data.medications.map((medication) => (
          <li key={medication.id}>
            <label htmlFor={`med-name-${medication.id}`}>Name</label>
            <input
              id={`med-name-${medication.id}`}
              value={medication.name}
              disabled={!canEdit}
              onChange={(event) => saveMedication({ ...medication, name: event.target.value })}
            />

            <label htmlFor={`med-dose-${medication.id}`}>Dose</label>
            <input
              id={`med-dose-${medication.id}`}
              value={medication.dose}
              disabled={!canEdit}
              onChange={(event) => saveMedication({ ...medication, dose: event.target.value })}
            />

            <label htmlFor={`med-frequency-${medication.id}`}>Frequency</label>
            <input
              id={`med-frequency-${medication.id}`}
              value={medication.frequency}
              disabled={!canEdit}
              onChange={(event) => saveMedication({ ...medication, frequency: event.target.value })}
            />

            <div className="actions">
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => setActiveMedicationId(medication.id)}
              className="button-secondary"
            >
              Report Side Effect
            </button>
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => deleteMedication(medication.id)}
              className="button-secondary"
            >
              Remove Medication
            </button>
            </div>
          </li>
        ))}
      </ul>

      <h3>Add Medication</h3>
      <label htmlFor="new-med-name">Name</label>
      <input id="new-med-name" value={draftName} disabled={!canEdit} onChange={(event) => setDraftName(event.target.value)} />

      <label htmlFor="new-med-dose">Dose</label>
      <input id="new-med-dose" value={draftDose} disabled={!canEdit} onChange={(event) => setDraftDose(event.target.value)} />

      <label htmlFor="new-med-frequency">Frequency</label>
      <input id="new-med-frequency" value={draftFrequency} disabled={!canEdit} onChange={(event) => setDraftFrequency(event.target.value)} />

      <button type="button" onClick={addMedication} disabled={!canEdit || !draftName.trim() || !draftDose.trim() || !draftFrequency.trim()}>
        Add Medication
      </button>

      <h3>Side Effect Report</h3>
      <label htmlFor="reporter">Reporter</label>
      <input id="reporter" value={reporter} disabled={!canEdit} onChange={(event) => setReporter(event.target.value)} />

      <label htmlFor="note">Observed Side Effect</label>
      <textarea id="note" rows={3} value={note} disabled={!canEdit} onChange={(event) => setNote(event.target.value)} />

      <button type="button" onClick={submitReport} disabled={!canEdit || !activeMedicationId}>
        Submit Report
      </button>

      <ul className="feed">
        {data.sideEffects.map((entry) => (
          <li key={entry.id}>
            {entry.note} ({entry.createdBy})
            <br />
            <small>Logged {formatTimestamp(entry.createdAt)}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
