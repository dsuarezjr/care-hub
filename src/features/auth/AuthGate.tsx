import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';

export function AuthGate() {
  const { hasConfig, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
    if (!hash) {
      return;
    }

    const params = new URLSearchParams(hash);
    const errorCode = params.get('error_code');
    const description = params.get('error_description');

    if (errorCode === 'otp_expired') {
      setError('That magic link has expired or was already used. Request a new link and open the newest email only once.');
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      return;
    }

    if (description) {
      setError(description.split('+').join(' '));
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }
  }, []);

  async function submit() {
    setSubmitting(true);
    setError('');
    setMessage('');

    const result = await signInWithMagicLink(email.trim());

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setMessage('Magic link sent. Check your email and return to Ramon Care Hub.');
    setSubmitting(false);
  }

  if (!hasConfig) {
    return (
      <section className="panel auth-panel">
        <h2>Authentication Setup Needed</h2>
        <p className="lead">
          Add Supabase environment values to enable magic-link login.
        </p>
        <p className="status-error">
          Missing: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
        </p>
      </section>
    );
  }

  return (
    <section className="panel auth-panel">
      <h2>Family Sign In</h2>
      <p className="lead">Use your email to receive a secure magic link.</p>

      <label htmlFor="auth-email">Email</label>
      <input
        id="auth-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <button type="button" onClick={submit} disabled={submitting || !email.trim()}>
        {submitting ? 'Sending Link...' : 'Send Magic Link'}
      </button>

      {error ? <p className="status-error">{error}</p> : null}
      {message ? <p className="status-ok">{message}</p> : null}
    </section>
  );
}
