import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell } from './app/layout/AppShell';
import { AuthGate } from './features/auth/AuthGate';
import { useAuth } from './features/auth/AuthProvider';
import { useCareDataBundle } from './features/care/useCareData';
import { syncFamilyData } from './services/storage/cloudSync';
import { useSyncStatus } from './services/storage/syncStatus';

export function App() {
  const { loading, user, profile, signOut } = useAuth();
  const syncStatus = useSyncStatus();
  const data = useCareDataBundle();

  useEffect(() => {
    if (!user) {
      return;
    }

    void syncFamilyData(user);
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const handleOnline = () => {
      void syncFamilyData(user);
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [user]);

  if (loading) {
    return (
      <AppShell isAuthenticated={false}>
        <section className="panel">
          <h2>Checking Session...</h2>
          <p className="lead">Loading secure family workspace.</p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      isAuthenticated={Boolean(user)}
      userEmail={user?.email || ''}
      userName={profile?.displayName || ''}
      userRole={profile?.roleLabel || ''}
      syncStatus={syncStatus}
      quickSummary={{
        clinical: data.clinicalLog.length,
        meds: data.medications.length,
        visits: data.visitLog.length,
        therapy: data.therapy.length,
        activities: data.activities.length
      }}
      onSignOut={signOut}
    >
      {user ? <Outlet /> : <AuthGate />}
    </AppShell>
  );
}
