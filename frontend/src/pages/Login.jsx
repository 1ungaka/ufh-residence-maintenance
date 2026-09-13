import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Emblem } from '../components/Ui.jsx';

const STEPS = [
  { n: '01', t: 'Log the fault from your room' },
  { n: '02', t: 'A tradesperson takes the job' },
  { n: '03', t: 'Follow every update to completion' }
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);

    // Enforce the UFH domain restriction on the frontend
    if (!email.endsWith('@ufh.ac.za')) {
      setError('You must use a valid University of Fort Hare (@ufh.ac.za) email address.');
      setBusy(false);
      return;
    }

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // Supabase error messages will be caught and displayed here
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <section className="auth-hero">
        <div className="bg" style={{ backgroundImage: 'url(/images/campus-team.jpg)' }} />

        <div className="auth-hero-brand">
          <Emblem size={40} />
          <div>
            <div className="line1">University of Fort Hare</div>
            <div className="line2">Residence Maintenance</div>
          </div>
        </div>

        <div className="auth-hero-body">
          <h1>Report it once. Watch it get fixed.</h1>
          <p>
            Broken lights, blocked drains, faulty locks and Wi-Fi problems go straight to the
            tradesperson who handles them, with a record you can check any time.
          </p>

          <div className="hero-steps">
            {STEPS.map((step, index) => (
              <div className="hero-step" key={step.n} style={{ animationDelay: `${180 + index * 110}ms` }}>
                <div className="n">{step.n}</div>
                <div className="t">{step.t}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-hero-foot">Residence Life &amp; Facilities Management</div>
      </section>

      <section className="auth-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Sign in</h2>
          <p className="lede">Use your university email address and password.</p>

          <Alert type="error">{error}</Alert>

          <div className="field">
            <label htmlFor="email">University email</label>
            <input
              id="email"
              type="email"
              value={email}
              placeholder="202412345@ufh.ac.za"
              autoComplete="username"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={busy}>
              {busy ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="auth-switch">
            First time here? <Link to="/register">Create your student account</Link>
          </div>

          <p className="auth-foot">
            Maintenance staff accounts are issued by Facilities Management. If you cannot sign in,
            contact the residence office.
          </p>
        </form>
      </section>
    </div>
  );
}
