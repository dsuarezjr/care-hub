import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCareDataBundle } from '../care/useCareData';
import { formatTimestamp } from '../../utils/time';

function weekWindowDays(daysAgoStart: number, daysAgoEnd: number): [string, string] {
  const end = new Date();
  end.setDate(end.getDate() - daysAgoStart);
  const start = new Date();
  start.setDate(start.getDate() - daysAgoEnd);
  return [start.toISOString(), end.toISOString()];
}

function countInWindow(items: Array<{ createdAt: string }>, start: string, end: string): number {
  return items.filter((item) => item.createdAt >= start && item.createdAt < end).length;
}

export function WeeklyReportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const data = useCareDataBundle();

  useEffect(() => {
    if (searchParams.get('print') !== '1') {
      return;
    }

    const timer = window.setTimeout(() => {
      window.print();
      const next = new URLSearchParams(searchParams);
      next.delete('print');
      setSearchParams(next, { replace: true });
    }, 120);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchParams, setSearchParams]);

  const [thisWeekStart, thisWeekEnd] = weekWindowDays(0, 7);
  const [lastWeekStart, lastWeekEnd] = weekWindowDays(7, 14);

  const thisWeek = {
    clinical: countInWindow(data.clinicalLog, thisWeekStart, thisWeekEnd),
    therapy: countInWindow(data.therapy, thisWeekStart, thisWeekEnd),
    visits: countInWindow(data.visitLog, thisWeekStart, thisWeekEnd),
    sideEffects: countInWindow(data.sideEffects, thisWeekStart, thisWeekEnd),
    activities: countInWindow(data.activities, thisWeekStart, thisWeekEnd)
  };

  const lastWeek = {
    clinical: countInWindow(data.clinicalLog, lastWeekStart, lastWeekEnd),
    therapy: countInWindow(data.therapy, lastWeekStart, lastWeekEnd),
    visits: countInWindow(data.visitLog, lastWeekStart, lastWeekEnd),
    sideEffects: countInWindow(data.sideEffects, lastWeekStart, lastWeekEnd),
    activities: countInWindow(data.activities, lastWeekStart, lastWeekEnd)
  };

  const topEvents = [
    ...data.clinicalLog.map((item) => ({ id: `clinical-${item.id}`, text: `Clinical: ${item.bloodPressure}, pulse ${item.pulse} (${item.createdBy})`, createdAt: item.createdAt })),
    ...data.therapy.map((item) => ({ id: `therapy-${item.id}`, text: `${item.discipline}: ${item.minutes} min, ${item.win}`, createdAt: item.createdAt })),
    ...data.visitLog.map((item) => ({ id: `visit-${item.id}`, text: `Visit: ${item.visitor} - ${item.updateSentence}`, createdAt: item.createdAt })),
    ...data.sideEffects.map((item) => ({ id: `side-${item.id}`, text: `Side effect: ${item.note} (${item.createdBy})`, createdAt: item.createdAt })),
    ...data.activities.map((item) => ({ id: `activity-${item.id}`, text: `${item.category}: ${item.note}`, createdAt: item.createdAt }))
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 12);

  return (
    <section className="panel report-sheet">
      <h2>Weekly Family Report</h2>
      <p className="lead">A printable summary for family alignment and care conversations.</p>

      <div className="actions no-print">
        <button type="button" onClick={() => window.print()}>Print Report</button>
      </div>

      <h3>Current Care Snapshot</h3>
      <p><strong>Status:</strong> {data.pulse.careStatus}</p>
      <p><strong>One Big Thing:</strong> {data.pulse.oneBigThing}</p>
      <p><strong>Updated:</strong> {formatTimestamp(data.pulse.updatedAt)} by {data.pulse.updatedBy}</p>

      <h3>Weekly Comparison</h3>
      <div className="summary-grid">
        <article className="summary-card"><p>Clinical</p><strong>{thisWeek.clinical}</strong><small>Last week {lastWeek.clinical}</small></article>
        <article className="summary-card"><p>Therapy</p><strong>{thisWeek.therapy}</strong><small>Last week {lastWeek.therapy}</small></article>
        <article className="summary-card"><p>Visits</p><strong>{thisWeek.visits}</strong><small>Last week {lastWeek.visits}</small></article>
        <article className="summary-card"><p>Side Effects</p><strong>{thisWeek.sideEffects}</strong><small>Last week {lastWeek.sideEffects}</small></article>
        <article className="summary-card"><p>Activities</p><strong>{thisWeek.activities}</strong><small>Last week {lastWeek.activities}</small></article>
      </div>

      <h3>Recent Notable Events</h3>
      <ul className="feed">
        {topEvents.map((event) => (
          <li key={event.id}>
            <strong>{event.text}</strong>
            <br />
            <small>{formatTimestamp(event.createdAt)}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
