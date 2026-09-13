import { useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert } from '../components/Ui.jsx';
import { RESIDENCES } from '../utils/residences.js';
import { formatDate } from '../utils/format.js';

export default function Profile() {
  const { user } = useAuth();
  
  // Extract custom fields from Supabase's user_metadata object
  const role = user?.user_metadata?.role || 'student';
  const trade = user?.user_metadata?.trade || '';

  const [form, setForm] = useState({
    name: user?.user_metadata?.full_name || '',
    residence: user?.user_metadata?.residence_building || RESIDENCES[0],
    room: user?.user_metadata?.room_number || ''
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
      // 1. Update the hidden authentication metadata (updates the active session)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: form.name,
          residence_building: form.residence,
          room_number: form.room
        }
      });
      if (authError) throw authError;

      // 2. Update the public profiles table (updates the directory used for ticket assignments)
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          full_name: form.name,
          residence_building: form.residence,
          room_number: form.room
        })
        .eq('id', user.id);
      if (dbError) throw dbError;

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
          <dd>{user?.email}</dd>
          <dt>Role</dt>
          <dd>{role === 'student' ? 'Student resident' : `Facilities - ${trade}`}</dd>
          <dt>Member since</dt>
          <dd>{formatDate(user?.created_at)}</dd>
        </dl>
      </div>

      <div className="card">
        <h2>Edit details</h2>
        <form onSubmit={handleSubmit}>
          {message && <Alert type="success">{message}</Alert>}
          {error && <Alert type="error">{error}</Alert>}

          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" value={form.name} onChange={update('name')} required />
          </div>

          {role === 'student' && (
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