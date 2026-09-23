/**
 * Step 1: enter your university email. Step 2: type the 6-digit code from the
 * reset email. A correct code signs you in and moves on to /reset-password.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert } from '../components/Ui.jsx';
import AuthCard from '../components/AuthCard.jsx';
import { emailError, normaliseEmail } from '../utils/emails.js';

export default function ForgotPassword() {
  const { requestPasswordReset, verifyRecovery } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const sendCode = async (event) => {
    event?.preventDefault();
    setError('');
    setNotice('');

    const cleanEmail = normaliseEmail(email);
    const formatError = emailError(cleanEmail);
    if (formatError) {
      setError(formatError);
      return;
    }

    setBusy(true);
    try {
      await requestPasswordReset(cleanEmail);
      setEmail(cleanEmail);
      setStep('code');
      if (event === undefined) setNotice('We sent you a new code.');
    } catch (err) {
      setError(/rate limit|too many/i.test(err.message)
        ? 'Too many requests. Please wait a minute and try again.'
        : err.message);
    } finally {
      setBusy(false);
    }
  };

  const checkCode = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!/^\d{6,10}$/.test(code)) {
      setError('Enter the code exactly as it appears in the email.');
      return;
    }

    setBusy(true);
    try {
      await verifyRecovery({ email, code });
      navigate('/reset-password', { replace: true });
    } catch {
      setError('That code is wrong or has expired. Check the latest email, or send a new code.');
      setBusy(false);
    }
  };

  if (step === 'code') {
    return (
      <AuthCard
        title="Enter your code"
        lede={<>We sent a code to <strong>{email}</strong>. It expires in one hour.</>}
      >
        <form onSubmit={checkCode} noValidate>
          {error && <Alert type="error">{error}</Alert>}
          {notice && <Alert type="success">{notice}</Alert>}
          <div className="field">
            <label htmlFor="reset-code">Reset code</label>
            <input
              id="reset-code"
              className="code-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={10}
              value={code}
              placeholder="000000"
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
            <p className="hint">Can&rsquo;t find it? Check your junk or spam folder.</p>
          </div>
          <div className="auth-card-actions">
            <button type="submit" className="btn btn-gold btn-block" disabled={busy}>
              {busy ? 'Checking...' : 'Continue'}
            </button>
            <div className="auth-card-row">
              <button type="button" className="btn-link" onClick={() => sendCode()} disabled={busy}>
                Send a new code
              </button>
              <button
                type="button"
                className="btn-link"
                onClick={() => { setStep('email'); setCode(''); setError(''); setNotice(''); }}
              >
                Use a different email
              </button>
            </div>
          </div>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      lede="Enter your student or staff email and we will send you a code to choose a new password."
    >
      <form onSubmit={sendCode} noValidate>
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
            {busy ? 'Sending...' : 'Send code'}
          </button>
          <Link to="/login" className="btn-link">Back to sign in</Link>
        </div>
      </form>
    </AuthCard>
  );
}
