/** Centred card on the navy backdrop, used by Register and the password reset screens. */
import { Link } from 'react-router-dom';
import { Emblem } from './Ui.jsx';

export default function AuthCard({ title, lede, wide = false, children }) {
  return (
    <div className="auth-card-page">
      <div className={`auth-card${wide ? ' is-wide' : ''}`}>
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
