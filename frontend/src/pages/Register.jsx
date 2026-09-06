import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Emblem } from '../components/Ui.jsx';
import { RESIDENCES } from '../utils/residences.js';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    residence: RESIDENCES[0],
    room: ''
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <section className="auth-hero">
        <div className="bg" style={{ backgroundImage: 'url(/images/electrical-panel.jpg)' }} />

        <div className="auth-hero-brand">
          <Emblem size={40} />
          <div>
            <div className="line1">University of Fort Hare</div>
            <div className="line2">Residence Maintenance</div>
          </div>
        </div>

        <div className="auth-hero-body">
          <h1>Set up your residence account</h1>
          <p>
            Register once with your residence and room number. Every fault you log is stamped with
            those details, and only you and the maintenance team can see it.
          </p>
        </div>

        <div className="auth-hero-foot">Residence Life &amp; Facilities Management</div>
      </section>

      <section className="auth-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Create account</h2>
          <p className="lede">Open to students living in university residences.</p>

          <Alert type="error">{error}</Alert>

          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" value={form.name} onChange={update('name')} placeholder="Aphiwe Ndlela" required />
          </div>

          <div className="field">
            <label htmlFor="email">University email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="202412345@ufh.ac.za"
              autoComplete="username"
              required
            />
            <p className="hint">Your student number followed by @ufh.ac.za.</p>
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={update('password')}
              autoComplete="new-password"
              required
            />
            <p className="hint">At least 8 characters, with a letter and a number.</p>
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="residence">Residence</label>
              <select id="residence" value={form.residence} onChange={update('residence')}>
                {RESIDENCES.map((residence) => (
                  <option key={residence}>{residence}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="room">Room</label>
              <input id="room" value={form.room} onChange={update('room')} placeholder="B12" required />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={busy}>
              {busy ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="auth-switch">
            Already registered? <Link to="/login">Sign in</Link>
          </div>
        </form>
      </section>
    </div>
  );
}
