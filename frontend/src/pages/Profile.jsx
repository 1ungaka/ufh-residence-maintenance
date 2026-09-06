import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert } from '../components/Ui.jsx';
import { RESIDENCES } from '../utils/residences.js';
import { formatDate } from '../utils/format.js';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name,
    residence: user.residence || RESIDENCES[0],
    room: user.room || ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const data = await api.updateProfile(form);
      setUser(data.user);
      setMessage('Your details have been saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>Profile</h1>
        <p>Your email address and role are set by the university and cannot be changed here.</p>
      </div>

      <div className="card">
        <dl className="definitions">
          <dt>Email</dt>
          <dd>{user.email}</dd>
          <dt>Role</dt>
          <dd>{user.role === 'student' ? 'Student resident' : `Facilities - ${user.trade}`}</dd>
          <dt>Member since</dt>
          <dd>{formatDate(user.created_at)}</dd>
        </dl>
      </div>

      <div className="card">
        <h2>Edit details</h2>
        <form onSubmit={handleSubmit}>
          <Alert type="success">{message}</Alert>
          <Alert type="error">{error}</Alert>

          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" value={form.name} onChange={update('name')} required />
          </div>

          {user.role === 'student' && (
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
                <label htmlFor="room">Room number</label>
                <input id="room" value={form.room} onChange={update('room')} required />
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" disabled={busy}>
              {busy ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
