import { NavLink } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import type { SyncStatus } from '../../services/storage/syncStatus';

const navItems = [
  { to: '/', label: 'Snapshot' },
  { to: '/clinical-log', label: 'Clinical' },
  { to: '/medications', label: 'Meds' },
  { to: '/visit-log', label: 'Visits' },
  { to: '/therapy', label: 'Therapy' },
  { to: '/activities', label: 'Activities' },
  { to: '/health-issues', label: 'Health Issues' },
  { to: '/weekly-report', label: 'Report' },
  { to: '/export', label: 'Export' },
  { to: '/profile', label: 'Profile' }
];

type AppShellProps = PropsWithChildren<{
  isAuthenticated?: boolean;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  syncStatus?: SyncStatus;
  quickSummary?: {
    clinical: number;
    meds: number;
    visits: number;
    therapy: number;
    activities: number;
  };
  onSignOut?: () => Promise<void>;
}>;

export function AppShell({
  children,
  isAuthenticated = true,
  userEmail,
  userName,
  userRole,
  syncStatus,
  quickSummary,
  onSignOut
}: AppShellProps) {
  const syncLabel = syncStatus?.isSyncing
    ? 'Syncing...'
    : syncStatus?.isDirty
      ? 'Pending sync'
      : syncStatus?.lastSyncedAt
        ? `Synced ${new Date(syncStatus.lastSyncedAt).toLocaleTimeString()}`
        : 'Not synced yet';

  return (
    <div className="app-layout">
      <header className="app-header">
        <p className="eyebrow">Ramon's Care Hub</p>
        <h1>Family Coordination Console</h1>
        <p className="subtitle">Mobile-first, collaborative, transparent care updates.</p>
        {isAuthenticated && quickSummary ? (
          <div className="header-summary" aria-label="Quick summary">
            <span>Clinical {quickSummary.clinical}</span>
            <span>Meds {quickSummary.meds}</span>
            <span>Visits {quickSummary.visits}</span>
            <span>Therapy {quickSummary.therapy}</span>
            <span>Activities {quickSummary.activities}</span>
          </div>
        ) : null}
        {isAuthenticated && userEmail ? (
          <div className="session-bar">
            <div>
              <p>{userName || userEmail}</p>
              <p className="session-detail">{userRole || 'Family member'} | {userEmail}</p>
              <p className={syncStatus?.isDirty ? 'sync-badge sync-badge-warn' : 'sync-badge'}>{syncLabel}</p>
              {syncStatus?.lastError ? <p className="sync-error">Last sync error: {syncStatus.lastError}</p> : null}
            </div>
            <button type="button" className="button-secondary" onClick={() => void onSignOut?.()}>
              Sign Out
            </button>
          </div>
        ) : null}
      </header>

      {isAuthenticated ? (
        <nav className="quick-nav" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'chip chip-active' : 'chip')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      ) : null}

      <main className="content" role="main">
        {children}
      </main>
    </div>
  );
}
