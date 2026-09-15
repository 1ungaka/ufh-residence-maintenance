import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert } from '../components/Ui.jsx';
import ClickSpark from '../components/ui/ClickSpark';

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
    <ClickSpark 
      sparkColor="#FFC700" 
      sparkSize={10} 
      sparkRadius={15} 
      sparkCount={8} 
      duration={400}
    >
      <div 
        className="register-page" 
        style={{ 
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 50%, #fffbf0 100%)',
          padding: '2rem'
        }}
      >
        <div className="auth-panel" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'transparent', color: '#000' }}>
          
          {/* 1. Uncommented the submit handler */}
          <form className="auth-form" onSubmit={handleSubmit}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2>Create your student account</h2>
              <p className="lede" style={{ color: '#666' }}>Register to log faults and track maintenance.</p>
            </div>

            {/* Display errors if they occur */}
            {error && <Alert type="error">{error}</Alert>}

            {/* 2. Restored all the necessary input fields */}
            <div className="field" style={{ marginBottom: '1rem' }}>
              <label htmlFor="fullName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Full Name</label>
              <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>

            <div className="field" style={{ marginBottom: '1rem' }}>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>University Email</label>
              <input id="email" type="email" placeholder="202412345@ufh.ac.za" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>

            <div className="field" style={{ marginBottom: '1rem' }}>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>

            <div className="field" style={{ marginBottom: '1rem' }}>
              <label htmlFor="residenceBuilding" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Residence</label>
              <select id="residenceBuilding" value={residenceBuilding} onChange={(e) => setResidenceBuilding(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                <option value="Alice Campus Res">Alice Campus Res</option>
                <option value="Bisho Campus Res">Bisho Campus Res</option>
                <option value="East London Campus Res">East London Campus Res</option>
              </select>
            </div>

            <div className="field" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="roomNumber" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Room Number</label>
              <input id="roomNumber" type="text" placeholder="e.g., A12" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                disabled={busy}
                style={{ 
                  backgroundColor: '#FFC700', 
                  color: '#000000',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  width: '100%',
                  marginTop: '1rem'
                }}
              >
                {busy ? 'Registering...' : 'Register'}
              </button>
            </div>

            <div className="auth-switch" style={{ textAlign: 'center', marginTop: '1.5rem', color: '#666' }}>
              Already have an account? <Link to="/login" style={{ color: '#3586DA', textDecoration: 'underline' }}>Sign in here</Link>
            </div>
          </form>

        </div>
      </div>
    </ClickSpark>
  );
}