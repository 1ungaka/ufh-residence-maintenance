<<<<<<< HEAD
/** Centred card on the navy campus backdrop, used by the password reset screens. */
import { Link } from 'react-router-dom';
import { Emblem } from './Ui.jsx';

export default function AuthCard({ title, lede, children }) {
  return (
    <div className="auth-card-page">
      <div className="auth-card">
=======
/** Centred card on the navy backdrop, used by Register and the password reset screens. */
import { Link } from 'react-router-dom';
import { Emblem } from './Ui.jsx';

export default function AuthCard({ title, lede, wide = false, children }) {
  return (
    <div className="auth-card-page">
      <div className={`auth-card${wide ? ' is-wide' : ''}`}>
>>>>>>> e1ffca59a6f9db1e59e2fd35f5a3ed2d7d7cf2fd
        <Link to="/login" className="auth-card-brand">
          <Emblem size={48} />
          <span>Residence Maintenance</span>
        </Link>
        <h1>{title}</h1>
        {lede && <p className="lede">{lede}</p>}
        {children}
      </div>
    </div>
  );
}
