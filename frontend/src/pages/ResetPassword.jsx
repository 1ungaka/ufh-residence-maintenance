/**
 * Choose a new password. Opened from the reset email: Supabase's default link
 * signs the user in automatically; the custom template's button links here with
 * ?token_hash=...&type=recovery, which is exchanged for a session below.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Loading } from '../components/Ui.jsx';
import AuthCard from '../components/AuthCard.jsx';

const MIN_LENGTH = 8;

export default function ResetPassword() {
  const { user, loading, updatePassword, verifyRecovery } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tokenHash = params.get('token_hash');
  const [verifying, setVerifying] = useState(Boolean(tokenHash));
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Exchange the one-time token from the email button for a session, then
  // drop it from the address bar so it isn't left in history.
  useEffect(() => {
    if (!tokenHash) return;
    verifyRecovery(tokenHash)
      .catch(() => {})
      .finally(() => {
        setParams({}, { replace: true });
        setVerifying(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || verifying) return <Loading label="Checking your reset link" />;

  if (!user) {
    return (
      <AuthCard
        title="Link expired"
        lede="This reset link is invalid or has already been used. Reset links only work once and expire after an hour."
      >
        <div className="auth-card-actions">
          <Link className="btn btn-gold btn-block" to="/forgot-password">Send a new link</Link>
          <Link to="/login" className="btn-link">Back to sign in</Link>
        </div>
      </AuthCard>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password.length < MIN_LENGTH) {
      setError(`Your password needs at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await updatePassword(password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Choose a new password" lede={`For ${user.email}`}>
      <form onSubmit={handleSubmit} noValidate>
        <Alert type="error">{error}</Alert>
        <div className="field">
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            value={password}
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
          <p className="hint">At least {MIN_LENGTH} characters.</p>
        </div>
        <div className="field">
          <label htmlFor="confirm-password">Confirm new password</label>
          <input
            id="confirm-password"
            type="password"
            value={confirm}
            autoComplete="new-password"
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <div className="auth-card-actions">
          <button type="submit" className="btn btn-gold btn-block" disabled={busy}>
            {busy ? 'Saving...' : 'Save password and sign in'}
          </button>
        </div>
      </form>
    </AuthCard>
  );
}
