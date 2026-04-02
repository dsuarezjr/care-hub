import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useCareDataBundle } from '../care/useCareData';
import { syncFamilyData } from '../../services/storage/cloudSync';
import { updatePulse } from '../../services/storage/localStore';
import { formatTimestamp } from '../../utils/time';

function inLastDays(iso: string, days: number): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return iso >= cutoff.toISOString();
}

export function CareSnapshotPage() {
  const { user, profile, canEdit } = useAuth();
  const data = useCareDataBundle();
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'clinical' | 'therapy' | 'visits' | 'side-effects' | 'activities'>('all');
  const [status, setStatus] = useState(data.pulse.careStatus);
  const [oneBigThing, setOneBigThing] = useState(data.pulse.oneBigThing);
  const [updatedBy, setUpdatedBy] = useState(data.pulse.updatedBy === 'System' ? profile?.displayName || 'Family Member' : data.pulse.updatedBy);

  const summaryCards = [
    { label: 'Clinical Entries', value: data.clinicalLog.length },
    { label: 'Side Effect Reports', value: data.sideEffects.length },
    { label: 'Visit Notes', value: data.visitLog.length },
    { label: 'Therapy Sessions', value: data.therapy.length },
    { label: 'Activities Logged', value: data.activities.length }
  ];

  const recentClinical = data.clinicalLog.filter((entry) => inLastDays(entry.createdAt, 7));
  const recentTherapy = data.therapy.filter((entry) => inLastDays(entry.createdAt, 7));
  const recentMoodPositive = recentClinical.filter((entry) => entry.mood === 'Positive').length;
  const avgSpeech = recentClinical.length
    ? (recentClinical.reduce((sum, entry) => sum + entry.speechClarity, 0) / recentClinical.length).toFixed(1)
    : 'n/a';
  const mobilityIndependent = recentClinical.filter((entry) => entry.mobilityLevel === 'Independent').length;
  const therapyMinutes = recentTherapy.reduce((sum, entry) => sum + entry.minutes, 0);

  const trends = [
    { label: 'Avg Speech Clarity (7d)', value: avgSpeech },
    { label: 'Positive Mood Logs (7d)', value: recentMoodPositive },
    { label: 'Independent Mobility Logs (7d)', value: mobilityIndependent },
    { label: 'Therapy Minutes (7d)', value: therapyMinutes }
  ];

  const recentTimeline = [
    { id: 'pulse', category: 'all', label: `Care Snapshot updated by ${data.pulse.updatedBy}`, createdAt: data.pulse.updatedAt },
    ...data.clinicalLog.map((item) => ({ id: `clinical-${item.id}`, category: 'clinical' as const, label: `Clinical log by ${item.createdBy}`, createdAt: item.createdAt })),
    ...data.sideEffects.map((item) => ({ id: `side-${item.id}`, category: 'side-effects' as const, label: `Side effect report by ${item.createdBy}`, createdAt: item.createdAt })),
    ...data.visitLog.map((item) => ({ id: `visit-${item.id}`, category: 'visits' as const, label: `Visit update by ${item.visitor}`, createdAt: item.createdAt })),
    ...data.therapy.map((item) => ({ id: `therapy-${item.id}`, category: 'therapy' as const, label: `${item.discipline} session by ${item.createdBy}`, createdAt: item.createdAt })),
    ...data.activities.map((item) => ({ id: `activity-${item.id}`, category: 'activities' as const, label: `${item.category} update by ${item.createdBy}`, createdAt: item.createdAt }))
  ]
    .filter((item) => timelineFilter === 'all' || item.category === timelineFilter)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 8);

  useEffect(() => {
    setStatus(data.pulse.careStatus);
    setOneBigThing(data.pulse.oneBigThing);
    setUpdatedBy(data.pulse.updatedBy === 'System' ? profile?.displayName || 'Family Member' : data.pulse.updatedBy);
  }, [data.pulse.careStatus, data.pulse.oneBigThing, data.pulse.updatedBy, profile?.displayName]);

  function save() {
    if (!canEdit) {
      return;
    }

    updatePulse({
      careStatus: status,
      oneBigThing,
      updatedBy,
      updatedAt: new Date().toISOString()
    });

    void syncFamilyData(user);
  }

  return (
    <section className="panel">
      <h2>Care Snapshot</h2>
      <p className="lead">One clear place for today’s status and a quick family-wide summary of progress.</p>

      <div className="actions">
        <Link to="/weekly-report" className="chip chip-active">Open Weekly Report</Link>
        <Link to="/weekly-report?print=1" className="chip">Print Weekly Report</Link>
      </div>

      <h3>Quick Family Summary</h3>
      <div className="summary-grid">
        {summaryCards.map((card) => (
          <article className="summary-card" key={card.label}>
            <p>{card.label}</p>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      <h3>7-Day Trends</h3>
      <div className="summary-grid summary-grid-trends">
        {trends.map((trend) => (
          <article className="summary-card" key={trend.label}>
            <p>{trend.label}</p>
            <strong>{trend.value}</strong>
          </article>
        ))}
      </div>

      <h3>Recent Activity Timeline</h3>
      <div className="filter-row" role="tablist" aria-label="Timeline filters">
        <button type="button" className={timelineFilter === 'all' ? 'button-secondary filter-active' : 'button-secondary'} onClick={() => setTimelineFilter('all')}>All</button>
        <button type="button" className={timelineFilter === 'clinical' ? 'button-secondary filter-active' : 'button-secondary'} onClick={() => setTimelineFilter('clinical')}>Clinical</button>
        <button type="button" className={timelineFilter === 'therapy' ? 'button-secondary filter-active' : 'button-secondary'} onClick={() => setTimelineFilter('therapy')}>Therapy</button>
        <button type="button" className={timelineFilter === 'visits' ? 'button-secondary filter-active' : 'button-secondary'} onClick={() => setTimelineFilter('visits')}>Visits</button>
        <button type="button" className={timelineFilter === 'side-effects' ? 'button-secondary filter-active' : 'button-secondary'} onClick={() => setTimelineFilter('side-effects')}>Side Effects</button>
        <button type="button" className={timelineFilter === 'activities' ? 'button-secondary filter-active' : 'button-secondary'} onClick={() => setTimelineFilter('activities')}>Activities</button>
      </div>
      <ul className="feed timeline-feed">
        {recentTimeline.map((item) => (
          <li key={item.id}>
            <strong>{item.label}</strong>
            <br />
            <small>{formatTimestamp(item.createdAt)}</small>
          </li>
        ))}
      </ul>

      <h3>Current Care Snapshot</h3>
      {!canEdit ? <p className="status-error">Your role is viewer. Snapshot editing is disabled.</p> : null}

      <label htmlFor="care-status">Care Status</label>
      <select
        id="care-status"
        value={status}
        disabled={!canEdit}
        onChange={(event) => setStatus(event.target.value as 'Stable' | 'Alert')}
      >
        <option value="Stable">Stable</option>
        <option value="Alert">Alert</option>
      </select>

      <label htmlFor="one-big-thing">One Big Thing This Week</label>
      <textarea
        id="one-big-thing"
        rows={3}
        value={oneBigThing}
        disabled={!canEdit}
        onChange={(event) => setOneBigThing(event.target.value)}
      />

      <label htmlFor="updated-by">Updated By</label>
      <input
        id="updated-by"
        value={updatedBy}
        disabled={!canEdit}
        onChange={(event) => setUpdatedBy(event.target.value)}
      />

      <button type="button" onClick={save} disabled={!canEdit}>Save Care Snapshot</button>
    </section>
  );
}
