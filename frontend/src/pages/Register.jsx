/** Student self-registration. Staff accounts are issued by Facilities Management. */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert } from '../components/Ui.jsx';
import AuthCard from '../components/AuthCard.jsx';
import ResidenceField from '../components/ResidenceField.jsx';
import ClickSpark from '../components/ui/ClickSpark';
import { EMAIL_PLACEHOLDER, normaliseEmail, roleForEmail } from '../utils/emails.js';

const MIN_PASSWORD = 8;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [residenceBuilding, setResidenceBuilding] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const cleanEmail = normaliseEmail(email);
    const emailRole = roleForEmail(cleanEmail);
    if (emailRole !== 'student') {
      setError(emailRole === 'maintenance'
        ? 'Staff accounts are issued by Facilities Management. Sign in with your staff email instead of registering.'
        : `Registration is restricted to student emails, for example ${EMAIL_PLACEHOLDER.student}.`);
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Your password needs at least ${MIN_PASSWORD} characters.`);
      return;
    }

    setBusy(true);
    try {
      await register({
        email: cleanEmail,
        password,
        full_name: fullName.trim(),
        student_number: cleanEmail.split('@')[0],
        residence_building: residenceBuilding.trim(),
        room_number: roomNumber.trim(),
        role: 'student'
      });
      navigate('/dashboard');
    } catch (err) {
      setError(/already registered/i.test(err.message)
        ? 'An account with this email already exists. Sign in, or reset your password if you have forgotten it.'
        : err.message);
      setBusy(false);
    }
  };

  return (
    <ClickSpark sparkColor="#F5B71D" sparkSize={10} sparkRadius={15} sparkCount={8} duration={400}>
      <AuthCard
        wide
        title="Create your student account"
        lede="Register once to log faults in your residence and follow every repair."
      >
        <form onSubmit={handleSubmit} noValidate>
          {error && <Alert type="error">{error}</Alert>}

          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              value={fullName}
              autoComplete="name"
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="email">Student email</label>
            <input
              id="email"
              type="email"
              value={email}
              placeholder={EMAIL_PLACEHOLDER.student}
              autoComplete="username"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="hint">Your student number followed by @ufh.ac.za.</p>
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-pressed={showPassword}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="hint">At least {MIN_PASSWORD} characters.</p>
          </div>

          <div className="form-row">
            <ResidenceField id="residenceBuilding" value={residenceBuilding} onChange={setResidenceBuilding} />
            <div className="field">
              <label htmlFor="roomNumber">Room number</label>
              <input
                id="roomNumber"
                value={roomNumber}
                placeholder="e.g. A12"
                onChange={(e) => setRoomNumber(e.target.value)}
                required
              />
            </div>
          </div>

          <p className="auth-foot">
            By creating an account you agree to our <Link to="/terms">Terms and conditions</Link> and
            confirm you have read our <Link to="/privacy">Privacy statement</Link>.
          </p>

          <div className="auth-card-actions">
            <button type="submit" className="btn btn-gold btn-pill btn-block" disabled={busy}>
              {busy ? 'Creating your account...' : 'Create account'}
            </button>
            <span className="auth-card-switch">
              Already have an account? <Link to="/login">Sign in</Link>
            </span>
          </div>
        </form>
      </AuthCard>
    </ClickSpark>
  );
}
