import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Emblem, Icons } from '../components/Ui.jsx';
import { INFO_LINKS, InfoLink } from '../components/Footer.jsx';
import GridMotion from '../components/ui/GridMotion';
import { EMAIL_PLACEHOLDER, emailError, normaliseEmail } from '../utils/emails.js';

const STEPS = [
  { n: '01', t: 'Log the fault from your room' },
  { n: '02', t: 'A tradesperson takes the job' },
  { n: '03', t: 'Follow every update to completion' }
];

// value matches user_metadata.role in Supabase
const ROLES = [
  { value: 'student', label: 'Student', hint: 'Log and track faults in your residence', icon: Icons.user },
  { value: 'maintenance', label: 'Maintenance tradesperson', hint: 'Pick up and update jobs', icon: Icons.tools }
];

// Local UFH photos first, then campus and trade shots.
const RESIDENCE_IMAGES = [
  '/images/campus-team.jpg',
  '/images/electrical-panel.jpg',
  '/images/maintenance-collage.jpg',
  '/images/electrical.jpg',
  '/images/plumber.jpg',
  'https://stagafrican.com/wp-content/uploads/2020/04/AliceCampus-Building2.jpg',
  'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1',
  'https://insideeducation.co.za/wp-content/uploads/2020/11/FortHareResidence.jpg',
  'https://images.unsplash.com/photo-1621905252507-b35492cc74b4',
  'https://www.dailydispatch.co.za/resizer/v2/5VBKUM3J6FLUNGDFVZDE5YBVSY.jpg?auth=6b5f7b3cecaab2387cd1203a54b9bf09b0d9c18a8142225fc8c93967eb3b5dd3&width=800&height=533&smart=true',
  'https://groundup.org.za/media/uploads/images/photographers/Johnnie%20Isaac/ashes_of_university_of_fort_hare_zJBo9vg.jpg',
  'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15',
  'https://www.ufh.ac.za/wp-content/uploads/2024/11/UFH-DRI-Research-Week-2024-Day-1-69-e1732064287899-847x1024.webp'
];

// GridMotion has 28 slots; repeat the photos until they are all filled.
const GRID_IMAGES = Array(28).fill(RESIDENCE_IMAGES).flat().slice(0, 28);

/**
 * Gentle 3D tilt: the card leans a few degrees toward the mouse and the
 * headline drifts the other way. Writes CSS variables straight to the page
 * element (no re-renders). Off for touch screens and reduced-motion users.
 */
function useTilt() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!el || reduced) return undefined;

    let frame = 0;
    const move = (event) => {
      if (event.pointerType !== 'mouse') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = event.clientX / window.innerWidth - 0.5; // -0.5 .. 0.5
        const y = event.clientY / window.innerHeight - 0.5;
        el.style.setProperty('--tilt-x', `${(-y * 6).toFixed(2)}deg`);
        el.style.setProperty('--tilt-y', `${(x * 8).toFixed(2)}deg`);
        el.style.setProperty('--drift-x', `${(-x * 14).toFixed(1)}px`);
        el.style.setProperty('--drift-y', `${(-y * 10).toFixed(1)}px`);
      });
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      ['--tilt-x', '--tilt-y', '--drift-x', '--drift-y'].forEach((v) => el.style.removeProperty(v));
    };

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', reset);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', reset);
    };
  }, []);

  return ref;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const landingRef = useTilt();
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [badCredentials, setBadCredentials] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setBadCredentials(false);

    const cleanEmail = normaliseEmail(email);
    const formatError = emailError(cleanEmail, role);
    if (formatError) {
      setError(formatError);
      return;
    }

    setBusy(true);
    try {
      await login(cleanEmail, password, role);
      navigate('/dashboard');
    } catch (err) {
      if (/invalid login credentials/i.test(err.message)) {
        setBadCredentials(true);
        setError('That email and password do not match an account.');
      } else if (/email not confirmed/i.test(err.message)) {
        setError('Please confirm your email first. Check your inbox for the link we sent when you registered.');
      } else {
        setError(err.message);
      }
      setBusy(false);
    }
  };

  return (
    <div className="landing" ref={landingRef}>
      {/* Full-page photo wall under a navy wash; everything else floats on top. */}
      <div className="landing-bg" aria-hidden="true">
        <GridMotion items={GRID_IMAGES} gradientColor="#002147" />
      </div>
      <div className="landing-shade" aria-hidden="true" />

      <header className="landing-top">
        <div className="landing-brand">
          <Emblem size={56} />
          <div>
            <div className="line1">University of Fort Hare</div>
            <div className="line2">Residence Maintenance Portal</div>
          </div>
        </div>
        <nav className="landing-nav" aria-label="Site">
          {INFO_LINKS.slice(0, 2).map((link) => (
            <InfoLink key={link.label} {...link} />
          ))}
        </nav>
      </header>

      <main className="landing-main">
        <section className="landing-intro">
          <span className="landing-kicker">Together in Excellence</span>
          <h1>
            Report it once. <em>Watch it get fixed.</em>
          </h1>
          <ol className="landing-steps">
            {STEPS.map((step, index) => (
              <li key={step.n} style={{ animationDelay: `${160 + index * 120}ms` }}>
                <span className="n">{step.n}</span>
                {step.t}
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-card">
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <h2>Sign in</h2>
            <p className="lede">Use your university email address and password.</p>

            <fieldset className="role-picker">
              <legend>I am signing in as a</legend>
              <div className="role-options">
                {ROLES.map(({ value, label, hint, icon: Icon }) => (
                  <label className="role-option" key={value}>
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      checked={role === value}
                      onChange={() => {
                        setRole(value);
                        setError('');
                        setBadCredentials(false);
                      }}
                    />
                    <span className="role-tile">
                      <Icon />
                      <strong>{label}</strong>
                      <span>{hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {error && (
              <Alert type="error">
                {error}
                {badCredentials && (
                  <>
                    {' '}
                    <Link to="/forgot-password">Reset your password</Link>
                    {role === 'student' && <> or <Link to="/register">create an account</Link></>}.
                  </>
                )}
              </Alert>
            )}

            <div className="field">
              <label htmlFor="email">{role === 'student' ? 'Student email' : 'Staff email'}</label>
              <input
                id="email"
                type="email"
                value={email}
                placeholder={EMAIL_PLACEHOLDER[role]}
                autoComplete="username"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <div className="label-row">
                <label htmlFor="password">Password</label>
                <Link to="/forgot-password" className="label-link">Forgot password?</Link>
              </div>
              <div className="password-input">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  autoComplete="current-password"
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
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-gold btn-pill btn-block" disabled={busy}>
                {busy ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            {role === 'student' ? (
              <div className="auth-switch">
                First time here? <Link to="/register">Create your student account</Link>
              </div>
            ) : (
              <div className="auth-switch">
                Maintenance staff accounts are issued by Facilities Management. If you cannot sign
                in, contact your supervisor or the Facilities office.
              </div>
            )}
          </form>
        </section>
      </main>

      <footer className="landing-foot">
        <span>&copy; {new Date().getFullYear()} University of Fort Hare &middot; Residence Life &amp; Facilities Management</span>
        <nav aria-label="Legal">
          {INFO_LINKS.slice(2).map((link) => (
            <InfoLink key={link.label} {...link} />
          ))}
        </nav>
      </footer>
    </div>
  );
}
