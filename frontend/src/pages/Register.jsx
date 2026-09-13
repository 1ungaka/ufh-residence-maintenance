import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert } from '../components/Ui.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [residenceBuilding, setResidenceBuilding] = useState('Alice Campus Res');
  const [roomNumber, setRoomNumber] = useState('');

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);

    if (!email.endsWith('@ufh.ac.za')) {
      setError('Registration is restricted to valid @ufh.ac.za email addresses.');
      setBusy(false);
      return;
    }

    const studentNumber = email.split('@')[0];

    // This exact payload structure is strictly required by the new AuthContext
    const payload = {
      email: email,
      password: password,
      full_name: fullName,
      student_number: studentNumber,
      residence_building: residenceBuilding,
      room_number: roomNumber,
      role: 'student'
    };

    try {
      await register(payload);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth-panel">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Create your student account</h2>
        <p className="lede">Register to log faults and track maintenance.</p>

        {error && <Alert type="error">{error}</Alert>}

        <div className="field">
          <label htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="email">University Email</label>
          <input
            id="email"
            type="email"
            value={email}
            placeholder="202612345@ufh.ac.za"
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
            onChange={(e) => setPassword(e.target.value)}
            minLength="6"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="residence">Residence</label>
          <select
            id="residence"
            value={residenceBuilding}
            onChange={(e) => setResidenceBuilding(e.target.value)}
            required
          >
            <option value="Alice Campus Res">Alice Campus Res</option>
            <option value="Bisho Campus Res">Bisho Campus Res</option>
            <option value="East London Res">East London Res</option>
            <option value="Wesley Residence">Wesley Residence</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="room">Room Number</label>
          <input
            id="room"
            type="text"
            value={roomNumber}
            placeholder="e.g., A12"
            onChange={(e) => setRoomNumber(e.target.value)}
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={busy}>
            {busy ? 'Creating account...' : 'Register'}
          </button>
        </div>

        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>
      </form>
    </div>
  );
}