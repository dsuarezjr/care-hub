import { createBrowserRouter } from 'react-router-dom';
import { App } from '../App';
import { ActivitiesPage } from '../features/activities/ActivitiesPage';
import { ClinicalLogPage } from '../features/clinical-log/ClinicalLogPage';
import { ExportPage } from '../features/export/ExportPage';
import { VisitLogPage } from '../features/family-visit-log/VisitLogPage';
import { MedicationMirrorPage } from '../features/medication-mirror/MedicationMirrorPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { CareSnapshotPage } from '../features/pulse-dashboard/PulseDashboardPage';
import { WeeklyReportPage } from '../features/reports/WeeklyReportPage';
import { TherapyTrackerPage } from '../features/therapy-tracker/TherapyTrackerPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <CareSnapshotPage /> },
      { path: '/clinical-log', element: <ClinicalLogPage /> },
      { path: '/medications', element: <MedicationMirrorPage /> },
      { path: '/visit-log', element: <VisitLogPage /> },
      { path: '/therapy', element: <TherapyTrackerPage /> },
      { path: '/activities', element: <ActivitiesPage /> },
      { path: '/export', element: <ExportPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/weekly-report', element: <WeeklyReportPage /> }
    ]
  }
]);
