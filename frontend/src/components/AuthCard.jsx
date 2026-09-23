/** Centred card on the navy campus backdrop, used by the password reset screens. */
import { Link } from 'react-router-dom';
import { Emblem } from './Ui.jsx';

export default function AuthCard({ title, lede, children }) {
  return (
    <div className="auth-card-page">
      <div className="auth-card">
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
