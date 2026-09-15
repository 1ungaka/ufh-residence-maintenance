import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Emblem } from '../components/Ui.jsx';
// Fixed the import path to go up one level
import GridMotion from '../components/ui/GridMotion'; 

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

  // 1. Generate the array of images to fill the grid
  // 1. Update the array with your local images and the new campus shots
const residenceImages = [
    // Your local UFH images
    '/images/campus-team.jpg',
    '/images/electrical-panel.jpg',
    '/images/maintenance-collage.jpg',
    '/images/electrical.jpg',
    '/images/plumber.jpg',
    
    // High-quality maintenance, trade, and campus placeholders
    'https://stagafrican.com/wp-content/uploads/2020/04/AliceCampus-Building2.jpg', // Construction/Building
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1', // Maintenance tools
    'https://insideeducation.co.za/wp-content/uploads/2020/11/FortHareResidence.jpg', // Campus building
    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4', // Electrical wiring
    'https://www.dailydispatch.co.za/resizer/v2/5VBKUM3J6FLUNGDFVZDE5YBVSY.jpg?auth=6b5f7b3cecaab2387cd1203a54b9bf09b0d9c18a8142225fc8c93967eb3b5dd3&width=800&height=533&smart=true', // Construction site
    'https://groundup.org.za/media/uploads/images/photographers/Johnnie%20Isaac/ashes_of_university_of_fort_hare_zJBo9vg.jpg', // Burnt Building
    'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15', // Brick building
    'https://www.ufh.ac.za/wp-content/uploads/2024/11/UFH-DRI-Research-Week-2024-Day-1-69-e1732064287899-847x1024.webp'//buhlungu
  ];

  // This will perfectly loop those 10 images until all 28 grid slots are filled
  const fullImageArray = Array(28).fill(residenceImages).flat().slice(0, 28);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);

    if (!email.endsWith('@ufh.ac.za')) {
      setError('You must use a valid University of Fort Hare (@ufh.ac.za) email address.');
      setBusy(false);
      return;
    }

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth">
<section className="auth-hero" style={{ position: 'relative' }}>
        
        {/* 1. The Dynamic Grid with a Dark Overlay added */}
        <div className="bg" style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
          <GridMotion items={fullImageArray} gradientColor="#002147" />
          
          {/* This is the magic overlay that darkens the photos just enough */}
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.65)', /* 65% black */
            zIndex: 1 
          }} />
        </div>

        {/* 2. Text with zIndex: 2 (to sit above the overlay) and textShadow added */}
        <div className="auth-hero-brand" style={{ position: 'relative', zIndex: 2, textShadow: '0 2px 5px rgba(0,0,0,0.8)' }}>
          <Emblem size={40} />
          <div>
            <div className="line1">University of Fort Hare</div>
            <div className="line2">Residence Maintenance</div>
          </div>
        </div>

        <div className="auth-hero-body" style={{ position: 'relative', zIndex: 2, textShadow: '0 2px 5px rgba(0,0,0,0.8)' }}>
          <h1>Report it once. Watch it get fixed.</h1>
          <p>
            Broken lights, blocked drains, faulty locks and Wi-Fi problems go straight to the
            tradesperson who handles them, with a record you can check any time.
          </p>

          <div className="hero-steps">
            {STEPS.map((step, index) => (
              <div 
                className="hero-step" 
                key={step.n} 
                style={{ 
                  animationDelay: `${180 + index * 110}ms`,
                  /* Optional: Add a slight glass effect to the step boxes for even more readability */
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  padding: '10px 15px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div className="n">{step.n}</div>
                <div className="t">{step.t}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-hero-foot" style={{ position: 'relative', zIndex: 2, textShadow: '0 2px 5px rgba(0,0,0,0.8)' }}>
          Residence Life &amp; Facilities Management
        </div>
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
                width: '100%' // Optional: makes the button stretch nicely across the form
              }}
            >
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