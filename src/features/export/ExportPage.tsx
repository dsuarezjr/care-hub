import { useState } from 'react';
import { useCareDataBundle } from '../care/useCareData';
import { useAuth } from '../auth/AuthProvider';
import { exportCsv, exportJson } from '../../services/export/exportData';
import { pullCloudSnapshot, pushLocalSnapshot, syncFamilyData } from '../../services/storage/cloudSync';

export function ExportPage() {
  const { user } = useAuth();
  const data = useCareDataBundle();
  const [syncMessage, setSyncMessage] = useState('');
  const [syncError, setSyncError] = useState('');

  async function pushToCloud() {
    setSyncError('');
    setSyncMessage('');
    const result = await pushLocalSnapshot(user);
    if (!result.ok) {
      setSyncError(result.message);
      return;
    }

    setSyncMessage(result.message);
  }

  async function syncNow() {
    setSyncError('');
    setSyncMessage('');
    const result = await syncFamilyData(user);
    if (!result.ok) {
      setSyncError(result.message);
      return;
    }

    setSyncMessage(result.message);
  }

  async function pullFromCloud() {
    setSyncError('');
    setSyncMessage('');
    const result = await pullCloudSnapshot();
    if (!result.ok) {
      setSyncError(result.message);
      return;
    }

    setSyncMessage(`${result.message} Refresh this page to load latest values.`);
  }

  return (
    <section className="panel">
      <h2>AI Export</h2>
      <p className="lead">
        Export the full care timeline for AI-assisted analysis, trend summaries, and planning.
      </p>

      <div className="actions">
        <button type="button" onClick={() => exportJson(data)}>
          Export JSON (AI-Ready)
        </button>
        <button type="button" className="button-secondary" onClick={() => exportCsv(data)}>
          Export CSV
        </button>
      </div>

      <h3>Cloud Sync</h3>
      <p className="lead">
        Keep the family in sync across devices before exporting for AI trend analysis.
      </p>
      <div className="actions">
        <button type="button" onClick={() => void syncNow()}>
          Sync Now
        </button>
        <button type="button" onClick={() => void pushToCloud()}>
          Push Local Data To Cloud
        </button>
        <button type="button" className="button-secondary" onClick={() => void pullFromCloud()}>
          Pull Latest Cloud Snapshot
        </button>
      </div>
      {syncError ? <p className="status-error">{syncError}</p> : null}
      {syncMessage ? <p className="status-ok">{syncMessage}</p> : null}

      <h3>Included Data</h3>
      <ul className="feed">
        <li>Pulse status and weekly one big thing</li>
        <li>Clinical vitals and recovery metrics</li>
        <li>Medication list and side-effect reports</li>
        <li>Family visit handoff updates</li>
        <li>Therapy minutes and wins</li>
        <li>Fun, entertainment, activity, and hygiene logs</li>
      </ul>
    </section>
  );
}
