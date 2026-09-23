/**
 * Enter your university email and Supabase emails a reset link. The link opens
 * /reset-password, already signed in, where a new password is chosen.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert } from '../components/Ui.jsx';
import AuthCard from '../components/AuthCard.jsx';
import { emailError, normaliseEmail } from '../utils/emails.js';

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const sendLink = async (event) => {
    event?.preventDefault();
    setError('');

    const cleanEmail = normaliseEmail(email);
    const formatError = emailError(cleanEmail);
    if (formatError) {
      setError(formatError);
      return;
    }

    setBusy(true);
    try {
      await requestPasswordReset(cleanEmail);
      setSentTo(cleanEmail);
    } catch (err) {
      setError(/rate limit|too many|seconds/i.test(err.message)
        ? 'Too many requests. Please wait a minute and try again.'
        : err.message);
    } finally {
      setBusy(false);
    }
  };

  if (sentTo) {
    return (
      <AuthCard title="Check your email">
        <div className="sent-box">
          <p>
            If an account exists for <strong>{sentTo}</strong>, we have sent a link to reset your
            password. Open it on this device to choose a new one.
          </p>
          <p>The link expires in one hour. Can&rsquo;t find it? Check your junk or spam folder.</p>
        </div>
        {error && <Alert type="error">{error}</Alert>}
        <div className="auth-card-actions">
          <Link className="btn btn-gold btn-block" to="/login">Back to sign in</Link>
          <div className="auth-card-row">
            <button type="button" className="btn-link" onClick={() => sendLink()} disabled={busy}>
              {busy ? 'Sending...' : 'Send the link again'}
            </button>
            <button type="button" className="btn-link" onClick={() => { setSentTo(''); setError(''); }}>
              Use a different email
            </button>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      lede="Enter your student or staff email and we will send you a link to choose a new password."
    >
      <form onSubmit={sendLink} noValidate>
        {error && <Alert type="error">{error}</Alert>}
        <div className="field">
          <label htmlFor="reset-email">University email</label>
          <input
            id="reset-email"
            type="email"
            value={email}
            placeholder="202412345@ufh.ac.za"
            autoComplete="username"
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <p className="hint">Staff: use 123456@staff.ufh.ac.za with your 6-digit staff ID.</p>
        </div>
        <div className="auth-card-actions">
          <button type="submit" className="btn btn-gold btn-block" disabled={busy}>
            {busy ? 'Sending...' : 'Send reset link'}
          </button>
          <Link to="/login" className="btn-link">Back to sign in</Link>
        </div>
      </form>
    </AuthCard>
  );
}
